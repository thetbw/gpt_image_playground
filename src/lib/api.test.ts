import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_PARAMS, DEFAULT_SETTINGS } from '../types'
import {
  clearAccessState,
  readAccessPassword,
  readAccessSession,
  subscribeToAccessUnauthorized,
  writeAccessPassword,
  writeAccessSession,
} from './accessGate'
import { callImageApi } from './api'

class MemorySessionStorage {
  private storage = new Map<string, string>()
  getItem(key: string) { return this.storage.get(key) ?? null }
  setItem(key: string, value: string) { this.storage.set(key, value) }
  removeItem(key: string) { this.storage.delete(key) }
  clear() { this.storage.clear() }
}

describe('callImageApi', () => {
  afterEach(() => {
    clearAccessState()
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('records actual params returned on Images API responses in Codex CLI mode', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      output_format: 'png',
      quality: 'medium',
      size: '1033x1522',
      data: [{
        b64_json: 'aW1hZ2U=',
        revised_prompt: '移除靴子',
      }],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))

    const result = await callImageApi({
      settings: { ...DEFAULT_SETTINGS, apiKey: 'test-key', codexCli: true },
      prompt: 'prompt',
      params: { ...DEFAULT_PARAMS },
      inputImageDataUrls: [],
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.actualParams).toEqual({
      output_format: 'png',
      quality: 'medium',
      size: '1033x1522',
    })
    expect(result.actualParamsList).toEqual([{
      output_format: 'png',
      quality: 'medium',
      size: '1033x1522',
    }])
    expect(result.revisedPrompts).toEqual(['移除靴子'])
  })

  it('does not synthesize actual quality in Codex CLI mode when the API omits it', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      output_format: 'png',
      size: '1033x1522',
      data: [{ b64_json: 'aW1hZ2U=' }],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))

    const result = await callImageApi({
      settings: { ...DEFAULT_SETTINGS, apiKey: 'test-key', codexCli: true },
      prompt: 'prompt',
      params: { ...DEFAULT_PARAMS },
      inputImageDataUrls: [],
    })

    expect(result.actualParams).toEqual({
      output_format: 'png',
      size: '1033x1522',
    })
    expect(result.actualParams?.quality).toBeUndefined()
    expect(result.actualParamsList).toEqual([{
      output_format: 'png',
      size: '1033x1522',
    }])
  })

  it('uses the same-origin API proxy path when API proxy is enabled', async () => {
    vi.stubEnv('VITE_API_PROXY_AVAILABLE', 'true')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      data: [{ b64_json: 'aW1hZ2U=' }],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))

    await callImageApi({
      settings: {
        ...DEFAULT_SETTINGS,
        apiKey: 'test-key',
        apiProxy: true,
        baseUrl: 'http://api.example.com/v1',
      },
      prompt: 'prompt',
      params: { ...DEFAULT_PARAMS },
      inputImageDataUrls: [],
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api-proxy/images/generations',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('ignores stored API proxy settings when the current deployment has no proxy', async () => {
    vi.stubEnv('VITE_API_PROXY_AVAILABLE', 'false')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      data: [{ b64_json: 'aW1hZ2U=' }],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))

    await callImageApi({
      settings: {
        ...DEFAULT_SETTINGS,
        apiKey: 'test-key',
        apiProxy: true,
        baseUrl: 'http://api.example.com/v1',
      },
      prompt: 'prompt',
      params: { ...DEFAULT_PARAMS },
      inputImageDataUrls: [],
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.example.com/v1/images/generations',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('does not send authorization header when managed proxy auth is enabled', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      data: [{ b64_json: 'aW1hZ2U=' }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    await callImageApi({
      settings: {
        ...DEFAULT_SETTINGS,
        apiKey: 'should-not-send',
        managedConfig: {
          ...DEFAULT_SETTINGS.managedConfig,
          managedProxyAuth: true,
        },
      },
      prompt: 'prompt',
      params: { ...DEFAULT_PARAMS },
      inputImageDataUrls: [],
    })

    const [, init] = fetchMock.mock.calls[0]
    expect((init as RequestInit).headers).not.toMatchObject({ Authorization: expect.any(String) })
  })

  it('forces same-origin proxy when managed proxy auth is enabled', async () => {
    vi.stubEnv('VITE_API_PROXY_AVAILABLE', 'true')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      data: [{ b64_json: 'aW1hZ2U=' }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    await callImageApi({
      settings: {
        ...DEFAULT_SETTINGS,
        apiKey: '',
        apiProxy: false,
        managedConfig: {
          ...DEFAULT_SETTINGS.managedConfig,
          managedProxyAuth: true,
        },
      },
      prompt: 'prompt',
      params: { ...DEFAULT_PARAMS },
      inputImageDataUrls: [],
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api-proxy/images/generations',
      expect.objectContaining({ method: 'POST' }),
    )
    const [, init] = fetchMock.mock.calls[0]
    expect((init as RequestInit).headers).not.toMatchObject({ Authorization: expect.any(String) })
  })

  it('adds the access password only to same-origin proxy requests', async () => {
    vi.stubEnv('VITE_API_PROXY_AVAILABLE', 'true')
    vi.stubGlobal('sessionStorage', new MemorySessionStorage())
    writeAccessPassword('pw123')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      data: [{ b64_json: 'aW1hZ2U=' }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    await callImageApi({
      settings: {
        ...DEFAULT_SETTINGS,
        apiKey: 'test-key',
        apiProxy: true,
      },
      prompt: 'prompt',
      params: { ...DEFAULT_PARAMS },
      inputImageDataUrls: [],
    })

    const [, init] = fetchMock.mock.calls[0]
    expect((init as RequestInit).headers).toMatchObject({ 'X-Access-Password': 'pw123' })
  })

  it('clears runtime access and notifies listeners when proxy auth returns an empty 401', async () => {
    vi.stubEnv('VITE_API_PROXY_AVAILABLE', 'true')
    let unauthorizedCalls = 0
    const unsubscribe = subscribeToAccessUnauthorized(() => {
      unauthorizedCalls += 1
    })
    writeAccessSession(true)
    writeAccessPassword('pw123')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, {
      status: 401,
      headers: { 'Content-Length': '0' },
    }))

    await expect(callImageApi({
      settings: {
        ...DEFAULT_SETTINGS,
        apiKey: 'test-key',
        apiProxy: true,
      },
      prompt: 'prompt',
      params: { ...DEFAULT_PARAMS },
      inputImageDataUrls: [],
    })).rejects.toThrow('访问密码已失效，请重新输入')

    unsubscribe()
    expect(unauthorizedCalls).toBe(1)
    expect(readAccessSession()).toBe(false)
    expect(readAccessPassword()).toBe('')
  })

  it('treats nginx html 401 responses as expired access-password failures', async () => {
    vi.stubEnv('VITE_API_PROXY_AVAILABLE', 'true')
    let unauthorizedCalls = 0
    const unsubscribe = subscribeToAccessUnauthorized(() => {
      unauthorizedCalls += 1
    })
    writeAccessSession(true)
    writeAccessPassword('pw123')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html><body><h1>401 Unauthorized</h1></body></html>', {
      status: 401,
      headers: {
        'Content-Type': 'text/html',
        'Content-Length': '179',
      },
    }))

    await expect(callImageApi({
      settings: {
        ...DEFAULT_SETTINGS,
        apiKey: 'test-key',
        apiProxy: true,
      },
      prompt: 'prompt',
      params: { ...DEFAULT_PARAMS },
      inputImageDataUrls: [],
    })).rejects.toThrow('访问密码已失效，请重新输入')

    unsubscribe()
    expect(unauthorizedCalls).toBe(1)
    expect(readAccessSession()).toBe(false)
    expect(readAccessPassword()).toBe('')
  })

  it('preserves runtime access when upstream returns a normal JSON 401 error', async () => {
    vi.stubEnv('VITE_API_PROXY_AVAILABLE', 'true')
    let unauthorizedCalls = 0
    const unsubscribe = subscribeToAccessUnauthorized(() => {
      unauthorizedCalls += 1
    })
    writeAccessSession(true)
    writeAccessPassword('pw123')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      error: { message: 'upstream unauthorized' },
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }))

    await expect(callImageApi({
      settings: {
        ...DEFAULT_SETTINGS,
        apiKey: 'test-key',
        apiProxy: true,
      },
      prompt: 'prompt',
      params: { ...DEFAULT_PARAMS },
      inputImageDataUrls: [],
    })).rejects.toThrow('upstream unauthorized')

    unsubscribe()
    expect(unauthorizedCalls).toBe(0)
    expect(readAccessSession()).toBe(true)
    expect(readAccessPassword()).toBe('pw123')
  })
})

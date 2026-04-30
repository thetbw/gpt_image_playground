import { afterEach, describe, expect, it, vi } from 'vitest'

describe('runtime managed docker config integration', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('routes image generation through the same-origin proxy when managed url and key are configured', async () => {
    vi.stubEnv('VITE_API_PROXY_AVAILABLE', 'false')
    vi.stubGlobal('window', {
      __GPT_IMAGE_PLAYGROUND_CONFIG__: {
        defaultApiUrl: 'https://api.openai.com/v1',
        apiProxyAvailable: true,
        managedApiUrl: true,
        managedApiKey: true,
        managedCodexCli: true,
        managedCodexCliValue: true,
        managedApiMode: true,
        managedApiModeValue: 'images',
        managedProxyAuth: true,
      },
    })
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      data: [{ b64_json: 'aW1hZ2U=' }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    const { DEFAULT_PARAMS, DEFAULT_SETTINGS } = await import('./types')
    const { callImageApi } = await import('./lib/api')

    expect(DEFAULT_SETTINGS.apiKey).toBe('')
    expect(DEFAULT_SETTINGS.apiProxy).toBe(true)
    expect(DEFAULT_SETTINGS.managedConfig.managedProxyAuth).toBe(true)

    await callImageApi({
      settings: DEFAULT_SETTINGS,
      prompt: 'prompt',
      params: DEFAULT_PARAMS,
      inputImageDataUrls: [],
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api-proxy/images/generations',
      expect.objectContaining({ method: 'POST' }),
    )
    const [, init] = fetchMock.mock.calls[0]
    expect((init as RequestInit).headers).not.toMatchObject({ Authorization: expect.any(String) })
  })
})

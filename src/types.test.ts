import { afterEach, describe, expect, it, vi } from 'vitest'

describe('runtime managed defaults', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('uses managed env values for client-visible non-secret settings', async () => {
    vi.stubEnv('VITE_MANAGED_API_URL', 'true')
    vi.stubEnv('VITE_MANAGED_API_KEY', 'true')
    vi.stubEnv('VITE_MANAGED_PROXY_AUTH', 'true')
    vi.stubEnv('VITE_MANAGED_CODEX_CLI', 'true')
    vi.stubEnv('VITE_MANAGED_CODEX_CLI_VALUE', 'true')
    vi.stubEnv('VITE_MANAGED_API_MODE', 'true')
    vi.stubEnv('VITE_MANAGED_API_MODE_VALUE', 'responses')
    vi.stubEnv('VITE_DEFAULT_API_URL', '__VITE_DEFAULT_API_URL_PLACEHOLDER__')

    const { DEFAULT_SETTINGS } = await import('./types')

    expect(DEFAULT_SETTINGS.baseUrl).toBe('https://api.openai.com/v1')
    expect(DEFAULT_SETTINGS.apiKey).toBe('')
    expect(DEFAULT_SETTINGS.apiProxy).toBe(true)
    expect(DEFAULT_SETTINGS.codexCli).toBe(true)
    expect(DEFAULT_SETTINGS.apiMode).toBe('responses')
    expect(DEFAULT_SETTINGS.managedConfig).toMatchObject({
      managedApiUrl: true,
      managedApiKey: true,
      managedProxyAuth: true,
      managedCodexCli: true,
      managedApiMode: true,
    })
  })

  it('prefers runtime config over build-time placeholders', async () => {
    vi.stubEnv('VITE_MANAGED_API_URL', '__VITE_MANAGED_API_URL_PLACEHOLDER__')
    vi.stubEnv('VITE_MANAGED_API_KEY', '__VITE_MANAGED_API_KEY_PLACEHOLDER__')
    vi.stubEnv('VITE_MANAGED_PROXY_AUTH', '__VITE_MANAGED_PROXY_AUTH_PLACEHOLDER__')
    vi.stubEnv('VITE_API_PROXY_AVAILABLE', '__VITE_API_PROXY_AVAILABLE_PLACEHOLDER__')
    vi.stubGlobal('window', {
      __GPT_IMAGE_PLAYGROUND_CONFIG__: {
        defaultApiUrl: 'https://api.openai.com/v1',
        apiProxyAvailable: true,
        managedApiUrl: true,
        managedApiKey: true,
        managedProxyAuth: true,
        managedCodexCli: true,
        managedCodexCliValue: true,
        managedApiMode: true,
        managedApiModeValue: 'images',
      },
    })

    const { DEFAULT_SETTINGS } = await import('./types')

    expect(DEFAULT_SETTINGS.baseUrl).toBe('https://api.openai.com/v1')
    expect(DEFAULT_SETTINGS.apiKey).toBe('')
    expect(DEFAULT_SETTINGS.apiProxy).toBe(true)
    expect(DEFAULT_SETTINGS.codexCli).toBe(true)
    expect(DEFAULT_SETTINGS.apiMode).toBe('images')
    expect(DEFAULT_SETTINGS.managedConfig.managedProxyAuth).toBe(true)
  })
})

import { describe, expect, it } from 'vitest'
import { getUrlSettingsOverrides } from './App'
import { DEFAULT_SETTINGS } from './lib/apiProfiles'

describe('getUrlSettingsOverrides', () => {
  it('parses unmanaged url params', () => {
    const overrides = getUrlSettingsOverrides('?apiUrl=https://x.com&apiKey=sk-123&codexCli=true&apiMode=responses', DEFAULT_SETTINGS)
    expect(overrides.baseUrl).toContain('https://x.com')
    expect(overrides.apiKey).toBe('sk-123')
    expect(overrides.codexCli).toBe(true)
    expect(overrides.apiMode).toBe('responses')
  })

  it('skips managed fields from url params', () => {
    const managedSettings = {
      ...DEFAULT_SETTINGS,
      managedConfig: {
        ...DEFAULT_SETTINGS.managedConfig,
        managedApiUrl: true,
        managedApiKey: true,
        managedCodexCli: true,
        managedApiMode: true,
      },
    }
    const overrides = getUrlSettingsOverrides('?apiUrl=https://x.com&apiKey=sk-123&codexCli=true&apiMode=responses', managedSettings)
    expect(overrides).toEqual({})
  })
})

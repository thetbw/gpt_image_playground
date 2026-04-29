import { describe, expect, it } from 'vitest'
import { getUrlSettingsOverrides } from './App'
import { DEFAULT_SETTINGS } from './types'

describe('getUrlSettingsOverrides', () => {
  it('parses unmanaged url params but ignores apiKey param entirely', () => {
    const overrides = getUrlSettingsOverrides('?apiUrl=https://x.com&apiKey=sk-123&codexCli=true&apiMode=responses', DEFAULT_SETTINGS)
    expect(overrides.baseUrl).toContain('https://x.com')
    expect(overrides.codexCli).toBe(true)
    expect(overrides.apiMode).toBe('responses')
    expect((overrides as Record<string, unknown>).apiKey).toBeUndefined()
  })

  it('skips managed fields from url params', () => {
    const managedSettings = {
      ...DEFAULT_SETTINGS,
      managedConfig: {
        ...DEFAULT_SETTINGS.managedConfig,
        managedApiUrl: true,
        managedCodexCli: true,
        managedApiMode: true,
      },
    }
    const overrides = getUrlSettingsOverrides('?apiUrl=https://x.com&codexCli=true&apiMode=responses', managedSettings)
    expect(overrides).toEqual({})
  })
})

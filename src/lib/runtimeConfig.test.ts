import { afterEach, describe, expect, it, vi } from 'vitest'
import { readRuntimeConfig } from './runtimeConfig'

describe('readRuntimeConfig', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the access gate title hint from runtime config', () => {
    vi.stubGlobal('window', {
      __GPT_IMAGE_PLAYGROUND_CONFIG__: {
        accessPasswordTitleHint: '内网使用',
      },
    })

    expect(readRuntimeConfig().accessPasswordTitleHint).toBe('内网使用')
  })
})

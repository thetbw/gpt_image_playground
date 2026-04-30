import { afterEach, describe, expect, it, vi } from 'vitest'
import { isAccessGateRequired } from '../lib/accessGate'

describe('isAccessGateRequired', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('requires the access gate when nginx reports 401', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 401 }))
    await expect(isAccessGateRequired()).resolves.toBe(true)
  })

  it('skips the access gate when no password is configured', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
    await expect(isAccessGateRequired()).resolves.toBe(false)
  })

  it('skips the access gate outside the docker nginx runtime', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('not served by nginx'))
    await expect(isAccessGateRequired()).resolves.toBe(false)
  })
})

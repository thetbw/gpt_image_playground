import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  clearAccessState,
  isAccessGateRequired,
  readAccessPassword,
  readAccessSession,
  resolveInitialAccessGrant,
  writeAccessPassword,
  writeAccessSession,
} from '../lib/accessGate'

describe('isAccessGateRequired', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    clearAccessState()
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

  it('always re-checks the backend on startup even if runtime access was previously granted', async () => {
    writeAccessSession(true)
    writeAccessPassword('pw123')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 401 }))

    await expect(resolveInitialAccessGrant()).resolves.toBe(false)
    expect(readAccessSession()).toBe(false)
    expect(readAccessPassword()).toBe('')
  })

  it('clears stale runtime access when startup determines no password is configured', async () => {
    writeAccessSession(true)
    writeAccessPassword('pw123')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))

    await expect(resolveInitialAccessGrant()).resolves.toBe(true)
    expect(readAccessSession()).toBe(false)
    expect(readAccessPassword()).toBe('')
  })
})

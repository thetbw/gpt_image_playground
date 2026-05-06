import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_PARAMS, DEFAULT_SETTINGS } from './types'
import type { TaskRecord } from './types'
import { editOutputs, submitTask, useStore } from './store'
import { clearAccessState } from './lib/accessGate'

const imageA = { id: 'image-a', dataUrl: 'data:image/png;base64,a' }

class MemorySessionStorage {
  private storage = new Map<string, string>()
  getItem(key: string) { return this.storage.get(key) ?? null }
  setItem(key: string, value: string) { this.storage.set(key, value) }
  removeItem(key: string) { this.storage.delete(key) }
  clear() { this.storage.clear() }
}

function task(overrides: Partial<TaskRecord> = {}): TaskRecord {
  return {
    id: 'task-a',
    prompt: 'prompt',
    params: { ...DEFAULT_PARAMS },
    inputImageIds: [],
    maskTargetImageId: null,
    maskImageId: null,
    outputImages: [],
    status: 'done',
    error: null,
    createdAt: 1,
    finishedAt: 2,
    elapsed: 1,
    ...overrides,
  }
}

describe('mask draft lifecycle in store actions', () => {
  beforeEach(() => {
    useStore.setState({
      settings: { ...DEFAULT_SETTINGS, apiKey: 'test-key' },
      prompt: 'prompt',
      inputImages: [],
      maskDraft: null,
      maskEditorImageId: null,
      params: { ...DEFAULT_PARAMS },
      tasks: [],
      detailTaskId: null,
      lightboxImageId: null,
      lightboxImageList: [],
      showSettings: false,
      toast: null,
      confirmDialog: null,
      showToast: vi.fn(),
      setConfirmDialog: vi.fn(),
    })
  })

  it('preserves an existing mask when quick edit-output adds outputs as references', async () => {
    const maskDraft = {
      targetImageId: imageA.id,
      maskDataUrl: 'data:image/png;base64,mask',
      updatedAt: 1,
    }
    useStore.setState({
      inputImages: [imageA],
      maskDraft,
    })

    await editOutputs(task({ outputImages: [imageA.id] }))

    expect(useStore.getState().maskDraft).toEqual(maskDraft)
  })

  it('clears an invalid mask draft when submit cannot find the mask target image', async () => {
    useStore.setState({
      inputImages: [imageA],
      maskDraft: {
        targetImageId: 'missing-image',
        maskDataUrl: 'data:image/png;base64,mask',
        updatedAt: 1,
      },
    })

    await submitTask()

    expect(useStore.getState().maskDraft).toBeNull()
  })
})

describe('access gate state', () => {
  beforeEach(() => {
    useStore.setState({
      isAccessGranted: false,
      setAccessGranted: (isAccessGranted: boolean) => useStore.setState({ isAccessGranted }),
    })
    vi.stubGlobal('sessionStorage', new MemorySessionStorage())
    sessionStorage.clear()
    clearAccessState()
  })

  it('toggles access gate state', () => {
    expect(useStore.getState().isAccessGranted).toBe(false)
    useStore.getState().setAccessGranted(true)
    expect(useStore.getState().isAccessGranted).toBe(true)
  })

  it('keeps access denied for wrong password flow', () => {
    useStore.getState().setAccessGranted(false)
    expect(useStore.getState().isAccessGranted).toBe(false)
  })

  it('keeps gate state only in runtime memory', async () => {
    const { readAccessPassword, readAccessSession, writeAccessPassword, writeAccessSession } = await import('./lib/accessGate')
    writeAccessSession(true)
    writeAccessPassword('pw123')
    expect(readAccessSession()).toBe(true)
    expect(readAccessPassword()).toBe('pw123')
    expect(sessionStorage.getItem('access-granted')).toBeNull()
    expect(sessionStorage.getItem('access-password')).toBeNull()
  })
})

describe('managed settings merge', () => {
  it('keeps existing managed flags when partial settings updates are applied', () => {
    useStore.setState({
      settings: {
        ...DEFAULT_SETTINGS,
        managedConfig: {
          ...DEFAULT_SETTINGS.managedConfig,
          managedApiUrl: true,
        },
      },
    })

    useStore.getState().setSettings({ apiMode: 'responses' })
    expect(useStore.getState().settings.managedConfig.managedApiUrl).toBe(true)
  })

  it('keeps managed proxy auth out of browser settings', () => {
    useStore.setState({
      settings: {
        ...DEFAULT_SETTINGS,
        apiKey: 'local-key',
        apiProxy: false,
        managedConfig: {
          ...DEFAULT_SETTINGS.managedConfig,
          managedApiKey: true,
          managedProxyAuth: true,
        },
      },
    })

    useStore.getState().setSettings({ apiKey: 'changed-key', apiProxy: false })
    expect(useStore.getState().settings.apiKey).toBe('')
    expect(useStore.getState().settings.apiProxy).toBe(true)
    expect(useStore.getState().settings.managedConfig.managedProxyAuth).toBe(true)
  })
})

export interface RuntimeConfig {
  defaultApiUrl?: string
  apiProxyAvailable?: boolean
  managedApiUrl?: boolean
  managedApiKey?: boolean
  managedCodexCli?: boolean
  managedCodexCliValue?: boolean
  managedApiMode?: boolean
  managedApiModeValue?: string
  managedProxyAuth?: boolean
  accessPasswordTitleHint?: string
}

export function readRuntimeConfig(): RuntimeConfig {
  if (typeof window === 'undefined') return {}
  return window.__GPT_IMAGE_PLAYGROUND_CONFIG__ ?? {}
}

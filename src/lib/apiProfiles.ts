import type { ApiMode, ApiProfile, ApiProvider, AppSettings, ManagedConfig } from '../types'
import { readRuntimeConfig } from './runtimeConfig'
import { readRuntimeEnv } from './runtimeEnv'

function readRuntimeString(value: string | undefined, fallback: string, runtimeValue?: string): string {
  const trimmed = runtimeValue?.trim() || readRuntimeEnv(value)
  if (!trimmed || /^__VITE_.+_PLACEHOLDER__$/.test(trimmed)) return fallback
  return trimmed
}

function readRuntimeBoolean(value: string | undefined, runtimeValue?: boolean): boolean {
  if (typeof runtimeValue === 'boolean') return runtimeValue
  return readRuntimeEnv(value) === 'true'
}

function readRuntimeApiMode(value: string | undefined): ApiMode {
  return value === 'responses' ? 'responses' : 'images'
}

const runtimeConfig = readRuntimeConfig()
const DEFAULT_BASE_URL = readRuntimeString(
  import.meta.env.VITE_DEFAULT_API_URL,
  'https://api.openai.com/v1',
  runtimeConfig.defaultApiUrl,
)
export const DEFAULT_IMAGES_MODEL = 'gpt-image-2'
export const DEFAULT_RESPONSES_MODEL = 'gpt-5.5'
export const DEFAULT_FAL_BASE_URL = 'https://fal.run'
export const DEFAULT_FAL_MODEL = 'openai/gpt-image-2'
export const DEFAULT_OPENAI_PROFILE_ID = 'default-openai'
export const DEFAULT_API_TIMEOUT = 600

export const DEFAULT_MANAGED_CONFIG: ManagedConfig = {
  managedApiUrl: readRuntimeBoolean(import.meta.env.VITE_MANAGED_API_URL, runtimeConfig.managedApiUrl),
  managedApiKey: readRuntimeBoolean(import.meta.env.VITE_MANAGED_API_KEY, runtimeConfig.managedApiKey),
  managedCodexCli: readRuntimeBoolean(import.meta.env.VITE_MANAGED_CODEX_CLI, runtimeConfig.managedCodexCli),
  managedApiMode: readRuntimeBoolean(import.meta.env.VITE_MANAGED_API_MODE, runtimeConfig.managedApiMode),
  managedProxyAuth: readRuntimeBoolean(import.meta.env.VITE_MANAGED_PROXY_AUTH, runtimeConfig.managedProxyAuth),
}

function readManagedConfig(input: Record<string, unknown>): ManagedConfig {
  const raw = input.managedConfig && typeof input.managedConfig === 'object'
    ? input.managedConfig as Record<string, unknown>
    : {}

  return {
    managedApiUrl: typeof raw.managedApiUrl === 'boolean' ? raw.managedApiUrl : DEFAULT_MANAGED_CONFIG.managedApiUrl,
    managedApiKey: typeof raw.managedApiKey === 'boolean' ? raw.managedApiKey : DEFAULT_MANAGED_CONFIG.managedApiKey,
    managedCodexCli: typeof raw.managedCodexCli === 'boolean' ? raw.managedCodexCli : DEFAULT_MANAGED_CONFIG.managedCodexCli,
    managedApiMode: typeof raw.managedApiMode === 'boolean' ? raw.managedApiMode : DEFAULT_MANAGED_CONFIG.managedApiMode,
    managedProxyAuth: typeof raw.managedProxyAuth === 'boolean' ? raw.managedProxyAuth : DEFAULT_MANAGED_CONFIG.managedProxyAuth,
  }
}

function getManagedApiMode(): ApiMode {
  return readRuntimeApiMode(runtimeConfig.managedApiModeValue ?? readRuntimeEnv(import.meta.env.VITE_MANAGED_API_MODE_VALUE))
}

function getManagedCodexCli(): boolean {
  return readRuntimeBoolean(import.meta.env.VITE_MANAGED_CODEX_CLI_VALUE, runtimeConfig.managedCodexCliValue)
}

function applyManagedProfile(profile: ApiProfile, managedConfig: ManagedConfig): ApiProfile {
  return {
    ...profile,
    apiKey: managedConfig.managedApiKey || managedConfig.managedProxyAuth ? '' : profile.apiKey,
    apiMode: managedConfig.managedApiMode ? getManagedApiMode() : profile.apiMode,
    codexCli: managedConfig.managedCodexCli ? getManagedCodexCli() : profile.codexCli,
    apiProxy: managedConfig.managedApiUrl || managedConfig.managedProxyAuth ? true : profile.apiProxy,
  }
}

export function createDefaultOpenAIProfile(overrides: Partial<ApiProfile> = {}): ApiProfile {
  return {
    id: DEFAULT_OPENAI_PROFILE_ID,
    name: '默认',
    provider: 'openai',
    baseUrl: DEFAULT_BASE_URL,
    apiKey: '',
    model: DEFAULT_IMAGES_MODEL,
    timeout: DEFAULT_API_TIMEOUT,
    apiMode: 'images',
    codexCli: false,
    apiProxy: false,
    ...overrides,
  }
}

export function createDefaultFalProfile(overrides: Partial<ApiProfile> = {}): ApiProfile {
  return {
    id: `fal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: '新配置',
    provider: 'fal',
    baseUrl: DEFAULT_FAL_BASE_URL,
    apiKey: '',
    model: DEFAULT_FAL_MODEL,
    timeout: DEFAULT_API_TIMEOUT,
    apiMode: 'images',
    codexCli: false,
    apiProxy: false,
    ...overrides,
  }
}

export function switchApiProfileProvider(profile: ApiProfile, provider: ApiProvider): ApiProfile {
  if (provider === 'fal') {
    return {
      ...profile,
      provider,
      baseUrl: DEFAULT_FAL_BASE_URL,
      model: DEFAULT_FAL_MODEL,
      apiMode: 'images',
      codexCli: false,
      apiProxy: false,
    }
  }

  return {
    ...profile,
    provider,
    baseUrl: DEFAULT_BASE_URL,
    model: DEFAULT_IMAGES_MODEL,
  }
}

export function normalizeApiProfile(input: unknown, fallback?: Partial<ApiProfile>): ApiProfile {
  const record = input && typeof input === 'object' ? input as Record<string, unknown> : {}
  const provider: ApiProvider = record.provider === 'fal' ? 'fal' : 'openai'
  const defaults = provider === 'fal' ? createDefaultFalProfile(fallback) : createDefaultOpenAIProfile(fallback)
  const apiMode: ApiMode = record.apiMode === 'responses' ? 'responses' : 'images'

  return {
    ...defaults,
    id: typeof record.id === 'string' && record.id.trim() ? record.id : defaults.id,
    name: typeof record.name === 'string' && record.name.trim() ? record.name : defaults.name,
    provider,
    baseUrl: typeof record.baseUrl === 'string' ? record.baseUrl : defaults.baseUrl,
    apiKey: typeof record.apiKey === 'string' ? record.apiKey : defaults.apiKey,
    model: typeof record.model === 'string' && record.model.trim() ? record.model : defaults.model,
    timeout: typeof record.timeout === 'number' && Number.isFinite(record.timeout) ? record.timeout : defaults.timeout,
    apiMode,
    codexCli: Boolean(record.codexCli),
    apiProxy: Boolean(record.apiProxy),
  }
}

export function normalizeSettings(input: Partial<AppSettings> | unknown): AppSettings {
  const record = input && typeof input === 'object' ? input as Record<string, unknown> : {}
  const managedConfig = readManagedConfig(record)
  const legacyProfile = createDefaultOpenAIProfile({
    baseUrl: typeof record.baseUrl === 'string' ? record.baseUrl : DEFAULT_BASE_URL,
    apiKey: typeof record.apiKey === 'string' ? record.apiKey : '',
    model: typeof record.model === 'string' && record.model.trim() ? record.model : DEFAULT_IMAGES_MODEL,
    timeout: typeof record.timeout === 'number' && Number.isFinite(record.timeout) ? record.timeout : DEFAULT_API_TIMEOUT,
    apiMode: record.apiMode === 'responses' ? 'responses' : 'images',
    codexCli: Boolean(record.codexCli),
    apiProxy: Boolean(record.apiProxy),
  })
  const profiles = Array.isArray(record.profiles) && record.profiles.length
    ? record.profiles.map((profile) => normalizeApiProfile(profile))
    : [legacyProfile]
  const activeProfileId = typeof record.activeProfileId === 'string' && profiles.some((p) => p.id === record.activeProfileId)
    ? record.activeProfileId
    : profiles[0].id
  const managedProfiles = profiles.map((profile) =>
    profile.id === activeProfileId ? applyManagedProfile(profile, managedConfig) : profile,
  )
  const active = managedProfiles.find((p) => p.id === activeProfileId) ?? managedProfiles[0]

  return {
    baseUrl: active.baseUrl,
    apiKey: active.apiKey,
    model: active.model,
    timeout: active.timeout,
    apiMode: active.apiMode,
    codexCli: active.codexCli,
    apiProxy: active.apiProxy,
    clearInputAfterSubmit: typeof record.clearInputAfterSubmit === 'boolean' ? record.clearInputAfterSubmit : false,
    profiles: managedProfiles,
    activeProfileId,
    managedConfig,
  }
}

export function getActiveApiProfile(settings: Partial<AppSettings> | unknown): ApiProfile {
  const record = settings && typeof settings === 'object' ? settings as Record<string, unknown> : {}
  const normalized = normalizeSettings(settings)
  const profile = normalized.profiles.find((p) => p.id === normalized.activeProfileId) ?? normalized.profiles[0] ?? createDefaultOpenAIProfile()
  const managedConfig = normalized.managedConfig

  return {
    ...profile,
    baseUrl: typeof record.baseUrl === 'string' ? record.baseUrl : profile.baseUrl,
    apiKey: !managedConfig.managedApiKey && !managedConfig.managedProxyAuth && typeof record.apiKey === 'string'
      ? record.apiKey
      : profile.apiKey,
    model: typeof record.model === 'string' && record.model.trim() ? record.model : profile.model,
    timeout: typeof record.timeout === 'number' && Number.isFinite(record.timeout) ? record.timeout : profile.timeout,
    apiMode: !managedConfig.managedApiMode && (record.apiMode === 'images' || record.apiMode === 'responses') ? record.apiMode : profile.apiMode,
    codexCli: !managedConfig.managedCodexCli && typeof record.codexCli === 'boolean' ? record.codexCli : profile.codexCli,
    apiProxy: !managedConfig.managedApiUrl && !managedConfig.managedProxyAuth && typeof record.apiProxy === 'boolean'
      ? record.apiProxy
      : profile.apiProxy,
  }
}

export function validateApiProfile(profile: ApiProfile, managedConfig: ManagedConfig = DEFAULT_MANAGED_CONFIG): string | null {
  if (!profile.name.trim()) return '缺少名称'
  if (profile.provider === 'openai' && !profile.baseUrl.trim()) return '缺少 API URL'
  if (!profile.apiKey.trim() && !managedConfig.managedApiKey && !managedConfig.managedProxyAuth) return '缺少 API Key'
  if (!profile.model.trim()) return '缺少模型 ID'
  return null
}

function isDefaultOpenAIProfile(profile: ApiProfile): boolean {
  return profile.id === DEFAULT_OPENAI_PROFILE_ID &&
    profile.name === '默认' &&
    profile.provider === 'openai' &&
    profile.baseUrl === DEFAULT_BASE_URL &&
    profile.apiKey === '' &&
    profile.model === DEFAULT_IMAGES_MODEL &&
    profile.timeout === DEFAULT_API_TIMEOUT &&
    profile.apiMode === 'images' &&
    profile.codexCli === false &&
    profile.apiProxy === false
}

function hasOnlyDefaultProfiles(settings: AppSettings): boolean {
  return settings.profiles.length === 1 &&
    settings.activeProfileId === DEFAULT_OPENAI_PROFILE_ID &&
    isDefaultOpenAIProfile(settings.profiles[0])
}

function createImportedProfileId(provider: ApiProvider, usedIds: Set<string>): string {
  let id = `${provider}-imported-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  while (usedIds.has(id)) {
    id = `${provider}-imported-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  }
  usedIds.add(id)
  return id
}

function getApiProfileDedupKey(profile: ApiProfile): string {
  return JSON.stringify([
    profile.provider,
    profile.baseUrl.trim().replace(/\/+$/, '').toLowerCase(),
    profile.apiKey.trim(),
    profile.model.trim(),
    profile.apiMode,
  ])
}

function dedupeApiProfiles(profiles: ApiProfile[]): ApiProfile[] {
  const seen = new Set<string>()
  return profiles.filter((profile) => {
    const key = getApiProfileDedupKey(profile)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function mergeImportedSettings(currentSettings: Partial<AppSettings> | unknown, importedSettings: Partial<AppSettings> | unknown): AppSettings {
  const current = normalizeSettings(currentSettings)
  const normalizedImported = normalizeSettings(importedSettings)
  const imported = normalizeSettings({
    ...normalizedImported,
    profiles: dedupeApiProfiles(normalizedImported.profiles),
  })

  if (hasOnlyDefaultProfiles(current)) {
    return imported
  }

  const usedIds = new Set(current.profiles.map((profile) => profile.id))
  const existingKeys = new Set(current.profiles.map(getApiProfileDedupKey))
  const importedProfiles = imported.profiles
    .filter((profile) => !existingKeys.has(getApiProfileDedupKey(profile)))
    .map((profile) => ({
      ...profile,
      id: createImportedProfileId(profile.provider, usedIds),
    }))
  const profiles = [...current.profiles, ...importedProfiles]

  return normalizeSettings({
    ...current,
    profiles,
    activeProfileId: current.activeProfileId,
  })
}

export const DEFAULT_SETTINGS: AppSettings = normalizeSettings({
  baseUrl: DEFAULT_BASE_URL,
  apiKey: '',
  model: DEFAULT_IMAGES_MODEL,
  timeout: DEFAULT_API_TIMEOUT,
  apiMode: DEFAULT_MANAGED_CONFIG.managedApiMode ? getManagedApiMode() : 'images',
  codexCli: DEFAULT_MANAGED_CONFIG.managedCodexCli ? getManagedCodexCli() : false,
  apiProxy: DEFAULT_MANAGED_CONFIG.managedApiUrl || DEFAULT_MANAGED_CONFIG.managedProxyAuth,
  clearInputAfterSubmit: false,
  managedConfig: DEFAULT_MANAGED_CONFIG,
})

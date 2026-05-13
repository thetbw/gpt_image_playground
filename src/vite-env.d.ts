/// <reference types="vite/client" />

declare const __APP_VERSION__: string
declare const __DEV_PROXY_CONFIG__: unknown

interface ImportMetaEnv {
  readonly VITE_DEFAULT_API_URL?: string
  readonly VITE_API_PROXY_AVAILABLE?: string
  readonly VITE_DOCKER_DEPLOYMENT?: string
  readonly VITE_DOCKER_LEGACY_API_URL_USED?: string
  readonly VITE_MANAGED_API_URL?: string
  readonly VITE_MANAGED_API_KEY?: string
  readonly VITE_MANAGED_CODEX_CLI?: string
  readonly VITE_MANAGED_CODEX_CLI_VALUE?: string
  readonly VITE_MANAGED_API_MODE?: string
  readonly VITE_MANAGED_API_MODE_VALUE?: string
  readonly VITE_MANAGED_PROXY_AUTH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  readonly __GPT_IMAGE_PLAYGROUND_CONFIG__?: import('./lib/runtimeConfig').RuntimeConfig
}

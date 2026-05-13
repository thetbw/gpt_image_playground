import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { normalizeDevProxyConfig } from './src/lib/devProxy'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

function loadDevProxyConfig() {
  try {
    return normalizeDevProxyConfig(
      JSON.parse(readFileSync('./dev-proxy.config.json', 'utf-8')) as unknown,
    )
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err.code === 'ENOENT') return null
    throw error
  }
}

export default defineConfig(({ command }) => {
  const devProxyConfig = command === 'serve' ? loadDevProxyConfig() : null

  return {
    plugins: [react()],
    base: './',
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __DEV_PROXY_CONFIG__: JSON.stringify(devProxyConfig),
      'import.meta.env.VITE_DEFAULT_API_URL': JSON.stringify(process.env.VITE_DEFAULT_API_URL ?? '__VITE_DEFAULT_API_URL_PLACEHOLDER__'),
      'import.meta.env.VITE_API_PROXY_AVAILABLE': JSON.stringify(process.env.VITE_API_PROXY_AVAILABLE ?? '__VITE_API_PROXY_AVAILABLE_PLACEHOLDER__'),
      'import.meta.env.VITE_DOCKER_DEPLOYMENT': JSON.stringify(process.env.VITE_DOCKER_DEPLOYMENT ?? '__VITE_DOCKER_DEPLOYMENT_PLACEHOLDER__'),
      'import.meta.env.VITE_DOCKER_LEGACY_API_URL_USED': JSON.stringify(process.env.VITE_DOCKER_LEGACY_API_URL_USED ?? '__VITE_DOCKER_LEGACY_API_URL_USED_PLACEHOLDER__'),
      'import.meta.env.VITE_MANAGED_API_URL': JSON.stringify(process.env.VITE_MANAGED_API_URL ?? '__VITE_MANAGED_API_URL_PLACEHOLDER__'),
      'import.meta.env.VITE_MANAGED_API_KEY': JSON.stringify(process.env.VITE_MANAGED_API_KEY ?? '__VITE_MANAGED_API_KEY_PLACEHOLDER__'),
      'import.meta.env.VITE_MANAGED_CODEX_CLI': JSON.stringify(process.env.VITE_MANAGED_CODEX_CLI ?? '__VITE_MANAGED_CODEX_CLI_PLACEHOLDER__'),
      'import.meta.env.VITE_MANAGED_CODEX_CLI_VALUE': JSON.stringify(process.env.VITE_MANAGED_CODEX_CLI_VALUE ?? '__VITE_MANAGED_CODEX_CLI_VALUE_PLACEHOLDER__'),
      'import.meta.env.VITE_MANAGED_API_MODE': JSON.stringify(process.env.VITE_MANAGED_API_MODE ?? '__VITE_MANAGED_API_MODE_PLACEHOLDER__'),
      'import.meta.env.VITE_MANAGED_API_MODE_VALUE': JSON.stringify(process.env.VITE_MANAGED_API_MODE_VALUE ?? '__VITE_MANAGED_API_MODE_VALUE_PLACEHOLDER__'),
      'import.meta.env.VITE_MANAGED_PROXY_AUTH': JSON.stringify(process.env.VITE_MANAGED_PROXY_AUTH ?? '__VITE_MANAGED_PROXY_AUTH_PLACEHOLDER__'),
    },
    server: {
      host: true,
      proxy:
        devProxyConfig?.enabled
          ? {
              [devProxyConfig.prefix]: {
                target: devProxyConfig.target,
                changeOrigin: devProxyConfig.changeOrigin,
                secure: devProxyConfig.secure,
                rewrite: (path) =>
                  path.replace(
                    new RegExp(`^${devProxyConfig.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
                    '',
                  ),
              },
            }
          : undefined,
    },
  }
})

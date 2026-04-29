#!/bin/sh

API_URL=${API_URL:-https://api.openai.com}
API_PROXY_AVAILABLE=false
if [ "$ENABLE_API_PROXY" = "true" ]; then
    API_PROXY_AVAILABLE=true
fi

MANAGED_API_URL_FLAG=false
MANAGED_API_KEY_FLAG=false
MANAGED_CODEX_CLI_FLAG=false
MANAGED_API_MODE_FLAG=false
MANAGED_PROXY_AUTH_FLAG=false

if [ -n "$MANAGED_API_URL" ]; then MANAGED_API_URL_FLAG=true; fi
if [ -n "$MANAGED_API_KEY" ]; then
    MANAGED_API_KEY_FLAG=true
    MANAGED_PROXY_AUTH_FLAG=true
fi
if [ -n "$MANAGED_CODEX_CLI" ]; then MANAGED_CODEX_CLI_FLAG=true; fi
if [ -n "$MANAGED_API_MODE" ]; then MANAGED_API_MODE_FLAG=true; fi

find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|__VITE_DEFAULT_API_URL_PLACEHOLDER__|$API_URL|g" {} +
find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|__VITE_API_PROXY_AVAILABLE_PLACEHOLDER__|$API_PROXY_AVAILABLE|g" {} +
find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|__VITE_MANAGED_API_URL_PLACEHOLDER__|$MANAGED_API_URL_FLAG|g" {} +
find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|__VITE_MANAGED_API_KEY_PLACEHOLDER__|$MANAGED_API_KEY_FLAG|g" {} +
find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|__VITE_MANAGED_CODEX_CLI_PLACEHOLDER__|$MANAGED_CODEX_CLI_FLAG|g" {} +
find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|__VITE_MANAGED_API_MODE_PLACEHOLDER__|$MANAGED_API_MODE_FLAG|g" {} +
find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|__VITE_MANAGED_PROXY_AUTH_PLACEHOLDER__|$MANAGED_PROXY_AUTH_FLAG|g" {} +

if [ "$ENABLE_API_PROXY" != "true" ]; then
    sed -i '/# BEGIN API PROXY/,/# END API PROXY/d' /etc/nginx/conf.d/default.conf
fi

exec "$@"

#!/bin/sh

# 用环境变量替换前端默认 API URL
DEFAULT_API_URL=${DEFAULT_API_URL:-${API_URL:-https://api.openai.com/v1}}
API_PROXY_URL=${API_PROXY_URL:-${API_URL:-$DEFAULT_API_URL}}
DOCKER_LEGACY_API_URL_USED=${DOCKER_LEGACY_API_URL_USED:-false}
if [ -n "$API_URL" ]; then
    DOCKER_LEGACY_API_URL_USED=true
fi
CLIENT_API_URL=$DEFAULT_API_URL

API_PROXY_AVAILABLE=false
if [ "$ENABLE_API_PROXY" = "true" ] || [ -n "$MANAGED_API_URL" ] || [ -n "$MANAGED_API_KEY" ]; then
    API_PROXY_AVAILABLE=true
fi

MANAGED_API_URL_FLAG=false
MANAGED_API_KEY_FLAG=false
MANAGED_CODEX_CLI_FLAG=false
MANAGED_CODEX_CLI_VALUE=false
MANAGED_API_MODE_FLAG=false
MANAGED_API_MODE_VALUE=images
MANAGED_PROXY_AUTH_FLAG=false
ACCESS_PASSWORD_TITLE_HINT_VALUE=

if [ -n "$MANAGED_API_URL" ]; then MANAGED_API_URL_FLAG=true; fi
if [ -n "$MANAGED_API_KEY" ]; then
    MANAGED_API_KEY_FLAG=true
    MANAGED_PROXY_AUTH_FLAG=true
fi
if [ -n "$MANAGED_CODEX_CLI" ]; then
    MANAGED_CODEX_CLI_FLAG=true
    if [ "$MANAGED_CODEX_CLI" = "true" ]; then
        MANAGED_CODEX_CLI_VALUE=true
    fi
fi
if [ "$MANAGED_API_MODE" = "images" ] || [ "$MANAGED_API_MODE" = "responses" ]; then
    MANAGED_API_MODE_FLAG=true
    MANAGED_API_MODE_VALUE=$MANAGED_API_MODE
fi
if [ -n "$ACCESS_PASSWORD_TITLE_HINT" ]; then
    ACCESS_PASSWORD_TITLE_HINT_VALUE=$ACCESS_PASSWORD_TITLE_HINT
fi

escape_sed_replacement() {
    printf '%s' "$1" | sed 's/[&|]/\\&/g'
}

escape_js_string() {
    printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

replace_js_placeholder() {
    placeholder=$1
    value=$(escape_sed_replacement "$2")
    find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|$placeholder|$value|g" {} +
}

cat > /usr/share/nginx/html/runtime-config.js <<EOF
window.__GPT_IMAGE_PLAYGROUND_CONFIG__ = Object.freeze({
  defaultApiUrl: "$(escape_js_string "$CLIENT_API_URL")",
  apiProxyAvailable: $API_PROXY_AVAILABLE,
  managedApiUrl: $MANAGED_API_URL_FLAG,
  managedApiKey: $MANAGED_API_KEY_FLAG,
  managedCodexCli: $MANAGED_CODEX_CLI_FLAG,
  managedCodexCliValue: $MANAGED_CODEX_CLI_VALUE,
  managedApiMode: $MANAGED_API_MODE_FLAG,
  managedApiModeValue: "$(escape_js_string "$MANAGED_API_MODE_VALUE")",
  managedProxyAuth: $MANAGED_PROXY_AUTH_FLAG,
  accessPasswordTitleHint: "$(escape_js_string "$ACCESS_PASSWORD_TITLE_HINT_VALUE")"
});
EOF
chmod 644 /usr/share/nginx/html/runtime-config.js

replace_js_placeholder "__VITE_DEFAULT_API_URL_PLACEHOLDER__" "$CLIENT_API_URL"
replace_js_placeholder "__VITE_API_PROXY_AVAILABLE_PLACEHOLDER__" "$API_PROXY_AVAILABLE"
replace_js_placeholder "__VITE_DOCKER_DEPLOYMENT_PLACEHOLDER__" "true"
replace_js_placeholder "__VITE_DOCKER_LEGACY_API_URL_USED_PLACEHOLDER__" "$DOCKER_LEGACY_API_URL_USED"
replace_js_placeholder "__VITE_MANAGED_API_URL_PLACEHOLDER__" "$MANAGED_API_URL_FLAG"
replace_js_placeholder "__VITE_MANAGED_API_KEY_PLACEHOLDER__" "$MANAGED_API_KEY_FLAG"
replace_js_placeholder "__VITE_MANAGED_CODEX_CLI_PLACEHOLDER__" "$MANAGED_CODEX_CLI_FLAG"
replace_js_placeholder "__VITE_MANAGED_CODEX_CLI_VALUE_PLACEHOLDER__" "$MANAGED_CODEX_CLI_VALUE"
replace_js_placeholder "__VITE_MANAGED_API_MODE_PLACEHOLDER__" "$MANAGED_API_MODE_FLAG"
replace_js_placeholder "__VITE_MANAGED_API_MODE_VALUE_PLACEHOLDER__" "$MANAGED_API_MODE_VALUE"
replace_js_placeholder "__VITE_MANAGED_PROXY_AUTH_PLACEHOLDER__" "$MANAGED_PROXY_AUTH_FLAG"

if [ "$API_PROXY_AVAILABLE" != "true" ]; then
    sed -i '/# BEGIN API PROXY/,/# END API PROXY/d' /etc/nginx/conf.d/default.conf
fi

exec "$@"

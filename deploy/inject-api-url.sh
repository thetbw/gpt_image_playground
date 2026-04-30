#!/bin/sh

API_URL=${API_URL:-https://api.openai.com}
CLIENT_API_URL=$API_URL
if [ -n "$MANAGED_API_URL" ]; then
    case "$MANAGED_API_URL" in
        */v1|*/v1/)
            CLIENT_API_URL=https://api.openai.com/v1
            ;;
        *)
            CLIENT_API_URL=https://api.openai.com
            ;;
    esac
fi

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

escape_sed_replacement() {
    printf '%s' "$1" | sed 's/[&|]/\\&/g'
}

replace_js_placeholder() {
    placeholder=$1
    value=$(escape_sed_replacement "$2")
    find /usr/share/nginx/html/assets -type f -name "*.js" -exec sed -i "s|$placeholder|$value|g" {} +
}

replace_js_placeholder "__VITE_DEFAULT_API_URL_PLACEHOLDER__" "$CLIENT_API_URL"
replace_js_placeholder "__VITE_API_PROXY_AVAILABLE_PLACEHOLDER__" "$API_PROXY_AVAILABLE"
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

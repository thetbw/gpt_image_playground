#!/bin/sh

ANNOUNCEMENTS_SRC_DIR=${ANNOUNCEMENTS_SRC_DIR:-/announcements-src}
ANNOUNCEMENTS_DEST_DIR=/usr/share/nginx/html/announcements
INDEX_FILE=$ANNOUNCEMENTS_DEST_DIR/index.json

mkdir -p "$ANNOUNCEMENTS_SRC_DIR"
rm -rf "$ANNOUNCEMENTS_DEST_DIR"
mkdir -p "$ANNOUNCEMENTS_DEST_DIR"

for src_path in "$ANNOUNCEMENTS_SRC_DIR"/*; do
    [ -e "$src_path" ] || continue
    [ -f "$src_path" ] || continue
    cp "$src_path" "$ANNOUNCEMENTS_DEST_DIR/$(basename "$src_path")"
done

json_escape() {
    printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

extract_title() {
    file_path=$1
    heading=$(grep -m 1 '^# ' "$file_path" 2>/dev/null || true)
    if [ -n "$heading" ]; then
        printf '%s' "$heading" | sed 's/^# //; s/[[:space:]]*$//'
        return
    fi

    file_name=$(basename "$file_path")
    fallback_title=${file_name%.md}
    fallback_title=$(printf '%s' "$fallback_title" | sed 's/^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9][-_]//; s/[-_][-_]*/ /g')
    printf '%s' "$fallback_title"
}

md_file_names=$(
    for src_path in "$ANNOUNCEMENTS_SRC_DIR"/*.md; do
        [ -e "$src_path" ] || continue
        [ -f "$src_path" ] || continue
        basename "$src_path"
    done | LC_ALL=C sort -r
)

{
    printf '['
    first=1
    printf '%s\n' "$md_file_names" | while IFS= read -r file_name; do
        [ -n "$file_name" ] || continue
        file_path="$ANNOUNCEMENTS_SRC_DIR/$file_name"
        title=$(extract_title "$file_path")
        published_at=''
        case "$file_name" in
            [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]-*|[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]_*)
                published_at=$(printf '%s' "$file_name" | cut -c 1-10)
                ;;
        esac

        if [ "$first" -eq 0 ]; then
            printf ','
        fi
        first=0

        printf '{"id":"%s","title":"%s","file":"%s"' \
            "$(json_escape "$file_name")" \
            "$(json_escape "$title")" \
            "$(json_escape "$file_name")"
        if [ -n "$published_at" ]; then
            printf ',"publishedAt":"%s"' "$(json_escape "$published_at")"
        fi
        printf '}'
    done
    printf ']'
} > "$INDEX_FILE"

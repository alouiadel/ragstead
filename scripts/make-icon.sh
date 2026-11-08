#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="$ROOT/assets/logo.svg"
ASSETS="$ROOT/assets"

if [[ ! -f "$SOURCE" ]]; then
    echo "Missing source logo: $SOURCE" >&2
    exit 1
fi

sips -s format png "$SOURCE" --out "$ASSETS/icon-1024.png" >/dev/null

sips -z 512 512 "$ASSETS/icon-1024.png" --out "$ASSETS/icon-512.png" >/dev/null
sips -z 192 192 "$ASSETS/icon-1024.png" --out "$ASSETS/icon-192.png" >/dev/null
sips -z 180 180 "$ASSETS/icon-1024.png" --out "$ASSETS/apple-touch-icon.png" >/dev/null
sips -z 32 32 "$ASSETS/icon-1024.png" --out "$ASSETS/favicon-32.png" >/dev/null
sips -z 16 16 "$ASSETS/icon-1024.png" --out "$ASSETS/favicon-16.png" >/dev/null

echo "Wrote icon set to $ASSETS"

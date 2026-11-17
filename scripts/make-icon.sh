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

for icon in \
    "512:icon-512.png" \
    "192:icon-192.png" \
    "180:apple-touch-icon.png" \
    "32:favicon-32.png" \
    "16:favicon-16.png"; do
    size="${icon%%:*}"
    name="${icon#*:}"
    sips -z "$size" "$size" "$ASSETS/icon-1024.png" --out "$ASSETS/$name" >/dev/null
done

echo "Wrote icon set to $ASSETS"

#!/usr/bin/env bash
# Compila la plataforma real (repo iot) como demo sin backend y la deja en
# public/plataforma, que es lo que muestra PlatformStage en la landing.
#
#   scripts/plataforma-demo/build.sh [ruta al repo iot]     (por defecto ../iot)
#
# No modifica el repo iot: trabaja sobre una copia temporal de su frontend.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
landing="$(cd "$here/../.." && pwd)"
iot="${1:-$landing/../iot}"
[ -d "$iot/frontend/src" ] || { echo "No encuentro el frontend de la plataforma en $iot/frontend" >&2; exit 1; }

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
rsync -a --exclude node_modules --exclude dist --exclude '.env*' "$iot/frontend/" "$work/"
mkdir "$work/demo"
cp "$here"/kit/* "$work/demo/"
cp "$here/demo.html" "$here/vite.demo.config.mjs" "$work/"

cd "$work"
npm ci --no-audit --no-fund --silent
VITE_API_URL=http://demo.invalid VITE_WS_URL=ws://demo.invalid npx vite build --config vite.demo.config.mjs

rm -rf "$landing/public/plataforma"
mkdir -p "$landing/public/plataforma"
cp -R dist-demo/. "$landing/public/plataforma/"
mv "$landing/public/plataforma/demo.html" "$landing/public/plataforma/index.html"
# El panel de administración no forma parte de la demo: sus archivos no se publican.
rm -f "$landing"/public/plataforma/assets/{AdminPanel,DashboardBuilder,Admin}*
git -C "$iot" rev-parse --short HEAD > "$landing/public/plataforma/VERSION"
echo "Demo de la plataforma ($(cat "$landing/public/plataforma/VERSION")) en public/plataforma"

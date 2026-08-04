#!/bin/bash
# Builds the Vanilla Chat desktop app (Gelectron) with bundled Ollama.
#
# Usage:
#   npm run build           — build and sign (ad-hoc)
#   npm run build -- --copy — also copy the finished .app into /Applications
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GELECTRON_REPO="$ROOT/../gelectron"
OLLAMA_REPO="$ROOT/../gelectron-ollama"
PACKAGER="$GELECTRON_REPO/packager/bin/gelectron-packager.js"
BINARY="$GELECTRON_REPO/target/release/gelectron"
STAGING="$ROOT/build/staging-gelectron"
DIST="$ROOT/dist"
APP_NAME="VanillaChat"
APP_BUNDLE="$APP_NAME.app"
WEB_FILES="server.js src public ui themes config"
COPY_TO_APPS=0

for arg in "$@"; do
  case "$arg" in
    --copy) COPY_TO_APPS=1 ;;
  esac
done

if [ ! -e "$PACKAGER" ]; then
  echo "✗ Missing packager: $PACKAGER" >&2
  echo "  Expected a 'gelectron' repo next to vanilla-sh (../gelectron)." >&2
  exit 1
fi
if [ ! -e "$BINARY" ]; then
  echo "✗ Missing gelectron binary: $BINARY" >&2
  echo "  Build it first: (cd ../gelectron && cargo build --release)" >&2
  exit 1
fi
if [ ! -d "$OLLAMA_REPO" ]; then
  echo "✗ Missing gelectron-ollama repo: $OLLAMA_REPO" >&2
  exit 1
fi

echo "── Vanilla Chat build (Gelectron) ──"

echo
echo "1/4 Assembling app payload..."
rm -rf "$STAGING"
mkdir -p "$STAGING"
for f in $WEB_FILES; do
  if [ -e "$ROOT/$f" ]; then
    cp -R "$ROOT/$f" "$STAGING/"
  else
    echo "  (skipping missing: $f)"
  fi
done
cp "$ROOT/gelectron/main.js" "$STAGING/main.js"
cp "$ROOT/gelectron/splash.html" "$STAGING/splash.html"
cp "$ROOT/logo.png" "$STAGING/icon.png"
cat > "$STAGING/package.json" <<EOF
{
  "name": "vanilla-chat",
  "version": "2.0.0",
  "description": "Vanilla Chat desktop app",
  "main": "main.js"
}
EOF

echo
echo "2/4 Installing runtime dependencies..."
mkdir -p "$STAGING/node_modules"
cp -R "$ROOT/node_modules/." "$STAGING/node_modules/"
rm -f "$STAGING/node_modules/gelectron-ollama"
rm -rf "$STAGING/node_modules/.bin" "$STAGING/node_modules/.cache"
cp -R "$OLLAMA_REPO" "$STAGING/node_modules/gelectron-ollama"
rm -rf "$STAGING/node_modules/gelectron-ollama/.git"
rm -rf "$STAGING/node_modules/gelectron-ollama/target"
find "$STAGING/node_modules" -type d -name ".github" -exec rm -rf {} + 2>/dev/null || true

echo
echo "3/4 Packaging app bundle..."
mkdir -p "$DIST"
node "$PACKAGER" --dir "$STAGING" \
  --name "$APP_NAME" \
  --binary "$BINARY" \
  --out "$DIST"

APP="$DIST/$APP_BUNDLE"
rm -rf "$APP/Contents/MacOS/node_modules"
cp -R "$STAGING/node_modules" "$APP/Contents/Resources/app/node_modules"
rm -rf "$APP/Contents/Resources/app/data"

ENTITLEMENTS="$APP/Contents/entitlements.plist"
BIN="$APP/Contents/MacOS/gelectron-bin"
if [ -f "$ENTITLEMENTS" ]; then
  if codesign --force --sign - --entitlements "$ENTITLEMENTS" "$BIN" >/dev/null 2>&1 \
     && codesign --force --sign - "$APP" >/dev/null 2>&1; then
    echo "  signed (ad-hoc, mic/camera entitlements)"
  else
    echo "  (codesign skipped)"
  fi
else
  if codesign --force --sign - "$APP" >/dev/null 2>&1; then
    echo "  signed (ad-hoc)"
  else
    echo "  (codesign skipped)"
  fi
fi

echo
echo "4/4 Cleaning up staging..."
rm -rf "$STAGING"

echo
echo "✓ Build complete: $APP"
echo "  Run it:  open \"$APP\""

if [ "$COPY_TO_APPS" = "1" ]; then
  echo "  Copying to /Applications…"
  rm -rf "/Applications/$APP_BUNDLE"
  cp -R "$APP" "/Applications/"
  echo "✓ Installed: /Applications/$APP_BUNDLE"
fi

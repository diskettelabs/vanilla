#!/bin/bash
# Builds the Vanilla desktop app for the Electron shell.
#
# Usage:
#   npm run build:electron           — build and sign (ad-hoc) into dist/electron/
#   npm run build:electron -- --copy — also copy the finished .app into /Applications
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGING="$ROOT/build/staging-electron"
DIST="$ROOT/dist/electron"
APP_NAME="Vanilla"
VERSION="$(node -p "require('$ROOT/electron/package.json').version")"
ELECTRON_VERSION="$(node -p "require('$ROOT/electron/package.json').devDependencies.electron.replace(/^\^/, '')")"
COPY_TO_APPS=0

for arg in "$@"; do
  case "$arg" in
    --copy) COPY_TO_APPS=1 ;;
  esac
done

echo "── Vanilla build (Electron) ──"

echo
echo "1/4 Assembling app payload..."
rm -rf "$STAGING"
mkdir -p "$STAGING"
for f in server.js src public ui themes config; do
  if [ -e "$ROOT/$f" ]; then
    cp -R "$ROOT/$f" "$STAGING/"
  else
    echo "  (skipping missing: $f)"
  fi
done
cp "$ROOT/electron/main.js" "$STAGING/main.js"
cp "$ROOT/electron/preload.js" "$STAGING/preload.js"
cp "$ROOT/electron/splash.html" "$STAGING/splash.html"
if [ -f "$ROOT/logo.png" ]; then
  cp "$ROOT/logo.png" "$STAGING/icon.png"
elif [ -f "$ROOT/electron/icon.png" ]; then
  cp "$ROOT/electron/icon.png" "$STAGING/icon.png"
fi

echo
echo "2/4 Installing runtime dependencies..."
mkdir -p "$STAGING/node_modules"
cp -R "$ROOT/node_modules/." "$STAGING/node_modules/"
rm -f "$STAGING/node_modules/gelectron-ollama"
rm -rf "$STAGING/node_modules/gelectron-core" \
       "$STAGING/node_modules/electron" \
       "$STAGING/node_modules/.bin" \
       "$STAGING/node_modules/.cache" \
       "$STAGING/node_modules/@electron-internal" \
       "$STAGING/node_modules/@electron"
cp -R "$ROOT/../gelectron-ollama" "$STAGING/node_modules/gelectron-ollama"
rm -rf "$STAGING/node_modules/gelectron-ollama/.git"
rm -rf "$STAGING/node_modules/gelectron-ollama/target"
find "$STAGING/node_modules" -type d -name ".github" -exec rm -rf {} + 2>/dev/null || true

cat > "$STAGING/package.json" <<EOF
{
  "name": "vanilla-chat",
  "productName": "Vanilla",
  "version": "$VERSION",
  "description": "Vanilla desktop app",
  "main": "main.js",
  "dependencies": {
    "cjs": "^0.0.11",
    "express": "^4.21.0",
    "gelectron-ollama": "^0.1.0",
    "multer": "^2.2.0",
    "sharp": "^0.35.3",
    "uuid": "^11.1.1",
    "vosk-browser": "^0.0.8"
  }
}
EOF

echo
echo "3/4 Packaging app bundle..."
mkdir -p "$DIST"

ICON_ARG=""
if [ -f "$ROOT/icon.icns" ]; then
  ICON_ARG="--icon=$ROOT/icon.icns"
elif [ -f "$ROOT/logo.png" ]; then
  ICON_ARG="--icon=$ROOT/logo.png"
elif [ -f "$ROOT/electron/icon.png" ]; then
  ICON_ARG="--icon=$ROOT/electron/icon.png"
fi

npx --yes electron-packager@17.1.2 "$STAGING" "$APP_NAME" \
  --platform=darwin \
  --arch=arm64 \
  --app-version="$VERSION" \
  --electron-version="$ELECTRON_VERSION" \
  --out="$DIST" \
  --overwrite \
  --no-prune \
  $ICON_ARG

APP="$DIST/$APP_NAME.app"
if command -v codesign >/dev/null 2>&1; then
  if codesign --force --deep --sign - "$APP" >/dev/null 2>&1; then
    echo "  signed (ad-hoc)"
  else
    echo "  (codesign skipped)"
  fi
fi

echo
echo "4/4 Cleaning up staging..."
rm -rf "$STAGING"

echo
echo "Creating distributable zip..."
ZIP="$DIST/$APP_NAME-$VERSION-mac-arm64.zip"
rm -f "$ZIP"
(cd "$DIST" && zip -rqy "$(basename "$ZIP")" "$APP.app")
echo "✓ Zip: $ZIP"

echo
echo "✓ Build complete: $APP"
echo "  Run it:  open \"$APP\""
echo "  Zip:     $ZIP"

if [ "$COPY_TO_APPS" = "1" ]; then
  echo "  Copying to /Applications…"
  rm -rf "/Applications/$APP_NAME.app"
  cp -R "$APP" "/Applications/"
  echo "✓ Installed: /Applications/$APP_NAME.app"
fi
#!/bin/bash
# Builds distributable desktop apps for Electron and Gelectron.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD="$ROOT/build"
GELECTRON_REPO="$ROOT/../gelectron"
GELECTRON_PACKAGER="$GELECTRON_REPO/packager/bin/gelectron-packager.js"
GELECTRON_BIN="$GELECTRON_REPO/target/release/gelectron"
WEB_FILES="server.js src public ui themes config"

echo "── Vanilla Chat desktop build ──"
rm -rf "$BUILD"
mkdir -p "$BUILD/staging-web"
mkdir -p "$BUILD/staging-gelectron"
mkdir -p "$BUILD/staging-electron"

echo
echo "1/4 Assembling shared web app payload..."
for f in $WEB_FILES; do
  if [ -e "$ROOT/$f" ]; then
    cp -R "$ROOT/$f" "$BUILD/staging-web/"
  else
    echo "  (skipping missing: $f)"
  fi
done

echo
echo "2/4 Assembling Gelectron staging dir..."
cp -R "$BUILD/staging-web/." "$BUILD/staging-gelectron/"
cp "$ROOT/gelectron/main.js" "$BUILD/staging-gelectron/main.js"
cp "$ROOT/gelectron/splash.html" "$BUILD/staging-gelectron/splash.html"
cp "$ROOT/logo.png" "$BUILD/staging-gelectron/icon.png"
cat > "$BUILD/staging-gelectron/package.json" <<EOF
{
  "name": "vanilla-chat",
  "version": "2.0.0",
  "description": "Vanilla Chat desktop app (Gelectron)",
  "main": "main.js"
}
EOF

echo "Installing production node_modules for Gelectron..."
mkdir -p "$BUILD/staging-gelectron/node_modules"
cp -R "$ROOT/node_modules/." "$BUILD/staging-gelectron/node_modules/"
rm -f "$BUILD/staging-gelectron/node_modules/gelectron-ollama"
rm -rf "$BUILD/staging-gelectron/node_modules/.bin" "$BUILD/staging-gelectron/node_modules/.cache"
echo "Copying real gelectron-ollama package (with dist + deps)..."
cp -R "$ROOT/../gelectron-ollama" "$BUILD/staging-gelectron/node_modules/gelectron-ollama"
rm -rf "$BUILD/staging-gelectron/node_modules/gelectron-ollama/.git"
rm -rf "$BUILD/staging-gelectron/node_modules/gelectron-ollama/target"
find "$BUILD/staging-gelectron/node_modules" -type d -name ".github" -exec rm -rf {} + 2>/dev/null

echo
echo "3/4 Assembling Electron staging dir..."
cp -R "$BUILD/staging-web/." "$BUILD/staging-electron/"
cp "$ROOT/electron/main.js" "$BUILD/staging-electron/main.js"
cp "$ROOT/electron/splash.html" "$BUILD/staging-electron/splash.html"
cp "$ROOT/electron/preload.js" "$BUILD/staging-electron/preload.js"
cp "$ROOT/logo.png" "$BUILD/staging-electron/icon.png"
cat > "$BUILD/staging-electron/package.json" <<EOF
{
  "name": "vanilla-chat-electron",
  "version": "2.0.0",
  "description": "Vanilla Chat desktop app (Electron)",
  "main": "main.js",
  "scripts": {
    "build": "electron-builder --mac"
  },
  "dependencies": {
    "electron-ollama": "^0.1.25"
  },
  "devDependencies": {
    "electron": "^43.2.0",
    "electron-builder": "^26.0.12"
  },
  "build": {
    "appId": "com.vanillachat.app",
    "productName": "Vanilla Chat",
    "asar": true,
    "asarUnpack": [
      "**/node_modules/@img/**",
      "**/node_modules/sharp/**"
    ],
    "files": [
      "**/*",
      "!node_modules/.cache",
      "!node_modules/.bin"
    ],
    "directories": {
      "output": "dist"
    },
    "mac": {
      "category": "public.app-category.chat",
      "icon": "icon.png",
      "target": [
        "dmg"
      ]
    }
  }
}
EOF

echo
echo "4/4 Packaging..."

echo "  ── Gelectron ──"
node "$GELECTRON_PACKAGER" --dir "$BUILD/staging-gelectron" \
  --name "VanillaChat" \
  --binary "$GELECTRON_BIN" \
  --out "$BUILD/out"

APP="$BUILD/out/VanillaChat.app"
rm -rf "$APP/Contents/MacOS/node_modules"
cp -R "$BUILD/staging-gelectron/node_modules" "$APP/Contents/Resources/app/node_modules"
rm -rf "$APP/Contents/Resources/app/data"
codesign --force --deep --sign - "$APP" >/dev/null 2>&1 && echo "  Gelectron: signed (ad-hoc)" || echo "  Gelectron: codesign skipped"

echo "  ── Electron ──"
if [ -d "$BUILD/staging-electron/node_modules" ]; then
  echo "  Electron: node_modules already installed"
else
  (cd "$BUILD/staging-electron" && npm install --no-audit --no-fund >/dev/null)
fi
(cd "$BUILD/staging-electron" && npx electron-builder --mac 2>&1 | tail -5)

echo
echo "✓ Build complete:"
echo "  Gelectron: $APP"
echo "  Electron:  $BUILD/staging-electron/dist/Vanilla Chat.app"

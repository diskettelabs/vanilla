#!/bin/bash
# Builds the Vanilla desktop app (Gelectron) with bundled Ollama.
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
APP_NAME="Vanilla"
APP_BUNDLE="$APP_NAME.app"
VERSION="0.1.0"
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

echo "── Vanilla build (Gelectron) ──"

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
cp "$ROOT/gelectron/preload.js" "$STAGING/preload.js"
cp "$ROOT/gelectron/splash.html" "$STAGING/splash.html"
cp "$ROOT/logo.png" "$STAGING/icon.png"
cat > "$STAGING/package.json" <<EOF
{
  "name": "vanilla-chat",
  "version": "$VERSION",
  "description": "Vanilla desktop app",
  "main": "main.js"
}
EOF

echo
echo "2/4 Installing runtime dependencies..."
mkdir -p "$STAGING/node_modules"
ditto --norsrc --noqtn "$ROOT/node_modules" "$STAGING/node_modules"
rm -f "$STAGING/node_modules/gelectron-ollama"
rm -rf "$STAGING/node_modules/.bin" "$STAGING/node_modules/.cache"
mkdir -p "$STAGING/node_modules/gelectron-ollama"
ditto --norsrc --noqtn "$OLLAMA_REPO/dist" "$STAGING/node_modules/gelectron-ollama/dist"
cp "$OLLAMA_REPO/package.json" "$OLLAMA_REPO/package-lock.json" "$STAGING/node_modules/gelectron-ollama/"
(cd "$STAGING/node_modules/gelectron-ollama" && npm install --omit=dev --no-audit --no-fund)
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
if [ -f "$ENTITLEMENTS" ]; then
  if codesign --force --deep --sign - --entitlements "$ENTITLEMENTS" "$APP" >/dev/null 2>&1; then
    echo "  signed (ad-hoc, mic/camera entitlements)"
  else
    echo "  (codesign skipped)"
  fi
else
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
if command -v ditto >/dev/null 2>&1; then
  ditto -c -k --sequesterRsrc --keepParent "$APP" "$ZIP"
else
  (cd "$DIST" && zip -rqy "$(basename "$ZIP")" "$APP_BUNDLE")
fi
echo "✓ Zip: $ZIP"

if [ "$(uname)" = "Darwin" ]; then
  echo
  echo "Creating DMG..."
  DMG="$DIST/$APP_NAME-$VERSION-mac-arm64.dmg"
  TMP_DMG="$DIST/.$APP_NAME-$VERSION.tmp.dmg"
  DMG_STAGE="$DIST/.dmg-stage"
  VOLNAME="$APP_NAME"
  BG_IMG="$ROOT/dmg/background.png"
  BG_RETINA="$ROOT/dmg/background@2x.png"

  BG_W=$(sips -g pixelWidth "$BG_IMG" 2>/dev/null | awk '/pixelWidth/{print $2}')
  BG_H=$(sips -g pixelHeight "$BG_IMG" 2>/dev/null | awk '/pixelHeight/{print $2}')
  [ -n "$BG_W" ] || BG_W=524
  [ -n "$BG_H" ] || BG_H=324

  rm -f "$TMP_DMG" "$DMG"
  rm -rf "$DMG_STAGE"
  mkdir -p "$DMG_STAGE/.background"
  cp -R "$APP" "$DMG_STAGE/"
  ln -s /Applications "$DMG_STAGE/Applications"
  if [ -f "$BG_IMG" ]; then
    cp "$BG_IMG" "$DMG_STAGE/.background/background.png"
    if [ -f "$BG_RETINA" ]; then
      cp "$BG_RETINA" "$DMG_STAGE/.background/background@2x.png"
    fi
  else
    echo "  (no background at dmg/background.png — using default)"
  fi

  MOUNT="/Volumes/$VOLNAME"
  hdiutil detach "$MOUNT" >/dev/null 2>&1 || true
  hdiutil create -volname "$VOLNAME" -srcfolder "$DMG_STAGE" -ov -format UDRW "$TMP_DMG" >/dev/null
  hdiutil attach "$TMP_DMG" -mountpoint "$MOUNT" -nobrowse >/dev/null

  if [ -f "$BG_IMG" ]; then
    if osascript <<OSA
tell application "Finder"
  tell disk "$VOLNAME"
    open
    delay 1
    set current view of container window to icon view
    set toolbar visible of container window to false
    set statusbar visible of container window to false
    set the bounds of container window to {100, 100, $((100 + BG_W)), $((100 + BG_H))}
    set opts to the icon view options of container window
    set background picture of opts to file ".background:background.png"
    set icon size of opts to 128
    set text size of opts to 14
    set arrangement of opts to not arranged
    set position of item "$APP_NAME.app" of container window to {$((BG_W / 4)), $((BG_H / 2))}
    set position of item "Applications" of container window to {$((BG_W * 3 / 4)), $((BG_H / 2))}
    delay 2
    close
  end tell
end tell
OSA
    then
      echo "  styled with background"
    else
      echo "  (could not style DMG window — automation permission? continuing without layout)"
    fi
  fi

  hdiutil detach "$MOUNT" >/dev/null 2>&1 || true
  hdiutil convert "$TMP_DMG" -format UDZO -imagekey zlib-level=9 -o "$DMG" >/dev/null
  rm -f "$TMP_DMG"
  rm -rf "$DMG_STAGE"
  echo "✓ DMG: $DMG"
fi

echo
echo "✓ Build complete: $APP"
echo "  Run it:  open \"$APP\""
echo "  Zip:     $ZIP"
if [ "$(uname)" = "Darwin" ]; then echo "  DMG:     $DMG"; fi

if [ "$COPY_TO_APPS" = "1" ]; then
  echo "  Copying to /Applications…"
  rm -rf "/Applications/$APP_BUNDLE"
  cp -R "$APP" "/Applications/"
  echo "✓ Installed: /Applications/$APP_BUNDLE"
fi

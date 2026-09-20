#!/bin/bash
# Sign Gelectron-built Vanilla app for notarization
set -euo pipefail

APP="$1"
IDENTITY="${2:-Developer ID Application: Nathan Van Vooren (2Z7G4AHZG9)}"

if [ ! -d "$APP" ]; then
  echo "Error: App not found: $APP" >&2
  exit 1
fi

echo "Signing Gelectron app for notarization..."
echo "App: $APP"
echo "Identity: $IDENTITY"
echo

# Clean extended attributes
echo "1. Cleaning extended attributes..."
xattr -cr "$APP"
find "$APP" \( -name "._*" -o -name ".DS_Store" \) -delete
# Also clear FinderInfo from the app bundle itself
xattr -d com.apple.FinderInfo "$APP" 2>/dev/null || true

# Sign all native node modules and dylibs
echo "2. Signing native modules..."
find "$APP/Contents/Resources/app/node_modules" -type f \( -name "*.node" -o -name "*.dylib" \) | \
grep -E "(darwin|universal)" | while read file; do
  echo "   Signing: $file"
  codesign --force --timestamp --options runtime --sign "$IDENTITY" "$file"
done

# Sign compat JS files
echo "3. Signing compat layer..."
if [ -d "$APP/Contents/MacOS/compat" ]; then
  find "$APP/Contents/MacOS/compat" -type f -name "*.js" | while read file; do
    echo "   Signing: $file"
    codesign --force --timestamp --options runtime --sign "$IDENTITY" "$file"
  done
fi

# Sign main binaries
echo "4. Signing main binaries..."
if [ -f "$APP/Contents/MacOS/gelectron-bin" ]; then
  echo "   Signing: gelectron-bin"
  codesign --force --timestamp --options runtime --sign "$IDENTITY" "$APP/Contents/MacOS/gelectron-bin"
fi
if [ -f "$APP/Contents/MacOS/node" ]; then
  echo "   Signing: node"
  codesign --force --timestamp --options runtime --sign "$IDENTITY" "$APP/Contents/MacOS/node"
fi

# Sign the app bundle (NOT with --deep, we already signed everything inside)
echo "5. Signing app bundle..."
# Only clear FinderInfo, not code signing attributes
xattr -d com.apple.FinderInfo "$APP" 2>/dev/null || true
codesign --force --timestamp --options runtime --sign "$IDENTITY" "$APP"

# Verify
echo "6. Verifying signature..."
codesign --verify --deep --strict --verbose=2 "$APP"

echo
echo "✓ Signing complete"

#!/bin/bash
set -Eeuo pipefail
IFS=$'\n\t'

###############################################################################
# Ocelo release pipeline
###############################################################################

ROOT="/Users/owen/Documents/Ocelo"
PROJECT="$ROOT/Ocelo.xcodeproj"
PBXPROJ="$PROJECT/project.pbxproj"
SCHEME="Ocelo"

# Prefer the full Xcode installation even if xcode-select points at CLT.
if [[ -z "${DEVELOPER_DIR:-}" && -d "/Applications/Xcode.app/Contents/Developer" ]]; then
  export DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer"
fi

DIST="$ROOT/Distribution"
DMG_CONFIG="$DIST/dmg.json"
APP_ENTITLEMENTS="$ROOT/Ocelo/Ocelo.entitlements"

RELEASES="$HOME/Developer/ocelo-releases"
UPDATES_REPO="$HOME/Developer/ocelo-updates"

NOTARY_PROFILE="xcode-key"
TEAM_ID="2Z7G4AHZG9"
IDENTITY="Developer ID Application: Nathan Van Vooren ($TEAM_ID)"

R2_BUCKET="ocelo-releases"
R2_PREFIX="ocelo"
DOWNLOAD_BASE="https://downloads.owen.uno/ocelo"
FEED_URL="https://ocelo.owen.uno/appcast.xml"

# Persistent state/work paths make --resume actually resume.
STATE_FILE="$DIST/.release-state.json"
WORK_ROOT="$HOME/Library/Application Support/OceloRelease"

RESUME=0
STATUS_ONLY=0
CURRENT_STAGE="none"
VERSION=""
BUILD=""
RELEASE_KIND=""

usage() {
  cat <<USAGE
Usage:
  $0
  $0 --resume
  $0 --status

Options:
  --resume      Continue from the last completed checkpoint.
  --status      Show the saved release checkpoint and exit.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --resume)
      RESUME=1
      ;;
    --status)
      STATUS_ONLY=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      usage >&2
      exit 2
      ;;
  esac
  shift
done

###############################################################################
# Helpers
###############################################################################

step() {
  printf '\n'
  printf '================================================================\n'
  printf '%s\n' "$1"
  printf '================================================================\n'
}

fail() {
  echo >&2
  echo "ERROR: $*" >&2
  exit 1
}

require() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing command: $1"
}

plist_value() {
  local plist="$1"
  local key="$2"
  /usr/libexec/PlistBuddy -c "Print :$key" "$plist"
}

stage_index() {
  case "$1" in
    none)                echo 0 ;;
    versioned)           echo 10 ;;
    built)               echo 20 ;;
    app_signed)          echo 30 ;;
    app_notarized)       echo 40 ;;
    dmg_built)           echo 50 ;;
    dmg_notarized)       echo 60 ;;
    packaged_verified)   echo 70 ;;
    finalized)           echo 80 ;;
    sparkle_generated)   echo 90 ;;
    uploaded)            echo 100 ;;
    published)           echo 110 ;;
    live_verified)       echo 120 ;;
    complete)            echo 130 ;;
    *) fail "Unknown release stage: $1" ;;
  esac
}

stage_done() {
  local wanted="$1"
  [[ "$(stage_index "$CURRENT_STAGE")" -ge "$(stage_index "$wanted")" ]]
}

save_state() {
  mkdir -p "$DIST"
  python3 - "$STATE_FILE" "$VERSION" "$BUILD" "$RELEASE_KIND" "$CURRENT_STAGE" <<'PY'
import json
import os
import sys
import tempfile
from pathlib import Path

path = Path(sys.argv[1])
data = {
    "version": sys.argv[2],
    "build": sys.argv[3],
    "release_kind": sys.argv[4],
    "last_completed_stage": sys.argv[5],
}
path.parent.mkdir(parents=True, exist_ok=True)
fd, temp_name = tempfile.mkstemp(prefix=path.name + ".", dir=path.parent)
try:
    with os.fdopen(fd, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
        f.flush()
        os.fsync(f.fileno())
    os.replace(temp_name, path)
finally:
    if os.path.exists(temp_name):
        os.unlink(temp_name)
PY
}

load_state() {
  [[ -f "$STATE_FILE" ]] || fail "No saved release state. Start a release without --resume."

  local fields
  fields="$(python3 - "$STATE_FILE" <<'PY'
import json
import sys

data = json.load(open(sys.argv[1]))
for key in ("version", "build", "release_kind", "last_completed_stage"):
    if key not in data:
        raise SystemExit(f"Missing state key: {key}")
print(data["version"])
print(data["build"])
print(data["release_kind"])
print(data["last_completed_stage"])
PY
)"

  VERSION="$(printf '%s\n' "$fields" | sed -n '1p')"
  BUILD="$(printf '%s\n' "$fields" | sed -n '2p')"
  RELEASE_KIND="$(printf '%s\n' "$fields" | sed -n '3p')"
  CURRENT_STAGE="$(printf '%s\n' "$fields" | sed -n '4p')"

  # Validate the stage while loading.
  stage_index "$CURRENT_STAGE" >/dev/null
}

checkpoint() {
  CURRENT_STAGE="$1"
  save_state
  echo "✓ checkpoint: $CURRENT_STAGE"
}

show_status() {
  if [[ ! -f "$STATE_FILE" ]]; then
    echo "No release is currently in progress."
    return
  fi

  load_state
  echo "Release in progress:"
  echo "  Ocelo $VERSION ($BUILD)"
  echo "  kind: $RELEASE_KIND"
  echo "  last completed stage: $CURRENT_STAGE"
}

on_error() {
  local code=$?
  local line="$1"

  # Avoid reporting the same failure again while Bash unwinds
  # an enclosing function / conditional block.
  trap - ERR

  echo >&2
  echo "Release failed at line $line." >&2
  echo "Last completed checkpoint: $CURRENT_STAGE" >&2
  echo >&2
  if [[ -f "$STATE_FILE" ]]; then
    echo "Nothing already published has been rolled back." >&2
    echo "After fixing the problem, run:" >&2
    echo >&2
    echo "  $0 --resume" >&2
  else
    echo "No resumable release state was created yet." >&2
  fi
  echo >&2
  exit "$code"
}

trap 'on_error $LINENO' ERR

notarize() {
  local archive="$1"
  local label="$2"
  local result_json="$3"
  local log_json="$4"

  step "Notarizing $label"

  xcrun notarytool submit \
    "$archive" \
    --keychain-profile "$NOTARY_PROFILE" \
    --wait \
    --output-format json \
    > "$result_json"

  cat "$result_json"

  local submission_id
  local status

  submission_id="$(python3 - "$result_json" <<'PY'
import json, sys
print(json.load(open(sys.argv[1]))["id"])
PY
)"

  status="$(python3 - "$result_json" <<'PY'
import json, sys
print(json.load(open(sys.argv[1]))["status"])
PY
)"

  xcrun notarytool log \
    "$submission_id" \
    --keychain-profile "$NOTARY_PROFILE" \
    "$log_json" \
    >/dev/null

  echo
  echo "Notary log:"
  echo "$log_json"

  if [[ "$status" != "Accepted" ]]; then
    cat "$log_json"
    fail "$label notarization returned status: $status"
  fi

  echo "✓ $label notarization accepted"
}

verify_no_forbidden_xattrs() {
  local target="$1"
  local forbidden

  forbidden="$(
    xattr -lr "$target" 2>/dev/null \
      | grep -E 'com\.apple\.(FinderInfo|ResourceFork)' \
      || true
  )"

  if [[ -n "$forbidden" ]]; then
    echo "$forbidden"
    fail "Forbidden FinderInfo/resource-fork metadata found in $target"
  fi
}

verify_production_entitlements() {
  local app="$1"
  local entitlements

  entitlements="$(codesign -d --entitlements :- "$app" 2>/dev/null)"

  if printf '%s\n' "$entitlements" | grep -F '$(' >/dev/null; then
    echo "$entitlements"
    fail "Unexpanded entitlement variable detected in production signature"
  fi

  if printf '%s\n' "$entitlements" \
    | grep -F '<key>com.apple.security.get-task-allow</key>' >/dev/null; then
    echo "$entitlements"
    fail "Development get-task-allow entitlement found in production signature"
  fi

  if printf '%s\n' "$entitlements" \
    | grep -F '<key>keychain-access-groups</key>' >/dev/null; then
    echo "$entitlements"
    fail "Unexpected keychain-access-groups entitlement in Developer ID release"
  fi

  echo "✓ production entitlements contain no unresolved variables"
  echo "✓ no development or unnecessary Keychain Sharing entitlement"
}

verify_source_entitlements() {
  [[ -f "$APP_ENTITLEMENTS" ]] || fail "Missing entitlements: $APP_ENTITLEMENTS"

  if grep -F '$(' "$APP_ENTITLEMENTS" >/dev/null; then
    fail "Source entitlements contain an Xcode build-variable placeholder. Resolve it before manual Developer ID signing."
  fi

  if /usr/libexec/PlistBuddy -c 'Print :keychain-access-groups' "$APP_ENTITLEMENTS" >/dev/null 2>&1; then
    fail "Ocelo.entitlements still contains keychain-access-groups, but Ocelo does not use a shared access group."
  fi
}

###############################################################################
# Status mode can exit before expensive preflight work.
###############################################################################

if [[ "$STATUS_ONLY" -eq 1 ]]; then
  show_status
  exit 0
fi

###############################################################################
# Preflight
###############################################################################

step "Preflight"
cd "$ROOT"

for cmd in \
  xcodebuild \
  xcrun \
  codesign \
  security \
  ditto \
  xattr \
  appdmg \
  git \
  curl \
  python3 \
  shasum \
  hdiutil \
  spctl \
  npx \
  cmp
do
  require "$cmd"
done

[[ -f "$PBXPROJ" ]] || fail "Missing $PBXPROJ"
[[ -f "$DMG_CONFIG" ]] || fail "Missing $DMG_CONFIG"
[[ -d "$UPDATES_REPO/.git" ]] || fail "Missing updates repository: $UPDATES_REPO"
mkdir -p "$DIST" "$RELEASES" "$WORK_ROOT"

verify_source_entitlements

# Make sure our saved Apple credentials actually work.
xcrun notarytool history --keychain-profile "$NOTARY_PROFILE" >/dev/null

# Make sure Developer ID identity exists.
security find-identity -v -p codesigning \
  | grep -F "$IDENTITY" >/dev/null \
  || fail "Developer ID identity not found: $IDENTITY"

# Fail before building if Cloudflare credentials are unavailable.
npx wrangler whoami >/dev/null

if [[ "$RESUME" -eq 1 ]]; then
  load_state
  echo "Resuming Ocelo $VERSION ($BUILD)"
  echo "Last completed checkpoint: $CURRENT_STAGE"

  RESUME_SETTINGS="$(
    xcodebuild \
      -project "$PROJECT" \
      -scheme "$SCHEME" \
      -configuration Release \
      -showBuildSettings
  )"
  RESUME_VERSION="$(
    printf '%s\n' "$RESUME_SETTINGS" \
      | awk -F ' = ' '/^[[:space:]]*MARKETING_VERSION = / { if (!found) { print $2; found=1 } }'
  )"
  RESUME_BUILD="$(
    printf '%s\n' "$RESUME_SETTINGS" \
      | awk -F ' = ' '/^[[:space:]]*CURRENT_PROJECT_VERSION = / { if (!found) { print $2; found=1 } }'
  )"

  [[ "$RESUME_VERSION" == "$VERSION" && "$RESUME_BUILD" == "$BUILD" ]] \
    || fail "Saved release is $VERSION ($BUILD), but the Xcode project is $RESUME_VERSION ($RESUME_BUILD)"

  # Before artifacts have been uploaded, the updates repo should still be clean.
  # Check this now so a stray file cannot derail the release at the very end.
  if [[ "$(stage_index "$CURRENT_STAGE")" -lt "$(stage_index uploaded)" ]]; then
    if [[ -n "$(git -C "$UPDATES_REPO" status --porcelain --untracked-files=all)" ]]; then
      echo "Updates repo contains local modifications:"
      git -C "$UPDATES_REPO" status --short
      fail "Clean ~/Developer/ocelo-updates before resuming"
    fi
    git -C "$UPDATES_REPO" pull --ff-only
  fi
else
  [[ ! -f "$STATE_FILE" ]] \
    || fail "A release is already in progress. Use --resume or inspect with --status."

  # Catch update-repo problems before spending time building/notarizing.
  if [[ -n "$(git -C "$UPDATES_REPO" status --porcelain --untracked-files=all)" ]]; then
    echo "Updates repo contains local modifications:"
    git -C "$UPDATES_REPO" status --short
    fail "Clean ~/Developer/ocelo-updates before starting a release"
  fi

  git -C "$UPDATES_REPO" pull --ff-only
fi

###############################################################################
# Read / choose version for a new release
###############################################################################

if [[ "$RESUME" -eq 0 ]]; then
  step "Reading current version"

  BUILD_SETTINGS="$(
    xcodebuild \
      -project "$PROJECT" \
      -scheme "$SCHEME" \
      -configuration Release \
      -showBuildSettings
  )"

  CURRENT_VERSION="$(
    printf '%s\n' "$BUILD_SETTINGS" \
      | awk -F ' = ' '/^[[:space:]]*MARKETING_VERSION = / { if (!found) { print $2; found=1 } }'
  )"

  CURRENT_BUILD="$(
    printf '%s\n' "$BUILD_SETTINGS" \
      | awk -F ' = ' '/^[[:space:]]*CURRENT_PROJECT_VERSION = / { if (!found) { print $2; found=1 } }'
  )"

  [[ -n "$CURRENT_VERSION" ]] || fail "Could not determine MARKETING_VERSION"
  [[ "$CURRENT_BUILD" =~ ^[0-9]+$ ]] \
    || fail "CURRENT_PROJECT_VERSION is not an integer: $CURRENT_BUILD"
  [[ "$CURRENT_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] \
    || fail "Expected semantic version x.y.z, got: $CURRENT_VERSION"

  echo "Current version: $CURRENT_VERSION"
  echo "Current build:   $CURRENT_BUILD"
  echo
  echo "Release type:"
  echo
  echo "  1) major   $CURRENT_VERSION → next x.0.0"
  echo "  2) minor   $CURRENT_VERSION → next x.y.0"
  echo "  3) patch   $CURRENT_VERSION → next x.y.z"
  echo
  read -r -p "Choose [1/2/3]: " RELEASE_CHOICE

  IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

  case "$RELEASE_CHOICE" in
    1|major|Major|MAJOR)
      VERSION="$((MAJOR + 1)).0.0"
      RELEASE_KIND="major"
      ;;
    2|minor|Minor|MINOR)
      VERSION="$MAJOR.$((MINOR + 1)).0"
      RELEASE_KIND="minor"
      ;;
    3|patch|Patch|PATCH)
      VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
      RELEASE_KIND="patch"
      ;;
    *)
      fail "Invalid release type"
      ;;
  esac

  BUILD="$((CURRENT_BUILD + 1))"

  echo
  echo "Release:"
  echo "  type:    $RELEASE_KIND"
  echo "  version: $CURRENT_VERSION → $VERSION"
  echo "  build:   $CURRENT_BUILD → $BUILD"
  echo
  read -r -p "Continue? [y/N]: " CONFIRM

  case "$CONFIRM" in
    y|Y|yes|YES) ;;
    *)
      echo "Cancelled."
      exit 0
      ;;
  esac

  step "Updating Xcode version numbers"

  VERSION_BACKUP="$PBXPROJ.release-backup"
  cp "$PBXPROJ" "$VERSION_BACKUP"

  python3 - "$PBXPROJ" "$VERSION" "$BUILD" <<'PY'
from pathlib import Path
import re
import sys

path = Path(sys.argv[1])
version = sys.argv[2]
build = sys.argv[3]
text = path.read_text()

text, marketing_count = re.subn(
    r'(?m)(MARKETING_VERSION\s*=\s*)[^;]+;',
    rf'\g<1>{version};',
    text,
)
text, build_count = re.subn(
    r'(?m)(CURRENT_PROJECT_VERSION\s*=\s*)[^;]+;',
    rf'\g<1>{build};',
    text,
)

if marketing_count == 0:
    raise SystemExit("No MARKETING_VERSION entries found")
if build_count == 0:
    raise SystemExit("No CURRENT_PROJECT_VERSION entries found")

path.write_text(text)
print(f"Updated {marketing_count} MARKETING_VERSION setting(s)")
print(f"Updated {build_count} CURRENT_PROJECT_VERSION setting(s)")
PY

  CURRENT_STAGE="versioned"
  save_state
  echo "✓ project version updated"
  echo "✓ checkpoint: versioned"
fi

###############################################################################
# Paths for this release
###############################################################################

WORK="$WORK_ROOT/$VERSION-$BUILD"
DERIVED="$WORK/DerivedData"
STAGE_DIST="$WORK/Distribution"
NOTARY_DIR="$DIST/.notary-$VERSION-$BUILD"

APP="$STAGE_DIST/Ocelo.app"
APP_ZIP="$NOTARY_DIR/Ocelo-$VERSION-$BUILD.zip"

DMG_NAME="Ocelo-$VERSION.dmg"
STAGED_DMG="$STAGE_DIST/$DMG_NAME"
FINAL_DMG="$DIST/$DMG_NAME"
DMG="$FINAL_DMG"

APP_NOTARY_JSON="$NOTARY_DIR/app-notary.json"
APP_NOTARY_LOG="$NOTARY_DIR/app-notary-log.json"
DMG_NOTARY_JSON="$NOTARY_DIR/dmg-notary.json"
DMG_NOTARY_LOG="$NOTARY_DIR/dmg-notary-log.json"

mkdir -p "$WORK" "$STAGE_DIST" "$NOTARY_DIR"

###############################################################################
# Build
###############################################################################

if ! stage_done built; then
  step "Building Ocelo $VERSION ($BUILD)"

  rm -rf "$DERIVED"
  mkdir -p "$DERIVED"

  xcodebuild \
    -project "$PROJECT" \
    -scheme "$SCHEME" \
    -configuration Release \
    -destination 'platform=macOS' \
    -derivedDataPath "$DERIVED" \
    DEVELOPMENT_TEAM="$TEAM_ID" \
    clean build

  BUILT_APP="$DERIVED/Build/Products/Release/Ocelo.app"
  [[ -d "$BUILT_APP" ]] || fail "Release build not found: $BUILT_APP"

  ACTUAL_VERSION="$(plist_value "$BUILT_APP/Contents/Info.plist" CFBundleShortVersionString)"
  ACTUAL_BUILD="$(plist_value "$BUILT_APP/Contents/Info.plist" CFBundleVersion)"

  [[ "$ACTUAL_VERSION" == "$VERSION" ]] \
    || fail "Built version is $ACTUAL_VERSION, expected $VERSION"
  [[ "$ACTUAL_BUILD" == "$BUILD" ]] \
    || fail "Built build number is $ACTUAL_BUILD, expected $BUILD"

  SOURCE_SPARKLE_BIN="$(
    find "$DERIVED" \
      -path '*/SourcePackages/artifacts/sparkle/Sparkle/bin' \
      -type d \
      -print 2>/dev/null \
      | sed -n '1p'
  )"
  [[ -n "$SOURCE_SPARKLE_BIN" ]] \
    || fail "Sparkle command-line tools were not produced by the build"

  rm -rf "$WORK/SparkleBin"
  DITTONORSRC=1 ditto --norsrc --noqtn "$SOURCE_SPARKLE_BIN" "$WORK/SparkleBin"

  checkpoint built
else
  echo "✓ skipping build (checkpoint already complete)"
fi

BUILT_APP="$DERIVED/Build/Products/Release/Ocelo.app"

###############################################################################
# Prepare and Developer ID sign app
###############################################################################

if ! stage_done app_signed; then
  step "Preparing clean release Ocelo.app"

  [[ -d "$BUILT_APP" ]] \
    || fail "Saved build output is missing: $BUILT_APP"

  rm -rf "$APP"

  DITTONORSRC=1 ditto \
    --norsrc \
    --noqtn \
    "$BUILT_APP" \
    "$APP"

  verify_no_forbidden_xattrs "$APP"
  echo "✓ release app contains no FinderInfo/resource forks"

  step "Signing Sparkle helpers with Developer ID"

  # Automatic Xcode builds may embed a development profile. This direct
  # Developer ID release does not use one.
  rm -f "$APP/Contents/embedded.provisionprofile"

  SPARKLE_FRAMEWORK="$APP/Contents/Frameworks/Sparkle.framework"
  SPARKLE_VERSION="$SPARKLE_FRAMEWORK/Versions/B"

  [[ -d "$SPARKLE_VERSION" ]] \
    || fail "Sparkle version directory is missing: $SPARKLE_VERSION"

  codesign --force --timestamp --options runtime --sign "$IDENTITY" \
    "$SPARKLE_VERSION/XPCServices/Installer.xpc"

  codesign --force --timestamp --options runtime \
    --preserve-metadata=entitlements \
    --sign "$IDENTITY" \
    "$SPARKLE_VERSION/XPCServices/Downloader.xpc"

  codesign --force --timestamp --options runtime --sign "$IDENTITY" \
    "$SPARKLE_VERSION/Autoupdate"

  codesign --force --timestamp --options runtime --sign "$IDENTITY" \
    "$SPARKLE_VERSION/Updater.app"

  codesign --force --timestamp --options runtime --sign "$IDENTITY" \
    "$SPARKLE_FRAMEWORK"

  for SIGNED_ITEM in \
    "$SPARKLE_VERSION/XPCServices/Installer.xpc" \
    "$SPARKLE_VERSION/XPCServices/Downloader.xpc" \
    "$SPARKLE_VERSION/Autoupdate" \
    "$SPARKLE_VERSION/Updater.app" \
    "$SPARKLE_FRAMEWORK"
  do
    SIGNED_INFO="$(codesign -dv --verbose=4 "$SIGNED_ITEM" 2>&1)"

    printf '%s\n' "$SIGNED_INFO" \
      | grep -F "Authority=$IDENTITY" >/dev/null \
      || fail "Sparkle component is not Developer ID signed: $SIGNED_ITEM"

    printf '%s\n' "$SIGNED_INFO" \
      | grep -E '^Timestamp=' >/dev/null \
      || fail "Sparkle component has no secure timestamp: $SIGNED_ITEM"

    HELPER_ENTITLEMENTS="$(codesign -d --entitlements :- "$SIGNED_ITEM" 2>/dev/null || true)"
    if printf '%s\n' "$HELPER_ENTITLEMENTS" \
      | grep -F '<key>com.apple.security.get-task-allow</key>' >/dev/null; then
      echo "$HELPER_ENTITLEMENTS"
      fail "Sparkle component retains get-task-allow: $SIGNED_ITEM"
    fi
  done

  echo "✓ Sparkle helpers use Developer ID"
  echo "✓ Sparkle helpers have secure timestamps"

  step "Signing Ocelo with Developer ID"

  codesign --force --timestamp --options runtime --sign "$IDENTITY" \
    "$APP/Contents/Frameworks/OceloCore.framework"

  codesign --force --timestamp --options runtime \
    --entitlements "$APP_ENTITLEMENTS" \
    --sign "$IDENTITY" \
    "$APP"

  verify_no_forbidden_xattrs "$APP"
  verify_production_entitlements "$APP"

  codesign --verify --deep --strict --verbose=2 "$APP"

  SIGN_INFO="$(codesign -dv --verbose=4 "$APP" 2>&1)"

  printf '%s\n' "$SIGN_INFO" \
    | grep -F "Authority=$IDENTITY" >/dev/null \
    || fail "App is not Developer ID signed"

  printf '%s\n' "$SIGN_INFO" \
    | grep -E 'flags=.*runtime' >/dev/null \
    || fail "App does not have hardened runtime enabled"

  printf '%s\n' "$SIGN_INFO" \
    | grep -E '^Timestamp=' >/dev/null \
    || fail "App signature does not have a secure timestamp"

  echo "✓ app signature valid"
  echo "✓ Developer ID: $IDENTITY"
  echo "✓ hardened runtime enabled"
  echo "✓ secure timestamp present"

  APP_FEED="$(plist_value "$APP/Contents/Info.plist" SUFeedURL)"
  APP_KEY="$(plist_value "$APP/Contents/Info.plist" SUPublicEDKey)"

  [[ "$APP_FEED" == "$FEED_URL" ]] || fail "Unexpected SUFeedURL: $APP_FEED"
  [[ -n "$APP_KEY" ]] || fail "SUPublicEDKey is missing"

  echo "Feed: $APP_FEED"
  echo "Public key: $APP_KEY"

  checkpoint app_signed
else
  echo "✓ skipping app signing (checkpoint already complete)"
fi

###############################################################################
# Notarize and staple app
###############################################################################

if ! stage_done app_notarized; then
  step "Creating app notarization archive"

  rm -f "$APP_ZIP"
  ditto -c -k --sequesterRsrc --keepParent "$APP" "$APP_ZIP"

  notarize "$APP_ZIP" "Ocelo.app" "$APP_NOTARY_JSON" "$APP_NOTARY_LOG"

  step "Stapling app"
  xcrun stapler staple "$APP"
  xcrun stapler validate "$APP"

  codesign --verify --deep --strict --verbose=2 "$APP"
  spctl -a -vv -t execute "$APP"

  checkpoint app_notarized
else
  echo "✓ skipping app notarization (checkpoint already complete)"
fi

###############################################################################
# Build and sign DMG
###############################################################################

if ! stage_done dmg_built; then
  step "Building custom DMG"

  rm -f "$STAGED_DMG"
  rm -rf "$STAGE_DIST/dmg.json" "$STAGE_DIST/background.png" \
    "$STAGE_DIST/background@2x.png" "$STAGE_DIST/icon.icns"

  ACTIVE_DMG_CONFIG="$STAGE_DIST/dmg.json"

  DITTONORSRC=1 ditto --norsrc --noqtn "$DMG_CONFIG" "$ACTIVE_DMG_CONFIG"

  for ASSET in background.png background@2x.png; do
    if [[ -f "$DIST/$ASSET" ]]; then
      DITTONORSRC=1 ditto --norsrc --noqtn "$DIST/$ASSET" "$STAGE_DIST/$ASSET"
    fi
  done

  ICON_SOURCE=""
  if [[ -f "$ROOT/icon.icns" ]]; then
    ICON_SOURCE="$ROOT/icon.icns"
  elif [[ -f "$DIST/icon.icns" ]]; then
    ICON_SOURCE="$DIST/icon.icns"
  fi

  if [[ -n "$ICON_SOURCE" ]]; then
    DITTONORSRC=1 ditto --norsrc --noqtn "$ICON_SOURCE" "$STAGE_DIST/icon.icns"
  fi

  python3 - "$ACTIVE_DMG_CONFIG" "$([[ -n "$ICON_SOURCE" ]] && echo 1 || echo 0)" <<'PY'
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
has_icon = sys.argv[2] == "1"
data = json.loads(path.read_text())

# Never let appdmg apply a second, unrelated code signature.
data.pop("code-sign", None)

if has_icon:
    data["icon"] = "icon.icns"
else:
    data.pop("icon", None)

path.write_text(json.dumps(data, indent=2) + "\n")
PY

  if [[ -n "$ICON_SOURCE" ]]; then
    echo "DMG icon: $ICON_SOURCE"
  fi

  (
    cd "$STAGE_DIST"
    appdmg "$(basename "$ACTIVE_DMG_CONFIG")" "$DMG_NAME"
  )

  hdiutil verify "$STAGED_DMG"

  step "Signing DMG"
  codesign --force --timestamp --sign "$IDENTITY" "$STAGED_DMG"
  codesign --verify --verbose=2 "$STAGED_DMG"

  DMG_SIGN_INFO="$(codesign -dv --verbose=4 "$STAGED_DMG" 2>&1)"
  printf '%s\n' "$DMG_SIGN_INFO" \
    | grep -F "Authority=$IDENTITY" >/dev/null \
    || fail "DMG is not Developer ID signed"
  printf '%s\n' "$DMG_SIGN_INFO" \
    | grep -E '^Timestamp=' >/dev/null \
    || fail "DMG signature does not have a secure timestamp"

  checkpoint dmg_built
else
  echo "✓ skipping DMG build/sign (checkpoint already complete)"
fi

###############################################################################
# Notarize and staple DMG
###############################################################################

if ! stage_done dmg_notarized; then
  notarize "$STAGED_DMG" "$DMG_NAME" "$DMG_NOTARY_JSON" "$DMG_NOTARY_LOG"

  step "Stapling DMG"
  xcrun stapler staple "$STAGED_DMG"
  xcrun stapler validate "$STAGED_DMG"

  spctl -a -vv -t open --context context:primary-signature "$STAGED_DMG"

  checkpoint dmg_notarized
else
  echo "✓ skipping DMG notarization (checkpoint already complete)"
fi

###############################################################################
# Verify the exact packaged app, including an actual launch smoke test
###############################################################################

if ! stage_done packaged_verified; then
  step "Verifying packaged app"

  MOUNTPOINT="$WORK/Mount"
  rm -rf "$MOUNTPOINT"
  mkdir -p "$MOUNTPOINT"

  cleanup_mount() {
    if mount | grep -F " on $MOUNTPOINT " >/dev/null 2>&1; then
      hdiutil detach "$MOUNTPOINT" >/dev/null || true
    fi
  }
  trap cleanup_mount EXIT

  hdiutil attach "$STAGED_DMG" -nobrowse -readonly -mountpoint "$MOUNTPOINT"

  PACKAGED_APP="$MOUNTPOINT/Ocelo.app"
  [[ -d "$PACKAGED_APP" ]] || fail "Ocelo.app missing from DMG"

  PACKAGED_VERSION="$(plist_value "$PACKAGED_APP/Contents/Info.plist" CFBundleShortVersionString)"
  PACKAGED_BUILD="$(plist_value "$PACKAGED_APP/Contents/Info.plist" CFBundleVersion)"

  [[ "$PACKAGED_VERSION" == "$VERSION" ]] \
    || fail "DMG contains version $PACKAGED_VERSION"
  [[ "$PACKAGED_BUILD" == "$BUILD" ]] \
    || fail "DMG contains build $PACKAGED_BUILD"

  verify_no_forbidden_xattrs "$PACKAGED_APP"
  codesign --verify --deep --strict --verbose=2 "$PACKAGED_APP"
  spctl -a -vv -t execute "$PACKAGED_APP"
  verify_production_entitlements "$PACKAGED_APP"

  STAGED_CDHASH="$(codesign -dv --verbose=4 "$APP" 2>&1 | awk -F= '/^CDHash=/{if (!found) {print $2; found=1}}')"
  PACKAGED_CDHASH="$(codesign -dv --verbose=4 "$PACKAGED_APP" 2>&1 | awk -F= '/^CDHash=/{if (!found) {print $2; found=1}}')"
  [[ -n "$STAGED_CDHASH" && "$STAGED_CDHASH" == "$PACKAGED_CDHASH" ]] \
    || fail "Packaged app signature differs from staged notarized app"

  step "Launch smoke test"

  SMOKE_LOG="$NOTARY_DIR/launch-smoke.log"
  python3 - "$PACKAGED_APP/Contents/MacOS/Ocelo" "$SMOKE_LOG" <<'PY'
import os
import signal
import subprocess
import sys
import time

exe, log_path = sys.argv[1:]
with open(log_path, "wb") as log:
    proc = subprocess.Popen(
        [exe],
        stdout=log,
        stderr=subprocess.STDOUT,
        env=os.environ.copy(),
    )
    time.sleep(4.0)
    code = proc.poll()
    if code is not None:
        log.flush()
        print(f"Ocelo exited during launch smoke test with status {code}", file=sys.stderr)
        try:
            print(open(log_path, errors="replace").read(), file=sys.stderr)
        except Exception:
            pass
        raise SystemExit(1)

    proc.terminate()
    try:
        proc.wait(timeout=3.0)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait(timeout=3.0)

print("✓ packaged Ocelo launched and remained alive for 4 seconds")
PY

  hdiutil detach "$MOUNTPOINT"
  rmdir "$MOUNTPOINT"
  trap - EXIT

  echo "✓ DMG contains launchable Ocelo $VERSION ($BUILD)"

  checkpoint packaged_verified
else
  echo "✓ skipping packaged-app verification (checkpoint already complete)"
fi

###############################################################################
# Install exact notarized DMG into Distribution
###############################################################################

if ! stage_done finalized; then
  step "Installing final DMG into Distribution"

  rm -f "$FINAL_DMG"
  DITTONORSRC=1 ditto --norsrc --noqtn "$STAGED_DMG" "$FINAL_DMG"

  STAGED_HASH="$(shasum -a 256 "$STAGED_DMG" | awk '{print $1}')"
  FINAL_HASH="$(shasum -a 256 "$FINAL_DMG" | awk '{print $1}')"

  [[ "$STAGED_HASH" == "$FINAL_HASH" ]] \
    || fail "Distribution DMG differs from notarized staged DMG"

  echo "✓ final DMG copied byte-for-byte"
  echo "  $FINAL_DMG"

  checkpoint finalized
else
  echo "✓ skipping final DMG install (checkpoint already complete)"
fi

DMG="$FINAL_DMG"

###############################################################################
# Generate Sparkle feed + optional deltas
###############################################################################

if ! stage_done sparkle_generated; then
  step "Finding Sparkle tools"

  if [[ -x "$WORK/SparkleBin/generate_appcast" ]]; then
    SPARKLE_BIN="$WORK/SparkleBin"
  else
    SPARKLE_BIN="$(
      find "$DERIVED" "$HOME/Library/Developer/Xcode/DerivedData" \
        -path '*/SourcePackages/artifacts/sparkle/Sparkle/bin' \
        -type d \
        -print 2>/dev/null \
        | sed -n '1p'
    )"
  fi

  [[ -n "$SPARKLE_BIN" ]] || fail "Could not find Sparkle command-line tools"
  [[ -x "$SPARKLE_BIN/generate_appcast" ]] || fail "generate_appcast not found"
  [[ -x "$SPARKLE_BIN/sign_update" ]] || fail "sign_update not found"

  echo "$SPARKLE_BIN"

  step "Archiving final release for Sparkle"
  RELEASE_DMG="$RELEASES/$DMG_NAME"

  if [[ -e "$RELEASE_DMG" ]]; then
    if cmp -s "$DMG" "$RELEASE_DMG"; then
      echo "Existing Sparkle archive is identical."
    else
      fail "$RELEASE_DMG already exists with different contents"
    fi
  else
    cp -p "$DMG" "$RELEASE_DMG"
  fi

  step "Testing Sparkle EdDSA signing"
  SPARKLE_SIGNATURE="$("$SPARKLE_BIN/sign_update" "$RELEASE_DMG")"
  echo "$SPARKLE_SIGNATURE"
  printf '%s\n' "$SPARKLE_SIGNATURE" \
    | grep -F 'sparkle:edSignature=' >/dev/null \
    || fail "Sparkle signing failed"

  step "Generating Sparkle appcast"
  "$SPARKLE_BIN/generate_appcast" \
    --download-url-prefix "$DOWNLOAD_BASE/" \
    "$RELEASES"

  APPCAST="$RELEASES/appcast.xml"
  [[ -f "$APPCAST" ]] || fail "generate_appcast did not create appcast.xml"

  step "Validating generated appcast"
  python3 - "$APPCAST" "$VERSION" "$BUILD" "$DOWNLOAD_BASE/$DMG_NAME" <<'PY'
import sys
import xml.etree.ElementTree as ET

path, expected_version, expected_build, expected_url = sys.argv[1:]
sparkle = "http://www.andymatuschak.org/xml-namespaces/sparkle"
ns = {"sparkle": sparkle}
root = ET.parse(path).getroot()
matches = []
for item in root.findall("./channel/item"):
    build = item.findtext("sparkle:version", namespaces=ns)
    if build == expected_build:
        matches.append(item)
if len(matches) != 1:
    raise SystemExit(f"Expected one appcast item for build {expected_build}, found {len(matches)}")
item = matches[0]
short = item.findtext("sparkle:shortVersionString", namespaces=ns)
if short != expected_version:
    raise SystemExit(f"Expected version {expected_version}, got {short}")
enclosure = item.find("enclosure")
if enclosure is None:
    raise SystemExit("Missing top-level enclosure")
url = enclosure.attrib.get("url")
if url != expected_url:
    raise SystemExit(f"Unexpected enclosure URL: {url}")
signature = enclosure.attrib.get(f"{{{sparkle}}}edSignature")
if not signature:
    raise SystemExit("Missing Sparkle EdDSA signature")
print(f"✓ version {expected_version}")
print(f"✓ build {expected_build}")
print(f"✓ URL {url}")
print("✓ EdDSA signature present")
PY

  ARTIFACT_LIST="$NOTARY_DIR/sparkle-artifacts.txt"

  python3 - "$APPCAST" "$BUILD" "$RELEASES" > "$ARTIFACT_LIST" <<'PY'
import os
import sys
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

appcast, expected_build, release_dir = sys.argv[1:]
sparkle = "http://www.andymatuschak.org/xml-namespaces/sparkle"
ns = {"sparkle": sparkle}
root = ET.parse(appcast).getroot()
target = None
for item in root.findall("./channel/item"):
    if item.findtext("sparkle:version", namespaces=ns) == expected_build:
        target = item
        break
if target is None:
    raise SystemExit(f"Build {expected_build} not found")
seen = set()
for node in target.iter():
    if node.tag.split("}")[-1] != "enclosure":
        continue
    url = node.attrib.get("url")
    if not url:
        continue
    name = os.path.basename(urlparse(url).path)
    path = os.path.join(release_dir, name)
    if not os.path.isfile(path):
        raise SystemExit(f"Referenced artifact missing: {path}")
    if path not in seen:
        seen.add(path)
        print(path)
PY

  echo "Artifacts for Ocelo $VERSION ($BUILD):"
  cat "$ARTIFACT_LIST"

  checkpoint sparkle_generated
else
  echo "✓ skipping Sparkle generation (checkpoint already complete)"
fi

APPCAST="$RELEASES/appcast.xml"
ARTIFACT_LIST="$NOTARY_DIR/sparkle-artifacts.txt"
RELEASE_DMG="$RELEASES/$DMG_NAME"

###############################################################################
# Upload current release artifacts and verify every uploaded byte
###############################################################################

if ! stage_done uploaded; then
  step "Uploading release artifacts to R2"

  while IFS= read -r FILE; do
    [[ -n "$FILE" ]] || continue
    NAME="$(basename "$FILE")"

    case "$NAME" in
      *.dmg) CONTENT_TYPE="application/x-apple-diskimage" ;;
      *)     CONTENT_TYPE="application/octet-stream" ;;
    esac

    echo
    echo "Uploading:"
    echo "  $NAME"

    npx wrangler r2 object put \
      "$R2_BUCKET/$R2_PREFIX/$NAME" \
      --file="$FILE" \
      --content-type="$CONTENT_TYPE" \
      --cache-control="public, max-age=31536000, immutable" \
      --remote
  done < "$ARTIFACT_LIST"

  step "Verifying uploaded artifacts"

  while IFS= read -r FILE; do
    [[ -n "$FILE" ]] || continue
    NAME="$(basename "$FILE")"
    REMOTE_FILE="$NOTARY_DIR/remote-$NAME"

    curl --fail --location --silent --show-error \
      "$DOWNLOAD_BASE/$NAME?verify=$(date +%s)" \
      -o "$REMOTE_FILE"

    LOCAL_HASH="$(shasum -a 256 "$FILE" | awk '{print $1}')"
    REMOTE_HASH="$(shasum -a 256 "$REMOTE_FILE" | awk '{print $1}')"

    echo "$NAME"
    echo "  local:  $LOCAL_HASH"
    echo "  remote: $REMOTE_HASH"

    [[ "$LOCAL_HASH" == "$REMOTE_HASH" ]] \
      || fail "Remote artifact does not match local artifact: $NAME"
  done < "$ARTIFACT_LIST"

  echo "✓ all public artifacts match their local bytes"

  checkpoint uploaded
else
  echo "✓ skipping R2 upload (checkpoint already complete)"
fi

###############################################################################
# Publish appcast
###############################################################################

if ! stage_done published; then
  step "Preparing updates repository"

  REPO_STATUS="$(git -C "$UPDATES_REPO" status --porcelain --untracked-files=all)"

  if [[ -n "$REPO_STATUS" ]]; then
    # Recover cleanly from a previous failure after copying appcast.xml but
    # before committing it. Any other dirty file remains a hard stop.
    STATUS_OTHER="$(
      printf '%s\n' "$REPO_STATUS" \
        | grep -vE '^.. public/appcast\.xml$' \
        || true
    )"

    if [[ -n "$STATUS_OTHER" ]]; then
      echo "Updates repo contains unrelated local modifications:"
      git -C "$UPDATES_REPO" status --short
      fail "Clean unrelated changes in ~/Developer/ocelo-updates before publishing"
    fi

    if ! cmp -s "$APPCAST" "$UPDATES_REPO/public/appcast.xml"; then
      echo "Updates repo has a different local appcast.xml:"
      git -C "$UPDATES_REPO" diff -- public/appcast.xml
      fail "Existing local appcast change does not match this release"
    fi

    echo "✓ resuming from matching uncommitted appcast.xml"
  else
    git -C "$UPDATES_REPO" pull --ff-only
    cp "$APPCAST" "$UPDATES_REPO/public/appcast.xml"
  fi

  step "Publishing appcast"

  git -C "$UPDATES_REPO" diff --check
  git -C "$UPDATES_REPO" diff -- public/appcast.xml
  git -C "$UPDATES_REPO" add public/appcast.xml

  if git -C "$UPDATES_REPO" diff --cached --quiet; then
    echo "appcast.xml is already published locally."
  else
    git -C "$UPDATES_REPO" commit -m "Publish Ocelo $VERSION"
  fi

  git -C "$UPDATES_REPO" push

  checkpoint published
else
  echo "✓ skipping appcast publish (checkpoint already complete)"
fi

###############################################################################
# Verify live feed matches the generated release item exactly enough to update
###############################################################################

if ! stage_done live_verified; then
  step "Waiting for live appcast"

  LIVE_APPCAST="$NOTARY_DIR/live-appcast.xml"
  LIVE_OK=0

  for ATTEMPT in $(seq 1 60); do
    if curl \
      --fail \
      --silent \
      --show-error \
      --header 'Cache-Control: no-cache' \
      "$FEED_URL?build=$BUILD&attempt=$ATTEMPT&ts=$(date +%s)" \
      -o "$LIVE_APPCAST"
    then
      if python3 - "$APPCAST" "$LIVE_APPCAST" "$BUILD" <<'PY'
import sys
import xml.etree.ElementTree as ET

local_path, live_path, expected_build = sys.argv[1:]
sparkle = "http://www.andymatuschak.org/xml-namespaces/sparkle"
ns = {"sparkle": sparkle}

def item_fields(path):
    root = ET.parse(path).getroot()
    for item in root.findall("./channel/item"):
        build = item.findtext("sparkle:version", namespaces=ns)
        if build != expected_build:
            continue
        short = item.findtext("sparkle:shortVersionString", namespaces=ns)
        enclosure = item.find("enclosure")
        if enclosure is None:
            return None
        result = {
            "build": build,
            "short": short,
            "url": enclosure.attrib.get("url"),
            "length": enclosure.attrib.get("length"),
            "signature": enclosure.attrib.get(f"{{{sparkle}}}edSignature"),
            "deltas": [],
        }
        for node in item.iter():
            if node is enclosure or node.tag.split("}")[-1] != "enclosure":
                continue
            result["deltas"].append((
                node.attrib.get("url"),
                node.attrib.get(f"{{{sparkle}}}deltaFrom"),
                node.attrib.get("length"),
                node.attrib.get(f"{{{sparkle}}}edSignature"),
            ))
        result["deltas"].sort()
        return result
    return None

local = item_fields(local_path)
live = item_fields(live_path)
if local is None or live is None or local != live:
    raise SystemExit(1)
print("✓ live appcast item matches generated appcast")
PY
      then
        LIVE_OK=1
        break
      fi
    fi

    sleep 2
  done

  [[ "$LIVE_OK" -eq 1 ]] || fail "Live appcast did not update to build $BUILD"

  checkpoint live_verified
else
  echo "✓ skipping live feed verification (checkpoint already complete)"
fi

###############################################################################
# Done
###############################################################################

step "Release complete"

echo "Ocelo $VERSION ($BUILD) is live."
echo
echo "DMG:"
echo "  $DOWNLOAD_BASE/$DMG_NAME"
echo
echo "Appcast:"
echo "  $FEED_URL"
echo
echo "Local notarized DMG:"
echo "  $FINAL_DMG"
echo
echo "Sparkle archive:"
echo "  $RELEASE_DMG"
echo

CURRENT_STAGE="complete"
save_state
cp "$STATE_FILE" "$NOTARY_DIR/release-state-final.json"

rm -f "$STATE_FILE"
rm -rf "$WORK"
rm -f "$PBXPROJ.release-backup"

trap - ERR


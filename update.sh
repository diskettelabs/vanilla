#!/bin/bash
# =============================================================================
# update.sh — pull latest code and update all libraries for Vanilla Chat
#
# Usage:
#   ./update.sh               update gelectron, gelectron-ollama, and app deps
#   ./update.sh --no-build    skip the Rust rebuild (reuse existing binary)
#   ./update.sh --help
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------- options ----
NO_BUILD=0

for arg in "$@"; do
  case "$arg" in
    --no-build) NO_BUILD=1 ;;
    --help|-h)
      sed -n '1,/^set -euo pipefail$/p' "$0" | grep '^#' | sed 's/^# \{0,1\}//' \
        | grep -v '^$' | grep -v '^=\+$' | grep -v '^-'
      exit 0
      ;;
    *) echo "Unknown option: $arg (try --help)" >&2; exit 1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PARENT="${REPO_PARENT:-$(dirname "$SCRIPT_DIR")}"

GELECTRON_DIR="$PARENT/gelectron"
OLLAMA_DIR="$PARENT/gelectron-ollama"

command -v git  >/dev/null 2>&1 || { echo "✗ git is required"; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo "✗ npm is required"; exit 1; }
if [ "$NO_BUILD" = "0" ]; then
  command -v cargo >/dev/null 2>&1 || { echo "✗ cargo (Rust) is required (or pass --no-build)"; exit 1; }
fi

echo "── Updating vanilla-sh libraries ──────────────────────"

# ------------------------------------------------------------- gelectron-ollama
echo
echo "── Updating gelectron-ollama ($OLLAMA_DIR) ──"
[ -d "$OLLAMA_DIR/.git" ] && git -C "$OLLAMA_DIR" pull --ff-only
npm install --prefix "$OLLAMA_DIR" --no-audit --no-fund
if [ ! -f "$OLLAMA_DIR/dist/index.js" ]; then
  echo "  dist/ not built (npm lifecycle scripts may be disabled) — running tsc…"
  (cd "$OLLAMA_DIR" && npm run build)
fi
[ -f "$OLLAMA_DIR/dist/index.js" ] || {
  echo "✗ gelectron-ollama build failed: dist/index.js is missing." >&2
  exit 1
}
echo "✓ gelectron-ollama updated"

# ------------------------------------------------------------------ gelectron
echo
echo "── Updating gelectron ($GELECTRON_DIR) ──"
[ -d "$GELECTRON_DIR/.git" ] && git -C "$GELECTRON_DIR" pull --ff-only
npm install --prefix "$GELECTRON_DIR" --no-audit --no-fund

GELECTRON_BIN="$GELECTRON_DIR/target/release/gelectron"
if [ "$NO_BUILD" = "1" ]; then
  [ -x "$GELECTRON_BIN" ] || { echo "✗ --no-build but no binary at $GELECTRON_BIN"; exit 1; }
  echo "✓ gelectron binary reused: $GELECTRON_BIN"
else
  echo "Building gelectron (Rust, a few minutes)…"
  (cd "$GELECTRON_DIR" && cargo build --release -p gelectron)
  echo "✓ gelectron binary rebuilt"
fi

# ------------------------------------------------------------- vanilla-sh deps
echo
echo "── Updating app dependencies ──"
npm install --prefix "$SCRIPT_DIR" --no-audit --no-fund

if [ -f "$SCRIPT_DIR/gelectron/package.json" ]; then
  echo "── Updating gelectron subpackage deps ──"
  npm install --prefix "$SCRIPT_DIR/gelectron" --no-audit --no-fund
else
  echo "  (no gelectron subpackage found, skipping)"
fi

echo
echo "✓ All libraries updated."
echo "  Build the app:  npm run build   (from $SCRIPT_DIR)"
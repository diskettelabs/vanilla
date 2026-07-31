#!/bin/bash
# =============================================================================
# install.sh — build & install Gelectron + gelectron-ollama, then run Vanilla Chat
#
# Usage:
#   ./install.sh              install everything (gelectron, gelectron-ollama, app deps)
#   ./install.sh --run        install, then launch the app (npm run gelectron)
#   ./install.sh --no-build   skip the Rust build (reuse an existing gelectron binary)
#   ./install.sh --help
#
# Environment overrides:
#   REPO_PARENT=<dir>         where sibling repos live (default: next to vanilla-sh)
#   GELECTRON_BIN_DIR=<dir>   where the gelectron binary + compat/ get installed
#                             (default: ~/.local/bin)
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------- options ----
DO_RUN=0
NO_BUILD=0

for arg in "$@"; do
  case "$arg" in
    --run) DO_RUN=1 ;;
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
BIN_DIR="${GELECTRON_BIN_DIR:-$HOME/.local/bin}"

GELECTRON_REPO="https://github.com/mileswolfallen2/gelectron.git"
OLLAMA_REPO="https://github.com/mileswolfallen2/gelectron-ollama.git"
APP_REPO="https://github.com/owenvanvooren/vanilla-sh.git"

# -------------------------------------------------------------- prerequisites
command -v git   >/dev/null 2>&1 || { echo "✗ git is required"; exit 1; }
command -v node  >/dev/null 2>&1 || { echo "✗ Node.js 18+ is required"; exit 1; }
command -v npm   >/dev/null 2>&1 || { echo "✗ npm is required"; exit 1; }
if [ "$NO_BUILD" = "0" ]; then
  command -v cargo >/dev/null 2>&1 || { echo "✗ cargo (Rust) is required to build gelectron (or pass --no-build)"; exit 1; }
fi

# ------------------------------------------------------- locate the app repo
if [ -f "$SCRIPT_DIR/package.json" ] && [ -f "$SCRIPT_DIR/server.js" ]; then
  APP_DIR="$SCRIPT_DIR"
  echo "Using app repo at: $APP_DIR"
else
  APP_DIR="$PARENT/vanilla-sh"
fi

echo "── Vanilla Chat installer ─────────────────────────────"
echo "  repos parent : $PARENT"
echo "  gelectron bin : $BIN_DIR"
echo "────────────────────────────────────────────────────────"

# ------------------------------------------------------------ clone missing
ensure_repo() {
  local dir="$1" url="$2" name="$3"
  if [ -d "$dir" ]; then
    echo "✓ $name already present: $dir"
  else
    echo "Cloning $name ..."
    git clone --depth 1 "$url" "$dir"
  fi
}

ensure_repo "$PARENT/gelectron"        "$GELECTRON_REPO" "gelectron"
ensure_repo "$PARENT/gelectron-ollama" "$OLLAMA_REPO"    "gelectron-ollama"
ensure_repo "$APP_DIR"                 "$APP_REPO"       "vanilla-sh"

# ------------------------------------------------------- gelectron-ollama
echo
echo "── Installing gelectron-ollama ──"
npm install --prefix "$PARENT/gelectron-ollama" --no-audit --no-fund
[ -d "$PARENT/gelectron-ollama/dist" ] && echo "✓ gelectron-ollama built (dist/ ready)"

# ------------------------------------------------------------- gelectron
echo
echo "── Installing gelectron ──"
npm install --prefix "$PARENT/gelectron" --no-audit --no-fund

GELECTRON_BIN="$PARENT/gelectron/target/release/gelectron"
if [ "$NO_BUILD" = "0" ] && [ ! -x "$GELECTRON_BIN" ]; then
  echo "Building gelectron (Rust, first build takes a few minutes)…"
  (cd "$PARENT/gelectron" && cargo build --release -p gelectron)
elif [ "$NO_BUILD" = "0" ]; then
  echo "✓ gelectron binary already built: $GELECTRON_BIN"
else
  [ -x "$GELECTRON_BIN" ] || { echo "✗ --no-build but no binary at $GELECTRON_BIN"; exit 1; }
fi

mkdir -p "$BIN_DIR"
cp "$GELECTRON_BIN" "$BIN_DIR/gelectron"
rm -rf "$BIN_DIR/compat"
cp -R "$PARENT/gelectron/src/electron" "$BIN_DIR/compat"
chmod +x "$BIN_DIR/gelectron"
echo "✓ installed: $BIN_DIR/gelectron + $BIN_DIR/compat"

if ! echo ":$PATH:" | grep -q ":$BIN_DIR:"; then
  echo
  echo "  NOTE: $BIN_DIR is not on your PATH. Add it with:"
  echo "    export PATH=\"$BIN_DIR:\$PATH\""
fi

# --------------------------------------------------------- vanilla-sh deps
echo
echo "── Installing app dependencies ──"
npm install --prefix "$APP_DIR" --no-audit --no-fund

# ------------------------------------------------------------- summary
echo
echo "── Installed ──────────────────────────────────────────"
echo "  gelectron       : $(command -v "$BIN_DIR/gelectron" || echo "$BIN_DIR/gelectron")"
echo "  gelectron-ollama: $PARENT/gelectron-ollama"
echo "  app             : $APP_DIR"
echo "────────────────────────────────────────────────────────"
echo
echo "Run the desktop app:"
echo "  cd \"$APP_DIR\" && npm run gelectron"
echo "Or the web version :"
echo "  cd \"$APP_DIR\" && npm start   # open http://localhost:3000"

if [ "$DO_RUN" = "1" ]; then
  echo
  echo "Launching Vanilla Chat…"
  (cd "$APP_DIR" && npm run gelectron)
fi

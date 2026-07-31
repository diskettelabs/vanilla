# Installing & Running Gelectron + gelectron-ollama

A complete walkthrough for building the **Gelectron** desktop runtime, the
**gelectron-ollama** library (bundled Ollama), and running the **Vanilla Chat**
app that ties them together. Verified on macOS (Apple Silicon, arm64).

---

## 1. What's what

| Piece | Repo | Role |
|---|---|---|
| **Gelectron** | `gelectron/` | Electron drop-in replacement. Rust binary (tao + wry, native WebView) + a JS compatibility layer (`compat/`) + `gelectron-packager` for building `.app` bundles. |
| **gelectron-ollama** | `gelectron-ollama/` | TypeScript library that detects a running Ollama, or downloads a matching Ollama binary and serves it — no separate Ollama install needed. |
| **Vanilla Chat** | `vanilla-sh/` | The example app. Express server + web UI, wrapped in Gelectron, with bundled Ollama. |

The repos must be **siblings** on disk, because Vanilla Chat references them with
relative `file:` dependencies:

```
<parent>/
├── gelectron/
├── gelectron-ollama/
└── vanilla-sh/
```

---

## 2. Prerequisites

- macOS (guide verified on arm64), or Linux/Windows for the cross-platform packager
- Node.js **18+** (works with 26.x)
- npm
- Rust **1.75+** via [rustup.rs](https://rustup.rs)
- Command-line tools (Xcode CLT on macOS): `xcode-select --install`

Check versions:

```bash
node -v
npm -v
cargo --version
```

---

## 3. Install the Gelectron runtime

```bash
git clone https://github.com/mileswolfallen2/gelectron.git
cd gelectron
npm install

# Build the native binary (tao + wry WebView)
cargo build --release -p gelectron
```

This produces `target/release/gelectron` (~3 MB).

### Make `gelectron` available on your PATH

The binary locates its JS compatibility layer in a `compat/` directory **next to
itself**, so copy both into a `bin` dir on your PATH:

```bash
mkdir -p ~/.local/bin
cp target/release/gelectron ~/.local/bin/gelectron
cp -R src/electron ~/.local/bin/compat
```

Verify:

```bash
~/.local/bin/gelectron --version
~/.local/bin/gelectron demo/      # opens a demo window
```

> If you skip the native build you can fall back to a Node-only shim
> (`node cli/gelectron.js <app>`), but that creates **no real window** — build the
> Rust binary for actual rendering.

---

## 4. Install the gelectron-ollama library

```bash
git clone <your-gelectron-ollama-remote> gelectron-ollama   # or use your existing clone
cd gelectron-ollama
npm install
```

The package compiles to `dist/` and ships type definitions. It has **no
dependency on Gelectron itself** — it only needs a `basePath` to manage Ollama
binaries.

The library's API surface (used by `vanilla-sh/gelectron/main.js`):

```ts
const go = new GelectronOllama({ basePath: app.getPath('userData') });

await go.isRunning();                        // is something already on :11434?
await go.getMetadata('latest');              // metadata for latest Ollama release
await go.serve(version, { serverLog, downloadLog }); // download + start server
go.getServer()?.stop();                      // stop the spawned server
await go.download(version, { os, arch });    // pre-download binaries for other platforms
await go.downloadedVersions();               // list cached versions
```

It skips installation if a standalone Ollama is already running, so it never
conflicts with a system Ollama.

---

## 5. Install the app (Vanilla Chat)

```bash
git clone <your-vanilla-sh-remote> vanilla-sh
cd vanilla-sh
npm install
```

`package.json` wires the local library:

```json
"gelectron-ollama": "file:../gelectron-ollama"
```

and the sub-package `vanilla-sh/gelectron/` also points at
`file:../../gelectron-ollama`.

### Where data lives

`main.js` sets the working directory, which decides where chat data goes:

| Mode | cwd | Chat data | Ollama runtime |
|---|---|---|---|
| Web (`npm start`) | repo root | `data/conversations/` | your own Ollama |
| Dev Gelectron (`npm run gelectron`) | repo root (`process.chdir(APP_ROOT)`) | `<repo>/data/conversations/` | `~/Library/Application Support/gelectron/vanilla-chat/ollama` |
| Packaged `.app` | userData | `~/Library/Application Support/gelectron/data/conversations/` | `~/Library/Application Support/gelectron/vanilla-chat/ollama` |

---

## 6. Run

### a) Web mode (browser)

```bash
cd vanilla-sh
npm start
# open http://localhost:3000
```

Requires Ollama running separately (`ollama serve`).

### b) Dev desktop mode (Gelectron + bundled Ollama)

```bash
cd vanilla-sh
npm run gelectron        # = gelectron .  (runs gelectron/main.js)
```

or via the unified launcher:

```bash
npm start -- -g
```

On first launch it downloads the Ollama runtime (~490 MB) into
`~/Library/Application Support/gelectron/vanilla-chat/ollama`, then serves the
UI on **port 2051** and Ollama on **11434**. The splash window shows download
progress; if the runtime install fails it shows the error and retries every 4 s.

### c) Optional: Electron mode

```bash
cd vanilla-sh
npm run electron:install
npm run electron         # = npm start -- -e
```

---

## 7. Build the packaged app

```bash
cd vanilla-sh
npm run build            # -> dist/VanillaChat.app
npm run build:install    # build + copy into /Applications
```

Prerequisites checked by `scripts/build-desktop.sh`:

- `../gelectron/packager/bin/gelectron-packager.js`
- `../gelectron/target/release/gelectron`
- `../gelectron-ollama/` present

What it does (in 4 steps):

1. Assembles the payload (`server.js`, `src/`, `public/`, `ui/`, `themes/`, `config/`,
   plus `gelectron/main.js` and `splash.html`).
2. Installs `node_modules` and bundles `gelectron-ollama` from the sibling repo.
3. Runs the packager — which **downloads a bundled Node.js runtime** (~20 MB) on
   first use — and builds a self-contained `VanillaChat.app`.
4. Ad-hoc code-signs the bundle. (If signing is skipped, first launch on another
   Mac may need right-click → Open.)

The packaged `.app` bundles the Rust binary, Node.js, your source, and the compat
layer — it runs standalone with no source tree needed.

### App bundle layout

```
VanillaChat.app/
  Contents/
    MacOS/
      VanillaChat        # launcher
      gelectron-bin      # Rust binary
      node               # bundled Node.js
      compat/            # JS electron compatibility layer
    Resources/
      app/               # your app source + node_modules
    Info.plist
```

---

## 8. Run the packaged app

```bash
open /Applications/VanillaChat.app        # or: open dist/VanillaChat.app
```

First launch re-downloads the Ollama runtime into `userData/vanilla-chat/ollama`
(if missing), then the UI opens on port 2051.

---

## 9. Uninstall

In-app: **Settings → Uninstall Vanilla Chat… → Yes, uninstall**.

This (in `src/uninstall.js`):

1. Stops the bundled Ollama (finds it by its runtime path, SIGTERM then SIGKILL) —
   works even if another instance owns the process.
2. Packaged: removes `~/Library/Application Support/gelectron` (userData) and
   `/Applications/VanillaChat.app`, then exits.
3. Dev: removes the bundled Ollama runtime and the app data dir, then exits.

The confirmation dialog is a native in-app modal — `window.confirm()` is **not
supported** in the Gelectron WebView, so the UI uses its own modal instead.

---

## 10. Troubleshooting

| Symptom | Fix |
|---|---|
| Splash stuck / "could not start" | Another instance already owns **2051** or **11434**. Quit the other app, then retry. |
| Ports busy but no visible app | Kill stale processes: `pkill -f "gelectron/main.js"` and `pkill -f "vanilla-chat/ollama"`. |
| Check what's listening | `lsof -nP -iTCP:2051 -sTCP:LISTEN` and `lsof -nP -iTCP:11434 -sTCP:LISTEN`. |
| Runtime keeps re-downloading | Expected after an uninstall — the app re-installs Ollama on next launch. |
| Uninstall button does nothing | You're on an old build; the button now uses an in-app modal. Rebuild (`npm run build:install`). |
| `gelectron: command not found` | Binary + `compat/` not on PATH — see section 3. |
| `cargo build` fails | Ensure `xcode-select --install` and Rust toolchain are up to date. |
| Dialog/`window.confirm` never shows | Unsupported in the WebView — use HTML modals, not `confirm()`/`alert()`. |

---

## 11. Quick reference

```bash
# gelectron
cd gelectron && npm install && cargo build --release -p gelectron
cp target/release/gelectron ~/.local/bin/gelectron
cp -R src/electron ~/.local/bin/compat

# gelectron-ollama
cd gelectron-ollama && npm install

# vanilla-sh
cd vanilla-sh && npm install
npm run gelectron        # dev desktop, bundled Ollama
npm run build:install    # build + install to /Applications
open /Applications/VanillaChat.app
```

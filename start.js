#!/usr/bin/env node
/**
 * Vanilla Chat launcher
 *
 * Usage:
 *   npm start          — start the web server (default)
 *   npm start -- -g    — launch with Gelectron (desktop, bundled Ollama)
 *   npm start -- -e    — launch with Electron (desktop, system Ollama)
 *
 * The -g and -e flags spawn the corresponding npm --prefix script so you
 * never have to remember the sub-package names.
 */

const { execSync, spawnSync } = require("node:child_process");
const args = process.argv.slice(2);

const flag = args.find((a) => a === "-g" || a === "-e");

if (flag === "-g") {
  console.log("Launching Vanilla with Gelectron…");
  spawnSync("npm", ["--prefix", "gelectron", "start"], { stdio: "inherit" });
} else if (flag === "-e") {
  console.log("Launching Vanilla with Electron…");
  spawnSync("npm", ["--prefix", "electron", "start"], { stdio: "inherit" });
} else {
  // Default: run the Express web server
  require("./server.js").start();
}

/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Resolve an npm polyfill package to an ABSOLUTE entry path. Needed because
// Vite resolves bare alias replacements relative to the importer (here, core
// source under ../../packages), which cannot see the frontend's deps; and
// because require.resolve("util") would return the Node builtin, not the npm
// package, so we go through the package's own package.json.
const requireFromHere = createRequire(import.meta.url);
function polyfill(name: string): string {
  const pkgJson = requireFromHere.resolve(`${name}/package.json`);
  const { main } = requireFromHere(pkgJson) as { main?: string };
  return join(dirname(pkgJson), main ?? "index.js");
}

// Reuse Freelens's own plugin: MobX 7 / mobx-react 10 use TC39 standard
// decorators (@observer, @observable accessor), which Vite's default transform
// passes through untransformed. This lowers them before React runs — the same
// mechanism the Electron renderer build uses.
import { standardDecorators } from "../../scripts/vite-plugin-standard-decorators.mjs";

const backend = process.env.BACKEND_URL ?? "http://127.0.0.1:4300";

// Point @freelensapp/utilities at its browser-safe barrel for the web build.
// The Node barrel (index.ts) stays the default for the Electron app and main
// process; only this bundle gets the browser variant, which is how the real
// Freelens shared components (which import the full barrel) load in a plain
// browser. This is the per-bundle form of a "browser" export condition.
const utilitiesBrowser = fileURLToPath(
  new URL("../../packages/utility-features/utilities/browser.ts", import.meta.url),
);

// Core renderer modules (e.g. the table) import node:assert; give them a tiny
// browser shim rather than dragging in a full Node polyfill.
const nodeAssertShim = fileURLToPath(new URL("./src/node-assert-shim.ts", import.meta.url));
const nodeQuerystringShim = fileURLToPath(new URL("./src/node-querystring-shim.ts", import.meta.url));
const nodeEventsShim = fileURLToPath(new URL("./src/node-events-shim.ts", import.meta.url));
const electronBrowser = fileURLToPath(new URL("./src/stubs/electron.browser.ts", import.meta.url));
const fsBrowser = fileURLToPath(new URL("./src/stubs/fs.browser.ts", import.meta.url));
const fsPromisesBrowser = fileURLToPath(new URL("./src/stubs/fs-promises.browser.ts", import.meta.url));
const fsExtraBrowser = fileURLToPath(new URL("./src/stubs/fs-extra.browser.ts", import.meta.url));
const emptyNodeModule = fileURLToPath(new URL("./src/stubs/empty-node-module.browser.ts", import.meta.url));
const undiciBrowser = fileURLToPath(new URL("./src/stubs/undici.browser.ts", import.meta.url));
const cryptoBrowser = fileURLToPath(new URL("./src/stubs/crypto.browser.ts", import.meta.url));
const pathBrowser = fileURLToPath(new URL("./src/stubs/path.browser.ts", import.meta.url));
const tarBrowser = fileURLToPath(new URL("./src/stubs/tar.browser.ts", import.meta.url));
const chokidarBrowser = fileURLToPath(new URL("./src/stubs/chokidar.browser.ts", import.meta.url));
const stub = (name: string) => fileURLToPath(new URL(`./src/stubs/${name}.browser.ts`, import.meta.url));

// Node builtin -> browser replacement. Generated into aliases for both the
// `node:` and bare specifier forms (dependencies use both).
const nodeBuiltinMap: Record<string, string> = {
  assert: nodeAssertShim,
  querystring: nodeQuerystringShim,
  events: polyfill("events"),
  fs: fsBrowser,
  "fs/promises": fsPromisesBrowser,
  path: pathBrowser,
  os: stub("os"),
  crypto: cryptoBrowser,
  stream: polyfill("stream-browserify"),
  util: polyfill("util"),
  buffer: polyfill("buffer"),
  url: polyfill("url"),
  process: polyfill("process"),
  // no real browser equivalent — faked at runtime
  zlib: emptyNodeModule,
  http: emptyNodeModule,
  https: emptyNodeModule,
  child_process: emptyNodeModule,
  net: emptyNodeModule,
  tls: emptyNodeModule,
  dns: emptyNodeModule,
  dgram: emptyNodeModule,
  diagnostics_channel: emptyNodeModule,
  worker_threads: emptyNodeModule,
  perf_hooks: emptyNodeModule,
  async_hooks: emptyNodeModule,
  timers: stub("timers"),
  "timers/promises": stub("timers"),
  string_decoder: stub("string_decoder"),
  tty: emptyNodeModule,
};

const nodeBuiltinAliases = Object.entries(nodeBuiltinMap).flatMap(([name, replacement]) => {
  const escaped = name.replace(/[/]/g, "\\/");
  return [
    { find: new RegExp(`^node:${escaped}$`), replacement },
    { find: new RegExp(`^${escaped}$`), replacement },
  ];
});

const winstonLoggerBrowser = fileURLToPath(new URL("./src/stubs/winston-logger.browser.ts", import.meta.url));

// Redirect @freelensapp/logger's node-only winston logger to a console-backed
// browser version. A resolveId hook is used (not resolve.alias) because the
// importer references it by a relative specifier.
function browserStubs() {
  return {
    name: "freelens-web:browser-stubs",
    enforce: "pre" as const,
    async resolveId(source: string, importer: string | undefined) {
      // Only @freelensapp/logger defines this module, so matching the basename
      // is enough to redirect every importer (logger.injectable and the
      // package's register-injectables).
      if (/(^|[\\/])winston-logger\.injectable(\.ts)?$/.test(source)) {
        void importer;
        return winstonLoggerBrowser;
      }
      return null;
    },
  };
}

export default defineConfig({
  // `process`, `Buffer` and `global` are referenced by the Node-targeted code
  // the full renderer pulls in; node-globals.ts also sets them at runtime.
  define: {
    global: "globalThis",
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production"),
  },
  resolve: {
    // Node-compat layer. The working app only needs @freelensapp/utilities and
    // a couple of shims; the rest let the FULL renderer boot (src/boot.tsx)
    // resolve its Node imports with real browser polyfills (fs via memfs,
    // path/os/crypto/... via browserify shims) or no-op stubs for modules with
    // no browser equivalent. The code that would actually use them is faked at
    // runtime by getDiForUnitTesting. Each builtin is aliased in both the
    // `node:` and bare forms, because dependencies use both.
    alias: [
      { find: /^@freelensapp\/utilities$/, replacement: utilitiesBrowser },
      { find: /^electron$/, replacement: electronBrowser },
      { find: /^undici$/, replacement: undiciBrowser },
      { find: /^graceful-fs$/, replacement: fsBrowser },
      { find: /^fs-extra$/, replacement: fsExtraBrowser },
      { find: /^tar$/, replacement: tarBrowser },
      { find: /^chokidar$/, replacement: chokidarBrowser },
      { find: /^@kubernetes\/client-node$/, replacement: stub("kube-client-node") },
      { find: /^node-pty$/, replacement: stub("node-pty") },
      { find: /^conf$/, replacement: stub("conf") },
      { find: /^tcp-port-used$/, replacement: stub("tcp-port-used") },
      { find: /^selfsigned$/, replacement: stub("selfsigned") },
      { find: /^ws$/, replacement: stub("ws") },
      { find: /^winston$/, replacement: stub("winston") },
      { find: /^winston-transport$/, replacement: stub("winston-transport") },
      { find: /^tempy$/, replacement: stub("tempy") },
      ...nodeBuiltinAliases,
    ],
  },
  plugins: [browserStubs(), standardDecorators(), react()],
  server: {
    port: 4310,
    // Proxy API calls to the headless backend during development so the
    // browser talks to a single origin.
    proxy: {
      "/api": { target: backend, changeOrigin: true, ws: true },
      // The renderer<->main message bridge.
      "/ws": { target: backend, changeOrigin: true, ws: true },
    },
  },
  build: {
    outDir: "dist",
  },
});

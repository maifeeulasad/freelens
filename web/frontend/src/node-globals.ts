/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Sets the Node globals (process, Buffer, global) the full renderer's
// Node-targeted code reads at module load. Imported first in the boot entry so
// they exist before any renderer module evaluates.

import { Buffer } from "buffer";
import { vol } from "memfs";
import process from "process";

// Seed the in-memory fs with base directories so code that touches /tmp or the
// home directory (via the memfs-backed fs stub) does not ENOENT at load.
try {
  vol.mkdirSync("/tmp", { recursive: true });
  vol.mkdirSync("/home/user", { recursive: true });
} catch {
  /* already present */
}

const g = globalThis as unknown as Record<string, unknown>;

g.global ??= globalThis;
g.process ??= process;
g.Buffer ??= Buffer;

const proc = g.process as { env?: Record<string, string>; isMainFrame?: boolean };
proc.env ??= {};
proc.env.NODE_ENV ??= "production";

// Electron sets process.isMainFrame; the renderer's bootstrap uses it to choose
// the root frame (catalog/welcome) vs a per-cluster frame. Freelens uses one
// iframe per cluster; the web app emulates that with a `?cluster=<id>` query:
// without it we are the root frame, with it we render that cluster's frame.
proc.isMainFrame = !new URLSearchParams(globalThis.location?.search ?? "").has("cluster");

g.setImmediate ??= (fn: (...a: unknown[]) => void, ...args: unknown[]) => globalThis.setTimeout(fn, 0, ...args);
g.clearImmediate ??= (id: unknown) => globalThis.clearTimeout(id as number);

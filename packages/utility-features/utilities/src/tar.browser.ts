/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Browser variant of ./tar. Reading tarballs needs the node-only `tar` package
// (filesystem + zlib streams), which cannot run in a browser. These stubs keep
// the module's exported shape so the browser barrel (../browser.ts) loads
// without pulling `tar`; calling them throws a clear error. Tarball work (e.g.
// installing an extension from a .tgz) must run in the backend/main process.

import type { JsonValue } from "type-fest";

// Defined locally (rather than imported from ./tar) so the browser graph never
// pulls ./tar, which imports the node-only `tar` package. Keep in lockstep with
// the type in ./tar.
export type ReadFileFromTarOpts<ParseJson extends boolean> = {
  tarPath: string;
  filePath: string;
} & (ParseJson extends true ? { parseJson: true } : { parseJson?: false });

const message =
  "Reading tar archives is not available in the browser build of @freelensapp/utilities; " +
  "perform tarball operations in the backend or main process.";

export function readFileFromTar(opts: ReadFileFromTarOpts<false>): Promise<Buffer>;
export function readFileFromTar(opts: ReadFileFromTarOpts<true>): Promise<JsonValue>;
export function readFileFromTar(): Promise<JsonValue | Buffer> {
  return Promise.reject(new Error(message));
}

export function listTarEntries(_filePath: string): Promise<string[]> {
  return Promise.reject(new Error(message));
}

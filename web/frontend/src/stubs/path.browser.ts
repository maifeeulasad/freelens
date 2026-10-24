/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Browser `node:path` for the full-renderer boot: path-browserify (posix) with
// `.posix` and `.win32` aliases added, since some Node libraries reach for
// `path.win32.isAbsolute` etc. In the browser everything is posix-shaped, which
// is fine for the faked code paths that touch it.

import pathb from "path-browserify";

const base = pathb as unknown as Record<string, unknown>;

const path = { ...base } as Record<string, unknown>;
path.posix = path;
path.win32 = path;

export default path;

export const sep = base.sep as string;
export const delimiter = base.delimiter as string;
export const basename = base.basename as (...a: unknown[]) => string;
export const dirname = base.dirname as (...a: unknown[]) => string;
export const extname = base.extname as (...a: unknown[]) => string;
export const join = base.join as (...a: unknown[]) => string;
export const resolve = base.resolve as (...a: unknown[]) => string;
export const normalize = base.normalize as (...a: unknown[]) => string;
export const isAbsolute = base.isAbsolute as (...a: unknown[]) => boolean;
export const relative = base.relative as (...a: unknown[]) => string;
export const parse = base.parse as (...a: unknown[]) => unknown;
export const format = base.format as (...a: unknown[]) => string;
export const posix = path;
export const win32 = path;

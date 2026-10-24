/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Browser `node:fs/promises` replacement backed by memfs, for the full-renderer
// boot. See fs.browser.ts.

import { fs } from "memfs";

const p = (fs as unknown as { promises: Record<string, unknown> }).promises;

export default p;

export const access = p.access;
export const appendFile = p.appendFile;
export const chmod = p.chmod;
export const chown = p.chown;
export const copyFile = p.copyFile;
export const cp = p.cp;
export const lstat = p.lstat;
export const mkdir = p.mkdir;
export const mkdtemp = p.mkdtemp;
export const open = p.open;
export const opendir = p.opendir;
export const readdir = p.readdir;
export const readFile = p.readFile;
export const readlink = p.readlink;
export const realpath = p.realpath;
export const rename = p.rename;
export const rm = p.rm;
export const rmdir = p.rmdir;
export const stat = p.stat;
export const symlink = p.symlink;
export const truncate = p.truncate;
export const unlink = p.unlink;
export const utimes = p.utimes;
export const watch = p.watch;
export const writeFile = p.writeFile;

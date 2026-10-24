/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Browser stub for fs-extra in the full-renderer boot. fs-extra's consumers
// (persistent stores, app-paths) are overridden with in-memory fakes, so these
// never run; the named exports exist only so the module loads. The base fs
// surface comes from memfs; the fs-extra-specific helpers are async no-ops.

import * as memfs from "memfs";

const asyncNoop = async (..._args: unknown[]) => undefined;
const syncNoop = (..._args: unknown[]) => undefined;

export const ensureDir = asyncNoop;
export const ensureDirSync = syncNoop;
export const ensureFile = asyncNoop;
export const ensureFileSync = syncNoop;
export const mkdirp = asyncNoop;
export const mkdirpSync = syncNoop;
export const pathExists = async () => false;
export const pathExistsSync = () => false;
export const remove = asyncNoop;
export const removeSync = syncNoop;
export const emptyDir = asyncNoop;
export const emptyDirSync = syncNoop;
export const copy = asyncNoop;
export const copySync = syncNoop;
export const move = asyncNoop;
export const moveSync = syncNoop;
export const outputFile = asyncNoop;
export const outputFileSync = syncNoop;
export const readJson = async () => ({});
export const readJsonSync = () => ({});
export const writeJson = asyncNoop;
export const writeJsonSync = syncNoop;
export const outputJson = asyncNoop;
export const outputJsonSync = syncNoop;

// Re-export the memfs fs surface (readFile, writeFile, stat, promises, ...).
export const {
  readFile,
  readFileSync,
  writeFile,
  writeFileSync,
  readdir,
  readdirSync,
  stat,
  statSync,
  existsSync,
  promises,
} = memfs.fs;

export default {
  ...memfs.fs,
  ensureDir,
  ensureDirSync,
  ensureFile,
  ensureFileSync,
  mkdirp,
  mkdirpSync,
  pathExists,
  pathExistsSync,
  remove,
  removeSync,
  emptyDir,
  emptyDirSync,
  copy,
  copySync,
  move,
  moveSync,
  outputFile,
  outputFileSync,
  readJson,
  readJsonSync,
  writeJson,
  writeJsonSync,
  outputJson,
  outputJsonSync,
};

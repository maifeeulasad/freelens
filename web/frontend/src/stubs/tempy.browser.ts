/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
// Browser stub for tempy. Returns fake temp paths without touching the
// filesystem; the injectables that use real temp files are faked at runtime.
const rnd = () => Math.random().toString(36).slice(2);
export const rootTemporaryDirectory = "/tmp";
export const temporaryDirectory = () => `/tmp/${rnd()}`;
export const temporaryFile = () => `/tmp/${rnd()}`;
export const temporaryDirectoryTask = async (cb: (p: string) => unknown) => cb(`/tmp/${rnd()}`);
export const temporaryFileTask = async (cb: (p: string) => unknown) => cb(`/tmp/${rnd()}`);
export const temporaryWrite = async () => `/tmp/${rnd()}`;
export const temporaryWriteTask = async (_data: unknown, cb: (p: string) => unknown) => cb(`/tmp/${rnd()}`);
export const file = temporaryFile;
export const directory = temporaryDirectory;
export default {
  rootTemporaryDirectory,
  temporaryDirectory,
  temporaryFile,
  temporaryDirectoryTask,
  temporaryFileTask,
  temporaryWrite,
  temporaryWriteTask,
  file,
  directory,
};

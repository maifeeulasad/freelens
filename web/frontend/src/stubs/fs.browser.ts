/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Browser `node:fs` / `graceful-fs` replacement backed by memfs (a full
// in-memory fs implementation) for the full-renderer boot. The renderer's
// fs-using injectables are overridden with fakes, so this backs only incidental
// use; exposing the complete named-export surface lets every consumer (and the
// bundler's static analysis) resolve.

import { fs } from "memfs";

const f = fs as unknown as Record<string, unknown>;

export default f;

export const constants = (f.constants as Record<string, number>) ?? {};
export const promises = f.promises;

export const access = f.access;
export const accessSync = f.accessSync;
export const appendFile = f.appendFile;
export const appendFileSync = f.appendFileSync;
export const chmod = f.chmod;
export const chmodSync = f.chmodSync;
export const chown = f.chown;
export const chownSync = f.chownSync;
export const close = f.close;
export const closeSync = f.closeSync;
export const copyFile = f.copyFile;
export const copyFileSync = f.copyFileSync;
export const createReadStream = f.createReadStream;
export const createWriteStream = f.createWriteStream;
export const exists = f.exists;
export const existsSync = f.existsSync;
export const fchmod = f.fchmod;
export const fchmodSync = f.fchmodSync;
export const fstat = f.fstat;
export const fstatSync = f.fstatSync;
export const fsync = f.fsync;
export const fsyncSync = f.fsyncSync;
export const ftruncate = f.ftruncate;
export const ftruncateSync = f.ftruncateSync;
export const futimes = f.futimes;
export const futimesSync = f.futimesSync;
export const link = f.link;
export const linkSync = f.linkSync;
export const lstat = f.lstat;
export const lstatSync = f.lstatSync;
export const mkdir = f.mkdir;
export const mkdirSync = f.mkdirSync;
export const mkdtemp = f.mkdtemp;
export const mkdtempSync = f.mkdtempSync;
export const open = f.open;
export const openSync = f.openSync;
export const opendir = f.opendir;
export const opendirSync = f.opendirSync;
export const read = f.read;
export const readSync = f.readSync;
export const readdir = f.readdir;
export const readdirSync = f.readdirSync;
export const readFile = f.readFile;
export const readFileSync = f.readFileSync;
export const readlink = f.readlink;
export const readlinkSync = f.readlinkSync;
export const realpath = f.realpath;
export const realpathSync = f.realpathSync;
export const rename = f.rename;
export const renameSync = f.renameSync;
export const rm = f.rm;
export const rmSync = f.rmSync;
export const rmdir = f.rmdir;
export const rmdirSync = f.rmdirSync;
export const stat = f.stat;
export const statSync = f.statSync;
export const symlink = f.symlink;
export const symlinkSync = f.symlinkSync;
export const truncate = f.truncate;
export const truncateSync = f.truncateSync;
export const unlink = f.unlink;
export const unlinkSync = f.unlinkSync;
export const unwatchFile = f.unwatchFile;
export const utimes = f.utimes;
export const utimesSync = f.utimesSync;
export const watch = f.watch;
export const watchFile = f.watchFile;
export const write = f.write;
export const writeSync = f.writeSync;
export const writeFile = f.writeFile;
export const writeFileSync = f.writeFileSync;
export const writev = f.writev;
export const writevSync = f.writevSync;

export const Stats = f.Stats;
export const Dirent = f.Dirent;
export const Dir = f.Dir;
export const ReadStream = f.ReadStream;
export const WriteStream = f.WriteStream;

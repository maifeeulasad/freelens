/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
// Browser node:os stub. Faked at runtime; values are inert but well-formed.
export const tmpdir = () => "/tmp";
export const homedir = () => "/home/user";
export const platform = () => "linux";
export const arch = () => "x64";
export const release = () => "";
export const hostname = () => "localhost";
export const type = () => "Browser";
export const cpus = () => [];
export const totalmem = () => 0;
export const freemem = () => 0;
export const networkInterfaces = () => ({});
export const userInfo = () => ({ username: "user", homedir: "/home/user", shell: null, uid: -1, gid: -1 });
export const endianness = () => "LE";
export const loadavg = () => [0, 0, 0];
export const uptime = () => 0;
export const EOL = "\n";
export const constants = {};
export default {
  tmpdir,
  homedir,
  platform,
  arch,
  release,
  hostname,
  type,
  cpus,
  totalmem,
  freemem,
  networkInterfaces,
  userInfo,
  endianness,
  loadavg,
  uptime,
  EOL,
  constants,
};

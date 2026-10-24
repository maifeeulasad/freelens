/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Browser `node:crypto` shim for the full-renderer boot, backed by Web Crypto.
// crypto-browserify is heavy and brittle in the browser; the renderer only uses
// a handful of crypto functions, and most callers are faked at runtime. These
// cover that surface: randomBytes/randomUUID/timingSafeEqual are real;
// createHash is a lightweight non-cryptographic digest (enough for the id/cache
// uses that are not faked), and X509Certificate is a stub.

import { Buffer } from "buffer";

export function randomBytes(size: number, callback?: (err: Error | null, buf: Buffer) => void): Buffer {
  const bytes = Buffer.allocUnsafe(size);
  globalThis.crypto.getRandomValues(bytes);
  if (callback) {
    callback(null, bytes);
    return bytes;
  }
  return bytes;
}

export function randomUUID(): string {
  return globalThis.crypto.randomUUID();
}

export function timingSafeEqual(a: ArrayBufferView, b: ArrayBufferView): boolean {
  const av = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
  const bv = new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
  if (av.length !== bv.length) return false;
  let diff = 0;
  for (let i = 0; i < av.length; i++) diff |= av[i]! ^ bv[i]!;
  return diff === 0;
}

// Lightweight FNV-1a digest, so createHash(...).update(x).digest("hex") returns
// a stable string. Not cryptographic; sufficient for the non-faked id/cache
// uses in the boot. (Cryptographic hashing callers are faked by getDiForUnitTesting.)
class Hash {
  private h = 0x811c9dc5;

  update(data: string | ArrayBufferView): this {
    const bytes =
      typeof data === "string"
        ? new TextEncoder().encode(data)
        : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    for (const b of bytes) {
      this.h ^= b;
      this.h = Math.imul(this.h, 0x01000193);
    }
    return this;
  }

  digest(encoding?: string): string {
    const hex = (this.h >>> 0).toString(16).padStart(8, "0").repeat(4);
    if (encoding === "hex" || encoding === undefined) return hex;
    return hex;
  }
}

export function createHash(_algorithm: string): Hash {
  return new Hash();
}

export class X509Certificate {
  constructor(_data?: unknown) {}
}

export const constants = {};

export default { randomBytes, randomUUID, timingSafeEqual, createHash, X509Certificate, constants };

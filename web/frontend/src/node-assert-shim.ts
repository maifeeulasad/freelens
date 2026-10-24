/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Minimal browser stand-in for node:assert, aliased in for the web build. The
// Freelens modules the web app pulls in (table.tsx, storage-helper.ts) use only
// the default `assert(value, message)` call, so that is all this needs to be.

function assert(value: unknown, message?: string | Error): asserts value {
  if (!value) {
    throw message instanceof Error ? message : new Error(message ?? "Assertion failed");
  }
}

assert.ok = assert;
assert.equal = (actual: unknown, expected: unknown, message?: string) => {
  // eslint-disable-next-line eqeqeq
  if (actual != expected) throw new Error(message ?? `${String(actual)} != ${String(expected)}`);
};
assert.strictEqual = (actual: unknown, expected: unknown, message?: string) => {
  if (actual !== expected) throw new Error(message ?? `${String(actual)} !== ${String(expected)}`);
};

export default assert;

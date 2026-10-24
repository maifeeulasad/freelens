/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Browser implementation of ./union-env-path, avoiding node:path. A browser has
// no OS PATH environment variable, so any real PATH unioning happens in the
// backend/main process; this keeps the function available (with the POSIX
// delimiter) for code paths that reach it. The browser barrel (../browser.ts)
// re-exports this in place of ./union-env-path.

import { iter } from "./iter";

// POSIX PATH delimiter; node:path's `path.delimiter` is ":" on POSIX and ";" on
// Windows, neither of which is meaningful in a browser.
const DELIMITER = ":";

/**
 * Join all entries with a PATH env var delimited string together
 * @param PATHs Any number of PATH env variables
 */
export function unionPATHs(...PATHs: string[]): string {
  const entries = new Set(iter.filterFlatMap(PATHs, (PATH) => PATH.split(DELIMITER)));

  return iter.join(entries.values(), DELIMITER);
}

/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Browser stub for chokidar (Node filesystem watcher) in the full-renderer boot.
// File watching only makes sense for local extension development in the desktop
// app; the injectables that use it are faked at runtime, so this returns an
// inert watcher.

class FSWatcher {
  on(): this {
    return this;
  }
  add(): this {
    return this;
  }
  unwatch(): this {
    return this;
  }
  async close(): Promise<void> {}
  getWatched(): Record<string, string[]> {
    return {};
  }
}

export function watch(): FSWatcher {
  return new FSWatcher();
}

export { FSWatcher };
export default { watch, FSWatcher };

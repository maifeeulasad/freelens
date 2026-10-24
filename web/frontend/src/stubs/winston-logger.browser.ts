/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Browser replacement for @freelensapp/logger's winston-logger.injectable.
// Winston is Node-only (it reaches node:util/os and `process`), and it also
// injectMany's the transport token, which pulls run-many (node:events). The web
// build redirects the winston-logger module here (see vite.config.ts), giving a
// console-backed logger with the same injectable id and Logger shape, so the
// real logger.injectable and everything that depends on loggerInjectionToken
// work unchanged.

import { getInjectable } from "@ogre-tools/injectable";

export const winstonLoggerInjectable = getInjectable({
  id: "winston-logger",
  instantiate: () => ({
    info: (...args: unknown[]) => console.info(...args),
    error: (...args: unknown[]) => console.error(...args),
    debug: (...args: unknown[]) => console.debug(...args),
    warn: (...args: unknown[]) => console.warn(...args),
    silly: (...args: unknown[]) => console.debug(...args),
  }),
});

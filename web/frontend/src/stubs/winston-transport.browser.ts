/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
// Browser stub for winston-transport's base Transport (normally a Node stream).
export default class TransportStream {
  on() {
    return this;
  }
  once() {
    return this;
  }
  emit() {
    return false;
  }
  log() {}
  close() {}
}

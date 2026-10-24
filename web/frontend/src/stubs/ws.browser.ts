/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
// Browser uses the native WebSocket; the Node `ws` package's server side is faked.
const NativeWebSocket = globalThis.WebSocket;

export { NativeWebSocket as WebSocket };
export class WebSocketServer {
  on() {
    return this;
  }
  close() {}
}
export default NativeWebSocket;

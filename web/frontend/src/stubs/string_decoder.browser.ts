/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */
// Browser node:string_decoder backed by TextDecoder.
export class StringDecoder {
  private decoder: TextDecoder;
  constructor(encoding = "utf8") {
    this.decoder = new TextDecoder(encoding === "utf8" ? "utf-8" : encoding);
  }
  write(buf: ArrayBufferView): string {
    return this.decoder.decode(buf, { stream: true });
  }
  end(buf?: ArrayBufferView): string {
    return buf ? this.decoder.decode(buf) : "";
  }
}
export default { StringDecoder };

/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Minimal browser EventEmitter standing in for node:events. Covers the surface
// run-many uses (addListener / removeListener / emit) plus the common on/once/off
// aliases, which is all the pulled-in Freelens code needs.

type Listener = (...args: unknown[]) => void;

export class EventEmitter {
  private readonly listeners = new Map<string | symbol, Set<Listener>>();

  addListener(event: string | symbol, listener: Listener): this {
    const set = this.listeners.get(event) ?? new Set<Listener>();
    set.add(listener);
    this.listeners.set(event, set);
    return this;
  }

  on(event: string | symbol, listener: Listener): this {
    return this.addListener(event, listener);
  }

  once(event: string | symbol, listener: Listener): this {
    const wrapper: Listener = (...args) => {
      this.removeListener(event, wrapper);
      listener(...args);
    };
    return this.addListener(event, wrapper);
  }

  removeListener(event: string | symbol, listener: Listener): this {
    this.listeners.get(event)?.delete(listener);
    return this;
  }

  off(event: string | symbol, listener: Listener): this {
    return this.removeListener(event, listener);
  }

  removeAllListeners(event?: string | symbol): this {
    if (event === undefined) this.listeners.clear();
    else this.listeners.delete(event);
    return this;
  }

  emit(event: string | symbol, ...args: unknown[]): boolean {
    const set = this.listeners.get(event);
    if (!set || set.size === 0) return false;
    for (const listener of [...set]) listener(...args);
    return true;
  }

  listenerCount(event: string | symbol): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

/** node:events named `once(emitter, event)` → resolves with the event args. */
export function once(emitter: EventEmitter, event: string | symbol): Promise<unknown[]> {
  return new Promise((resolve) => {
    emitter.once(event, (...args) => resolve(args));
  });
}

export default EventEmitter;

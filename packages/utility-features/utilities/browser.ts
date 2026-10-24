/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Browser-safe barrel for @freelensapp/utilities. It mirrors ./index.ts exactly,
// except the three modules that import node: builtins or the node-only `tar`
// package are swapped for their browser variants, so the whole barrel loads in a
// plain browser. The Node barrel (./index.ts) is unchanged and is what the
// Electron app and main process keep using; a web build points
// "@freelensapp/utilities" here (e.g. via a bundler alias or a browser export
// condition). Keep the two files in lockstep: adding a browser-safe module means
// adding the same line to both.

export * from "./src/abort-controller";
export * from "./src/array";
export * from "./src/backoff-caller";
export * from "./src/base64.browser";
export * from "./src/buildUrl";
export * from "./src/camelCase";
export * from "./src/collection-functions";
export * from "./src/computed-helpers";
export * from "./src/convertCpu";
export * from "./src/convertMemory";
export * from "./src/create-react-key";
export * from "./src/cssNames";
export * from "./src/cssVar";
export * from "./src/date";
export * from "./src/debouncePromise";
export * from "./src/delay";
export * from "./src/display-mode";
export * from "./src/disposer";
export * from "./src/formatDuration";
export * from "./src/hash-set";
export * from "./src/interval";
export * from "./src/isMiddleClick";
export * from "./src/isReactNode";
export * from "./src/iter";
export * from "./src/json";
export * from "./src/jsonPath";
export * from "./src/kustomize-hash";
export * from "./src/lowerAndPluralize";
export * from "./src/metricUnitsToNumber";
export * from "./src/name-parts";
export * from "./src/named-captures";
export * from "./src/noop";
export * from "./src/object";
export * from "./src/observable-crate";
export * from "./src/on-keyboard-shortcut";
export * from "./src/orderable";
export * from "./src/prevDefault";
export * from "./src/readonly";
export * from "./src/reject-promise";
export * from "./src/result";
export * from "./src/sha256";
export * from "./src/sort-compare";
export * from "./src/sort-function";
export * from "./src/tar.browser";
export * from "./src/tuple";
export * from "./src/type-narrowing";
export * from "./src/typed-event-emitter";
export * from "./src/types";
export * from "./src/union-env-path.browser";
export * from "./src/wait";

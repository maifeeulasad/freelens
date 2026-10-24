/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

// Browser shim for the subset of node:querystring the JSON API uses
// (stringify + parse). Built on URLSearchParams, which matches node's
// percent-encoding closely enough for kube API query parameters.

export function stringify(obj: Record<string, unknown> = {}): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, String(item));
    } else if (value !== undefined && value !== null) {
      params.append(key, String(value));
    } else {
      params.append(key, "");
    }
  }

  return params.toString();
}

export function parse(str = ""): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  const params = new URLSearchParams(str.startsWith("?") ? str.slice(1) : str);

  for (const key of new Set(params.keys())) {
    const all = params.getAll(key);
    out[key] = all.length > 1 ? all : (all[0] ?? "");
  }

  return out;
}

export default { stringify, parse };

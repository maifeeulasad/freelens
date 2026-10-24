/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

export interface ContextInfo {
  currentContext: string;
  contexts: { name: string; cluster: string; user: string }[];
}

export interface NamespaceInfo {
  name: string;
  status?: string;
  createdAt?: string;
}

export interface DeploymentInfo {
  name: string;
  replicas: number;
  ready: number;
  available: number;
  images: string[];
  createdAt?: string;
}

export interface PodInfo {
  name: string;
  phase?: string;
  node?: string;
  restarts: number;
  createdAt?: string;
}

export interface ServiceInfo {
  name: string;
  type?: string;
  clusterIP?: string;
  ports?: { port: number; targetPort?: unknown; nodePort?: number; protocol?: string }[];
}

export interface PortForwardInfo {
  id: string;
  namespace: string;
  pod: string;
  podPort: number;
  localPort: number;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error((data as { error?: string } | null)?.error ?? `${res.status} ${res.statusText}`);
  }
  return data as T;
}

export const api = {
  health: () => request<{ status: string; time: string }>("GET", "/api/health"),
  contexts: () => request<ContextInfo>("GET", "/api/contexts"),
  useContext: (name: string) => request<{ currentContext: string }>("POST", "/api/contexts/use", { name }),
  namespaces: () => request<{ items: NamespaceInfo[] }>("GET", "/api/namespaces"),
  deployments: (ns: string) => request<{ items: DeploymentInfo[] }>("GET", `/api/${ns}/deployments`),
  pods: (ns: string) => request<{ items: PodInfo[] }>("GET", `/api/${ns}/pods`),
  services: (ns: string) => request<{ items: ServiceInfo[] }>("GET", `/api/${ns}/services`),
  deploy: (ns: string, spec: { name: string; image: string; port?: number; replicas?: number }) =>
    request<{ name: string; namespace: string }>("POST", `/api/${ns}/deploy`, spec),
  deleteDeployment: (ns: string, name: string) =>
    request<{ deleted: string }>("DELETE", `/api/${ns}/deployments/${name}`),
  expose: (ns: string, spec: { name: string; port: number; targetPort?: number; type?: string }) =>
    request<ServiceInfo>("POST", `/api/${ns}/expose`, spec),
  portForwards: () => request<{ items: PortForwardInfo[] }>("GET", "/api/portforwards"),
  startPortForward: (spec: { namespace: string; pod: string; podPort: number; localPort?: number }) =>
    request<PortForwardInfo>("POST", "/api/portforwards", spec),
  stopPortForward: (id: string) =>
    request<{ stopped: boolean }>("DELETE", `/api/portforwards/${encodeURIComponent(id)}`),
};

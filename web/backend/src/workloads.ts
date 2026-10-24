/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import type { V1Deployment, V1Service } from "@kubernetes/client-node";

import type { KubeClients } from "./kube.ts";

export interface DeploySpec {
  name: string;
  image: string;
  /** Container port the workload listens on. Optional. */
  port?: number;
  replicas?: number;
  env?: Record<string, string>;
}

export interface ExposeSpec {
  /** Deployment name to expose; its selector labels are reused. */
  name: string;
  port: number;
  targetPort?: number;
  type?: "ClusterIP" | "NodePort";
}

const MANAGED_BY = { "app.kubernetes.io/managed-by": "freelens-web" };

function badRequest(message: string): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = 400;
  return err;
}

/** Create (or replace) a Deployment from a simple spec. */
export async function deploy(kube: KubeClients, namespace: string, spec: DeploySpec): Promise<V1Deployment> {
  if (!spec?.name) throw badRequest("Missing 'name'");
  if (!spec?.image) throw badRequest("Missing 'image'");

  const labels = { app: spec.name, ...MANAGED_BY };
  const env = Object.entries(spec.env ?? {}).map(([name, value]) => ({ name, value }));

  const body: V1Deployment = {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: { name: spec.name, labels },
    spec: {
      replicas: spec.replicas ?? 1,
      selector: { matchLabels: { app: spec.name } },
      template: {
        metadata: { labels },
        spec: {
          containers: [
            {
              name: spec.name,
              image: spec.image,
              ...(spec.port ? { ports: [{ containerPort: spec.port }] } : {}),
              ...(env.length ? { env } : {}),
            },
          ],
        },
      },
    },
  };

  return kube.apps().createNamespacedDeployment({ namespace, body });
}

export async function deleteDeployment(kube: KubeClients, namespace: string, name: string): Promise<void> {
  await kube.apps().deleteNamespacedDeployment({ namespace, name });
}

/** Create a Service in front of a Deployment with matching labels. */
export async function expose(kube: KubeClients, namespace: string, spec: ExposeSpec): Promise<V1Service> {
  if (!spec?.name) throw badRequest("Missing 'name'");
  if (!spec?.port) throw badRequest("Missing 'port'");

  const body: V1Service = {
    apiVersion: "v1",
    kind: "Service",
    metadata: { name: spec.name, labels: { app: spec.name, ...MANAGED_BY } },
    spec: {
      type: spec.type ?? "ClusterIP",
      selector: { app: spec.name },
      ports: [{ port: spec.port, targetPort: spec.targetPort ?? spec.port }],
    },
  };

  return kube.core().createNamespacedService({ namespace, body });
}

/** Rollout status for a Deployment: ready vs desired replicas. */
export async function rolloutStatus(
  kube: KubeClients,
  namespace: string,
  name: string,
): Promise<{ desired: number; ready: number; available: number; ready_: boolean }> {
  const d = await kube.apps().readNamespacedDeployment({ namespace, name });
  const desired = d.spec?.replicas ?? 0;
  const ready = d.status?.readyReplicas ?? 0;
  const available = d.status?.availableReplicas ?? 0;
  return { desired, ready, available, ready_: desired > 0 && ready >= desired };
}

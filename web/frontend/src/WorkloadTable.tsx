/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { podApiInjectable } from "@freelensapp/kube-api-specifics";
import { DiContextProvider } from "@ogre-tools/injectable-react";
import { useEffect, useMemo, useState } from "react";
// The real Freelens core table + the real Pod kube-object, imported by source
// path so we don't pull the whole @freelensapp/core renderer bundle.
import { SortableTable } from "../../../packages/core/src/renderer/components/table/sortable-table";
import { getRendererDi } from "./renderer-di.ts";

import type { Pod } from "@freelensapp/kube-object";

import type { SortableTableColumn } from "../../../packages/core/src/renderer/components/table/sortable-table";

const columns: SortableTableColumn<Pod>[] = [
  { id: "name", title: "Name", sortBy: (p) => p.getName(), renderCell: (p) => p.getName() },
  { id: "phase", title: "Phase", sortBy: (p) => p.getStatus(), renderCell: (p) => p.getStatus() },
  { id: "node", title: "Node", sortBy: (p) => p.getNodeName() ?? "", renderCell: (p) => p.getNodeName() ?? "-" },
  { id: "restarts", title: "Restarts", sortBy: (p) => p.getRestartsCount(), renderCell: (p) => p.getRestartsCount() },
];

/**
 * Fetches pods through Freelens's real `PodApi` (a kube-object `KubeApi`), which
 * talks to this page's origin at /api-kube, where the backend proxies the
 * cluster's apiserver. The rows are real parsed `Pod` kube-objects, rendered by
 * the real core `SortableTable` inside a scoped renderer DI container. This is
 * the kube-object-API + apiserver-proxy layer end to end — no custom backend
 * REST shape in between.
 */
export function WorkloadTable({ namespace }: { namespace: string }) {
  const di = useMemo(getRendererDi, []);
  const podApi = useMemo(() => di.inject(podApiInjectable), [di]);

  const [pods, setPods] = useState<Pod[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    podApi
      .list({ namespace })
      .then((list) => {
        if (alive) setPods(list ?? []);
      })
      .catch((e: unknown) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [podApi, namespace]);

  if (error) {
    return <p className="banner error">podApi.list failed: {error}</p>;
  }

  if (loading && pods.length === 0) {
    return <p className="muted">Loading pods through the real PodApi…</p>;
  }

  if (pods.length === 0) {
    return <p className="muted">No pods in this namespace.</p>;
  }

  return (
    <DiContextProvider value={di}>
      <SortableTable columns={columns} items={pods} getItemKey={(p) => p.getId()} className="freelens-core-table" />
    </DiContextProvider>
  );
}

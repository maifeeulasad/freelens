/**
 * Copyright (c) Freelens Authors. All rights reserved.
 * Copyright (c) Maifee Ul Asad. All rights reserved.
 * Licensed under MIT License. See LICENSE in root directory for more information.
 */

import { Button } from "@freelensapp/button";
import { useCallback, useEffect, useState } from "react";
import {
  api,
  type DeploymentInfo,
  type NamespaceInfo,
  type PodInfo,
  type PortForwardInfo,
  type ServiceInfo,
} from "./api.ts";
import { WorkloadTable } from "./WorkloadTable.tsx";

export function App() {
  const [contexts, setContexts] = useState<{ name: string }[]>([]);
  const [currentContext, setCurrentContext] = useState("");
  const [namespaces, setNamespaces] = useState<NamespaceInfo[]>([]);
  const [namespace, setNamespace] = useState("default");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [deployments, setDeployments] = useState<DeploymentInfo[]>([]);
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [pods, setPods] = useState<PodInfo[]>([]);
  const [forwards, setForwards] = useState<PortForwardInfo[]>([]);

  const report = useCallback((e: unknown) => setError(e instanceof Error ? e.message : String(e)), []);

  const refresh = useCallback(async () => {
    try {
      const [d, s, p, f] = await Promise.all([
        api.deployments(namespace),
        api.services(namespace),
        api.pods(namespace),
        api.portForwards(),
      ]);
      setDeployments(d.items);
      setServices(s.items);
      setPods(p.items);
      setForwards(f.items);
    } catch (e) {
      report(e);
    }
  }, [namespace, report]);

  useEffect(() => {
    (async () => {
      try {
        const ctx = await api.contexts();
        setContexts(ctx.contexts);
        setCurrentContext(ctx.currentContext);
        const ns = await api.namespaces();
        setNamespaces(ns.items);
      } catch (e) {
        report(e);
      }
    })();
  }, [report]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 4000);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          Free<span className="accent">lens</span> Web
        </div>
        <div>
          <label>Cluster</label>
          <select
            value={currentContext}
            onChange={async (e) => {
              try {
                await api.useContext(e.target.value);
                setCurrentContext(e.target.value);
                const ns = await api.namespaces();
                setNamespaces(ns.items);
                setInfo(`Switched to ${e.target.value}`);
              } catch (err) {
                report(err);
              }
            }}
          >
            {contexts.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Namespace</label>
          <select value={namespace} onChange={(e) => setNamespace(e.target.value)}>
            {namespaces.map((n) => (
              <option key={n.name} value={n.name}>
                {n.name}
              </option>
            ))}
          </select>
        </div>
        <div className="spacer" />
        <Button plain label="Refresh" onClick={() => void refresh()} />
      </div>

      <div className="content">
        <div className="stack">
          <DeployPanel namespace={namespace} onDone={refresh} onError={report} onInfo={setInfo} />
        </div>

        <div className="stack">
          {error && (
            <div className="banner error" onClick={() => setError(null)}>
              {error} (click to dismiss)
            </div>
          )}
          {info && (
            <div className="banner info" onClick={() => setInfo(null)}>
              {info} (click to dismiss)
            </div>
          )}

          <DeploymentsPanel
            namespace={namespace}
            deployments={deployments}
            onChange={refresh}
            onError={report}
            onInfo={setInfo}
          />
          <PodsPanel
            namespace={namespace}
            pods={pods}
            forwards={forwards}
            onChange={refresh}
            onError={report}
            onInfo={setInfo}
          />
          <ServicesPanel services={services} />

          <div className="panel">
            <h2>Pods — real Freelens kube-object API + core table</h2>
            <p className="muted" style={{ marginBottom: 10 }}>
              Fetched by the real <code>PodApi</code> through <code>/api-kube</code> (the backend&apos;s apiserver
              proxy) and rendered by the actual <code>SortableTable</code> from <code>@freelensapp/core</code>, in a
              scoped renderer DI container. Click a header to sort.
            </p>
            <WorkloadTable namespace={namespace} />
          </div>
        </div>
      </div>
    </div>
  );
}

type Handlers = {
  onError: (e: unknown) => void;
  onInfo: (m: string) => void;
};

function DeployPanel({ namespace, onDone, onError, onInfo }: { namespace: string; onDone: () => void } & Handlers) {
  const [name, setName] = useState("web-demo");
  const [image, setImage] = useState("nginx:alpine");
  const [port, setPort] = useState(80);
  const [replicas, setReplicas] = useState(1);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api.deploy(namespace, { name, image, port, replicas });
      onInfo(`Deployed "${name}" to ${namespace}`);
      onDone();
    } catch (e) {
      onError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel">
      <h2>Deploy a container</h2>
      <label className="field">
        <span>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="field">
        <span>Image</span>
        <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="nginx:alpine" />
      </label>
      <label className="field">
        <span>Container port</span>
        <input type="number" value={port} onChange={(e) => setPort(Number(e.target.value))} />
      </label>
      <label className="field">
        <span>Replicas</span>
        <input type="number" value={replicas} onChange={(e) => setReplicas(Number(e.target.value))} />
      </label>
      <Button primary waiting={busy} label="Deploy" onClick={submit} />
      <p className="muted" style={{ marginTop: 10 }}>
        Creates a Deployment in <strong>{namespace}</strong>. Then expose it and port-forward below.
      </p>
    </div>
  );
}

function DeploymentsPanel({
  namespace,
  deployments,
  onChange,
  onError,
  onInfo,
}: { namespace: string; deployments: DeploymentInfo[]; onChange: () => void } & Handlers) {
  const expose = async (name: string, port: number) => {
    try {
      const svc = await api.expose(namespace, { name, port, type: "NodePort" });
      const np = svc.ports?.[0]?.nodePort;
      onInfo(`Exposed "${name}"${np ? ` on NodePort ${np}` : ""}`);
      onChange();
    } catch (e) {
      onError(e);
    }
  };

  const remove = async (name: string) => {
    try {
      await api.deleteDeployment(namespace, name);
      onInfo(`Deleted "${name}"`);
      onChange();
    } catch (e) {
      onError(e);
    }
  };

  return (
    <div className="panel">
      <h2>Deployments</h2>
      {deployments.length === 0 ? (
        <p className="muted">No deployments in this namespace yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Ready</th>
              <th>Image</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {deployments.map((d) => {
              const ready = d.ready >= d.replicas && d.replicas > 0;
              return (
                <tr key={d.name}>
                  <td>{d.name}</td>
                  <td>
                    <span className={`pill ${ready ? "ok" : "warn"}`}>
                      {d.ready}/{d.replicas}
                    </span>
                  </td>
                  <td>{d.images.join(", ")}</td>
                  <td>
                    <div className="row-actions">
                      <Button plain label="Expose" onClick={() => expose(d.name, 80)} />
                      <Button plain accent label="Delete" onClick={() => remove(d.name)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function PodsPanel({
  namespace,
  pods,
  forwards,
  onChange,
  onError,
  onInfo,
}: { namespace: string; pods: PodInfo[]; forwards: PortForwardInfo[]; onChange: () => void } & Handlers) {
  const start = async (pod: string) => {
    try {
      const pf = await api.startPortForward({ namespace, pod, podPort: 80 });
      onInfo(`Port-forward started: http://127.0.0.1:${pf.localPort}`);
      onChange();
    } catch (e) {
      onError(e);
    }
  };

  const stop = async (id: string) => {
    try {
      await api.stopPortForward(id);
      onInfo("Port-forward stopped");
      onChange();
    } catch (e) {
      onError(e);
    }
  };

  return (
    <div className="panel">
      <h2>Pods</h2>
      {pods.length === 0 ? (
        <p className="muted">No pods in this namespace yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phase</th>
              <th>Restarts</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pods.map((p) => (
              <tr key={p.name}>
                <td>{p.name}</td>
                <td>
                  <span className={`pill ${p.phase === "Running" ? "ok" : p.phase === "Pending" ? "warn" : "err"}`}>
                    {p.phase}
                  </span>
                </td>
                <td>{p.restarts}</td>
                <td>
                  <div className="row-actions">
                    <Button plain label="Port-forward :80" onClick={() => start(p.name!)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {forwards.length > 0 && (
        <>
          <h3>Active port-forwards</h3>
          <table>
            <thead>
              <tr>
                <th>Pod</th>
                <th>Reachable at</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {forwards.map((f) => (
                <tr key={f.id}>
                  <td>
                    {f.pod}:{f.podPort}
                  </td>
                  <td>
                    <a className="reachable" href={`http://127.0.0.1:${f.localPort}`} target="_blank" rel="noreferrer">
                      127.0.0.1:{f.localPort}
                    </a>
                  </td>
                  <td>
                    <Button plain accent label="Stop" onClick={() => stop(f.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function ServicesPanel({ services }: { services: ServiceInfo[] }) {
  return (
    <div className="panel">
      <h2>Services</h2>
      {services.length === 0 ? (
        <p className="muted">No services in this namespace yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Cluster IP</th>
              <th>Ports</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.name}>
                <td>{s.name}</td>
                <td>{s.type}</td>
                <td>{s.clusterIP}</td>
                <td>
                  {s.ports?.map((p) => `${p.port}${p.nodePort ? `:${p.nodePort}` : ""}/${p.protocol}`).join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  moduleCatalog,
  orderedMissionIds,
  type ModuleSettings,
} from "./modules";
export default function ModuleEditor() {
  const [id, setId] = useState(moduleCatalog[0].id);
  const [saved, setSaved] = useState<ModuleSettings[]>([]);
  const [objectives, setObjectives] = useState("");
  const [order, setOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const selected = moduleCatalog.find((m) => m.id === id)!;
  useEffect(() => {
    let active = true;
    fetch("/api/modules")
      .then(async (r) => {
        const b = await r.json();
        if (!r.ok) throw new Error(b.error);
        if (active) {setSaved(b.modules);setReady(true);}
      })
      .catch((e) => {
        if (active) setError(e instanceof SyntaxError ? "No pudimos conectar con el editor. Recarga e inténtalo nuevamente." : e.message || "No pudimos cargar los módulos.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const value = saved.find((m) => m.id === id);
    setObjectives((value?.objectives || []).join("\n"));
    setOrder(orderedMissionIds(id, value?.mission_order));
    setDirty(false);
  }, [id, saved]);
  function move(index: number, delta: number) {
    const next = [...order];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    setOrder(next);
    setDirty(true);
    setMessage("");
  }
  async function save() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          objectives: objectives
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
          mission_order: order,
        }),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      setSaved((v) => [...v.filter((m) => m.id !== id), b.module]);
      setMessage(
        "Módulo guardado. Los objetivos y el orden ya están disponibles en el sitio.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel spaced">
      <h2>Objetivos y misiones de los módulos</h2>
      <p className="muted">
        Selecciona un módulo, escribe un objetivo por línea y ordena sus
        misiones.
      </p>
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Cargando módulos…</p>
      ) : !ready ? <p className="muted">Recarga el panel para volver a conectar antes de editar.</p> : (
        <>
          <label className="field">
            Módulo
            <select
              value={id}
              disabled={busy || dirty}
              onChange={(e) => setId(e.target.value)}
            >
              {moduleCatalog.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.area} · {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field spaced">
            Objetivos del módulo
            <textarea
              rows={8}
              value={objectives}
              disabled={busy}
              onChange={(e) => {
                setObjectives(e.target.value);
                setDirty(true);
                setMessage("");
              }}
              placeholder="Escribe cada objetivo en una línea"
            />
          </label>
          <h3>Misiones del módulo</h3>
          {order.length ? (
            <ol>
              {order.map((mission, index) => (
                <li key={mission} className="module-order-row">
                  <span>
                    {selected.missions.find((m) => m.id === mission)?.title}
                  </span>
                  <button
                    className="button secondary"
                    disabled={busy || index === 0}
                    aria-label={`Subir ${selected.missions.find((m) => m.id === mission)?.title}`}
                    onClick={() => move(index, -1)}
                  >
                    ↑ Subir
                  </button>
                  <button
                    className="button secondary"
                    disabled={busy || index === order.length - 1}
                    aria-label={`Bajar ${selected.missions.find((m) => m.id === mission)?.title}`}
                    onClick={() => move(index, 1)}
                  >
                    ↓ Bajar
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">
              Este módulo todavía no tiene misiones disponibles.
            </p>
          )}
          <button className="button" disabled={busy || !dirty} onClick={save}>
            {busy ? "Guardando…" : "Guardar módulo"}
          </button>
          {dirty && (
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => {
                const v = saved.find((m) => m.id === id);
                setObjectives((v?.objectives || []).join("\n"));
                setOrder(orderedMissionIds(id, v?.mission_order));
                setDirty(false);
                setMessage("");
              }}
            >
              Descartar cambios
            </button>
          )}
          {message && <p role="status">{message}</p>}
        </>
      )}
    </section>
  );
}

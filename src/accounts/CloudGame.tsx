import { useEffect, useRef, useState } from "react";
import { useAccount } from "./Session";
import { learningApi } from "./client";
import { AdventureEntry } from "./Account";
import { Link } from "react-router-dom";
import type { Progress } from "../games/coihue/progress";
import type { GameEvent } from "../../server/learningDomain";
import CoihueGame from "../games/coihue/Game";
type Saved = { state: Progress; revision: number; owner?: string };
export default function CloudGame() {
  const { profile, loading, error } = useAccount();
  const currentUser = useRef(profile?.id);
  currentUser.current = profile?.id;
  const [saved, setSaved] = useState<Saved | null>(null);
  const savedRef = useRef<Saved | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const busyRef = useRef(false);
  const [pending, setPending] = useState<{
    event: GameEvent;
    event_id: string;
    revision: number;
  } | null>(null);
  const load = async () => {
    try {
      const owner = profile?.id;
      const data = await learningApi<Saved>("progress");
      if (owner !== currentUser.current) return;
      savedRef.current = { ...data, owner };
      setSaved({ ...data, owner });
      setProblem("");
      setPending(null);
    } catch (e) {
      setProblem((e as Error).message);
    }
  };
  useEffect(() => {
    setSaved(null);
    savedRef.current = null;
    if (profile?.role === "student") void load();
  }, [profile?.id]);
  const send = async (event: GameEvent, retry?: typeof pending) => {
    if (
      busyRef.current ||
      !savedRef.current ||
      savedRef.current.owner !== profile?.id
    )
      return;
    busyRef.current = true;
    setBusy(true);
    const request = retry ?? {
      event,
      event_id: crypto.randomUUID(),
      revision: savedRef.current.revision,
    };
    try {
      const data = await learningApi<Saved>("event", request);
      if (currentUser.current !== profile?.id) return;
      savedRef.current = { ...data, owner: profile?.id };
      setSaved({ ...data, owner: profile?.id });
      setPending(null);
      setProblem("");
    } catch (e) {
      if (currentUser.current !== profile?.id) return;
      setPending(request);
      setProblem((e as Error).message);
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  };
  if (loading) return <p role="status">Comprobando tu acceso…</p>;
  if (!profile)
    return error ? (
      <section className="panel">
        <p role="alert">{error}</p>
        <Link to="/cuenta">Revisar acceso</Link>
      </section>
    ) : (
      <AdventureEntry />
    );
  if (profile.role !== "student")
    return (
      <section className="panel">
        <h1>Valle del Coihue</h1>
        <p>
          Esta aventura guarda evidencias en cuentas de estudiante. Puedes
          revisar el contenido desde el repositorio y acompañar a tus cursos en
          el panel docente.
        </p>
        <Link to="/acompanamiento">Abrir panel docente</Link>
      </section>
    );
  return (
    <>
      <p className="muted small" role="status">
        {busy
          ? "Guardando en tu cuenta…"
          : saved && !problem
            ? "Avance recuperado y confirmado por el servidor."
            : ""}
      </p>
      {problem && (
        <div className="notice" role="alert">
          <p>
            {problem} La actividad no se dará por guardada hasta recibir
            confirmación.
          </p>
          {pending && (
            <button
              className="button"
              disabled={busy}
              onClick={() => void send(pending.event, pending)}
            >
              Reintentar la misma respuesta
            </button>
          )}
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => void load()}
          >
            Recargar avance del servidor
          </button>
        </div>
      )}
      {saved && saved.owner === profile.id ? (
        <CoihueGame
          state={saved.state}
          onEvent={(event) => void send(event)}
          disabled={busy || !!pending}
        />
      ) : !problem ? (
        <p role="status">Recuperando tu aventura…</p>
      ) : null}
    </>
  );
}

import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAccount } from "./Session";
import { authClient, learningApi } from "./client";
import { missions } from "../data";
import { parseDemoState, STORAGE_KEY, type Attempt } from "../progress";
import type { Profile, Role } from "./model";
export const roleNames: Record<Role, string> = {
  student: "Estudiante",
  teacher: "Docente",
  institution_admin: "Administrador institucional",
  admin: "Administrador TP PLAY",
};
export function Guard({
  roles,
  children,
}: {
  roles: Role[];
  children: ReactNode;
}) {
  const { loading, profile, error, session, refresh, logout } = useAccount();
  const [checked, setChecked] = useState(false),
    [problem, setProblem] = useState("");
  const key =
    roles.length === 4
      ? "account"
      : roles.includes("admin") && roles.length === 1
        ? "admin"
        : roles.includes("teacher")
          ? "teacher"
          : roles.includes("institution_admin")
            ? "institution"
            : "student";
  useEffect(() => {
    setChecked(false);
    setProblem("");
    if (profile && roles.includes(profile.role))
      void learningApi("roleAccess&role=" + key)
        .then(() => setChecked(true))
        .catch((e) => setProblem(e.message));
  }, [profile?.id, profile?.role, key]);
  if (loading) return <p role="status">Validando tu acceso…</p>;
  if (!profile) {
    if (error || session)
      return (
        <section className="panel">
          <h1>Revisa tu acceso</h1>
          <p role="alert">
            {error || "Verifica tu correo antes de continuar."}
          </p>
          <button className="button" onClick={() => void refresh()}>
            Volver a comprobar
          </button>
          <button className="button secondary" onClick={() => void logout()}>
            Cerrar sesión
          </button>
        </section>
      );
    return <Navigate to="/cuenta/ingresar" replace />;
  }
  if (!roles.includes(profile.role) || problem)
    return (
      <section className="panel">
        <p className="eyebrow">ACCESO PROTEGIDO</p>
        <h1>No tienes acceso a este espacio</h1>
        <p role="alert">
          {problem || "Tu perfil no tiene los permisos necesarios."}
        </p>
        <Link className="button" to="/perfil">
          Ir a mi perfil
        </Link>
      </section>
    );
  if (!checked)
    return <p role="status">Confirmando permisos con el servidor…</p>;
  return <>{children}</>;
}
export type DashboardData = {
  progress: {
    mission_id: string;
    status: string;
    progress_percentage: number;
    xp_earned: number;
    completed_at: string | null;
  }[];
  attempts: {
    id: string;
    mission_id: string;
    state: Attempt;
    revision: number;
    completed_at: string | null;
  }[];
  xp: number;
  totalMissions: number;
  achievements: { code: string; name: string; description: string }[];
  imports: { source: string; source_id: string }[];
};
function useDashboard() {
  const { profile } = useAccount();
  const [data, setData] = useState<DashboardData | null>(null),
    [error, setError] = useState("");
  const load = async () => {
    try {
      setData(await learningApi("dashboard"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    if (profile?.role === "student") void load();
  }, [profile?.id]);
  return { data, error, load };
}
export function StudentDashboard() {
  return (
    <Guard roles={["student"]}>
      <StudentContent />
    </Guard>
  );
}
function StudentContent() {
  const { profile } = useAccount();
  const { data, error, load } = useDashboard();
  const [coihue, setCoihue] = useState<unknown>(null);
  const [migration, setMigration] = useState<Attempt[]>([]),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    try {
      const old = localStorage.getItem("tpplay.coihue.tributos.v1");
      if (old) setCoihue(JSON.parse(old));
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMigration(parseDemoState(raw).attempts);
    } catch {
      setMessage(
        "Hay datos locales incompatibles. Los conservamos sin borrarlos.",
      );
    }
  }, []);
  if (error)
    return (
      <section className="panel">
        <p role="alert">{error}</p>
        <button className="button" onClick={() => void load()}>
          Reintentar
        </button>
      </section>
    );
  if (!data) return <p role="status">Recuperando tu aventura…</p>;
  const completed = data.progress.filter(
      (p) => p.status === "completed",
    ).length,
    percentage = Math.round(
      data.progress.reduce((n, p) => n + p.progress_percentage, 0) /
        data.totalMissions,
    ),
    draft = data.attempts.find((a) => !a.completed_at);
  const pending = migration.filter(
    (a) =>
      !data.imports.some((i) => i.source === "demo" && i.source_id === a.id),
  );
  async function migrate() {
    setBusy(true);
    let count = 0;
    const failures: string[] = [];
    for (const a of pending) {
      try {
        await learningApi("importLocal", { attempt: a });
        count++;
      } catch (e) {
        failures.push((e as Error).message);
      }
    }
    await load();
    setMessage(
      `${count} intentos importados. ${failures.length ? failures.join(" ") : "Los originales siguen en este navegador."}`,
    );
    setBusy(false);
  }
  return (
    <>
      <section className="panel valley-dashboard">
        <p className="eyebrow">VALLE DEL COIHUE</p>
        <h1>Hola, {profile?.first_name || profile?.name} 👋</h1>
        <p>Cada decisión abre un nuevo camino.</p>
        <div className="stats-grid">
          <div className="stat">
            <strong>Nivel {Math.floor(data.xp / 200) + 1}</strong>
            <span>{data.xp} XP</span>
          </div>
          <div className="stat">
            <strong>{percentage}%</strong>
            <span>Progreso general</span>
          </div>
          <div className="stat">
            <strong>{completed}</strong>
            <span>Misiones completadas</span>
          </div>
        </div>
        <div className="valley-actions">
          <Link
            className="button"
            to={
              draft
                ? `/desafios/${draft.mission_id}/jugar`
                : "/juegos/mision-tributos"
            }
          >
            Continuar mi aventura
          </Link>
          <Link className="button secondary" to="/perfil">
            Mi perfil
          </Link>
        </div>
      </section>
      {coihue && !data.imports.some((i) => i.source === "coihue") && (
        <section className="panel spaced">
          <h2>Aventura local de Valle del Coihue</h2>
          <p>
            Podemos importar las respuestas válidas y recalcular el progreso. El
            historial de intentos previo no se puede verificar; se identificará
            como importación local.
          </p>
          <button
            className="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await learningApi("importLocal", {
                  source: "coihue",
                  state: coihue,
                });
                await load();
                setMessage(
                  "Aventura local importada. El original se conserva.",
                );
              } catch (e) {
                setMessage((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Importar mi aventura anterior
          </button>
        </section>
      )}
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {pending.length > 0 && (
        <section className="panel spaced">
          <h2>Tu recorrido anterior sigue aquí</h2>
          <p>
            Encontramos {pending.length} intentos locales. Impórtalos solo si
            son tuyos. Recalcularemos los resultados y el XP; conservaremos los
            originales.
          </p>
          <button
            className="button"
            disabled={busy}
            onClick={() => void migrate()}
          >
            {busy ? "Importando…" : "Importar mi progreso local"}
          </button>
        </section>
      )}
      <section className="section">
        <h2>Misiones y próximos desafíos</h2>
        <div className="account-roster">
          {missions.map((m) => {
            const p = data.progress.find((p) => p.mission_id === m.slug);
            return (
              <article className="panel" key={m.slug}>
                <h3>{m.title}</h3>
                <p>
                  {p?.progress_percentage || 0}% · {p?.xp_earned || 0} XP
                </p>
                <Link
                  className="button secondary"
                  to={`/desafios/${m.slug}/jugar`}
                >
                  {p?.status === "completed"
                    ? "Nuevo intento"
                    : p
                      ? "Continuar misión"
                      : "Comenzar misión"}
                </Link>
              </article>
            );
          })}
          <article className="panel">
            <h3>Valle del Coihue · Tributos</h3>
            <p>Siete misiones en la ciudad.</p>
            <Link className="button secondary" to="/juegos/mision-tributos">
              Abrir mapa
            </Link>
          </article>
        </div>
      </section>
      <section className="panel">
        <h2>Tus logros</h2>
        {data.achievements.length ? (
          data.achievements.map((a) => (
            <p key={a.code}>
              🏅 <strong>{a.name}</strong> · {a.description}
            </p>
          ))
        ) : (
          <p>Tu primera misión desbloqueará el primer logro.</p>
        )}
      </section>
      <section className="section">
        <h2>Historial personal</h2>
        {data.attempts.length ? (
          data.attempts.map((a) => (
            <p key={a.id}>
              <Link
                to={
                  a.completed_at
                    ? `/intentos/${a.id}/resultados`
                    : `/desafios/${a.mission_id}/jugar`
                }
              >
                {missions.find((m) => m.slug === a.mission_id)?.title ||
                  a.mission_id}{" "}
                · {a.completed_at ? "Completada" : "En curso"}
              </Link>
            </p>
          ))
        ) : (
          <p>Todavía no has iniciado una misión. ¡Elige tu primer desafío!</p>
        )}
      </section>
    </>
  );
}
export function UserProfile() {
  return (
    <Guard roles={["student", "teacher", "institution_admin", "admin"]}>
      <ProfileContent />
    </Guard>
  );
}
function ProfileContent() {
  const { profile, session, refresh, logout } = useAccount();
  const { data } = useDashboard();
  const [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await learningApi("identityProfile", {
        first_name: f.get("first_name"),
        last_name: f.get("last_name"),
      });
      await refresh();
      setMessage("Perfil guardado.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel account-panel">
      <p className="eyebrow">MI PERFIL · TP PLAY</p>
      <div className="identity-avatar" aria-hidden="true">
        {profile?.name
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")}
      </div>
      <h1>{profile?.name}</h1>
      <p>{roleNames[profile!.role]}</p>
      <p>
        {profile?.email || session?.user.email} ·{" "}
        {session?.user.email_confirmed_at
          ? "Correo verificado"
          : "Correo pendiente de verificación"}
      </p>
      <p>
        Incorporación:{" "}
        {profile?.created_at
          ? new Date(profile.created_at).toLocaleDateString("es-CL")
          : "Cuenta existente"}
      </p>
      {data && (
        <p>
          {data.xp} XP ·{" "}
          {data.progress.filter((p) => p.status === "completed").length}{" "}
          misiones completadas
        </p>
      )}
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <form onSubmit={save} className="account-form">
        <label className="field">
          Nombre
          <input
            name="first_name"
            defaultValue={profile?.first_name || profile?.name}
            minLength={2}
            maxLength={60}
            required
            autoComplete="given-name"
          />
        </label>
        <label className="field">
          Apellido
          <input
            name="last_name"
            defaultValue={profile?.last_name}
            minLength={2}
            maxLength={60}
            required
            autoComplete="family-name"
          />
        </label>
        <button className="button" disabled={busy}>
          Guardar mi perfil
        </button>
      </form>
      <div className="valley-actions">
        <Link className="button secondary" to="/cuenta/recuperar">
          Cambiar contraseña de forma segura
        </Link>
        <Link className="button secondary" to="/cuenta/cursos">
          Mis cursos y establecimiento
        </Link>
        <Link
          to={
            profile?.role === "student"
              ? "/alumno"
              : profile?.role === "teacher"
                ? "/docente"
                : profile?.role === "institution_admin"
                  ? "/institucion"
                  : "/admin"
          }
        >
          Abrir mi espacio
        </Link>
        <button className="text-button" onClick={() => void logout()}>
          Cerrar sesión
        </button>
      </div>
    </section>
  );
}
export function InstitutionalDashboard() {
  return (
    <Guard roles={["institution_admin", "admin"]}>
      <InstitutionContent />
    </Guard>
  );
}
function InstitutionContent() {
  const [name, setName] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    void learningApi<{ institution: { name: string } | null }>("institution")
      .then((d) =>
        setName(
          d.institution?.name || "Establecimiento pendiente de asignación",
        ),
      )
      .catch((e) => setError(e.message));
  }, []);
  return (
    <section className="panel">
      <p className="eyebrow">TP PLAY INSTITUCIONAL</p>
      <h1>Tu comunidad educativa</h1>
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <p>{name || "Recuperando establecimiento…"}</p>
      )}
      <div className="account-roster">
        {[
          "Establecimiento",
          "Docentes",
          "Cursos",
          "Estudiantes",
          "Métricas",
        ].map((x) => (
          <article className="panel" key={x}>
            <h2>{x}</h2>
            <p>Disponible próximamente para tu institución.</p>
          </article>
        ))}
      </div>
    </section>
  );
}

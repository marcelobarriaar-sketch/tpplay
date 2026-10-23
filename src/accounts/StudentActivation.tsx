import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAccount } from "./Session";
import { authClient, learningApi } from "./client";
export default function StudentActivation() {
  const { profile, loading, session, refresh } = useAccount();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (loading) return <p role="status">Preparando tu activación…</p>;
  if (!session)
    return (
      <section className="panel">
        <h1>Activa tu cuenta de alumno</h1>
        <p>
          Abre el enlace individual que recibiste por correo. Si venció,
          solicita uno mediante recuperación de contraseña.
        </p>
        <Link to="/cuenta/recuperar" className="button">
          Recuperar acceso
        </Link>
      </section>
    );
  if (profile && !profile.onboarding_required)
    return <Navigate to="/alumno" replace />;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError("");
    setBusy(true);
    try {
      if (f.get("password") !== f.get("confirmation"))
        throw Error("Las contraseñas deben coincidir.");
      const result = await authClient!.auth.updateUser({
        password: String(f.get("password")),
      });
      if (result.error)
        throw Error(
          "No pudimos guardar la contraseña. Usa al menos 12 caracteres y vuelve a intentar.",
        );
      await learningApi("activateStudent", {
        accepted: f.get("terms") === "on",
      });
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel account-panel">
      <h1>Activa tu cuenta de alumno</h1>
      <p>
        Hola, {profile?.name}. Tu docente registró tu matrícula. Define tu
        contraseña para comenzar.
      </p>
      <form className="account-form" onSubmit={(e) => void submit(e)}>
        <label className="field">
          Tu nueva contraseña
          <input
            type="password"
            name="password"
            minLength={12}
            required
            autoComplete="new-password"
          />
        </label>
        <label className="field">
          Repite tu contraseña
          <input
            type="password"
            name="confirmation"
            minLength={12}
            required
            autoComplete="new-password"
          />
        </label>
        <label>
          <input type="checkbox" name="terms" required /> Acepto los{" "}
          <Link to="/condiciones" target="_blank">
            términos
          </Link>{" "}
          y la{" "}
          <Link to="/cuenta/privacidad" target="_blank">
            privacidad
          </Link>{" "}
          de TP PLAY.
        </label>
        {error && <p role="alert">{error}</p>}
        <button className="button" disabled={busy}>
          {busy ? "Activando…" : "Activar mi cuenta"}
        </button>
      </form>
    </section>
  );
}

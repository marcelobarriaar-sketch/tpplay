import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { authClient, learningApi } from "./client";
import { useAccount } from "./Session";
import { levelNames, type Registry, type Evaluation } from "./model";
export function AccountUnavailable() {
  return (
    <section className="panel account-panel">
      <p className="eyebrow">VALLE DEL COIHUE</p>
      <h1>Tu aventura está por comenzar</h1>
      <p>
        Estamos preparando las cuentas de estudiantes para conservar tu
        recorrido y recibir acompañamiento docente.
      </p>
      <p role="status">
        El registro y el ingreso aún no están habilitados. Aquí aparecerán
        cuando el servicio de cuentas esté conectado.
      </p>
      <div className="valley-actions">
        <button className="button" disabled>
          Ingresar
        </button>
        <button className="button secondary" disabled>
          Crear mi cuenta
        </button>
      </div>
      <Link className="button secondary" to="/">
        Volver al inicio
      </Link>
      <Link className="text-link spaced" to="/desafios">
        Explorar los desafíos de demostración
      </Link>
    </section>
  );
}
export function AdventureEntry() {
  const { profile, loading, error } = useAccount();
  if (loading) return <p role="status">Comprobando tu acceso…</p>;
  if (profile?.role === "student")
    return <Navigate replace to="/juegos/mision-tributos" />;
  if (!authClient) return <AccountUnavailable />;
  return (
    <section className="panel account-panel">
      <p className="eyebrow">BIENVENIDO A VALLE DEL COIHUE</p>
      <h1>Comienza tu aventura</h1>
      <p>
        Tu cuenta permite continuar desde otro dispositivo y recibir la
        retroalimentación de tu docente.
      </p>
      {error && <p role="alert">{error}</p>}
      {profile ? (
        <>
          <p>Tu cuenta tiene acceso docente o administrativo.</p>
          <Link className="button" to="/acompanamiento">
            Abrir mi panel
          </Link>
        </>
      ) : (
        <div className="valley-actions">
          <Link className="button" to="/cuenta/ingresar">
            Ingresar
          </Link>
          <Link className="button secondary" to="/cuenta/crear">
            Crear mi cuenta
          </Link>
        </div>
      )}
      <p className="muted small">
        No necesitas RUT, domicilio ni fecha de nacimiento.{" "}
        <Link to="/cuenta/privacidad">Conoce cómo cuidamos tus datos.</Link>
      </p>
    </section>
  );
}
export function AccountAccess() {
  const location = useLocation();
  const mode = location.pathname.endsWith("/crear")
    ? "create"
    : location.pathname.endsWith("/recuperar") ||
        location.pathname === "/recuperar-acceso"
      ? "recover"
      : "login";
  const { session, profile, refresh } = useAccount();
  const [registry, setRegistry] = useState<Registry>({
    cities: [],
    schools: [],
  });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [city, setCity] = useState("");
  const [school, setSchool] = useState("");
  useEffect(() => {
    if (authClient && mode === "create")
      void learningApi<Registry>("registry")
        .then(setRegistry)
        .catch((e) => setError(e.message));
  }, [mode]);
  if (!authClient) return <AccountUnavailable />;
  if (profile && mode !== "recover") return <Navigate to="/cuenta" replace />;
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    try {
      if (mode === "create") {
        if (password !== form.get("confirmation"))
          throw Error("Las contraseñas deben coincidir.");
        const response = await authClient!.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/cuenta",
            data: {
              name: String(form.get("name")),
              city_id: city,
              school_id: school || null,
              requested_school: school
                ? null
                : String(form.get("requested_school") || ""),
            },
          },
        });
        if (response.error)
          throw Error(
            "No pudimos crear la cuenta. Revisa los datos y vuelve a intentarlo.",
          );
        setNotice(
          "Revisa tu correo y abre el enlace de verificación. Después podrás ingresar; si tu establecimiento no estaba en la lista, su incorporación quedará pendiente de revisión.",
        );
      } else if (mode === "recover" && session) {
        if (password !== form.get("confirmation"))
          throw Error("Las contraseñas deben coincidir.");
        const response = await authClient!.auth.updateUser({ password });
        if (response.error)
          throw Error(
            "El enlace venció o no pudimos cambiar la contraseña. Solicita otro enlace.",
          );
        await authClient!.auth.signOut();
        setNotice("Contraseña actualizada. Ingresa con tu nueva contraseña.");
      } else if (mode === "recover") {
        const response = await authClient!.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/cuenta/recuperar",
        });
        if (response.error)
          throw Error("No pudimos solicitar el enlace. Intenta más tarde.");
        setNotice(
          "Si existe una cuenta con este correo, recibirás un enlace de recuperación. Revisa también la carpeta de spam.",
        );
      } else {
        const response = await authClient!.auth.signInWithPassword({
          email,
          password,
        });
        if (response.error)
          throw Error(
            "No pudimos ingresar. Revisa tus datos y verifica el correo.",
          );
        await refresh();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel account-panel">
      <p className="eyebrow">TU ACCESO A VALLE DEL COIHUE</p>
      <h1>
        {mode === "create"
          ? "Crear mi cuenta"
          : mode === "recover"
            ? session
              ? "Elegir nueva contraseña"
              : "Recuperar mi acceso"
            : "Ingresar"}
      </h1>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      <form onSubmit={submit} className="account-form">
        {mode === "create" && (
          <>
            <label className="field">
              Nombre del estudiante
              <input
                name="name"
                autoComplete="name"
                minLength={2}
                maxLength={120}
                required
              />
            </label>
            <label className="field">
              Ciudad donde estudias
              <select
                value={city}
                required
                onChange={(e) => {
                  setCity(e.target.value);
                  setSchool("");
                }}
              >
                <option value="">Selecciona tu ciudad</option>
                {registry.cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Colegio o establecimiento
              <select
                value={school}
                onChange={(e) => setSchool(e.target.value)}
              >
                <option value="">Mi establecimiento aún no aparece</option>
                {registry.schools
                  .filter((s) => s.city_id === city)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
              <small>
                Si falta, escribe su nombre para solicitar su incorporación.
                Ningún colegio asigna un curso automáticamente.
              </small>
            </label>
            {!school && (
              <label className="field">
                Nombre del establecimiento que falta
                <input
                  name="requested_school"
                  required
                  minLength={2}
                  maxLength={160}
                />
                <small>
                  Quedará pendiente de revisión por el administrador.
                </small>
              </label>
            )}
          </>
        )}
        {!(mode === "recover" && session) && (
          <label className="field">
            Correo electrónico
            <input
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
            />
          </label>
        )}
        {(mode !== "recover" || session) && (
          <label className="field">
            {mode === "recover" ? "Nueva contraseña" : "Contraseña"}
            <input
              name="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={mode === "login" ? undefined : 12}
              maxLength={256}
              required
            />
            <small>
              {mode === "login"
                ? "Puedes usar tu gestor de contraseñas."
                : "Usa al menos 12 caracteres. Puedes pegar y usar un gestor de contraseñas."}
            </small>
          </label>
        )}
        {(mode === "create" || (mode === "recover" && session)) && (
          <label className="field">
            Confirmación de contraseña
            <input
              name="confirmation"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={256}
              required
            />
          </label>
        )}
        {mode === "create" && (
          <label className="toggle">
            <input type="checkbox" required />
            He leído el <Link to="/cuenta/privacidad">aviso de privacidad</Link>
            .
          </label>
        )}
        <button
          className="button"
          disabled={busy || (mode === "create" && !city)}
        >
          {busy
            ? "Procesando…"
            : mode === "create"
              ? "Crear cuenta y verificar correo"
              : mode === "recover"
                ? session
                  ? "Guardar nueva contraseña"
                  : "Enviar enlace"
                : "Ingresar"}
        </button>
      </form>
      <div className="valley-actions spaced">
        <Link to="/cuenta/ingresar">Ingresar</Link>
        <Link to="/cuenta/crear">Crear mi cuenta</Link>
        <Link to="/cuenta/recuperar">Recuperar contraseña</Link>
      </div>
    </section>
  );
}
export function AccountPrivacy() {
  return (
    <section className="panel account-panel">
      <h1>Tu cuenta y tus datos</h1>
      <p>
        TP PLAY es un proyecto educativo del docente Marcelo Barría Arismendi.
        Para acompañarte solicitamos nombre, correo, ciudad y establecimiento.
        No pedimos RUT, domicilio ni fecha de nacimiento.
      </p>
      <p>
        El servicio de cuentas utiliza Supabase Auth para verificar tu correo y
        recuperar el acceso. Las contraseñas no se muestran al docente ni se
        incluyen en exportaciones.
      </p>
      <p>
        Guardamos respuestas, intentos, apoyos, justificaciones y versiones del
        contenido para que puedas continuar tu aventura. Los docentes asignados
        a tus cursos y administradores autorizados pueden revisar estas
        evidencias; tú puedes consultar tu avance y las evaluaciones publicadas.
        No hay rankings públicos.
      </p>
      <p>
        El navegador conserva la sesión de acceso. Cierra sesión al terminar en
        un equipo compartido. El avance de Valle del Coihue se guarda en el
        servidor; las otras misiones de demostración conservan su almacenamiento
        local.
      </p>
      <p>
        Antes de habilitar cuentas de menores, el establecimiento y el
        responsable deben acordar información a las familias, autorización
        cuando corresponda, plazo de conservación y procedimiento de
        eliminación. Consulta a tu docente sobre los acuerdos de tu
        establecimiento. Si el servicio de cuentas aún no está conectado, el
        registro permanece deshabilitado.
      </p>
      <p>
        Para consultar, corregir o solicitar la eliminación de datos:{" "}
        <a href="mailto:marcelo.barriaar@gmail.com">
          marcelo.barriaar@gmail.com
        </a>
        . No escribas datos sensibles de otras personas en las actividades.
      </p>
      <Link className="button secondary" to="/aventura">
        Volver al acceso
      </Link>
    </section>
  );
}
export function MyAccount() {
  const { profile, loading, error, refresh } = useAccount();
  const [data, setData] = useState<{
    courses: { course_id: string; courses: { id: string; name: string } }[];
    feedback: Evaluation[];
    requests: { id: string; name: string; status: string }[];
  }>({ courses: [], feedback: [], requests: [] });
  const [registry, setRegistry] = useState<Registry>({
    cities: [],
    schools: [],
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [city, setCity] = useState(profile?.city_id || "");
  const [school, setSchool] = useState(profile?.school_id || "");
  const load = () =>
    learningApi<typeof data>("me")
      .then(setData)
      .catch((e) => setMessage(e.message));
  useEffect(() => {
    if (profile) {
      void load();
      void learningApi<Registry>("registry")
        .then(setRegistry)
        .catch((e) => setMessage(e.message));
      setCity(profile.city_id || "");
      setSchool(profile.school_id || "");
    }
  }, [profile?.id]);
  if (loading) return <p role="status">Comprobando acceso…</p>;
  if (!profile)
    return error ? (
      <section className="panel">
        <p role="alert">{error}</p>
        <button
          className="button"
          onClick={() => void authClient?.auth.signOut()}
        >
          Cerrar sesión
        </button>
      </section>
    ) : (
      <AdventureEntry />
    );
  const submit = async (e: FormEvent<HTMLFormElement>, action: string) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const body =
        action === "profile"
          ? { name: form.get("name"), city_id: city, school_id: school || null }
          : action === "join"
            ? { code: form.get("code") }
            : { name: form.get("schoolName"), city_id: city };
      await learningApi(action, body);
      setMessage("Cambio guardado.");
      await refresh();
      await load();
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <section className="panel">
        <p className="eyebrow">MI CUENTA</p>
        <h1>Hola, {profile.name}</h1>
        <div className="valley-actions">
          {profile.role === "student" ? (
            <Link className="button" to="/juegos/mision-tributos">
              Continuar mi aventura
            </Link>
          ) : (
            <Link className="button" to="/acompanamiento">
              Abrir panel docente
            </Link>
          )}
          {profile.role === "admin" && (
            <Link className="button secondary" to="/administracion-cuentas">
              Gestionar cuentas
            </Link>
          )}
          <button
            className="button secondary"
            onClick={() =>
              void authClient?.auth.signOut().then(() => refresh())
            }
          >
            Cerrar sesión
          </button>
        </div>
      </section>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <div className="two-column spaced">
        <section className="panel">
          <h2>Mis datos</h2>
          <form
            className="account-form"
            onSubmit={(e) => void submit(e, "profile")}
          >
            <label className="field">
              Nombre
              <input
                name="name"
                defaultValue={profile.name}
                minLength={2}
                maxLength={120}
                required
              />
            </label>
            <label className="field">
              Ciudad
              <select
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setSchool("");
                }}
                required
              >
                {registry.cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Establecimiento
              <select
                value={school}
                onChange={(e) => setSchool(e.target.value)}
              >
                <option value="">Pendiente de incorporación</option>
                {registry.schools
                  .filter((s) => s.city_id === city)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </label>
            <button className="button secondary" disabled={busy}>
              Guardar datos
            </button>
          </form>
          {data.requests.map((r) => (
            <p className="notice" key={r.id}>
              Establecimiento solicitado: {r.name}. Pendiente de revisión.
            </p>
          ))}
          {!profile.school_id &&
            profile.role === "student" &&
            !data.requests.length && (
              <form
                className="account-form spaced"
                onSubmit={(e) => void submit(e, "schoolRequest")}
              >
                <label className="field">
                  Solicitar establecimiento en{" "}
                  {registry.cities.find((c) => c.id === city)?.name}
                  <input
                    name="schoolName"
                    minLength={2}
                    maxLength={160}
                    required
                  />
                </label>
                <button className="button secondary" disabled={busy}>
                  Enviar solicitud
                </button>
              </form>
            )}
        </section>
        <section className="panel">
          <h2>Mis cursos</h2>
          {data.courses.map((c) => (
            <p key={c.course_id}>{c.courses.name}</p>
          ))}
          {profile.role === "student" && (
            <form
              className="account-form"
              onSubmit={(e) => void submit(e, "join")}
            >
              <label className="field">
                Código entregado por tu docente
                <input name="code" autoComplete="off" maxLength={64} required />
              </label>
              <button className="button" disabled={busy}>
                Unirme al curso
              </button>
            </form>
          )}
          <p className="muted">
            Un código incorpora al curso y no concede permisos docentes.
          </p>
        </section>
      </div>
      <section className="panel spaced">
        <h2>Retroalimentación publicada</h2>
        {!data.feedback.length && <p>Aún no tienes evaluaciones publicadas.</p>}
        {data.feedback.map((e) => (
          <article className="spaced" key={e.id}>
            <h3>Misión tributos · rúbrica {e.rubric.version}</h3>
            {e.rubric.criteria.map((c) => (
              <p key={c.id}>
                <strong>
                  {c.title}:{" "}
                  {e.ratings[c.id]
                    ? levelNames[e.ratings[c.id]! - 1]
                    : "Sin evidencia suficiente"}
                </strong>
                <br />
                {e.comments[c.id]}
              </p>
            ))}
            <p>{e.overall}</p>
          </article>
        ))}
      </section>
    </>
  );
}

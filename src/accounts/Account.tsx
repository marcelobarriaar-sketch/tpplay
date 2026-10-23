import { AcademicFields } from './AcademicSetup';
import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { authClient, learningApi, rememberSession } from "./client";
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
  const { pathname } = useLocation();
  const mode =
    pathname.endsWith("/crear") || pathname === "/registro"
      ? "create"
      : pathname.includes("recuperar")
        ? "recover"
        : "login";
  const { session, profile, recovery, refresh } = useAccount();
  const [registrationRole,setRegistrationRole]=useState("student"),[academicData,setAcademicData]=useState<unknown>();
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  if (!authClient) return <AccountUnavailable />;
  if (profile && mode !== "recover")
    return (
      <Navigate
        to={
          profile.role === "student"
            ? "/alumno"
            : profile.role === "teacher"
              ? "/docente"
              : profile.role === "institution_admin"
                ? "/institucion"
                : "/admin"
        }
        replace
      />
    );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    const f = new FormData(e.currentTarget),
      email = String(f.get("email") || "").trim(),
      password = String(f.get("password") || "");
    try {
      if (mode === "create") {
        if (password !== f.get("confirmation"))
          throw Error("Las contraseñas deben coincidir.");
        const initial_role = String(f.get("role"));
        if (
          !["student", "teacher"].includes(initial_role) ||
          f.get("terms") !== "on"
        )
          throw Error(
            "Selecciona tu perfil y acepta los términos y privacidad.",
          );
        const r = await authClient!.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/cuenta",
            data: {
              first_name: String(f.get("first_name")),
              last_name: String(f.get("last_name")),
              initial_role,
              terms_version: "2026-10",
              academic_setup: academicData,
            },
          },
        });
        if (r.error)
          throw Error(
            r.error.code === "user_already_exists"
              ? "Ya existe una cuenta asociada a este correo."
              : "No pudimos crear la cuenta. Revisa los datos o intenta ingresar si ya estás registrado.",
          );
        if (r.data.user?.identities?.length === 0)
          setNotice(
            "Si ya tienes una cuenta, ingresa o recupera tu contraseña. Si es un registro nuevo, revisa tu correo para verificarlo.",
          );
        else
          setNotice(
            "Cuenta creada. Revisa tu correo y abre el enlace de verificación antes de ingresar.",
          );
      } else if (mode === "recover" && session && recovery) {
        if (password !== f.get("confirmation"))
          throw Error("Las contraseñas deben coincidir.");
        const r = await authClient!.auth.updateUser({ password });
        if (r.error)
          throw Error(
            "No pudimos cambiar la contraseña. Solicita un enlace nuevo.",
          );
        await authClient!.auth.signOut();
        setNotice(
          "Contraseña actualizada. Ya puedes ingresar con tu nueva contraseña.",
        );
      } else if (mode === "recover") {
        const r = await authClient!.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/cuenta/recuperar",
        });
        if (r.error)
          throw Error(
            "No pudimos solicitar el correo. Espera unos minutos y vuelve a intentar.",
          );
        setNotice(
          "Si el correo corresponde a una cuenta, recibirás un enlace seguro. Revisa también spam.",
        );
      } else {
        rememberSession(f.get("remember") === "on");
        const r = await authClient!.auth.signInWithPassword({
          email,
          password,
        });
        if (r.error)
          throw Error(
            "Correo o contraseña incorrectos, o correo pendiente de verificación.",
          );
        await refresh();
      }
    } catch (e) {
      setError((e as Error).message || "No pudimos conectar. Reintenta.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel account-panel identity-access">
      <p className="eyebrow">VALLE DEL COIHUE · TU AVENTURA CONTINÚA</p>
      <h1>
        {mode === "create"
          ? "Crea tu cuenta TP PLAY"
          : mode === "recover"
            ? session && recovery
              ? "Elige tu nueva contraseña"
              : "Recupera tu acceso"
            : "¡Qué bueno verte de nuevo!"}
      </h1>
      <p>Tu recorrido te acompaña desde cualquier dispositivo.</p>
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      <form className="account-form" onSubmit={submit}>
        {mode === "create" && (
          <>
            <label className="field">
              Nombre
              <input
                name="first_name"
                autoComplete="given-name"
                minLength={2}
                maxLength={60}
                required
              />
            </label>
            <label className="field">
              Apellido
              <input
                name="last_name"
                autoComplete="family-name"
                minLength={2}
                maxLength={60}
                required
              />
            </label>
            <label className="field">
              Quiero ingresar como
              <select name="role" required value={registrationRole} onChange={e=>setRegistrationRole(e.target.value)}>
                <option value="student">Estudiante</option>
                <option value="teacher">Docente</option>
              </select>
            </label>
            <AcademicFields role={registrationRole} onChange={setAcademicData}/>
          </>
        )}
        {!(mode === "recover" && session && recovery) && (
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
        {(mode !== "recover" || (session && recovery)) && (
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
            {mode !== "login" && (
              <small>
                Al menos 12 caracteres. Puedes pegar desde tu gestor de
                contraseñas.
              </small>
            )}
          </label>
        )}
        {(mode === "create" || (mode === "recover" && session && recovery)) && (
          <label className="field">
            Confirmar contraseña
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
            <input name="terms" type="checkbox" required />
            Acepto los <Link to="/condiciones">términos</Link> y el{" "}
            <Link to="/cuenta/privacidad">aviso de privacidad</Link>.
          </label>
        )}
        {mode === "login" && (
          <label className="toggle">
            <input type="checkbox" name="remember" defaultChecked />
            Mantener mi sesión en este dispositivo
          </label>
        )}
        {mode === "login" && (
          <p className="muted small">
            La sesión se mantiene al actualizar. En equipos compartidos,
            recuerda cerrar sesión.
          </p>
        )}
        <button className="button" disabled={busy}>
          {busy
            ? "Procesando…"
            : mode === "create"
              ? "Crear cuenta"
              : mode === "recover"
                ? session && recovery
                  ? "Guardar nueva contraseña"
                  : "Enviarme enlace seguro"
                : "Ingresar a mi aventura"}
        </button>
      </form>
      <div className="valley-actions">
        <Link to="/cuenta/ingresar">Ingresar</Link>
        <Link to="/cuenta/crear">Crear cuenta</Link>
        <Link to="/cuenta/recuperar">Olvidé mi contraseña</Link>
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
        El ranking está reservado a estudiantes con sesión y muestra alias, sin nombres ni correos. Los Coihues son la moneda de Villa del Coihue y se acumulan mientras avanzas en las misiones.
      </p>
      <p>
        El navegador conserva la sesión de acceso. Cierra sesión al terminar en
        un equipo compartido. El progreso asociado a tu cuenta se guarda en el
        servidor. Los recorridos de invitado se conservan en el navegador y
        puedes importarlos a tu cuenta.
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
          {(profile.role === "teacher" || profile.role === "admin") && <Link className="button" to={profile.role === "teacher" ? "/docente#carga-alumnos" : "/admin/cursos#carga-alumnos"}>Cargar alumnos desde Excel</Link>}
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
              >
                <option value="">No indicada (opcional)</option>
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
          {((!profile.school_id && profile.role === "student") || profile.role === "teacher") &&
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

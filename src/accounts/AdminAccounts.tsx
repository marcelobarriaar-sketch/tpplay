import { useEffect, useState, useRef, type FormEvent } from "react";
import { useAccount } from "./Session";
import { learningApi } from "./client";
import { AdventureEntry } from "./Account";
import { Link } from "react-router-dom";
import type { Profile, Registry } from "./model";
type Course = {
  id: string;
  name: string;
  teacher_id: string;
  school_id: string;
  active: boolean;
};
type Request = {
  id: string;
  student_id: string;
  city_id: string;
  name: string;
};
type Audit = {
  id: string;
  actor_id: string;
  action: string;
  target_id: string;
  created_at: string;
};
export default function AdminAccounts() {
  const { profile, loading } = useAccount();
  const [users, setUsers] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [registry, setRegistry] = useState<Registry>({
    cities: [],
    schools: [],
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseEditor, setCourseEditor] = useState<Course | null>(null);
  const selectedUser = useRef<string | null>(null);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [status, setStatus] = useState<{
    email: string;
    email_verified: boolean;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const [data, reg, c] = await Promise.all([
      learningApi<{ users: Profile[]; requests: Request[]; audits: Audit[] }>(
        "admin",
      ),
      learningApi<Registry>("registry"),
      learningApi<{ courses: typeof courses }>("courses"),
    ]);
    setUsers(data.users);
    setRequests(data.requests);
    setAudits(data.audits);
    setRegistry(reg);
    setCourses(c.courses);
  };
  useEffect(() => {
    if (profile?.role === "admin")
      void load().catch((e) => setMessage(e.message));
  }, [profile?.id]);
  if (loading) return <p role="status">Comprobando acceso…</p>;
  if (!profile) return <AdventureEntry />;
  if (profile.role !== "admin")
    return (
      <section className="panel">
        <h1>Administración de cuentas</h1>
        <p>Este espacio requiere una cuenta administradora autorizada.</p>
        <Link to="/cuenta">Mi cuenta</Link>
      </section>
    );
  const run = async (action: string, body: unknown) => {
    setBusy(true);
    try {
      await learningApi(action, body);
      await load();
      setMessage("Cambio guardado y registrado.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const edit = async (user: Profile) => {
    selectedUser.current = user.id;
    setSelected({ ...user });
    setStatus(null);
    try {
      const response = await learningApi<{
        email: string;
        email_verified: boolean;
      }>("userStatus&user=" + user.id);
      if (selectedUser.current === user.id) setStatus(response);
    } catch (e) {
      setMessage((e as Error).message);
    }
  };
  return (
    <>
      <section className="panel">
        <p className="eyebrow">ADMINISTRACIÓN AUTORIZADA</p>
        <h1>Cuentas, establecimientos y permisos</h1>
        <Link to="/acompanamiento">Cursos y panel docente</Link>
        <p>
          Las contraseñas no se muestran. La recuperación envía un enlace al
          correo registrado.
        </p>
      </section>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      <section className="panel spaced">
        <h2>Cursos y docentes asignados</h2>
        <div className="account-roster">
          {courses.map((c) => (
            <button
              className="panel"
              key={c.id}
              onClick={() => setCourseEditor({ ...c })}
            >
              <strong>{c.name}</strong>
              <span>
                {users.find((u) => u.id === c.teacher_id)?.name} ·{" "}
                {c.active ? "Activo" : "Cerrado a nuevas incorporaciones"}
              </span>
            </button>
          ))}
        </div>
        {courseEditor && (
          <form
            className="account-form spaced"
            onSubmit={(e) => {
              e.preventDefault();
              void run("adminCourse", courseEditor);
            }}
          >
            <label className="field">
              Nombre del curso
              <input
                required
                minLength={2}
                maxLength={120}
                value={courseEditor.name}
                onChange={(e) =>
                  setCourseEditor({ ...courseEditor, name: e.target.value })
                }
              />
            </label>
            <label className="field">
              Docente asignado
              <select
                required
                value={courseEditor.teacher_id}
                onChange={(e) =>
                  setCourseEditor({
                    ...courseEditor,
                    teacher_id: e.target.value,
                  })
                }
              >
                {users
                  .filter((u) => u.active && u.role !== "student")
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field">
              Establecimiento
              <select
                required
                value={courseEditor.school_id}
                onChange={(e) =>
                  setCourseEditor({
                    ...courseEditor,
                    school_id: e.target.value,
                  })
                }
              >
                {registry.schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={courseEditor.active}
                onChange={(e) =>
                  setCourseEditor({ ...courseEditor, active: e.target.checked })
                }
              />
              Permitir nuevas incorporaciones
            </label>
            <button className="button" disabled={busy}>
              Guardar curso y docente
            </button>
          </form>
        )}
        <h2 className="spaced">Usuarios</h2>
        <div className="account-roster">
          {users.map((u) => (
            <button className="panel" key={u.id} onClick={() => void edit(u)}>
              <strong>{u.name}</strong>
              <span>
                {u.role} · {u.active ? "Activa" : "Desactivada"}
              </span>
            </button>
          ))}
        </div>
      </section>
      {selected && (
        <section className="panel spaced">
          <h2>Gestionar {selected.name}</h2>
          {status && (
            <p>
              {status.email} · correo{" "}
              {status.email_verified
                ? "verificado"
                : "pendiente de verificación"}
            </p>
          )}
          <form
            className="account-form"
            onSubmit={(e) => {
              e.preventDefault();
              void run("adminUser", {
                id: selected.id,
                name: selected.name,
                role: selected.role,
                active: selected.active,
                city_id: selected.city_id,
                school_id: selected.school_id,
              });
            }}
          >
            <label className="field">
              Nombre
              <input
                required
                minLength={2}
                maxLength={120}
                value={selected.name}
                onChange={(e) =>
                  setSelected({ ...selected, name: e.target.value })
                }
              />
            </label>
            <label className="field">
              Ciudad
              <select
                required
                value={selected.city_id || ""}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    city_id: e.target.value,
                    school_id: null,
                  })
                }
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
                value={selected.school_id || ""}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    school_id: e.target.value || null,
                  })
                }
              >
                <option value="">Pendiente</option>
                {registry.schools
                  .filter((s) => s.city_id === selected.city_id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field">
              Permiso
              <select
                value={selected.role}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    role: e.target.value as Profile["role"],
                  })
                }
              >
                <option value="student">Estudiante</option>
                <option value="teacher">Docente</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={selected.active}
                onChange={(e) =>
                  setSelected({ ...selected, active: e.target.checked })
                }
              />
              Cuenta activa
            </label>
            <button
              className="button"
              disabled={busy || selected.id === profile.id}
            >
              Guardar correcciones y permisos
            </button>
          </form>
          <button
            className="button secondary spaced"
            disabled={busy}
            onClick={() => void run("recovery", { id: selected.id })}
          >
            Enviar enlace de recuperación
          </button>
          {selected.role === "student" && (
            <form
              className="account-form spaced"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void run("adminMembership", {
                  student_id: selected.id,
                  course_id: f.get("course"),
                  remove: f.get("remove") === "on",
                });
              }}
            >
              <label className="field">
                Asignar o retirar curso
                <select name="course" required>
                  <option value="">Selecciona</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="toggle">
                <input name="remove" type="checkbox" />
                Retirar de este curso
              </label>
              <button className="button secondary" disabled={busy}>
                Actualizar asignación
              </button>
            </form>
          )}
        </section>
      )}
      <section className="panel spaced">
        <h2>Solicitudes de establecimientos</h2>
        {!requests.length && <p>No hay solicitudes pendientes.</p>}
        {requests.map((r) => (
          <article key={r.id} className="spaced">
            <p>
              <strong>{r.name}</strong> ·{" "}
              {registry.cities.find((c) => c.id === r.city_id)?.name}
            </p>
            <p className="muted">
              Comprueba el nombre oficial y si ya existe antes de incorporarlo.
            </p>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() =>
                void run("approveSchool", {
                  request_id: r.id,
                  name: r.name,
                  city_id: r.city_id,
                })
              }
            >
              Incorporar establecimiento
            </button>
          </article>
        ))}
      </section>
      <section className="panel spaced">
        <h2>Registro de ciudades y establecimientos</h2>
        <form
          className="account-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void run("adminCity", { name: f.get("name") });
          }}
        >
          <label className="field">
            Nueva ciudad
            <input name="name" minLength={2} maxLength={120} required />
          </label>
          <button className="button secondary" disabled={busy}>
            Agregar ciudad
          </button>
        </form>
        <form
          className="account-form spaced"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void run("adminSchool", {
              name: f.get("name"),
              city_id: f.get("city"),
            });
          }}
        >
          <label className="field">
            Ciudad
            <select name="city" required>
              {registry.cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Nombre oficial del establecimiento
            <input name="name" minLength={2} maxLength={160} required />
          </label>
          <button className="button secondary" disabled={busy}>
            Agregar establecimiento
          </button>
        </form>
      </section>
      <section className="panel spaced">
        <h2>Registro de cambios administrativos</h2>
        <div className="evidence-scroll">
          {audits.map((a) => (
            <p key={a.id}>
              {new Date(a.created_at).toLocaleString("es-CL")} ·{" "}
              {users.find((u) => u.id === a.actor_id)?.name ||
                "Cuenta eliminada"}{" "}
              · {a.action} ·{" "}
              {users.find((u) => u.id === a.target_id)?.name || a.target_id}
            </p>
          ))}
        </div>
      </section>
    </>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Guard, roleNames } from "./Identity";
import { learningApi } from "./client";
import { useAccount } from "./Session";
import type { Profile, Role } from "./model";
export default function UserAdmin() {
  return (
    <Guard roles={["admin"]}>
      <AdminContent />
    </Guard>
  );
}
function AdminContent() {
  const { profile } = useAccount();
  const [users, setUsers] = useState<Profile[]>([]),
    [stats, setStats] = useState<Record<string, number>>({}),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(0),
    [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [role, setRole] = useState(""),
    [status, setStatus] = useState(""),
    [selected, setSelected] = useState<Profile | null>(null),
    [password, setPassword] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const load = async () => {
    setBusy(true);
    try {
      const r = await learningApi<{
        users: Profile[];
        total: number;
        stats: Record<string, number>;
      }>(
        `adminUsers&page=${page}&search=${encodeURIComponent(query)}&role=${role}&status=${status}`,
      );
      setUsers(r.users);
      setTotal(r.total);
      setStats(r.stats);
      setMessage("");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void load();
  }, [page, query, role, status]);
  async function save() {
    if (!selected || busy) return;
    setBusy(true);
    setMessage("");
    try {
      await learningApi("adminIdentity", {
        id: selected.id,
        status: selected.status,
        role: selected.role,
        ...(password ? { password } : {}),
      });
      setPassword("");
      setSelected(null);
      await load();
      setMessage("Cambio guardado y registrado en auditoría.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
      setPassword("");
    }
  }
  return (
    <>
      <section className="panel">
        <p className="eyebrow">ADMINISTRACIÓN TP PLAY</p>
        <h1>Personas que construyen su futuro</h1>
        <p>Gestión protegida de cuentas y permisos.</p>
        <div className="valley-actions">
          <Link to="/admin/contenidos" className="button secondary">
            Administración de contenidos
          </Link>
          <Link to="/administracion-cuentas">Cursos y establecimientos</Link>
        </div>
        <div className="stats-grid">
          {Object.entries({
            total: "Total usuarios",
            student: "Estudiantes",
            teacher: "Docentes",
            institution_admin: "Administradores institucionales",
            active: "Activos",
            suspended: "Suspendidos",
          }).map(([k, label]) => (
            <div className="stat" key={k}>
              <strong>{stats[k] ?? 0}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <section className="panel spaced">
        <h2>Usuarios registrados</h2>
        <form
          className="account-form"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
            setPage(0);
          }}
        >
          <label className="field">
            Buscar por nombre o correo
            <input
              type="search"
              value={search}
              maxLength={100}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button className="button" disabled={busy}>
            Buscar
          </button>
        </form>
        <div className="valley-actions">
          <label className="field">
            Rol
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Todos</option>
              {Object.entries(roleNames).map(([v, label]) => (
                <option value={v} key={v}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Estado
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
            >
              <option value="">Todos</option>
              <option value="active">Activo</option>
              <option value="pending">Pendiente</option>
              <option value="suspended">Suspendido</option>
            </select>
          </label>
        </div>
        {busy && <p role="status">Consultando cuentas…</p>}
        <div className="identity-table-wrap">
          <table className="identity-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creación</th>
                <th>Último acceso</th>
                <th>Ficha</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.name}
                    <br />
                    <small>{u.email}</small>
                  </td>
                  <td>{roleNames[u.role]}</td>
                  <td>{u.status}</td>
                  <td>
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString("es-CL")
                      : "—"}
                  </td>
                  <td>
                    {u.last_login_at
                      ? new Date(u.last_login_at).toLocaleString("es-CL")
                      : "Sin acceso registrado"}
                  </td>
                  <td>
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => {
                        setSelected({ ...u });
                        setPassword("");
                      }}
                    >
                      Abrir ficha
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!busy && !users.length && (
          <p>No hay usuarios que coincidan con los filtros.</p>
        )}
        <div className="valley-actions">
          <button
            className="button secondary"
            disabled={busy || page === 0}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </button>
          <span>
            Página {page + 1} · {total} usuarios
          </span>
          <button
            className="button secondary"
            disabled={busy || (page + 1) * 20 >= total}
            onClick={() => setPage(page + 1)}
          >
            Siguiente
          </button>
        </div>
      </section>
      {selected && (
        <section className="panel spaced">
          <h2>Ficha de {selected.name}</h2>
          <p>
            {selected.email} ·{" "}
            {selected.email_verified ? "Correo verificado" : "Correo pendiente"}
          </p>
          <form
            className="account-form"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <label className="field">
              Rol
              <select
                value={selected.role}
                disabled={selected.id === profile?.id}
                onChange={(e) =>
                  setSelected({ ...selected, role: e.target.value as Role })
                }
              >
                {Object.entries(roleNames).map(([v, label]) => (
                  <option value={v} key={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Estado
              <select
                value={selected.status}
                disabled={selected.id === profile?.id}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    status: e.target.value as Profile["status"],
                  })
                }
              >
                <option value="active">Activo / reactivar</option>
                <option value="pending">Pendiente</option>
                <option value="suspended">Suspendido</option>
              </select>
            </label>
            <label className="field">
              Confirma tu contraseña para cambiar roles o una cuenta
              administradora
              <input
                type="password"
                autoComplete="current-password"
                maxLength={256}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <p className="muted">
              Otro administrador debe modificar tu propia cuenta. Ningún rol
              institucional puede concederse administración TP PLAY.
            </p>
            <button
              className="button"
              disabled={busy || selected.id === profile?.id}
            >
              Guardar permisos y estado
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => setSelected(null)}
            >
              Cerrar ficha
            </button>
          </form>
        </section>
      )}
    </>
  );
}

import { Link } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { learningApi } from "./client";
import { useAccount } from "./Session";
export type Assignment = {
  id: string;
  teacher_id: string;
  group_id: string;
  subject_id: string;
  status: string;
  created_at?: string;
  class_groups: {
    id: string;
    name: string;
    school_id: string;
    school_year: number;
    schools: { name: string; cities?: { name: string } };
  };
  subjects: { name: string };
  profiles?: { name: string; email: string };
};
export type Enrollment = {
  id: string;
  group_id: string;
  subject_id: string;
  class_groups: Assignment["class_groups"];
  subjects: { name: string };
};
export type Catalog = {
  subjects: { id: string; name: string }[];
  groups: { id: string; name: string; school_year: number }[];
  assignments: { group_id: string; subject_id: string }[];
  links: { mission_id: string; subject_id: string }[];
  scales: import("./grading").Scale[];
  missions: { id: string; title: string }[];
};
export function AcademicFields({
  role,
  onChange,
}: {
  role: string;
  onChange?: (value: unknown) => void;
}) {
  const [schools, setSchools] = useState<
      { id: string; name: string; city_id: string }[]
    >([]),
    [cities, setCities] = useState<{ id: string; name: string }[]>([]),
    [city, setCity] = useState(""),
    [school, setSchool] = useState(""),
    [catalog, setCatalog] = useState<Catalog | null>(null),
    [year, setYear] = useState(new Date().getFullYear()),
    [rows, setRows] = useState([
      { group_name: "", subject_name: "", group_id: "", subject_id: "" },
    ]),
    [error, setError] = useState("");
  useEffect(() => {
    void learningApi<{
      schools: { id: string; name: string; city_id: string }[];
      cities: { id: string; name: string }[];
    }>("registry")
      .then((d) => {
        setSchools(d.schools);
        setCities(d.cities);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    let live = true;
    setCatalog(null);
    if (school)
      void learningApi<Catalog>("academicCatalog&school=" + school)
        .then((d) => {
          if (live) setCatalog(d);
        })
        .catch((e) => {
          if (live) setError(e.message);
        });
    return () => {
      live = false;
    };
  }, [school]);
  const payload = {
    school_id: school,
    year,
    pairs: rows.map((r) =>
      role === "student"
        ? { group_id: r.group_id, subject_id: r.subject_id }
        : { group_name: r.group_name, subject_name: r.subject_name },
    ),
  };
  useEffect(() => {
    onChange?.(payload);
  }, [school, year, JSON.stringify(rows), role]);
  function edit(index: number, key: string, value: string) {
    setRows((current) =>
      current.map((r, i) =>
        i === index
          ? {
              ...r,
              [key]: value,
              ...(key === "group_id" ? { subject_id: "" } : {}),
            }
          : r,
      ),
    );
  }
  return (
    <fieldset>
      <legend>
        {role === "student"
          ? "Tu establecimiento, curso y asignatura"
          : "Establecimiento y clases que impartes"}
      </legend>
      {error && <p role="alert">{error}</p>}
      <p className="small muted">
        Selecciona la comuna y el establecimiento. Luego indica el curso y su
        asignatura.
        {role !== "student" &&
          " Puedes registrar otro establecimiento repitiendo estos pasos."}
      </p>
      <label className="field">
        Comuna del establecimiento
        <select
          required
          name="academic_city"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setSchool("");
            setRows([
              {
                group_name: "",
                subject_name: "",
                group_id: "",
                subject_id: "",
              },
            ]);
          }}
        >
          <option value="">Selecciona una comuna</option>
          {cities
            .filter((c) => schools.some((s) => s.city_id === c.id))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </label>
      <label className="field">
        Establecimiento educacional
        <select
          required
          name="academic_school"
          disabled={!city}
          value={school}
          onChange={(e) => {
            setSchool(e.target.value);
            setRows([
              {
                group_name: "",
                subject_name: "",
                group_id: "",
                subject_id: "",
              },
            ]);
          }}
        >
          <option value="">Selecciona tu establecimiento</option>
          {schools
            .filter((s) => s.city_id === city)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>
      </label>
      {school && (
        <p className="notice">
          {schools.find((s) => s.id === school)?.name} ·{" "}
          {cities.find((c) => c.id === city)?.name}
        </p>
      )}
      <label className="field">
        Año escolar
        <input
          type="number"
          min="2020"
          max="2100"
          required
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        />
      </label>
      {rows.map((row, i) => (
        <div className="panel spaced" key={i}>
          {role === "student" ? (
            <>
              <label className="field">
                Curso
                <select
                  required
                  value={row.group_id}
                  onChange={(e) => edit(i, "group_id", e.target.value)}
                >
                  <option value="">Selecciona un curso</option>
                  {catalog?.groups
                    .filter(
                      (g) =>
                        g.school_year === year &&
                        catalog.assignments.some((a) => a.group_id === g.id),
                    )
                    .map((g) => (
                      <option value={g.id} key={g.id}>
                        {g.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className="field">
                Asignatura o módulo
                <select
                  required
                  value={row.subject_id}
                  onChange={(e) => edit(i, "subject_id", e.target.value)}
                >
                  <option value="">Selecciona una asignatura</option>
                  {catalog?.subjects
                    .filter((s) =>
                      catalog.assignments.some(
                        (a) =>
                          a.group_id === row.group_id && a.subject_id === s.id,
                      ),
                    )
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </select>
              </label>
            </>
          ) : (
            <>
              <label className="field">
                Curso
                <input
                  required
                  maxLength={120}
                  minLength={2}
                  list="academic-groups"
                  placeholder="Ej.: 3° Medio Administración"
                  value={row.group_name}
                  onChange={(e) => edit(i, "group_name", e.target.value)}
                />
              </label>
              <label className="field">
                Asignatura o módulo
                <input
                  required
                  maxLength={120}
                  minLength={2}
                  list="academic-subjects"
                  placeholder="Selecciona o escribe una asignatura"
                  value={row.subject_name}
                  onChange={(e) => edit(i, "subject_name", e.target.value)}
                />
              </label>
            </>
          )}
          {rows.length > 1 && (
            <button
              type="button"
              className="text-button"
              onClick={() => setRows(rows.filter((_, n) => n !== i))}
            >
              Quitar esta clase
            </button>
          )}
        </div>
      ))}
      <datalist id="academic-groups">
        {catalog?.groups
          .filter((g) => g.school_year === year)
          .map((g) => (
            <option key={g.id} value={g.name} />
          ))}
      </datalist>
      <datalist id="academic-subjects">
        {catalog?.subjects.map((s) => (
          <option key={s.id} value={s.name} />
        ))}
      </datalist>
      <button
        type="button"
        className="button secondary spaced"
        disabled={rows.length >= 20}
        onClick={() =>
          setRows([
            ...rows,
            { group_name: "", subject_name: "", group_id: "", subject_id: "" },
          ])
        }
      >
        {role === "student"
          ? "Agregar otra asignatura"
          : "Agregar otro curso o asignatura"}
      </button>
      {role !== "student" && (
        <p className="small muted">
          Administración validará estas asignaciones antes de habilitar el
          acceso a las nóminas.
        </p>
      )}
      {role === "student" && (
        <p className="small muted">
          Si tu curso no aparece, tu docente debe registrar sus clases y obtener
          la validación de administración.
        </p>
      )}
    </fieldset>
  );
}
export function AcademicSetup({ done }: { done?: () => void }) {
  const { profile, refresh } = useAccount();
  const [data, setData] = useState<unknown>(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <form
      className="panel spaced"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMessage("");
        try {
          await learningApi("academicSetup", data);
          await refresh();
          setMessage(
            profile?.role === "student"
              ? "Tu matrícula quedó registrada."
              : "Clases registradas. Revisa su estado de validación.",
          );
          done?.();
        } catch (err) {
          setMessage((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>
        {profile?.role === "student"
          ? "Mi matrícula"
          : "Registrar cursos y asignaturas"}
      </h2>
      <AcademicFields role={profile?.role || "student"} onChange={setData} />
      {profile?.role === "teacher" && (
        <p>
          ¿No aparece tu establecimiento?{" "}
          <Link to="/cuenta/cursos">
            Solicita incorporarlo desde tus datos de cuenta
          </Link>
          . Administración revisará su nombre y comuna.
        </p>
      )}
      <p role="status">{message}</p>
      <button className="button" disabled={busy}>
        {profile?.role === "student"
          ? "Guardar mi matrícula"
          : "Registrar cursos y asignaturas"}
      </button>
    </form>
  );
}
export function AcademicGate({
  mission,
  children,
}: {
  mission: string;
  children: ReactNode;
}) {
  const { profile, refresh } = useAccount();
  const [data, setData] = useState<{
      enrollments: Enrollment[];
      active: string | null;
    } | null>(null),
    [links, setLinks] = useState<Catalog["links"]>([]),
    [error, setError] = useState("");
  const load = () => {
    void Promise.all([
      learningApi<{ enrollments: Enrollment[]; active: string | null }>(
        "academicMe",
      ),
      learningApi<Catalog>("academicCatalog"),
    ])
      .then(([me, c]) => {
        setData(me);
        setLinks(c.links);
        setError("");
      })
      .catch((e) => setError(e.message));
  };
  useEffect(load, [profile?.id, profile?.active_enrollment_id]);
  const available =
    data?.enrollments.filter((e) =>
      links.some(
        (l) => l.mission_id === mission && l.subject_id === e.subject_id,
      ),
    ) || [];
  if (error)
    return (
      <section className="panel">
        <p role="alert">{error}</p>
        <button className="button" onClick={load}>
          Reintentar
        </button>
      </section>
    );
  if (!data) return <p role="status">Comprobando tu curso y asignatura…</p>;
  if (!available.some((e) => e.id === data.active))
    return (
      <>
        <section className="panel">
          <h2>¿En qué curso realizarás este desafío?</h2>
          <p>Tu resultado quedará asociado a este curso y asignatura.</p>
          {available.map((e) => (
            <button
              key={e.id}
              className="button spaced"
              onClick={async () => {
                try {
                  await learningApi("academicSelect", { id: e.id });
                  await refresh();
                  load();
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
            >
              {e.class_groups.schools.name} · {e.class_groups.name} ·{" "}
              {e.subjects.name}
            </button>
          ))}
          {!available.length && (
            <p>
              No tienes una matrícula vinculada a este desafío. Registra tu
              curso y asignatura a continuación.
            </p>
          )}
        </section>
        <AcademicSetup done={load} />
      </>
    );
  return (
    <>
      <p className="small muted">
        {available.find((e) => e.id === data.active)?.class_groups.name} ·{" "}
        {available.find((e) => e.id === data.active)?.subjects.name}
      </p>
      {children}
    </>
  );
}

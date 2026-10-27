import { GameHUD } from "../games/inicio/SimulationGame";
import { RosterImport } from "./RosterImport";
import { Link, useLocation } from "react-router-dom";
import { missions as challengeCatalog } from "../data";
import { allItems as townItems } from "../games/coihue/content";
import { useEffect, useState, type FormEvent } from "react";
import { useAccount } from "./Session";
import { learningApi } from "./client";
import {
  AcademicSetup,
  type Assignment,
  type Enrollment,
  type Catalog,
} from "./AcademicSetup";
import { gradeLabel, type Scale } from "./grading";
import { EvaluationCard } from "../games/inicio/EvaluationCard";
import type { Attempt } from "../progress";
type Row = {
  id: string;
  student_id: string;
  enrollment_id: string;
  mission_id: string;
  status: string;
  score: number | null;
  maximum: number;
  achievement: number | null;
  money_gained: number | null;
  money_lost: number | null;
  grade: number | null;
  recorded_at: string;
  scale: Scale;
};
type Pupil = Enrollment & {
  student_id: string;
  profiles: { id: string; name: string };
};
type Rows = {
  assignment: Assignment;
  enrollments: Pupil[];
  results: Row[];
  book: Row[];
  next: number | null;
};
const money = (n: number | null) =>
  n === null
    ? "—"
    : `${n < 0 ? "−" : ""}$${Math.abs(n).toLocaleString("es-CL")} Coihues`;
export function AcademicDashboard() {
  const { profile } = useAccount();
  const location = useLocation();
  const [assignments, setAssignments] = useState<Assignment[]>([]),
    [catalog, setCatalog] = useState<Catalog | null>(null),
    [selected, setSelected] = useState(""),
    [mission, setMission] = useState(""),
    [status, setStatus] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [data, setData] = useState<Rows | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [detail, setDetail] = useState<{
      record: Row;
      detail: { state: Attempt; completed_at?: string };
    } | null>(null),
    [refresh, setRefresh] = useState(0);
  const reload = () => setRefresh((n) => n + 1);
  useEffect(() => { if(location.hash === "#carga-alumnos") document.getElementById("carga-alumnos")?.scrollIntoView({block:"start"}); }, [location.hash, selected]);
  useEffect(() => {
    let live = true;
    void Promise.all([
      learningApi<{ assignments: Assignment[] }>(
        profile?.role === "admin" ? "academicAssignments" : "academicMe",
      ),
      learningApi<Catalog>("academicCatalog"),
    ])
      .then(([a, c]) => {
        if (!live) return;
        setAssignments(a.assignments);
        setCatalog(c);
        setSelected((current) =>
          a.assignments.some((x) => x.id === current && x.status === "approved")
            ? current
            : a.assignments.find((x) => x.status === "approved")?.id || "",
        );
        setError("");
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [profile?.id, refresh]);
  const params = new URLSearchParams({
    assignment: selected,
    mission,
    status,
    from,
    to,
  });
  useEffect(() => {
    let live = true;
    setDetail(null);
    setData(null);
    if (!selected) return;
    setBusy(true);
    void learningApi<Rows>("academicRows&" + params)
      .then((d) => {
        if (live) {
          setData(d);
          setError("");
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setBusy(false);
      });
    return () => {
      live = false;
    };
  }, [selected, mission, status, from, to, refresh]);
  const best = new Map<string, Row>();
  for (const row of data?.book || []) {
    const key = row.student_id + ":" + row.mission_id,
      old = best.get(key);
    if (
      !old ||
      (row.status === "completed" && old.status !== "completed") ||
      (row.status === old.status && (row.grade ?? -1) > (old.grade ?? -1))
    )
      best.set(key, row);
  }
  const book = [...best.values()],
    graded = book.filter((r) => r.status === "completed" && r.grade !== null),
    grades = graded.map((r) => Number(r.grade)),
    average = grades.length
      ? grades.reduce((a, b) => a + b, 0) / grades.length
      : null;
  const assignment = assignments.find((a) => a.id === selected),
    groups = [
      ...new Map(
        assignments
          .filter((a) => a.status === "approved")
          .map((a) => [a.group_id, a]),
      ).values(),
    ];
  async function run(work: () => Promise<unknown>, refreshAfter = false) {
    setBusy(true);
    setError("");
    try {
      await work();
      if (refreshAfter) reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveScale(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const b = Object.fromEntries(f);
    await run(
      () =>
        learningApi("academicScale", {
          ...b,
          requirement: Number(b.requirement) / 100,
        }),
      true,
    );
  }
  return (
    <section className="section" aria-label="Administrador de cursos">
      <h1>Administrador de cursos</h1>
      <p><a href="#carga-alumnos" className="button">Cargar alumnos desde Excel</a></p>
      {profile?.role === "admin" && (
        <p>
          Valida las asignaciones de docentes por establecimiento, curso y
          asignatura para habilitar el acceso a sus estudiantes y resultados.
        </p>
      )}
      <p>
        Un desafío, una nota. Se usa el mejor resultado completado de cada
        estudiante; los intentos se conservan en el detalle.
      </p>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      <details
        className="panel"
        open={profile?.role === "admin" ? true : undefined}
      >
        <summary>
          {profile?.role === "admin"
            ? "Validar cursos y asignaturas por establecimiento"
            : "Mis cursos y asignaturas · Registro académico"}
        </summary>
        {profile?.role === "admin" ? (
          <details className="spaced">
            <summary>Registrar cursos y asignaturas</summary>
            <AcademicSetup done={reload} />
          </details>
        ) : (
          <AcademicSetup done={reload} />
        )}
        <h2>
          {profile?.role === "admin"
            ? "Registro de cursos y asignaturas"
            : "Mis cursos registrados"}
        </h2>
        {profile?.role === "admin" && (
          <p>
            <Link to="/administracion-cuentas">
              Agregar un establecimiento o comuna al registro
            </Link>
          </p>
        )}
        <ul>
          {assignments.map((a) => (
            <li key={a.id}>
              {a.profiles?.name && `${a.profiles.name} · `}
              {a.class_groups.schools.name} ·{" "}
              {a.class_groups.schools.cities?.name || "Comuna sin registrar"} ·{" "}
              {a.class_groups.name} · {a.subjects.name} · Año{" "}
              {a.class_groups.school_year} ·{" "}
              {a.status === "approved"
                ? "Validado"
                : a.status === "pending"
                  ? "Pendiente de validación"
                  : "Rechazado"}
              {a.created_at && (
                <p className="small muted">
                  Registrado el{" "}
                  {new Date(a.created_at).toLocaleString("es-CL", {
                    timeZone: "America/Santiago",
                  })}
                </p>
              )}
              {profile?.role === "admin" && a.status !== "approved" && (
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() =>
                    void run(
                      () =>
                        learningApi("academicApprove", {
                          id: a.id,
                          status: "approved",
                        }),
                      true,
                    )
                  }
                >
                  Validar asignación de {a.profiles?.name || "docente"}
                </button>
              )}
              {profile?.role === "admin" && a.status === "approved" && (
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() =>
                    void run(
                      () =>
                        learningApi("academicApprove", {
                          id: a.id,
                          status: "rejected",
                        }),
                      true,
                    )
                  }
                >
                  Revocar acceso
                </button>
              )}
            </li>
          ))}
        </ul>
      </details>
      <div className="filter-panel spaced" id="seleccionar-curso-excel">
        <label className="field">
          Establecimiento y curso
          <select
            value={assignment?.group_id || ""}
            onChange={(e) =>
              setSelected(
                assignments.find(
                  (a) =>
                    a.group_id === e.target.value && a.status === "approved",
                )?.id || "",
              )
            }
          >
            <option value="">Selecciona un curso validado</option>
            {groups.map((a) => (
              <option key={a.group_id} value={a.group_id}>
                {a.class_groups.schools.name} ·{" "}
                {a.class_groups.schools.cities?.name} · {a.class_groups.name} ·{" "}
                {a.class_groups.school_year}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Asignatura
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Selecciona una asignatura</option>
            {assignments
              .filter(
                (a) =>
                  a.group_id === assignment?.group_id &&
                  a.status === "approved",
              )
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.subjects.name}
                  {profile?.role === "admin"
                    ? ` · ${a.profiles?.name || "Docente"}`
                    : ""}
                </option>
              ))}
          </select>
        </label>
      </div>
      <div id="carga-alumnos" style={{scrollMarginTop:"20px"}}>
        <RosterImport key={assignment?.id || "none"} assignment={assignment?.status === "approved" ? assignment : undefined} done={reload} />
      </div>
      <div className="filter-panel spaced">
        <label className="field">
          Desafío
          <select value={mission} onChange={(e) => setMission(e.target.value)}>
            <option value="">Todos los desafíos</option>
            {catalog?.missions
              .filter((m) =>
                catalog.links.some(
                  (l) =>
                    l.subject_id === assignment?.subject_id &&
                    l.mission_id === m.id,
                ),
              )
              .map((m) => (
                <option value={m.id} key={m.id}>
                  {m.title}
                </option>
              ))}
          </select>
        </label>
        <label className="field">
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="completed">Completado</option>
            <option value="in_progress">En curso</option>
          </select>
        </label>
        <label className="field">
          Desde
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="field">
          Hasta
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>
      {busy && <p role="status">Cargando información académica…</p>}

      <h2>Mis estudiantes</h2>
      {!selected && (
        <p>
          Registra tus clases y espera su validación para consultar las nóminas.
        </p>
      )}
      {!data && (
        <>
          <h2>Libro de notas</h2>
          <p>
            Selecciona un curso y asignatura validados para consultar las notas.
          </p>
        </>
      )}
      {data && (
        <>
          <div className="ranking-table">
            <table>
              <caption>
                Nómina de {data.assignment.class_groups.name} ·{" "}
                {data.assignment.subjects.name}
              </caption>
              <thead>
                <tr>
                  {[
                    "Estudiante",
                    "Establecimiento",
                    "Curso",
                    "Asignatura",
                    "Desafío",
                    "Fecha",
                    "Puntaje",
                    "Dinero ganado / perdido",
                    "Nota",
                    "Estado",
                  ].map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.enrollments.flatMap((p) => {
                  const records = book.filter(
                    (r) => r.student_id === p.student_id,
                  );
                  return (records.length ? records : [null]).map((r) => (
                    <tr key={p.id + (r?.mission_id || "none")}>
                      <th scope="row">{p.profiles.name}</th>
                      <td>{data.assignment.class_groups.schools.name}</td>
                      <td>{data.assignment.class_groups.name}</td>
                      <td>{data.assignment.subjects.name}</td>
                      <td>
                        {r
                          ? catalog?.missions.find((m) => m.id === r.mission_id)
                              ?.title || r.mission_id
                          : "Sin actividad"}
                      </td>
                      <td>
                        {r
                          ? new Date(r.recorded_at).toLocaleString("es-CL", {
                              timeZone: "America/Santiago",
                            })
                          : "—"}
                      </td>
                      <td>
                        {r
                          ? r.scale.evidence_weight ? `${Number(r.achievement).toFixed(1)}% ponderado` : r.scale.metric === "money"
                            ? money(r.score)
                            : `${r.score} puntos`
                          : "—"}
                      </td>
                      <td>
                        {r?.scale.metric === "money"
                          ? `${money(r.money_gained)} / ${money(r.money_lost)}`
                          : "No utiliza dinero"}
                      </td>
                      <td>{r ? gradeLabel(r.grade) : "—"}</td>
                      <td>
                        {r?.status === "completed"
                          ? "Completado"
                          : r
                            ? "En curso"
                            : "Sin iniciar"}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
          <h2>Libro de notas</h2>
          <div className="stats-grid">
            {[
              [
                "Estudiantes participantes",
                new Set(book.map((r) => r.student_id)).size,
              ],
              ["Promedio", gradeLabel(average)],
              [
                "Nota más alta",
                gradeLabel(grades.length ? Math.max(...grades) : null),
              ],
              [
                "Nota más baja",
                gradeLabel(grades.length ? Math.min(...grades) : null),
              ],
              [
                "Aprobación",
                grades.length
                  ? `${Math.round((graded.filter((r) => Math.round((Number(r.grade) + Number.EPSILON) * 10) / 10 >= Number(r.scale.grade_pass)).length / grades.length) * 100)}%`
                  : "—",
              ],
              [
                "Estudiantes que completaron",
                data.enrollments.length
                  ? `${Math.round((new Set(graded.map((r) => r.student_id)).size / data.enrollments.length) * 100)}%`
                  : "—",
              ],
            ].map(([label, value]) => (
              <div className="stat" key={String(label)}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <p className="small muted">
            Los indicadores respetan los filtros. Sin filtro de desafío,
            «completaron» significa al menos un desafío completado. Promedio y
            aprobación usan las notas de las filas del libro.
          </p>
          <p>
            Distribución:{" "}
            {[
              [1, 4],
              [4, 5],
              [5, 6],
              [6, 7.1],
            ]
              .map(
                ([lo, hi]) =>
                  `${lo.toFixed(1).replace(".", ",")}–${(hi > 7 ? 7 : hi - 0.1).toFixed(1).replace(".", ",")}: ${grades.filter((g) => Math.round(g * 10) / 10 >= lo && Math.round(g * 10) / 10 < hi).length}`,
              )
              .join(" · ")}
          </p>
          <div className="ranking-table">
            <table>
              <caption>Una nota por estudiante y desafío</caption>
              <thead>
                <tr>
                  {[
                    "Estudiante",
                    "Curso",
                    "Asignatura",
                    "Desafío",
                    "Puntaje",
                    "Máximo",
                    "Logro",
                    "Nota",
                    "Fecha",
                    "Detalle",
                  ].map((h) => (
                    <th scope="col" key={h}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {book.map((r) => (
                  <tr key={r.id}>
                    <th scope="row">
                      {
                        data.enrollments.find(
                          (p) => p.student_id === r.student_id,
                        )?.profiles.name
                      }
                    </th>
                    <td>{data.assignment.class_groups.name}</td>
                    <td>{data.assignment.subjects.name}</td>
                    <td>
                      {catalog?.missions.find((m) => m.id === r.mission_id)
                        ?.title || r.mission_id}
                    </td>
                    <td>
                      {r.scale.evidence_weight ? `${Number(r.score).toFixed(1)} puntos ponderados` : r.scale.metric === "money" ? money(r.score) : r.score}
                    </td>
                    <td>
                      {r.scale.metric === "money" && !r.scale.evidence_weight
                        ? money(r.maximum)
                        : r.maximum}
                    </td>
                    <td>
                      {r.achievement === null
                        ? "—"
                        : `${Number(r.achievement).toFixed(1).replace(".", ",")}%`}
                    </td>
                    <td>{gradeLabel(r.grade)}</td>
                    <td>
                      {new Date(r.recorded_at).toLocaleDateString("es-CL", {
                        timeZone: "America/Santiago",
                      })}
                    </td>
                    <td>
                      <button
                        className="button secondary"
                        onClick={() =>
                          void run(async () =>
                            setDetail(
                              await learningApi(
                                "academicDetail&assignment=" +
                                  selected +
                                  "&id=" +
                                  r.id,
                              ),
                            ),
                          )
                        }
                      >
                        Ver intentos y respuestas
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.next !== null && (
            <button
              className="button secondary"
              onClick={() =>
                void run(async () => {
                  const next = await learningApi<Rows>(
                    "academicRows&" + params + "&offset=" + data.next,
                  );
                  setData((d) =>
                    d
                      ? {
                          ...d,
                          results: [...d.results, ...next.results],
                          next: next.next,
                        }
                      : next,
                  );
                })
              }
            >
              Cargar resultados anteriores
            </button>
          )}
          <details className="panel spaced">
            <summary>Escalas utilizadas</summary>
            {[
              ...new Set([
                ...book.map((r) => r.mission_id),
                ...(catalog?.links
                  .filter(
                    (l) =>
                      l.subject_id === assignment?.subject_id &&
                      (!mission || l.mission_id === mission),
                  )
                  .map((l) => l.mission_id) || []),
              ]),
            ].map((id) => {
              const s =
                book.find((r) => r.mission_id === id)?.scale ||
                catalog?.scales.find((s) => s.mission_id === id);
              if (!s) return null;
              return (
                <p key={id}>
                  {catalog?.missions.find((m) => m.id === id)?.title || id}:
                  mínimo {s.minimum}, óptimo {s.optimum}, notas{" "}
                  {gradeLabel(s.grade_min)}–{gradeLabel(s.grade_max)},
                  aprobación {gradeLabel(s.grade_pass)} con{" "}
                  {s.requirement * 100}% de exigencia. Versión {s.version}.
                </p>
              );
            })}
          </details>
          {detail && (
            <section className="panel spaced">
              <h3>Detalle del estudiante</h3>
              <p>
                Nota {gradeLabel(detail.record.grade)} ·{" "}
                {new Date(detail.record.recorded_at).toLocaleString("es-CL", {
                  timeZone: "America/Santiago",
                })}
              </p>
              <p>
                Dinero ganado: {money(detail.record.money_gained)} · perdido:{" "}
                {money(detail.record.money_lost)}
              </p>
              {data.results
                .filter(
                  (r) =>
                    r.student_id === detail.record.student_id &&
                    r.mission_id === detail.record.mission_id,
                )
                .map((r) => (
                  <p key={r.id}>
                    <button
                      className="text-button"
                      onClick={() =>
                        void run(async () =>
                          setDetail(
                            await learningApi(
                              "academicDetail&assignment=" +
                                selected +
                                "&id=" +
                                r.id,
                            ),
                          ),
                        )
                      }
                    >
                      {new Date(r.recorded_at).toLocaleString("es-CL")} ·{" "}
                      {gradeLabel(r.grade)} ·{" "}
                      {r.status === "completed" ? "Completado" : "En curso"}
                    </button>
                  </p>
                ))}
              {detail.detail?.state.simulation?.version===1 && <><h3>Gestión del negocio · recorrido de Camila</h3><GameHUD attempt={detail.detail.state}/></>}
              {detail.record.scale.evidence_weight && <p>Nota ponderada: 80% gestión de recursos y 20% mejor explicación evaluada. La caja y sus movimientos conservan sus valores reales.</p>}
              {detail.detail?.state.evidenceAcceptance && <p>El alumno eligió continuar y cerrar con su mejor explicación evaluada: {detail.detail.state.evidenceAcceptance.bestScore}/100. La confirmación quedó registrada.</p>}
              {detail.detail?.state.evidence && (
                <blockquote style={{ whiteSpace: "pre-wrap" }}>
                  {detail.detail.state.evidence}
                </blockquote>
              )}
              <EvaluationCard
                history={detail.detail?.state.evidenceEvaluations}
              />
              {detail.detail?.state.evidenceEvaluations?.map((e) => (
                <details key={e.attempt}>
                  <summary>
                    Evaluación de nota abierta {e.attempt} · {e.total}/100
                  </summary>
                  <p>
                    {new Date(e.evaluatedAt).toLocaleString("es-CL", {
                      timeZone: "America/Santiago",
                    })}
                  </p>
                  <blockquote>{e.response}</blockquote>
                  <ul>
                    {e.criteria.map((c) => (
                      <li key={c.id}>
                        {c.title}: {c.points}/20 · {c.feedback}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
              <details>
                <summary>Respuestas y estado del recorrido</summary>
                <ol>
                  {Array.isArray(detail.detail?.state.answers)
                    ? detail.detail.state.answers.map((value, i) => {
                        const step = challengeCatalog.find(
                          (m) => m.slug === detail.record.mission_id,
                        )?.steps[i];
                        return (
                          <li key={i}>
                            <strong>{step?.title || `Etapa ${i + 1}`}</strong>:{" "}
                            {step?.kind === "number"
                              ? value
                              : step?.options?.[Number(value)] || value}
                          </li>
                        );
                      })
                    : Object.entries(detail.detail?.state.answers || {}).map(
                        ([id, raw]) => {
                          const value = raw as unknown as {
                            value: string;
                            attempts: number;
                            correct: boolean;
                          };
                          const item = townItems.find((i) => i.id === id);
                          return (
                            <li key={id}>
                              {item?.prompt || id}:{" "}
                              {item?.options.find((o) => o.id === value.value)
                                ?.label || value.value}{" "}
                              · {value.attempts} intentos ·{" "}
                              {value.correct ? "Logrado" : "Por reforzar"}
                            </li>
                          );
                        },
                      )}
                </ol>
              </details>
            </section>
          )}
        </>
      )}
      {profile?.role === "admin" && catalog && (
        <details className="panel spaced">
          <summary>Administración · Escalas y desafíos por asignatura</summary>
          {catalog.missions
            .map(
              (m) =>
                catalog.scales.find((s) => s.mission_id === m.id) || {
                  mission_id: m.id,
                  minimum: 0,
                  optimum: 0,
                  grade_min: 1,
                  grade_pass: 4,
                  grade_max: 7,
                  requirement: 0.6,
                  metric: "performance" as const,
                  version: 0,
                },
            )
            .map((s) => (
              <form
                key={s.mission_id + "-" + s.version}
                className="panel spaced"
                onSubmit={(e) => void saveScale(e)}
              >
                <h3>
                  {catalog.missions.find((m) => m.id === s.mission_id)?.title ||
                    s.mission_id}
                </h3>
                <input type="hidden" name="mission_id" value={s.mission_id} />
                <label className="field">
                  Referencia
                  <select name="metric" defaultValue={s.metric}>
                    <option value="performance">Puntaje de desempeño</option>
                    {s.mission_id === "inicio-actividades" && (
                      <option value="money">Saldo de la caja en Coihues</option>
                    )}
                  </select>
                </label>
                {[
                  ["minimum", "Puntaje mínimo", s.minimum],
                  ["optimum", "Puntaje óptimo", s.optimum],
                  ["grade_min", "Nota mínima", s.grade_min],
                  ["grade_pass", "Nota de aprobación", s.grade_pass],
                  ["grade_max", "Nota máxima", s.grade_max],
                  ["requirement", "Exigencia (%)", s.requirement * 100],
                ].map(([name, label, value]) => (
                  <label className="field" key={name}>
                    {label}
                    <input
                      type="number"
                      required
                      step="any"
                      name={String(name)}
                      defaultValue={
                        name === "optimum" && s.version === 0 ? "" : value
                      }
                    />
                  </label>
                ))}
                <button className="button" disabled={busy}>
                  Guardar escala para nuevos recorridos
                </button>
              </form>
            ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void run(
                () => learningApi("academicLink", Object.fromEntries(f)),
                true,
              );
            }}
          >
            <h3>Vincular un desafío con una asignatura</h3>
            <label className="field">
              Desafío
              <select name="mission_id" required>
                {catalog.missions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Asignatura
              <select name="subject_id" required>
                {catalog.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="button" disabled={busy}>
              Vincular asignatura
            </button>
          </form>
        </details>
      )}
    </section>
  );
}

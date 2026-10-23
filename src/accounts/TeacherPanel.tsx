import { AcademicDashboard } from './AcademicDashboard';
import { EvaluationCard } from "../games/inicio/EvaluationCard";
import type { Attempt } from "../progress";
type MissionEvidence = {id:string;state:Attempt;last_activity_at:string;source:string};
import { useEffect, useState, useRef, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAccount } from "./Session";
import { authClient, learningApi } from "./client";
import { AdventureEntry } from "./Account";
import {
  initialRubric,
  levelNames,
  type Profile,
  type Registry,
  type Rubric,
  type Evaluation,
} from "./model";
import { concepts, missions, allItems } from "../games/coihue/content";
import { completed, learning, type Progress } from "../games/coihue/progress";
type Course = {
  id: string;
  name: string;
  school_id: string;
  teacher_id: string;
};
type Student = Profile & {
  progress: { state: Progress; revision: number } | null;
  evaluation: Evaluation | null;
};
type Evidence = {
  id: string;
  mission_id: string;
  created_at: string;
  content_version: number;
  event: { type: string };
  details: {
    response?: string;
    response_label?: string;
    prompt?: string;
    challenge_title?: string;
    item_id?: string;
    challenge_id?: string;
    value?: string;
    correct?: boolean;
    attempts?: number;
    assisted?: boolean;
    concepts?: string[];
  };
};
type Suggestion = {
  criterion: string;
  level: number | null;
  activities: string[];
  rule: string;
};
export default function TeacherPanel() {
  const { profile, loading } = useAccount();
  const [courses, setCourses] = useState<Course[]>([]);
  const [registry, setRegistry] = useState<Registry>({
    cities: [],
    schools: [],
  });
  const [course, setCourse] = useState("");
  const [school, setSchool] = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [rubric, setRubric] = useState<Rubric>(initialRubric);
  const [editor, setEditor] = useState<Rubric | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [missionAttempts, setMissionAttempts] = useState<MissionEvidence[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const currentCourse = useRef(course);
  currentCourse.current = course;
  const reviewRequest = useRef(0);
  const [confirmed, setConfirmed] = useState(false);
  const reloadCourses = () =>
    learningApi<{ courses: Course[] }>("courses").then((d) => {
      setCourses(d.courses);
      setCourse((current) => current || d.courses[0]?.id || "");
    });
  useEffect(() => {
    if (profile && ["teacher", "admin"].includes(profile.role)) {
      void reloadCourses().catch((e) => setMessage(e.message));
      void learningApi<Registry>("registry")
        .then(setRegistry)
        .catch((e) => setMessage(e.message));
    }
  }, [profile?.id]);
  const reload = () => {
    if (!course) return Promise.resolve();
    const requestedCourse = course;
    return learningApi<{ students: Student[]; rubric: Rubric }>(
      "roster&course=" + course,
    ).then((d) => {
      if (currentCourse.current !== requestedCourse) return;
      setStudents(d.students);
      setRubric(d.rubric);
    });
  };
  useEffect(() => {
    reviewRequest.current++;
    setSelected(null);
    setEvaluation(null);
    setEvidence([]);
    setMissionAttempts([]);
    setEditor(null);
    if (course) void reload().catch((e) => setMessage(e.message));
  }, [course]);
  if (loading) return <p role="status">Comprobando acceso…</p>;
  if (!profile) return <AdventureEntry />;
  if (!["teacher", "admin"].includes(profile.role))
    return (
      <section className="panel">
        <h1>Acceso docente</h1>
        <p>Tu cuenta no tiene cursos docentes asignados.</p>
        <Link to="/cuenta">Volver a mi cuenta</Link>
      </section>
    );
  if(profile.role==='teacher')return <AcademicDashboard/>;
  const run = async (
    work: () => Promise<unknown>,
    success = "Cambio guardado.",
  ) => {
    setBusy(true);
    setMessage("");
    try {
      await work();
      if (success) setMessage(success);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const pick = async (s: Student) => {
    const request = ++reviewRequest.current;
    setSelected(s);
    setEvidence([]);
    setMissionAttempts([]);
    setSuggestions([]);
    setNextOffset(null);
    setConfirmed(false);
    setEvaluation(
      s.evaluation ?? {
        student_id: s.id,
        course_id: course,
        rubric,
        ratings: Object.fromEntries(rubric.criteria.map((c) => [c.id, null])),
        comments: {},
        overall: "",
        published: false,
      },
    );
    await run(async () => {
      const data = await learningApi<{
        evidence: Evidence[];
        missionAttempts: MissionEvidence[];
        next_offset: number | null;
        suggestions: Suggestion[];
      }>("evidence&course=" + course + "&student=" + s.id);
      if (request !== reviewRequest.current) return;
      setEvidence(data.evidence);
      setMissionAttempts(data.missionAttempts || []);
      setNextOffset(data.next_offset);
      setSuggestions(data.suggestions);
    }, "Evidencias cargadas.");
  };
  const exportCSV = () =>
    run(async () => {
      const token = (await authClient!.auth.getSession()).data.session
        ?.access_token;
      const params = new URLSearchParams({
        action: "csv",
        course,
        game: "mision-tributos",
        ...(school ? { school } : {}),
        ...(studentFilter ? { student: studentFilter } : {}),
      });
      const response = await fetch("/api/learning?" + params, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw Error("No pudimos exportar este curso.");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "tpplay-resultados.csv";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "CSV descargado.");
  const visible = students.filter(
    (s) =>
      (!school || s.school_id === school) &&
      (!studentFilter || s.id === studentFilter),
  );
  return (
    <>
      <AcademicDashboard/>
      <details className="panel spaced"><summary>Supervisión histórica de cursos y evidencias</summary>
      <section className="panel">
        <p className="eyebrow">TP PLAY DOCENTE</p>
        <h1>Bienvenido/a, {profile.first_name || profile.name}</h1>
        <div className="account-roster">
          <article className="panel">
            <h2>Mis cursos</h2>
            <p>Organiza tus cursos autorizados en este panel.</p>
          </article>
          <article className="panel">
            <h2>Misiones</h2>
            <Link to="/desafios">Explorar misiones disponibles</Link>
            <p>Asignaciones con fecha: disponible próximamente.</p>
          </article>
          <article className="panel">
            <h2>Estudiantes</h2>
            <p>Selecciona un curso para ver a sus integrantes.</p>
          </article>
          <article className="panel">
            <h2>Resultados</h2>
            <p>
              Revisa evidencias de Valle del Coihue y publica retroalimentación.
            </p>
          </article>
        </div>
      </section>
      <section className="panel">
        <p className="eyebrow">ACOMPAÑAMIENTO DOCENTE</p>
        <h1>Cursos y evidencias de aprendizaje</h1>
        <p>
          Solo aparecen los cursos asignados a tu cuenta. Los tiempos y las
          pistas no se convierten en notas.
        </p>
        <Link to="/cuenta">Mi cuenta y cierre de sesión</Link>
      </section>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <section className="panel spaced">
        <h2>Crear un curso</h2>
        <form
          className="account-form"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            void run(async () => {
              await learningApi("createCourse", {
                name: form.get("name"),
                school_id: form.get("school"),
              });
              await reloadCourses();
            });
          }}
        >
          <label className="field">
            Nombre del curso
            <input
              name="name"
              minLength={2}
              maxLength={120}
              required
              placeholder="3.º medio Administración A"
            />
          </label>
          <label className="field">
            Establecimiento
            <select name="school" required>
              <option value="">Selecciona</option>
              {registry.schools.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <button className="button secondary" disabled={busy}>
            Crear curso
          </button>
        </form>
      </section>
      <section className="panel spaced">
        <h2>Seleccionar curso</h2>
        <div className="filter-grid">
          <label className="field">
            Curso
            <select value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="">Selecciona</option>
              {courses.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Establecimiento
            <select value={school} onChange={(e) => setSchool(e.target.value)}>
              <option value="">Todos</option>
              {registry.schools.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Estudiante
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {students.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Juego
            <select value="mision-tributos" disabled>
              <option value="mision-tributos">Misión tributos</option>
            </select>
          </label>
        </div>
        <div className="valley-actions">
          <button
            className="button secondary"
            disabled={!course || busy}
            onClick={() =>
              void run(async () => {
                const invitation = await learningApi<{
                  code: string;
                  expires_at: string;
                }>("invite", { course_id: course });
                setMessage(
                  `Código: ${invitation.code} · válido hasta ${new Date(invitation.expires_at).toLocaleDateString("es-CL")} · 100 incorporaciones. Cópialo ahora; no se guarda en texto visible.`,
                );
              }, "")
            }
          >
            Generar código de invitación
          </button>
          <button
            className="button secondary"
            disabled={!course || busy}
            onClick={() => void exportCSV()}
          >
            Exportar CSV
          </button>
          <button
            className="button secondary"
            disabled={!course || busy}
            onClick={() =>
              setEditor(
                structuredClone({ ...rubric, version: rubric.version + 1 }),
              )
            }
          >
            Editar rúbrica del curso
          </button>
        </div>
        {!visible.length && (
          <p>Aún no hay estudiantes incorporados con estos filtros.</p>
        )}
        <div className="account-roster">
          {visible.map((s) => (
            <button className="panel" key={s.id} onClick={() => void pick(s)}>
              <strong>{s.name}</strong>
              <span>
                {s.progress
                  ? missions.filter((m) => completed(s.progress!.state, m.id))
                      .length
                  : 0}{" "}
                / 7 misiones
              </span>
              <span>
                {s.evaluation?.published
                  ? "Retroalimentación publicada"
                  : s.evaluation
                    ? "Borrador docente"
                    : "Por revisar"}
              </span>
            </button>
          ))}
        </div>
      </section>
      {editor && (
        <section className="panel spaced">
          <h2>Rúbrica nueva · versión {editor.version}</h2>
          <p>
            Se conserva la versión de las evaluaciones anteriores. Las
            ponderaciones no generan una nota de 1,0 a 7,0.
          </p>
          {editor.criteria.map((c, index) => (
            <fieldset className="rubric-row" key={c.id}>
              <legend>{c.title}</legend>
              <label className="field">
                Ponderación
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={c.weight}
                  onChange={(e) =>
                    setEditor({
                      ...editor,
                      criteria: editor.criteria.map((item, i) =>
                        i === index
                          ? { ...item, weight: Number(e.target.value) }
                          : item,
                      ),
                    })
                  }
                />
              </label>
              {c.levels.map((descriptor, level) => (
                <label className="field" key={level}>
                  {levelNames[level]}
                  <textarea
                    maxLength={800}
                    value={descriptor}
                    onChange={(e) =>
                      setEditor({
                        ...editor,
                        criteria: editor.criteria.map((item, i) =>
                          i === index
                            ? {
                                ...item,
                                levels: item.levels.map((d, l) =>
                                  l === level ? e.target.value : d,
                                ),
                              }
                            : item,
                        ),
                      })
                    }
                  />
                </label>
              ))}
            </fieldset>
          ))}
          <div className="valley-actions">
            <button
              className="button"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await learningApi("rubric", {
                    course_id: course,
                    rubric: editor,
                  });
                  setEditor(null);
                  await reload();
                })
              }
            >
              Guardar nueva versión
            </button>
            <button
              className="button secondary"
              onClick={() => setEditor(null)}
            >
              Cancelar
            </button>
          </div>
        </section>
      )}
      {selected && evaluation && (
        <section className="panel spaced">
          <h2>Revisión de {selected.name}</h2>
          <h3>Dificultades por concepto</h3>
          <div className="valley-concept-list">
            {concepts.map((c) => (
              <p key={c.id}>
                <strong>{c.term}</strong>
                <br />
                {selected.progress
                  ? learning(selected.progress.state, c.id)
                  : "Sin actividad registrada"}
              </p>
            ))}
          </div>
          <h3>Explícaselo a Camila · Evaluaciones automáticas</h3>
          <p>Consulta las respuestas y resultados por criterio. La lectura docente es opcional y no bloquea el avance. El puntaje de la nota se conserva separado de los criterios del recorrido.</p>
          {missionAttempts.map(item=><article className="panel spaced" key={item.id}><h4>Nota para Camila</h4><p>{new Date(item.last_activity_at).toLocaleString('es-CL',{timeZone:'America/Santiago'})} · {item.source==='local_import'?'Importado y recalculado en servidor':'Guardado en cuenta'}</p><EvaluationCard history={item.state.evidenceEvaluations}/>{item.state.evidenceEvaluations?.map(e=><details key={e.attempt}><summary>Intento {e.attempt} · {e.total}/100 · {new Date(e.evaluatedAt).toLocaleString('es-CL',{timeZone:'America/Santiago'})}</summary><blockquote style={{whiteSpace:'pre-wrap'}}>{e.response}</blockquote><ul>{e.criteria.map(c=><li key={c.id}>{c.title}: {c.points}/20 · {c.feedback}</li>)}</ul></details>)}{!item.state.evidenceEvaluations?.length&&<p>Registro anterior a la evaluación automática. {item.state.evidence}</p>}</article>)}
          {!missionAttempts.length&&<p>No hay notas de Camila guardadas en la cuenta de este estudiante.</p>}
          <h3>Evidencias por actividad</h3>
          <p>
            Se conservan respuestas, reintentos y apoyos, incluidos los
            recorridos reiniciados. Las explicaciones requieren lectura docente.
          </p>
          <div className="evidence-scroll">
            {evidence
              .filter((e) =>
                ["answer", "advance", "justify", "hint"].includes(e.event.type),
              )
              .map((e) => (
                <article key={e.id}>
                  <strong>
                    {missions.find((m) => m.id === e.mission_id)?.title} ·{" "}
                    {e.details.challenge_title ||
                      e.details.challenge_id ||
                      e.event.type}{" "}
                    · contenido v{e.content_version}
                  </strong>
                  <small>
                    {new Date(e.created_at).toLocaleString("es-CL")}
                  </small>
                  {e.details.prompt && <p>{e.details.prompt}</p>}
                  <p>
                    {e.details.response ||
                      `${e.details.item_id || ""}: respuesta ${e.details.response_label ?? allItems.find((i) => i.id === e.details.item_id)?.options.find((o) => o.id === e.details.value)?.label ?? e.details.value ?? "—"} · intentos ${e.details.attempts ?? "—"} · ${e.details.correct === undefined ? "" : e.details.correct ? "correcta" : "por revisar"} · ${e.details.assisted ? "con apoyo" : "apoyo no registrado en esta respuesta"}`}
                  </p>
                </article>
              ))}
          </div>
          {nextOffset !== null && (
            <button
              className="button secondary"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const request = reviewRequest.current;
                  const data = await learningApi<{
                    evidence: Evidence[];
        missionAttempts: MissionEvidence[];
                    next_offset: number | null;
                  }>(
                    `evidence&course=${course}&student=${selected.id}&offset=${nextOffset}`,
                  );
                  if (request !== reviewRequest.current) return;
                  setEvidence((current) => [...current, ...data.evidence]);
                  setMissionAttempts(current => [...current, ...(data.missionAttempts || [])]);
                  setNextOffset(data.next_offset);
                }, "Más evidencias cargadas.")
              }
            >
              Cargar evidencias anteriores
            </button>
          )}
          <h3>Rúbrica de evaluación · versión {evaluation.rubric.version}</h3>
          <p>
            Las sugerencias se basan en comprobaciones distintas por concepto.
            No leen ni califican las justificaciones. Revísalas antes de asignar
            un nivel; “Sin evidencia suficiente” no es cero.
          </p>
          {evaluation.rubric.criteria.map((c) => {
            const suggestion = suggestions.find((s) => s.criterion === c.id);
            return (
              <fieldset className="rubric-row" key={c.id}>
                <legend>
                  {c.title} · peso {c.weight}
                </legend>
                <details>
                  <summary>Descriptores y actividades vinculadas</summary>
                  {c.levels.map((d, i) => (
                    <p key={i}>
                      <strong>{levelNames[i]}:</strong> {d}
                    </p>
                  ))}
                  <p>
                    Conceptos:{" "}
                    {c.concepts.join(", ") ||
                      "Transferencia: casos de la feria y explicaciones abiertas."}
                  </p>
                  <p>
                    Actividades observadas:{" "}
                    {suggestion?.activities.join(", ") ||
                      "Sin evidencia suficiente"}
                  </p>
                  <p>{suggestion?.rule}</p>
                </details>
                <p className="muted">
                  Sugerencia orientativa:{" "}
                  {suggestion?.level
                    ? levelNames[suggestion.level - 1]
                    : "Sin evidencia suficiente / revisión de justificación"}
                </p>
                <label className="field">
                  Nivel confirmado por el docente
                  <select
                    disabled={evaluation.published || busy}
                    value={evaluation.ratings[c.id] ?? ""}
                    onChange={(e) =>
                      setEvaluation({
                        ...evaluation,
                        ratings: {
                          ...evaluation.ratings,
                          [c.id]: e.target.value
                            ? Number(e.target.value)
                            : null,
                        },
                      })
                    }
                  >
                    <option value="">Sin evidencia suficiente</option>
                    {levelNames.map((level, i) => (
                      <option key={level} value={i + 1}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Justificación y comentario
                  <textarea
                    disabled={evaluation.published || busy}
                    maxLength={2000}
                    value={evaluation.comments[c.id] || ""}
                    onChange={(e) =>
                      setEvaluation({
                        ...evaluation,
                        comments: {
                          ...evaluation.comments,
                          [c.id]: e.target.value,
                        },
                      })
                    }
                  />
                </label>
              </fieldset>
            );
          })}
          <label className="field">
            Retroalimentación general
            <textarea
              disabled={evaluation.published || busy}
              maxLength={4000}
              value={evaluation.overall}
              onChange={(e) =>
                setEvaluation({ ...evaluation, overall: e.target.value })
              }
            />
          </label>
          {evaluation.published ? (
            <p className="notice">
              Retroalimentación publicada. Se conserva su rúbrica y evaluación.
            </p>
          ) : (
            <>
              <label className="toggle spaced">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                He revisado las respuestas, las justificaciones y los niveles
                asignados.
              </label>
              <div className="valley-actions">
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await learningApi("evaluation", {
                        ...evaluation,
                        published: false,
                      });
                      await reload();
                    })
                  }
                >
                  Guardar borrador
                </button>
                <button
                  className="button"
                  disabled={busy || !confirmed}
                  onClick={() =>
                    void run(async () => {
                      await learningApi("evaluation", {
                        ...evaluation,
                        published: true,
                        confirmed,
                      });
                      setEvaluation({ ...evaluation, published: true });
                      await reload();
                    })
                  }
                >
                  Publicar retroalimentación
                </button>
              </div>
            </>
          )}
        </section>
      )}
      </details>
    </>
  );
}

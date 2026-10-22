import { missions as coihueStages } from "./games/coihue/content";
import { orderedMissionIds } from "./modules";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  administrationModules,
  administrationMissions,
  administrationSpecialty,
  findAdministrationModule,
  modulePath,
  statusLabels,
  curriculumDisclaimer,
  type ContentStatus,
} from "./administrationCurriculum";
import { PageHead, ButtonLink } from "./ui";
import { useAccount } from "./accounts/Session";
import { learningApi } from "./accounts/client";
import type { DashboardData } from "./accounts/Identity";
import type { ModuleSettings } from "./modules";
const base = "/especialidades/administracion";
export function Administration() {
  const { modulo, grado } = useParams();
  const selected = findAdministrationModule(modulo);
  const grade = grado === "3-medio" ? 3 : grado === "4-medio" ? 4 : undefined;
  const { profile } = useAccount();
  const [progress, setProgress] = useState<DashboardData["progress"]>([]);
  const [progressError, setProgressError] = useState("");
  const [settings, setSettings] = useState<ModuleSettings[]>([]);
  const [settingsError, setSettingsError] = useState("");
  useEffect(() => {
    let active = true;
    setProgress([]);
    setProgressError("");
    if (profile?.role === "student")
      void learningApi<DashboardData>("dashboard")
        .then((d) => {
          if (active) setProgress(d.progress);
        })
        .catch(() => {
          if (active)
            setProgressError(
              "No pudimos consultar tu progreso. Puedes reintentar recargando la página.",
            );
        });
    return () => {
      active = false;
    };
  }, [profile?.id, profile?.role]);
  useEffect(() => {
    let active = true;
    fetch("/api/modules")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((d) => {
        if (active) setSettings(d.modules || []);
      })
      .catch(() => {
        if (active)
          setSettingsError(
            "No pudimos cargar los objetivos complementarios del equipo docente. El referente curricular sigue accesible.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  if ((modulo && !selected) || (grado && !grade))
    return (
      <section className="panel">
        <h1>Ruta no encontrada</h1>
        <Link to={base}>Volver a Administración</Link>
      </section>
    );
  const listed = selected
    ? [selected]
    : administrationModules.filter((m) => !grade || m.grade === grade);
  const completed = (slug: string) =>
    slug === "mision-tributos"
      ? coihueStages.every((m) =>
          progress.some(
            (p) =>
              p.mission_id === `coihue:${m.id}` && p.status === "completed",
          ),
        )
      : progress.some((p) => p.mission_id === slug && p.status === "completed");
  return (
    <>
      <nav className="curriculum-breadcrumb" aria-label="Ruta de aprendizaje">
        <Link to="/especialidades">Especialidades</Link>
        <span aria-hidden="true">›</span>
        <Link to={base}>Administración</Link>
        {(selected || grade) && (
          <>
            <span aria-hidden="true">›</span>
            <Link to={`${base}/${selected?.grade || grade}-medio`}>
              {selected?.grade || grade}.º medio
            </Link>
          </>
        )}
        {selected && (
          <>
            <span aria-hidden="true">›</span>
            <span aria-current="page">{selected.displayName}</span>
          </>
        )}
      </nav>
      <PageHead
        eyebrow="ADMINISTRACIÓN · MENCIÓN RECURSOS HUMANOS"
        title={selected?.displayName || "Tu ruta en Administración"}
      >
        {selected?.description ||
          "Aprende a organizar información, atender personas y tomar decisiones dentro del Valle del Coihue. Comienza con las experiencias disponibles y descubre lo que viene después."}
      </PageHead>
      {selected ? (
        <p className="notice">
          Módulo oficial: <strong>{selected.officialModuleName}</strong> ·{" "}
          {selected.grade}.º medio · {selected.hours} horas pedagógicas
          referenciales del programa.
        </p>
      ) : (
        <section className="panel">
          <h2>Una especialidad, dos niveles</h2>
          <p>
            Sector Administración. 3.º medio: plan común. 4.º medio: mención
            Recursos Humanos. La otra mención oficial es Logística; no se
            desarrolla en esta etapa.
          </p>
          <p>
            11 módulos · 28 experiencias en el roadmap · 3 disponibles para
            pilotaje · 25 por desarrollar. El mapa está completo como
            estructura; las misiones aún no cubren todo el programa.
          </p>
          <nav
            className="valley-actions"
            aria-label="Niveles de Administración"
          >
            <ButtonLink secondary to={`${base}/3-medio`}>
              Explorar 3.º medio
            </ButtonLink>
            <ButtonLink secondary to={`${base}/4-medio`}>
              Explorar 4.º medio
            </ButtonLink>
          </nav>
        </section>
      )}
      {progressError && (
        <p role="alert" className="notice">
          {progressError}
        </p>
      )}
      {!selected && (
        <section className="section">
          <h2>Así recorrerás el Valle</h2>
          <p className="muted">
            El orden de los módulos sigue el plan de estudio. El recorrido de
            misiones es una propuesta de TP PLAY, flexible y sin prerrequisitos
            de bloqueo. No constituye una secuencia obligatoria de Mineduc.
          </p>
          <div className="module-grid">
            {[
              "Oficina TP: información, procesos y herramientas digitales.",
              "Barrio comercial: atención, documentos y tributación.",
              "Empresa del Valle: relaciones laborales y gestión de personas.",
              "Centro de emprendimiento: proyectos y trayectoria laboral.",
            ].map((t) => (
              <div className="panel" key={t}>
                <p>{t}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {[3, 4]
        .filter((g) => listed.some((m) => m.grade === g))
        .map((g) => (
          <section className="section" key={g}>
            <h2>
              {g}.º medio · {g === 3 ? "Plan común" : "Recursos Humanos"}
            </h2>
            {listed
              .filter((m) => m.grade === g)
              .map((m) => {
                const custom = settings.find(
                  (s) => s.id === `administracion/${m.legacySlugs[0]}`,
                );
                const editorialOrder = orderedMissionIds(
                  `administracion/${m.legacySlugs[0]}`,
                  custom?.mission_order,
                );
                const items = administrationMissions
                  .filter((x) => x.moduleId === m.moduleId)
                  .sort(
                    (a, b) =>
                      (a.available
                        ? editorialOrder.indexOf(a.slug)
                        : 100 + a.order) -
                      (b.available
                        ? editorialOrder.indexOf(b.slug)
                        : 100 + b.order),
                  );
                return (
                  <article className="panel curriculum-module" key={m.moduleId}>
                    {!selected ? (
                      <>
                        <p className="eyebrow">
                          {m.moduleId} · {m.hours} horas referenciales
                        </p>
                        <h3>
                          <Link to={modulePath(m)}>{m.displayName}</Link>
                        </h3>
                        <p className="muted">
                          Módulo oficial: {m.officialModuleName}
                        </p>
                        <p>{m.description}</p>
                        <p>
                          {items.filter((x) => x.available).length} disponibles
                          · {items.filter((x) => !x.available).length}{" "}
                          planificadas
                        </p>
                        <Link className="text-link" to={modulePath(m)}>
                          Explorar módulo →
                        </Link>
                      </>
                    ) : (
                      <>
                        {m.moduleId === "ADM-AIG" && (
                          <p className="notice">
                            Referencia horaria: 114 horas en el capítulo del
                            módulo (pp. 96–97). La tabla inicial del PDF indica
                            144; se documenta la discrepancia y se conserva el
                            total de referencia de 836 horas.
                          </p>
                        )}
                        <h3>¿Qué aprenderás?</h3>
                        <p>{m.description}</p>
                        <details className="curriculum-teacher">
                          <summary>
                            Aprendizajes asociados y fuentes · Para docentes
                          </summary>
                          <p>
                            Resúmenes propios del programa; no reemplazan sus
                            OA, aprendizajes esperados ni criterios completos.
                          </p>
                          {m.officialObjectives.map((o) => (
                            <p key={o.code}>
                              <strong>{o.code}</strong> · {o.summary}
                            </p>
                          ))}
                          <ul>
                            {m.learningOutcomes.map((o) => (
                              <li key={o}>{o}</li>
                            ))}
                          </ul>
                          <p>
                            Fuente:{" "}
                            <a
                              href={m.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {m.source}
                            </a>
                            , pp. {m.sourcePages}. Revisión documental:{" "}
                            {m.lastReviewedAt}. Versión {m.version}.
                          </p>
                          {m.moduleId === "ADM-DPE" && (
                            <p>
                              El perfil de egreso menciona inducción básica y la
                              visión global del módulo desarrolla selección. Se
                              mantienen los alcances de cada sección sin
                              intercambiarlos.
                            </p>
                          )}
                          {custom?.objectives?.length ? (
                            <>
                              <h4>Objetivos didácticos de tu equipo</h4>
                              <p>
                                Texto editorial; no constituye una denominación
                                oficial.
                              </p>
                              <ul>
                                {custom.objectives.map((o, i) => (
                                  <li key={i}>{o}</li>
                                ))}
                              </ul>
                            </>
                          ) : null}
                          {settingsError && (
                            <p className="notice">{settingsError}</p>
                          )}
                        </details>
                        <h3>Misiones TP PLAY</h3>
                        <p>
                          Empieza por una experiencia disponible. Las demás
                          están cerradas porque todavía deben diseñarse,
                          revisarse y pilotarse; no se desbloquean con XP.
                        </p>
                        <ol className="curriculum-missions">
                          {items.map((x) => (
                            <li key={x.id}>
                              <p className="eyebrow">
                                {x.id} · {x.location.building}
                              </p>
                              <h4>{x.title}</h4>
                              <p>{x.learningObjective}</p>
                              <p className="pill">
                                {completed(x.slug)
                                  ? "Completada en tu cuenta"
                                  : x.available
                                    ? "Disponible · Pilotaje"
                                    : "Próximamente · Borrador"}
                              </p>
                              <details className="curriculum-teacher">
                                <summary>
                                  Relación curricular · Para docentes
                                </summary>
                                <p className="muted small">
                                  {x.curriculumAlignment.description}
                                </p>
                              </details>
                              {x.available && x.href ? (
                                <ButtonLink secondary to={x.href}>
                                  {completed(x.slug)
                                    ? "Revisar experiencia"
                                    : "Explorar misión"}
                                </ButtonLink>
                              ) : (
                                <p className="small">
                                  Contenido en preparación. Sin fecha de
                                  publicación comprometida.
                                </p>
                              )}
                            </li>
                          ))}
                        </ol>
                        <nav
                          className="valley-actions"
                          aria-label="Continuar por los módulos"
                        >
                          <Link to={`${base}/${g}-medio`}>
                            Volver a {g}.º medio
                          </Link>
                          {administrationModules.find(
                            (n) => n.order === m.order + 1,
                          ) && (
                            <Link
                              to={modulePath(
                                administrationModules.find(
                                  (n) => n.order === m.order + 1,
                                )!,
                              )}
                            >
                              Siguiente módulo →
                            </Link>
                          )}
                        </nav>
                      </>
                    )}
                  </article>
                );
              })}
          </section>
        ))}
      <section className="panel spaced">
        <h2>Fuentes curriculares</h2>
        <p>
          Plan y programa de Administración (2015), basado en las Bases
          Curriculares EMTP del Decreto 452/2013. Revisión documental: 21 de
          octubre de 2026. Confirmar eventuales adecuaciones del
          establecimiento.
        </p>
        <a
          href={administrationSpecialty.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Programa oficial · Currículum Nacional
        </a>
        <p>
          <a
            href="https://bibliotecadigital.mineduc.cl/handle/20.500.12365/316"
            target="_blank"
            rel="noreferrer"
          >
            Ficha del programa · Biblioteca Digital Mineduc
          </a>
        </p>
        <p className="muted small">{curriculumDisclaimer}</p>
      </section>
    </>
  );
}
export function MissionCurriculum({ slug }: { slug: string }) {
  const mission = administrationMissions.find((m) => m.slug === slug);
  if (!mission) return null;
  const module = administrationModules.find(
    (m) => m.moduleId === mission.moduleId,
  )!;
  return (
    <section className="panel spaced">
      <nav
        className="curriculum-breadcrumb"
        aria-label="Ruta curricular de la misión"
      >
        <Link to={base}>Administración</Link>
        <span>›</span>
        <Link to={`${base}/${mission.grade}-medio`}>
          {mission.grade}.º medio
        </Link>
        <span>›</span>
        <Link to={modulePath(module)}>{module.displayName}</Link>
      </nav>
      <h2>Tu misión dentro de la ruta</h2>
      <p>Módulo oficial: {module.officialModuleName}</p>
      <p>
        Versión {mission.version} · Estado:{" "}
        {statusLabels[mission.status as ContentStatus]} · Actualización:{" "}
        {mission.updatedAt}
      </p>
      <p>
        Revisión de relación curricular: {mission.reviewedAt}. Validación
        pedagógica docente y pilotaje de duración pendientes.
      </p>
      <details className="curriculum-teacher">
        <summary>Para docentes · Alineación y aplicación</summary>
        <p>{mission.curriculumAlignment.description}</p>
        <p>
          <strong>Objetivo de la experiencia:</strong>{" "}
          {mission.learningObjective}
        </p>
        <p>
          <strong>Metodología:</strong> {mission.teacher.methodology}
        </p>
        <p>
          <strong>Evidencia:</strong> {mission.teacher.evidence}
        </p>
        <p>{mission.teacher.criteria}</p>
        <p>
          Pauta: {mission.teacher.answerGuideStatus}. La retroalimentación del
          juego es formativa y no reemplaza revisión de evidencias.
        </p>
        <p>
          Apoyos actuales del diseño: instrucciones por etapas, pistas y tiempo
          flexible. Audio, apoyos visuales adicionales y lectura simplificada:
          planificados.
        </p>
        <p>
          Sugerencia: contextualizar con datos ficticios, resolver, justificar
          decisiones y contrastar fuentes en un cierre acompañado. Aceptar
          evidencia oral o visual según el contexto docente, sin diagnósticos ni
          etiquetas personales.
        </p>
        <a href={module.sourceUrl} target="_blank" rel="noreferrer">
          Fuente curricular · Programa Mineduc
        </a>
        <p className="small muted">{curriculumDisclaimer}</p>
      </details>
    </section>
  );
}

import { AcademicGate } from './AcademicSetup';
import { EvaluationCard } from "../games/inicio/EvaluationCard";
import { evidenceOutcome } from "../games/inicio/evaluation";
import { CamilaEvidence } from "../games/inicio/Evidence";
import { BusinessBudget } from "../games/inicio/Budget";
import { CoinRanking } from "./Ranking";
import { InicioStoryGate, CamilaChapter } from "../games/inicio/story";
import { InicioScene, InicioDocuments, isInicio } from "../games/inicio/Scene";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { missions } from "../data";
import { Guard } from "./Identity";
import { learningApi } from "./client";
import type { Attempt } from "../progress";
import { useAccount } from "./Session";
type Saved = {
  state: Attempt | null;
  revision: number;
  score?: number;
  xpEarned?: number;
  attempts?: number;
};
export default function CloudMission({ result = false }: { result?: boolean }) {
  const {slug}=useParams();
  return (
    <Guard roles={["student"]}>
      {result ? <MissionContent result={result}/> : <AcademicGate mission={slug||""}><MissionContent result={result}/></AcademicGate>}
    </Guard>
  );
}
function MissionContent({ result }: { result: boolean }) {
  const { slug, id } = useParams();
  const { profile } = useAccount();
  const navigate = useNavigate();
  const [saved, setSaved] = useState<Saved | null>(null),
    [problem, setProblem] = useState(""),
    [busy, setBusy] = useState(false),
    [value, setValue] = useState(""),
    [evidence, setEvidence] = useState(""),
    [hint, setHint] = useState(false);
  const lock = useRef(false),
    current = useRef<Saved | null>(null),
    owner = useRef(profile?.id);
  owner.current = profile?.id;
  const pending = useRef<object | null>(null);
  async function load() {
    setProblem("");
    try {
      const own = profile?.id;
      const data = await learningApi<Saved>(
        result ? `mission&id=${id}` : `mission&mission=${slug}`,
      );
      if (own !== owner.current) return;
      current.current = data;
      setSaved(data);
      setValue(data.state?.answers[data.state.index] || "");
      setEvidence(data.state?.evidence || "");
      pending.current = null;
    } catch (e) {
      setProblem((e as Error).message);
    }
  }
  useEffect(() => {
    current.current = null;
    setSaved(null);
    void load();
  }, [slug, id, profile?.id]);
  const mission = missions.find(
    (m) => m.slug === (saved?.state?.missionSlug || slug),
  );
  async function send(type: string, eventValue?: string) {
    if (lock.current || !mission || !current.current) return false;
    lock.current = true;
    setBusy(true);
    setProblem("");
    const payload = pending.current || {
      id: current.current.state?.id || crypto.randomUUID(),
      mission: mission.slug,
      event_id: crypto.randomUUID(),
      revision: current.current.revision,
      event: {
        type,
        ...(eventValue !== undefined ? { value: eventValue } : {}),
      },
    };
    pending.current = payload;
    try {
      const own = profile?.id;
      const next = await learningApi<Saved>("missionEvent", payload);
      if (owner.current !== own) return false;
      current.current = next;
      setSaved(next);
      setValue(next.state?.answers[next.state.index] || "");
      setEvidence(next.state?.evidence || "");
      pending.current = null;
      return true;
    } catch (e) {
      if ((e as { status?: number }).status === 400) pending.current = null;
      setProblem((e as Error).message);
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (!saved && !problem)
    return <p role="status">Recuperando tu misión desde el servidor…</p>;
  const alert = problem && (
    <div className="notice" role="alert">
      <p>
        {problem} Conservamos lo que escribiste. El último guardado confirmado
        sigue en tu cuenta.
      </p>
      {pending.current && (
        <button
          className="button"
          disabled={busy}
          onClick={() => void send("start")}
        >
          Reintentar el mismo guardado
        </button>
      )}
      <button
        className="button secondary"
        disabled={busy}
        onClick={() => void load()}
      >
        Recargar avance del servidor
      </button>
    </div>
  );
  if (!mission)
    return (
      <section className="panel">
        {alert}
        <h1>No encontramos esta misión</h1>
        <Link to="/alumno">Volver a mi aventura</Link>
      </section>
    );
  if (!saved?.state)
    return (
      <section className="panel">
        {alert}
        <p className="eyebrow">VALLE DEL COIHUE</p>
        <h1>{mission.title}</h1>
        <div className="mission-start-bar"><p>Tu avance se guarda en tu cuenta.</p><button
          className="button"
          disabled={busy}
          onClick={() => void send("start")}
        >
          Comenzar a jugar
        </button></div><p>{mission.context}</p>
      </section>
    );
  const a = saved.state,
    step = mission.steps[a.index];
  const completed = !!a.completedAt;
  if (completed)
    return (
      <section className="panel">
        {alert}
        <p className="eyebrow">MISIÓN GUARDADA</p>
        <h1>¡Cada decisión te hace avanzar!</h1>
        <h2>{mission.title}</h2><BusinessBudget attempt={a}/><CoinRanking compact/>
        {isInicio(mission.slug) && <CamilaChapter ending/>}
        <p>Completada: {new Date(a.completedAt!).toLocaleString("es-CL")}</p>
        <p>
          Tu saldo se calcula en el servidor. Consulta tus Coihues acumulados y logros en
          tu aventura.
        </p>
        <p>Intento: {a.id}</p>
        {saved.score !== undefined && (
          <p>
            {saved.score} de {mission.steps.length} criterios automáticos
            logrados.
          </p>
        )}
        {saved.xpEarned !== undefined && (
          <p>${saved.xpEarned} Coihues acumulados en esta misión.</p>
        )}
        {mission.steps.map((step, i) => (
          <article className="criterion" key={step.title}>
            <h3>{step.criterion}</h3>
            <p>
              {Number(a.answers[i]) === step.correct
                ? "Logrado"
                : "Por mejorar"}
            </p>
            <p>
              {
                step.feedback[
                  step.kind === "number"
                    ? Number(a.answers[i]) === step.correct
                      ? 1
                      : 0
                    : Number(a.answers[i])
                ]
              }
            </p>
          </article>
        ))}
        <h3>{isInicio(mission.slug) ? `Tu evidencia · ${a.evidenceEvaluations?.length ? evidenceOutcome(a.evidenceEvaluations) : "Registro anterior a la evaluación automática"}` : "Tu evidencia · Pendiente de revisión docente"}</h3>{isInicio(mission.slug)&&<EvaluationCard history={a.evidenceEvaluations}/>}
        <blockquote>{a.evidence}</blockquote>
        <Link className="button" to="/alumno">
          Ver mi progreso y logros
        </Link>
        <Link
          className="button secondary"
          to={`/desafios/${mission.slug}/jugar`}
        >
          Volver a la misión
        </Link>
      </section>
    );
  const confirmed = a.confirmed[a.index];
  async function saveAnswer() {
    if (value !== a.answers[a.index]) return send("answer", value);
    return true;
  }
  async function finish() {
    if (isInicio(mission!.slug)) {
      if (await send("evaluateEvidence", evidence)) {
        if (current.current?.state?.completedAt) navigate(`/intentos/${a.id}/resultados`);
      }
      return;
    }
    if (
      evidence !== current.current?.state?.evidence &&
      !(await send("evidence", evidence))
    )
      return;
    if (await send("complete")) navigate(`/intentos/${a.id}/resultados`);
  }
  return (
    <InicioStoryGate key={a.id} enabled={isInicio(mission.slug) && a.index===0 && !a.confirmed[0]}><div className="player-page">
      {alert}
      <p role="status" className="muted">
        {busy
          ? "Guardando en tu cuenta…"
          : pending.current
            ? "Guardado pendiente: reintenta antes de salir."
            : (
                  step
                    ? value !== (a.answers[a.index] || "")
                    : evidence !== a.evidence
                )
              ? "Tienes cambios sin guardar. Comprueba tu decisión o pulsa Guardar y salir."
              : "Último avance confirmado por el servidor."}
      </p>
      <div className="player-top">
        <Link to="/alumno">Mi aventura</Link>
        <button
          className="button secondary"
          disabled={busy || !!pending.current}
          onClick={async () => {
            const ok = step
              ? value
                ? await saveAnswer()
                : true
              : evidence !== a.evidence
                ? await send("evidence", evidence)
                : true;
            if (ok) navigate("/alumno");
          }}
        >
          Guardar y salir
        </button>
      </div>
      <h1>{mission.title}</h1>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Progreso de misión"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round((a.index / (mission.steps.length + 1)) * 100)}
      >
        <span
          style={{ width: `${(a.index / (mission.steps.length + 1)) * 100}%` }}
        />
      </div>
      {isInicio(mission.slug) && (
        <InicioScene key={a.index} index={a.index} confirmed={a.confirmed} />
      )}
      <section className="panel task-panel">
        <p className="eyebrow">
          ETAPA {a.index + 1} DE {mission.steps.length + 1}
        </p>
        <h2>{step?.title || (isInicio(mission.slug) ? "Explícaselo a Camila" : "Explica lo que aprendiste")}</h2>
        {!step && isInicio(mission.slug) ? <CamilaEvidence/> : <p>{step?.context || mission.evidence}</p>}
        <fieldset disabled={busy || !!pending.current}>
          <legend>{step?.prompt || "Tu evidencia final"}</legend>
          {step ? (
            isInicio(mission.slug) && a.index === 4 ? (
              <InicioDocuments
                value={value}
                onChange={setValue}
                disabled={confirmed || busy || !!pending.current}
              />
            ) : step.kind === "number" ? (
              <label className="field">
                Monto en pesos
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={value}
                  disabled={confirmed}
                  onChange={(e) => setValue(e.target.value)}
                />
              </label>
            ) : (
              <div className="choices">
                {step.options?.map((option, i) => (
                  <label className={`choice ${value === String(i) ? "chosen" : ""}`} key={option}>
                    <input
                      type="radio"
                      name={`step-${a.index}`}
                      value={i}
                      checked={value === String(i)}
                      disabled={confirmed}
                      onChange={() => setValue(String(i))}
                    />
                    <span className="choice-letter" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                    <span>{option}</span>
                  </label>
                ))}
                {value !== "" && <p role="status">Respuesta seleccionada: {step.options?.[Number(value)]}</p>}
              </div>
            )
          ) : (
            <label className="field">
              Tu explicación
              {isInicio(mission.slug) && <span className="small muted">Evaluación automática · hasta tres intentos. Se conserva tu mejor puntaje.</span>}
              <textarea
                maxLength={2500}
                rows={isInicio(mission.slug) ? 10 : 7}
                placeholder={isInicio(mission.slug) ? "Escribe aquí tu explicación para Camila…" : undefined}
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
              />
            </label>
          )}
          {!step && isInicio(mission.slug) && <EvaluationCard history={a.evidenceEvaluations}/>}
          {step && <BusinessBudget attempt={a} index={a.index} answer={value} confirmed={confirmed}/>}
          {step && confirmed && (
            <p className="feedback" role="status">
              {
                step.feedback[
                  step.kind === "number"
                    ? Number(a.answers[a.index]) === step.correct
                      ? 1
                      : 0
                    : Number(a.answers[a.index])
                ]
              }
            </p>
          )}
          <div className="valley-actions">
            {step ? (
              confirmed ? (
                <button
                  className="button"
                  onClick={() => {
                    setHint(false);
                    void send("next");
                  }}
                >
                  Continuar
                </button>
              ) : (
                <button
                  className="button"
                  onClick={async () => {
                    if (await saveAnswer()) await send("confirm");
                  }}
                >
                  Guardar y comprobar decisión
                </button>
              )
            ) : (
              <>
                <button
                  className="button secondary"
                  onClick={() => void send("evidence", evidence)}
                >
                  Guardar mi explicación
                </button>
                <button className="button" onClick={() => void finish()}>
                  {isInicio(mission.slug) ? "Evaluar mi explicación" : "Terminar misión"}
                </button>
              </>
            )}
            {step && (
              <button className="text-button" onClick={() => setHint(!hint)}>
                Necesito una pista
              </button>
            )}
          </div>
        </fieldset>
        {hint && step && <p className="hint">{step.hint}</p>}
        {!step&&<BusinessBudget attempt={a}/>}<p className="muted small">
          {isInicio(mission.slug) ? "Sin tiempo límite. Tu nota se evalúa automáticamente por criterios; la revisión docente es opcional. No incluyas datos personales reales." : "Sin tiempo límite. Tu explicación no recibe una nota automática. No incluyas datos personales."}
        </p>
      </section>
    </div></InicioStoryGate>
  );
}

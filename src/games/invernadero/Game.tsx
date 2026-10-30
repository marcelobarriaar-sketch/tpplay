import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Thermometer,
  Droplets,
  Wind,
  Leaf,
  Sprout,
  ClipboardList,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import { missions } from "../../data";
import { scoreAttempt, type Attempt } from "../../progress";
import { WorkbenchChoices } from "../WorkbenchChoices";
import { GameReaction } from "../reactions/GameReaction";
import type { ReactionEvent } from "../reactions/reactions";
import {
  greenhouseCurriculum,
  greenhouseChapters,
  observations,
  type ObservationId,
} from "./content";
import {
  greenhouseFeedback,
  type FieldDraft,
  type GreenhouseAction,
} from "./domain";
const icons = {
  temperature: Thermometer,
  soil: Droplets,
  ventilation: Wind,
  leaves: Leaf,
};
const observed = (fields: FieldDraft) =>
  (Object.keys(observations) as ObservationId[]).filter(
    (id) => fields[id] === "seen",
  );
function PlanPreview({ fields }: { fields: FieldDraft }) {
  return (
    <div
      className={`gh-plan ${fields.ventilation === "open" ? "open" : ""}`}
      aria-label="Vista del plan propuesto"
    >
      <div className="gh-roof" />
      <div className="gh-window left" />
      <div className="gh-window right" />
      <div className="gh-crop">
        <Leaf />
        <Leaf />
        <Leaf />
        <Leaf />
      </div>
      <p>
        {fields.ventilation === "open"
          ? "Ventanas: apertura supervisada propuesta"
          : fields.ventilation === "closed"
            ? "Ventanas: mantener cerradas propuesto"
            : "Ventanas: decide el manejo"}
      </p>
      <small>
        Vista de tu propuesta. Todavía no es una medición del cultivo.
      </small>
    </div>
  );
}
export function GreenhouseCurriculum() {
  return (
    <section className="panel spaced">
      <p className="eyebrow">RUTA AGRÍCOLA · 4.º MEDIO TP</p>
      <h2>{greenhouseCurriculum.module}</h2>
      <p>{greenhouseCurriculum.specialty}</p>
      <p>{greenhouseCurriculum.objective}</p>
      <details>
        <summary>Orientación curricular para docentes</summary>
        <p>
          {greenhouseCurriculum.learning} Esta misión trabaja de forma acotada
          la observación y el manejo del ambiente del invernadero; no representa
          la evaluación completa del módulo.
        </p>
        <p>{greenhouseCurriculum.criterion}</p>
        <p>
          La evidencia debe relacionar al menos dos señales del caso con una
          acción supervisada y un plan de seguimiento. Revisar también el uso
          responsable del agua y la comunicación del registro al siguiente
          turno. La nota automática considera tres encargos; la explicación
          escrita queda para revisión docente.
        </p>
        <a href={greenhouseCurriculum.source} target="_blank" rel="noreferrer">
          Consultar el módulo oficial de Mineduc
        </a>
      </details>
    </section>
  );
}
export function GreenhouseGame({
  attempt,
  busy = false,
  onAction,
  onNext,
  evidence,
  onEvidence,
  onSaveEvidence,
  onComplete,
  problem,
}: {
  attempt: Attempt;
  busy?: boolean;
  onAction: (event: GreenhouseAction) => void;
  onNext: () => void;
  evidence: string;
  onEvidence: (value: string) => void;
  onSaveEvidence: () => void;
  onComplete: () => void;
  problem?: ReactNode;
}) {
  const index = attempt.index,
    confirmed = !!attempt.confirmed[index],
    mission = missions.find((m) => m.slug === "rescate-invernadero")!,
    chapter = greenhouseChapters[index];
  const [started, setStarted] = useState(
    index > 0 || !!attempt.greenhouse || !!attempt.answers[0],
  );
  const [fields, setFields] = useState<FieldDraft>(
    attempt.greenhouse?.drafts[index] || {},
  );
  const [station, setStation] = useState<ObservationId>();
  const [evidenceSlot, setEvidenceSlot] = useState<"evidence1" | "evidence2">(
    "evidence1",
  );
  const [hint, setHint] = useState(false),
    [reaction, setReaction] = useState<ReactionEvent>();
  const heading = useRef<HTMLHeadingElement>(null),
    wasConfirmed = useRef(confirmed);
  useEffect(() => {
    if (started) heading.current?.focus();
  }, [index, started]);
  const correct =
    Number(attempt.answers[index]) === mission.steps[index]?.correct;
  useEffect(() => {
    if (confirmed && !wasConfirmed.current)
      setReaction({
        id: `${attempt.id}:${index}`,
        type: correct ? "success" : "loss",
        message: correct ? "¡Ronda lograda!" : "Revisemos el manejo",
        detail: "Teresa guarda tu decisión en la bitácora de la huerta.",
      });
    wasConfirmed.current = confirmed;
  }, [confirmed, correct, attempt.id, index]);
  const disabled = busy || confirmed,
    set = (key: string, value: string) =>
      setFields((old) => ({ ...old, [key]: value }));
  const choices = (
    field: string,
    label: string,
    options: [string, string][],
  ) => (
    <WorkbenchChoices
      className="gh"
      field={field}
      label={label}
      options={options}
      fields={fields}
      set={set}
      disabled={disabled}
    />
  );
  const notes = attempt.greenhouse?.drafts[0] || {};
  return (
    <div className="gh-game">
      {reaction && (
        <GameReaction
          event={reaction}
          onFinished={() => setReaction(undefined)}
        />
      )}
      <div className="gh-hud" aria-label="Avance de la huerta">
        <span>
          <Sprout /> Huerta del Coihue
        </span>
        <span>Etapa {index + 1} de 4</span>
        <span>
          {attempt.confirmed.filter(Boolean).length} de 3 rondas entregadas
        </span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Avance del rescate"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={index}
      >
        <span style={{ width: `${index * 25}%` }} />
      </div>
      {!started && (
        <div className="gh-start">
          <button className="button" onClick={() => setStarted(true)}>
            Entrar al invernadero y jugar <ArrowRight size={18} />
          </button>
        </div>
      )}
      <section className="panel gh-story">
        <img
          src="/images/invernadero-huerta-coihue.webp"
          width="1536"
          height="1024"
          alt="Martina y Teresa observan lechugas y preparan la bitácora en la Huerta del Coihue."
        />
        <div>
          <p className="eyebrow">AGROPECUARIA · AGRICULTURA · 4.º MEDIO</p>
          <h1 ref={heading} tabIndex={-1}>
            {started ? chapter.title : "Rescate del invernadero"}
          </h1>
          <p>{chapter.story}</p>
          <blockquote>{chapter.request}</blockquote>
        </div>
      </section>
      {started && (
        <section className="panel gh-desk" aria-label="Mesa de campo">
          {index === 0 && (
            <>
              <h2>
                <Leaf /> Recorre antes de intervenir
              </h2>
              <p>
                Visita las cuatro estaciones. Después elige una hipótesis y
                conecta dos señales de tu cuaderno para fundamentarla.
              </p>
              <div className="gh-scene">
                <img
                  src="/images/invernadero-huerta-coihue.webp"
                  width="1536"
                  height="1024"
                  alt="Escena del invernadero. Usa las estaciones para consultar las lecturas del caso."
                />
                {(Object.keys(observations) as ObservationId[]).map((id) => {
                  const Icon = icons[id];
                  return (
                    <button
                      className={`gh-hotspot station-${id}`}
                      key={id}
                      disabled={disabled}
                      aria-pressed={station === id}
                      onClick={() => {
                        setStation(id);
                        set(id, "seen");
                      }}
                    >
                      <Icon size={20} />
                      {observations[id].short}
                      {fields[id] === "seen" && <CheckCircle2 size={16} />}
                    </button>
                  );
                })}
              </div>
              {station && (
                <div className="gh-reading" role="status">
                  <h3>{observations[station].value}</h3>
                  <p>{observations[station].detail}</p>
                </div>
              )}
              <div className="gh-notebook">
                <h3>
                  <ClipboardList /> Cuaderno de observación ·{" "}
                  {observed(fields).length}/4
                </h3>
                <div className="gh-evidence-cards">
                  {observed(fields).map((id) => (
                    <div className="gh-note" key={id}>
                      <ClipboardList size={18} aria-hidden="true" />

                      <span>{observations[id].value}</span>
                      <button
                        type="button"
                        className="gh-connect"
                        disabled={disabled}
                        onClick={() => set(evidenceSlot, id)}
                        aria-label={`Usar señal: ${observations[id].value}`}
                      >
                        Conectar
                      </button>
                    </div>
                  ))}
                </div>
                {!observed(fields).length && (
                  <p className="muted">
                    Las lecturas aparecerán aquí al recorrer las estaciones.
                  </p>
                )}
              </div>
              {choices(
                "hypothesis",
                "¿Qué hipótesis vas a contrastar primero?",
                [
                  ["heat", "Revisar acumulación de calor y poca ventilación"],
                  ["water", "Atribuirlo a falta de agua"],
                  ["pest", "Dar por confirmada una plaga"],
                ],
              )}
              <p>
                Elige un espacio y pulsa Conectar en una señal del cuaderno.
                Necesitas dos señales distintas.
              </p>
              <div className="gh-evidence-slots">
                {(["evidence1", "evidence2"] as const).map((slot, i) => (
                  <button
                    className={`gh-slot ${evidenceSlot === slot ? "selected" : ""}`}
                    type="button"
                    key={slot}
                    disabled={disabled}
                    aria-pressed={evidenceSlot === slot}
                    onClick={() => setEvidenceSlot(slot)}
                  >
                    <strong>Señal {i + 1}</strong>
                    <span>
                      {observations[fields[slot] as ObservationId]?.value ||
                        "Sin conectar"}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
          {index === 1 && (
            <>
              <h2>
                <Wind /> Prepara el manejo del ambiente
              </h2>
              <p>
                Lee la indicación de Teresa y arma tu propuesta. El panel
                muestra el plan; las nuevas mediciones llegarán en la próxima
                ronda.
              </p>
              <button
                className="button secondary"
                aria-expanded={fields.authorization === "seen"}
                disabled={disabled}
                onClick={() => set("authorization", "seen")}
              >
                Consultar a Teresa
              </button>
              {fields.authorization === "seen" && (
                <div className="gh-reading" role="status">
                  <strong>Indicación de Teresa</strong>
                  <p>
                    «Autorizo abrir la ventilación según mi indicación y
                    supervisión. Registra hora, temperatura y estado de las
                    hojas. No hay autorización para aplicar productos. Antes de
                    cambiar el riego revisamos los datos del suelo».
                  </p>
                </div>
              )}
              <PlanPreview fields={fields} />
              {choices("ventilation", "Control de ventanas", [
                ["open", "Proponer apertura supervisada"],
                ["closed", "Mantener cerradas"],
              ])}
              {choices("irrigation", "Control del riego", [
                ["hold", "Mantener sin aumentar y revisar necesidad"],
                ["continuous", "Activar riego continuo"],
              ])}
              {choices("products", "Manejo de productos", [
                ["none", "No aplicar sin diagnóstico ni autorización"],
                ["apply", "Proponer un producto sin identificar la causa"],
              ])}
              {choices("record", "Bitácora de la intervención", [
                ["record", "Anotar hora, temperatura y estado de las hojas"],
                ["skip", "Continuar sin registro"],
              ])}
            </>
          )}
          {index === 2 && (
            <>
              <h2>
                <Thermometer /> Contrasta el antes y el después
              </h2>
              {attempt.greenhouse?.drafts[1] && attempt.answers[1] !== "2" && (
                <p className="notice">
                  Teresa revisó y corrigió tu propuesta antes de intervenir. La
                  lectura posterior corresponde a la ventilación autorizada que
                  realizó el equipo.
                </p>
              )}
              <div className="gh-comparison">
                <article>
                  <p className="eyebrow">PRIMERA RONDA · 11:00</p>
                  <strong>32 °C</strong>
                  <p>Suelo húmedo · ventanas cerradas · hojas decaídas.</p>
                </article>
                <article>
                  <p className="eyebrow">SEGUNDA RONDA · 11:20</p>
                  <strong>25 °C</strong>
                  <p>
                    Ventilación abierta bajo supervisión · mejoría parcial ·
                    algunas plantas siguen decaídas.
                  </p>
                </article>
              </div>
              <p>
                Transfiere las observaciones a tu registro de seguimiento. La
                temperatura es una lectura del caso, no una receta para todos
                los invernaderos.
              </p>
              {choices(
                "temperature",
                "Temperatura que registrarás en la segunda ronda",
                [
                  ["25", "25 °C"],
                  ["32", "32 °C"],
                  ["39", "39 °C"],
                ],
              )}
              {choices("trend", "Comportamiento de la temperatura", [
                ["down", "Disminuyó"],
                ["same", "Se mantuvo"],
                ["up", "Aumentó"],
              ])}
              {choices("crop", "Estado del cultivo después del manejo", [
                ["partial", "Mejoró parcialmente; quedan plantas decaídas"],
                ["resolved", "Todo resuelto, sin observaciones pendientes"],
                ["worse", "Todas las plantas empeoraron"],
              ])}
              {choices("next", "Encargo para continuar", [
                [
                  "consult",
                  "Registrar las plantas pendientes y consultar a Teresa",
                ],
                ["close", "Cerrar el caso y dejar de observar"],
                ["water", "Duplicar el riego sin nueva revisión"],
              ])}
            </>
          )}
          {problem}
          {confirmed && !attempt.greenhouse?.drafts[index] && (
            <p className="notice">
              Esta ronda se conserva de tu recorrido anterior. Su resultado no
              ha cambiado.
            </p>
          )}
          {index < 3 ? (
            <>
              {confirmed && (
                <div
                  className={`feedback ${correct ? "good" : "review"}`}
                  role="status"
                >
                  <strong>
                    {correct ? "Ronda lograda" : "Hay una decisión que revisar"}
                  </strong>
                  <p>
                    {attempt.greenhouse?.drafts[index]
                      ? greenhouseFeedback(
                          index,
                          attempt.greenhouse.drafts[index],
                        )
                      : mission.steps[index].feedback[
                          Number(attempt.answers[index])
                        ]}
                  </p>
                  {!correct && (
                    <p>
                      Tu decisión queda en el resultado. Podrás mejorarla en un
                      nuevo intento; Teresa mantiene la supervisión del cultivo.
                    </p>
                  )}
                </div>
              )}
              <div className="task-actions">
                <button
                  className="text-button"
                  onClick={() => setHint(!hint)}
                  aria-expanded={hint}
                >
                  <Lightbulb size={18} />
                  {hint ? "Ocultar pista" : "Pedir una pista"}
                </button>
                {confirmed ? (
                  <button className="button" disabled={busy} onClick={onNext}>
                    Continuar la ronda <ArrowRight size={18} />
                  </button>
                ) : (
                  <>
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => onAction({ action: "save", fields })}
                    >
                      Guardar cuaderno
                    </button>
                    <button
                      className="button"
                      disabled={busy}
                      onClick={() => onAction({ action: "check", fields })}
                    >
                      Entregar ronda <CheckCircle2 size={18} />
                    </button>
                  </>
                )}
              </div>
              {hint && <p className="hint">{mission.steps[index].hint}</p>}
              {!confirmed && (
                <p className="small muted">
                  {attempt.greenhouse?.drafts[index] &&
                  JSON.stringify(attempt.greenhouse.drafts[index]) ===
                    JSON.stringify(fields)
                    ? "Cuaderno guardado. "
                    : "Guarda el cuaderno antes de salir. "}
                  Al entregar, esta decisión contará en tu resultado.
                </p>
              )}
            </>
          ) : (
            <>
              <h2>Déjale la bitácora a Teresa</h2>
              <p>
                Explica con tus palabras qué señales relacionaste, qué manejo
                supervisado propusiste y cómo comprobarías su efecto. Usa al
                menos dos datos de la jornada. Aclara qué queda pendiente y por
                qué no actuarías a ciegas sobre el riego o con productos.
              </p>
              <label className="field">
                Nota para el siguiente turno
                <textarea
                  rows={10}
                  maxLength={2500}
                  disabled={busy}
                  value={evidence}
                  onChange={(e) => onEvidence(e.target.value)}
                  placeholder="Teresa, al recorrer el invernadero observamos…"
                />
              </label>
              <p className="small muted">
                Al menos 25 caracteres. No incluyas datos personales reales. La
                nota queda como evidencia para revisión docente; no se evalúa
                automáticamente.
              </p>
              <div className="task-actions">
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={onSaveEvidence}
                >
                  Guardar mi bitácora
                </button>
                <button className="button" disabled={busy} onClick={onComplete}>
                  Cerrar jornada y ver resultados <CheckCircle2 size={18} />
                </button>
              </div>
            </>
          )}
          <details className="gh-context">
            <summary>Consultar el cuaderno y las referencias</summary>
            <p>{mission.context}</p>
            {index > 0 && (
              <ul>
                {observed(notes).map((id) => (
                  <li key={id}>{observations[id].value}</li>
                ))}
              </ul>
            )}
            <p>
              La decisión se construye con las condiciones de esta jornada. No
              se indican dosis, tratamientos ni valores universales de riego o
              temperatura.
            </p>
            <Link to="/recursos/cultivo-vegetales-mineduc">
              Módulo oficial de Agricultura
            </Link>{" "}
            ·{" "}
            <Link to="/recursos/invernaderos-sur-uach">
              Manejo del ambiente en invernaderos del sur
            </Link>
          </details>
        </section>
      )}
    </div>
  );
}
export function GreenhouseOutcome({ attempt }: { attempt: Attempt }) {
  const score = scoreAttempt(attempt);
  return (
    <section className="panel gh-ending">
      <Sprout size={30} />
      <h2>El siguiente turno recibe tu bitácora</h2>
      <p>
        Martina y Teresa reciben tus decisiones y tu explicación.{" "}
        {score === 3
          ? "Completaste las tres rondas relacionando observación, manejo y seguimiento."
          : `Lograste ${score} de las tres rondas; revisa los puntos pendientes antes de repetir el recorrido.`}
      </p>
      <p>
        El caso termina con una mejoría parcial y plantas que requieren
        seguimiento. Cuidar el cultivo también significa reconocer lo que
        todavía no puedes dar por resuelto.
      </p>
    </section>
  );
}

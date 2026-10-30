import { WorkbenchChoices as Choice } from '../WorkbenchChoices';
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  FolderOpen,
  Calculator,
  ClipboardCheck,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import type { Attempt } from "../../progress";
import { missions } from "../../data";
import { normativeReferences } from "../../normativeReferences";
import { CitizenPortrait } from "../coihue/story";
import { ivaFeedback, type IvaAction, type IvaFields } from "./domain";
import { GameReaction } from "../reactions/GameReaction";
import type { ReactionEvent } from "../reactions/reactions";
const money = (value: string | number) =>
  `$${Number(value).toLocaleString("es-CL")}`;
const titles = [
  "La carpeta mezclada",
  "La calculadora del mes",
  "El cierre de Bosque Sur",
  "Explícaselo a Diego",
];
const stories = [
  "La cooperativa Bosque Sur prepara cuadernos para los colegios de Villa del Coihue. Antes de organizar su próxima venta en la Feria del Lago, sus socios le entregan a Diego una carpeta: se mezclaron los documentos de compras y ventas. Te invita a la mesa de trabajo para reconstruir el registro del mes.",
  "Diego ya tiene la carpeta en la mesa. Ahora necesita preparar el cálculo del IVA de las ventas. En la factura aparecen dos montos distintos: elegir la base equivocada cambiaría el resultado. Toma el dato que corresponde y completa tu cálculo.",
  "Llega el momento de preparar el resumen para los socios. Diego encuentra dos fichas de IVA, pero los casilleros del registro están vacíos. Ubica cada ficha, decide cómo relacionarlas y calcula el saldo de este mes.",
  "Diego llevará el registro a la reunión de la cooperativa. Quiere comprender tus decisiones para explicarlas a los socios, no limitarse a repetir un número. Déjale una nota que conecte los documentos, el cálculo y los antecedentes que aún habría que revisar.",
];
function Invoice({
  id,
  calculating = false,
}: {
  id: "a" | "b";
  calculating?: boolean;
}) {
  const purchase = id === "a";
  return (
    <article className="iva-invoice">
      <span className="pill">Documento {id.toUpperCase()}</span>
      <h3>Factura {purchase ? "recibida" : "emitida"}</h3>
      <p>
        {purchase
          ? "La proveedora entrega materiales a Bosque Sur."
          : "Bosque Sur vende cuadernos al comercio del barrio."}
      </p>
      <dl>
        <dt>Neto</dt>
        <dd>{money(purchase ? 100000 : 200000)}</dd>
        <dt>IVA</dt>
        <dd>
          {calculating ? "Por calcular" : money(purchase ? 19000 : 38000)}
        </dd>
        <dt>Total</dt>
        <dd>{money(purchase ? 119000 : 238000)}</dd>
      </dl>
    </article>
  );
}
export function IvaGame({
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
  onAction: (event: IvaAction) => void;
  onNext: () => void;
  evidence: string;
  onEvidence: (value: string) => void;
  onSaveEvidence: () => void;
  onComplete: () => void;
  problem?: ReactNode;
}) {
  const index = attempt.index,
    confirmed = !!attempt.confirmed[index],
    mission = missions.find((m) => m.slug === "mision-iva")!;
  const [started, setStarted] = useState(
    index > 0 || !!attempt.iva || !!attempt.answers[0],
  );
  const [fields, setFields] = useState<IvaFields>(
    attempt.iva?.drafts[index] || {},
  );
  const [selected, setSelected] = useState<"a" | "b">("a");
  const [hint, setHint] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [index]);
  const [reaction, setReaction] = useState<ReactionEvent>();
  const wasConfirmed = useRef(confirmed);
  useEffect(() => {
    if (confirmed && !wasConfirmed.current)
      setReaction({
        id: `${attempt.id}:${index}`,
        type:
          Number(attempt.answers[index]) === mission.steps[index]?.correct
            ? "success"
            : "loss",
        message:
          Number(attempt.answers[index]) === mission.steps[index]?.correct
            ? "¡Encargo logrado!"
            : "Revisemos el registro",
        detail: "Diego guarda tu decisión en el expediente de Bosque Sur.",
      });
    wasConfirmed.current = confirmed;
  }, [confirmed, attempt.id, index, attempt.answers, mission]);
  const disabled = busy || confirmed;
  const set = (key: string, value: string) =>
    setFields((old) => ({ ...old, [key]: value }));
  const correct =
    Number(attempt.answers[index]) === mission.steps[index]?.correct;
  const amount = (
    <label className="field">
      {index === 1 ? "IVA de las ventas, en pesos" : "Saldo del mes, en pesos"}
      <input
        inputMode="numeric"
        type="text"
        pattern="[0-9]*"
        maxLength={9}
        value={fields.amount || ""}
        disabled={disabled}
        onChange={(e) => {
          if (/^\d*$/.test(e.target.value)) set("amount", e.target.value);
        }}
        placeholder="Escribe el monto sin puntos"
      />
    </label>
  );
  return (
    <div className="iva-game">
      {reaction && (
        <GameReaction
          event={reaction}
          onFinished={() => setReaction(undefined)}
        />
      )}
      <div className="iva-hud" aria-label="Avance del expediente">
        <span>
          <FolderOpen /> Bosque Sur
        </span>
        <span>Etapa {index + 1} de 4</span>
        <span>
          {attempt.confirmed.filter(Boolean).length} de 3 encargos entregados
        </span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Avance de Misión IVA"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={index}
      >
        <span style={{ width: `${index * 25}%` }} />
      </div>
      <div className="iva-start">
          {!started && (
            <button className="button" onClick={() => setStarted(true)}>
              Recibir la carpeta y jugar <ArrowRight size={18} />
            </button>
          )}
      </div>
      <section className="panel iva-story">
        <CitizenPortrait character="diego" />
        <div>
          <p className="eyebrow">MISIÓN IVA · COOPERATIVA BOSQUE SUR</p>
          <h1 ref={heading} tabIndex={-1}>
            {!started ? "Una carpeta, muchas decisiones" : titles[index]}
          </h1>
          <p>{stories[index]}</p>
          <blockquote>
            «
            {index === 0
              ? "Ayúdame a ordenar los documentos. Quiero llegar a la reunión con un registro que podamos explicar."
              : index === 1
                ? "¿Qué monto usarías como base? Deja tu cálculo preparado antes de entregarlo."
                : index === 2
                  ? "No quiero sumar o restar por costumbre. Necesito saber qué representa cada cifra."
                  : "¿Por qué descontamos el IVA de compras en este caso y qué revisaríamos antes de hacerlo en otra empresa?"}
            »
          </blockquote>

        </div>
      </section>
      {started && (
        <section className="panel iva-desk" aria-label="Mesa de trabajo de IVA">
          {index === 0 && (
            <>
              <h2>
                <FolderOpen /> Organiza la carpeta
              </h2>
              <p>
                Selecciona un documento y toca su carpeta de destino. También
                puedes arrastrarlo. Revisa ambos antes de entregarlos.
              </p>
              <div className="iva-documents">
                {(["a", "b"] as const).map((id) => (
                  <div
                    key={id}
                    draggable={!disabled}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", id);
                      setSelected(id);
                    }}
                  >
                    <Invoice id={id} />
                    <button
                      className="button secondary"
                      disabled={disabled}
                      aria-pressed={selected === id}
                      onClick={() => setSelected(id)}
                    >
                      Seleccionar documento {id.toUpperCase()}
                    </button>
                    <p role="status">
                      Destino:{" "}
                      {(
                        {
                          purchase: "Compras recibidas",
                          sale: "Ventas emitidas",
                          review: "Por revisar",
                        } as Record<string, string>
                      )[fields[id]] || "Sin archivar"}
                    </p>
                  </div>
                ))}
              </div>
              <div className="iva-folders">
                {[
                  ["purchase", "Compras recibidas"],
                  ["sale", "Ventas emitidas"],
                  ["review", "Por revisar"],
                ].map(([value, label]) => (
                  <button
                    type="button"
                    className="iva-folder"
                    key={value}
                    disabled={disabled}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const id = e.dataTransfer.getData("text/plain");
                      if (!disabled && (id === "a" || id === "b"))
                        set(id, value);
                    }}
                    onClick={() => set(selected, value)}
                  >
                    <FolderOpen />
                    {label}
                    <small>Archivar documento {selected.toUpperCase()}</small>
                  </button>
                ))}
              </div>
            </>
          )}
          {index === 1 && (
            <>
              <h2>
                <Calculator /> Prepara la calculadora
              </h2>
              <div className="iva-workspace">
                <Invoice id="b" calculating />
                <div>
                  <Choice
                    field="base"
                    label="Lleva a la calculadora el monto que usarás como base"
                    options={[
                      ["200000", "Neto: $200.000"],
                      ["238000", "Total: $238.000"],
                    ]}
                    fields={fields}
                    set={set}
                    disabled={disabled}
                  />
                  <div className="iva-formula">
                    {fields.base ? money(fields.base) : "Base por elegir"} ×{" "}
                    {normativeReferences.iva.caseRatePercent}% = ?
                  </div>
                  {amount}
                  <p className="small muted">
                    Puedes usar papel o tu calculadora. Aquí ingresas tu
                    resultado.
                  </p>
                </div>
              </div>
            </>
          )}
          {index === 2 && (
            <>
              <h2>
                <ClipboardCheck /> Reconstruye el registro
              </h2>
              <p>
                Fichas disponibles: IVA de ventas $38.000 e IVA de compras
                admitido $19.000.
              </p>
              <div className="iva-ledger">
                <Choice
                  field="debit"
                  label="Casillero de débito fiscal"
                  options={[
                    ["38000", "IVA de ventas: $38.000"],
                    ["19000", "IVA de compras: $19.000"],
                  ]}
                  fields={fields}
                  set={set}
                  disabled={disabled}
                />
                <Choice
                  field="credit"
                  label="Casillero de crédito fiscal"
                  options={[
                    ["38000", "IVA de ventas: $38.000"],
                    ["19000", "IVA de compras: $19.000"],
                  ]}
                  fields={fields}
                  set={set}
                  disabled={disabled}
                />
              </div>
              <Choice
                field="operation"
                label="¿Cómo construirás el saldo?"
                options={[
                  ["subtract", "Débito menos crédito"],
                  ["add", "Débito más crédito"],
                  ["ignore", "Solo débito"],
                ]}
                fields={fields}
                set={set}
                disabled={disabled}
              />
              {amount}
            </>
          )}
          {problem}
          {confirmed && !attempt.iva?.drafts[index] && (
            <p className="notice">
              Esta decisión se conserva de tu recorrido anterior. Su resultado
              no ha cambiado.
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
                    {correct
                      ? "Encargo logrado"
                      : "Diego encontró una diferencia"}
                  </strong>
                  <p>
                    {attempt.iva?.drafts[index]
                      ? ivaFeedback(index, attempt.iva.drafts[index])
                      : mission.steps[index].feedback[
                          index === 1
                            ? correct
                              ? 1
                              : 0
                            : Number(attempt.answers[index])
                        ]}
                  </p>
                  {!correct && (
                    <p>
                      Esta decisión queda registrada en tu resultado. Podrás
                      mejorarla en un nuevo intento.
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
                  <Lightbulb size={18} />{" "}
                  {hint ? "Ocultar pista" : "Pedir una pista"}
                </button>
                {confirmed ? (
                  <button className="button" disabled={busy} onClick={onNext}>
                    Continuar <ArrowRight size={18} />
                  </button>
                ) : (
                  <>
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() => onAction({ action: "save", fields })}
                    >
                      Guardar preparación
                    </button>
                    <button
                      className="button"
                      disabled={busy}
                      onClick={() => onAction({ action: "check", fields })}
                    >
                      Entregar encargo <CheckCircle2 size={18} />
                    </button>
                  </>
                )}
              </div>
              {hint && <p className="hint">{mission.steps[index].hint}</p>}
              {!confirmed && (
                <p className="small muted">
                  {attempt.iva?.drafts[index] &&
                  JSON.stringify(attempt.iva.drafts[index]) ===
                    JSON.stringify(fields)
                    ? "Preparación guardada. "
                    : "Guarda tu preparación antes de salir. "}
                  Al entregar, la decisión se confirma y contará en tu
                  resultado.
                </p>
              )}
            </>
          ) : (
            <>
              <h2>Tu nota para Diego</h2>
              <p>
                Explica con tus palabras cómo relacionaste el IVA de ventas con
                el IVA de compras admitido y por qué. Menciona qué antecedentes
                revisarías antes de aplicar este cálculo en otra empresa.
              </p>
              <label className="field">
                Explicación para la cooperativa
                <textarea
                  rows={10}
                  maxLength={2500}
                  value={evidence}
                  onChange={(e) => onEvidence(e.target.value)}
                  placeholder="Diego, para preparar el registro del mes…"
                  disabled={busy}
                />
              </label>
              <p className="small muted">
                Escribe al menos 25 caracteres. No incluyas datos personales
                reales. Esta explicación se conserva como evidencia para
                revisión docente; no se evalúa automáticamente.
              </p>
              <div className="task-actions">
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={onSaveEvidence}
                >
                  Guardar mi explicación
                </button>
                <button className="button" disabled={busy} onClick={onComplete}>
                  Cerrar el expediente y ver resultados{" "}
                  <CheckCircle2 size={18} />
                </button>
              </div>
            </>
          )}
          <details className="iva-case">
            <summary>Consultar los datos y límites del caso</summary>
            <p>{mission.context}</p>
            <p>
              Los montos de las facturas están expresados en pesos chilenos.
              Este registro no realiza declaraciones ni pagos. Los Coihues de tu
              progreso se contabilizan por separado.
            </p>
            <dl>
              <dt>Neto</dt>
              <dd>Monto antes de IVA.</dd>
              <dt>Débito fiscal</dt>
              <dd>IVA de ventas del caso.</dd>
              <dt>Crédito fiscal</dt>
              <dd>IVA de compras admitido bajo las condiciones del caso.</dd>
            </dl>
            <Link to="/recursos/iva-sii">Consultar la referencia del SII</Link>
          </details>
        </section>
      )}
    </div>
  );
}
export function IvaOutcome({ attempt }: { attempt: Attempt }) {
  const correct = attempt.confirmed.filter(
    (yes, i) => yes && Number(attempt.answers[i]) === [1, 38000, 1][i],
  ).length;
  return (
    <section className="panel iva-ending">
      <ClipboardCheck size={32} />
      <h2>El expediente vuelve a la cooperativa</h2>
      <p>
        Diego lleva tu registro y tu explicación a la reunión de Bosque Sur.{" "}
        {correct === 3
          ? "Los tres encargos quedaron resueltos y puedes explicar cómo se conectan."
          : `Lograste ${correct} de los tres encargos. Revisa las diferencias antes de preparar un nuevo registro.`}
      </p>
      <p>
        El cierre de referencia del caso es: débito $38.000 − crédito admitido
        $19.000 = saldo $19.000. Tu evidencia queda junto al recorrido para
        revisar tu razonamiento.
      </p>
    </section>
  );
}

import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  bestEvaluation,
  evidenceOutcome,
  type EvidenceEvaluation,
} from "./evaluation";
export function EvaluationCard({
  history = [],
  onContinue,
  onReview,
  disabled = false,
}: {
  history?: EvidenceEvaluation[];
  onContinue?: () => void;
  onReview?: () => void;
  disabled?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const confirmation = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (confirming) confirmation.current?.focus();
  }, [confirming]);
  useEffect(() => setConfirming(false), [history.length]);
  const best = bestEvaluation(history),
    latest = history.at(-1);
  if (!best || !latest) return null;
  const final = best.total >= 80 || history.length >= 3;
  const display = final ? best : latest;
  const title =
    best.total >= 80
      ? "✅ ¡Excelente trabajo!"
      : history.length >= 3
        ? "Evaluación finalizada"
        : display.total >= 60
          ? "🟡 Vas por buen camino"
          : "🔴 Revisemos antes de continuar";
  const message =
    best.total >= 80
      ? "Tu explicación demuestra que comprendiste los principales pasos que Camila debe considerar para comenzar formalmente su actividad."
      : display.total >= 60
        ? "Comprendiste gran parte del proceso, pero hay algunos aspectos que podrías explicar mejor."
        : "Tu respuesta todavía necesita incorporar algunos elementos importantes para ayudar correctamente a Camila.";
  return (
    <section
      className="panel spaced"
      aria-label="Resultado de tu misión"
      aria-live="polite"
    >
      <h2>Resultado de tu misión</h2>
      <p>
        <strong>{best.total} / 100 puntos</strong> · Mejor puntaje ·{" "}
        {evidenceOutcome(history)}
      </p>
      <p>
        Intento {latest.attempt} de 3 · Último resultado: {latest.total}/100
      </p>
      <h3>{title}</h3>
      <p>{message}</p>
      <ul>
        {display.criteria.map((c) => (
          <li key={c.id}>
            {c.points === 20 ? "✅" : c.points >= 10 ? "🟡" : "→"} {c.title}:{" "}
            {c.points}/20
          </li>
        ))}
      </ul>
      {latest !== best && (
        <p>
          Conservas el mejor resultado del intento {best.attempt}: {best.total}
          /100. El desglose y las pistas corresponden a tu{" "}
          {final ? "mejor" : "última"} respuesta.
        </p>
      )}
      {final && best !== latest && (
        <details>
          <summary>Ver la respuesta de tu mejor resultado</summary>
          <blockquote style={{ whiteSpace: "pre-wrap" }}>
            {best.response}
          </blockquote>
        </details>
      )}
      <h3>Lo que hiciste bien</h3>
      {display.strengths.length ? (
        <ul>
          {display.strengths.map((s) => (
            <li key={s}>✓ {s}</li>
          ))}
        </ul>
      ) : (
        <p>
          Ya diste el primer paso al escribir tu nota. Ahora puedes conectar
          mejor las ideas del recorrido.
        </p>
      )}
      {display.improvements.length > 0 && (
        <>
          <h3>Puedes mejorar</h3>
          <ul>
            {display.improvements.map((s) => (
              <li key={s}>→ {s}</li>
            ))}
          </ul>
        </>
      )}
      {best.total < 80 && history.length < 3 && (
        <p>
          Revisa las pistas, vuelve a leer el recorrido de Camila y edita tu
          nota. Te quedan {3 - history.length} intentos. Conservaremos tu mejor
          puntaje.{" "}
        </p>
      )}
      {history.length >= 3 && best.total < 80 && (
        <p>
          Puedes continuar con apoyo. Tu explicación y los aspectos por reforzar
          quedan registrados.
        </p>
      )}
      {onContinue && best.total < 80 && (
        <div className="evidence-choice">
          <p>
            Tu mejor explicación evaluada obtuvo {best.total}/100. Si continúas,
            este resultado se reflejará en tu nota final: la explicación pesa un
            20% y la gestión de recursos un 80%. No se incluyen cambios de texto
            sin evaluar.
          </p>
          {best.total < 60 && (
            <p>
              <strong>
                El resultado de tu explicación es bajo. Te recomendamos volver a
                los contenidos antes de cerrar la misión.
              </strong>
            </p>
          )}
          <div className="valley-actions">
            {onReview ? (
              <button
                className="button secondary"
                disabled={disabled}
                onClick={onReview}
              >
                Volver a los contenidos
              </button>
            ) : (
              <Link
                className="button secondary"
                to="/desafios/inicio-actividades"
              >
                Volver a los contenidos
              </Link>
            )}
            {!confirming && (
              <button
                className="button"
                disabled={disabled}
                onClick={() => setConfirming(true)}
              >
                Continuar con mi resultado
              </button>
            )}
          </div>
          {confirming && (
            <div
              ref={confirmation}
              tabIndex={-1}
              className="notice"
              role="group"
              aria-label="Confirmar cierre con el resultado obtenido"
            >
              <h3>¿Quieres continuar igual?</h3>
              <p>
                Se cerrará este intento con tu mejor respuesta evaluada (
                {best.total}/100), aunque todavía puedas mejorarla. Después
                podrás iniciar otro intento; este resultado quedará registrado.
              </p>
              <div className="valley-actions">
                <button
                  className="button"
                  disabled={disabled}
                  onClick={onContinue}
                >
                  Sí, continuar y finalizar
                </button>
                <button
                  className="button secondary"
                  disabled={disabled}
                  onClick={() => setConfirming(false)}
                >
                  Seguir revisando mi explicación
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <p className="small muted">
        Evaluación automática por relaciones entre conceptos · {latest.version}.
        Puede no reconocer todos los matices de una explicación.
      </p>
    </section>
  );
}

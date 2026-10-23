import { Link } from "react-router-dom";
import {
  bestEvaluation,
  evidenceOutcome,
  type EvidenceEvaluation,
} from "./evaluation";
export function EvaluationCard({
  history = [],
}: {
  history?: EvidenceEvaluation[];
}) {
  const best = bestEvaluation(history),
    latest = history.at(-1);
  if (!best || !latest) return null;
  const final = best.total >= 80 || history.length >= 3;
  const display = final ? best : latest;
  const title =
    best.total >= 80
      ? "✅ ¡Excelente trabajo!"
      : history.length >= 3
        ? "Misión completada con apoyo"
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
          <Link className="text-link" to="/desafios/inicio-actividades">
            Volver al contenido de aprendizaje
          </Link>
        </p>
      )}
      {history.length >= 3 && best.total < 80 && (
        <p>
          Puedes continuar con apoyo. Tu explicación y los aspectos por reforzar
          quedan registrados.
        </p>
      )}
      <p className="small muted">
        Evaluación automática por relaciones entre conceptos · {latest.version}.
        Puede no reconocer todos los matices de una explicación.
      </p>
    </section>
  );
}

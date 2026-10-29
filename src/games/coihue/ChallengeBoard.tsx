import { useState, type DragEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  FileText,
  FolderOpen,
  Globe,
  Landmark,
  Mail,
  MessageCircle,
  Move,
  Search,
} from "lucide-react";
import { Building } from "./Map";
import type { Challenge, Item } from "./content";
import type { Progress } from "./progress";
const orderLabels: Record<string, string> = {
  revisar: "Revisar los antecedentes",
  declarar: "Presentar la declaración",
  pagar: "Pagar si corresponde",
  guardar: "Guardar los comprobantes",
};
const desks = {
  match: {
    title: "Mesa de clasificación",
    instruction:
      "Toma la ficha y arrástrala a su destino. También puedes tocar un destino y confirmar.",
    action: "Archivar ficha",
    Icon: FolderOpen,
  },
  deliver: {
    title: "Reparto del Barrio Cívico",
    instruction:
      "Lee el sobre y entrégalo a la oficina que corresponde. Arrastra o selecciona un buzón.",
    action: "Entregar sobre",
    Icon: Mail,
  },
  explore: {
    title: "Observatorio de la comunidad",
    instruction:
      "Abre un lugar del recorrido, observa lo que ocurre y ubica la observación en su categoría.",
    action: "Registrar observación",
    Icon: Search,
  },
  channel: {
    title: "La tablet de Diego",
    instruction:
      "Revisa el encargo y prepara una ruta. Los portales de esta mesa son parte del juego: no ingreses claves ni realices pagos.",
    action: "Confirmar ruta",
    Icon: Globe,
  },
  case: {
    title: "Puesto de orientación",
    instruction:
      "Escucha al vecino y prepara lo que le dirías. Revisa tu mensaje antes de compartirlo.",
    action: "Compartir orientación",
    Icon: MessageCircle,
  },
};
export default function ChallengeBoard({
  challenge,
  state,
  onAnswer,
}: {
  challenge: Challenge;
  state: Progress;
  onAnswer: (id: string, value: string) => void;
}) {
  const [active, setActive] = useState(() =>
    Math.max(
      0,
      challenge.items.findIndex((i) => !state.answers[i.id]),
    ),
  );
  if (challenge.kind === "order")
    return <Workflow challenge={challenge} state={state} onAnswer={onAnswer} />;
  const desk = desks[challenge.kind],
    item = challenge.items[active] ?? challenge.items[0];
  const checked = challenge.items.filter((i) => state.answers[i.id]).length;
  return (
    <section
      className={`tribute-workshop type-${challenge.kind}`}
      aria-label={desk.title}
    >
      <div className="tribute-workshop-heading">
        <desk.Icon size={26} />
        <div>
          <p className="eyebrow">{desk.title}</p>
          <p>{desk.instruction}</p>
        </div>
        <span className="pill">
          {checked} / {challenge.items.length} revisadas
        </span>
      </div>
      <nav
        className="tribute-inventory"
        aria-label="Encargos de esta investigación"
      >
        {challenge.items.map((task, index) => (
          <button
            key={task.id}
            className={active === index ? "active" : ""}
            aria-pressed={active === index}
            onClick={() => setActive(index)}
          >
            {challenge.kind === "explore" ? (
              <Building kind={task.visual || "shop"} />
            ) : state.answers[task.id]?.correct ? (
              <Check size={20} />
            ) : (
              <FileText size={20} />
            )}
            <span>
              {challenge.kind === "explore"
                ? task.prompt.split(":")[0]
                : `${challenge.kind === "deliver" ? "Sobre" : challenge.kind === "case" ? "Vecino" : "Ficha"} ${index + 1}`}
              <small>
                {state.answers[task.id]?.correct
                  ? "Resuelto"
                  : state.answers[task.id]
                    ? "Por reforzar"
                    : "Por revisar"}
              </small>
            </span>
          </button>
        ))}
      </nav>
      <ActionDesk
        key={item.id}
        item={item}
        kind={challenge.kind}
        answer={state.answers[item.id]}
        onAnswer={onAnswer}
      />
      {active < challenge.items.length - 1 && state.answers[item.id] && (
        <button
          className="button secondary"
          onClick={() => setActive(active + 1)}
        >
          Preparar el siguiente encargo →
        </button>
      )}
    </section>
  );
}
function ActionDesk({
  item,
  kind,
  answer,
  onAnswer,
}: {
  item: Item;
  kind: Exclude<Challenge["kind"], "order">;
  answer: Progress["answers"][string] | undefined;
  onAnswer: (id: string, value: string) => void;
}) {
  const [selected, setSelected] = useState(answer?.value ?? "");
  const [dragging, setDragging] = useState(false);
  const [inspected, setInspected] = useState(kind !== "explore" || !!answer);
  const desk = desks[kind],
    locked = !!answer?.correct;
  const choose = (id: string) => {
    if (!locked) setSelected(id);
  };
  const drop = (e: DragEvent, id: string) => {
    e.preventDefault();
    if (e.dataTransfer.getData("text/plain") === item.id) choose(id);
    setDragging(false);
  };
  return (
    <article className={`tribute-action-desk ${locked ? "solved" : ""}`}>
      {kind === "explore" && !inspected ? (
        <div className="tribute-observation">
          <Building kind={item.visual || "shop"} />
          <h3>{item.prompt.split(":")[0]}</h3>
          <button className="button" onClick={() => setInspected(true)}>
            <Search size={18} />
            Observar este lugar
          </button>
        </div>
      ) : (
        <>
          <div
            className={`tribute-object ${dragging ? "dragging" : ""}`}
            draggable={!locked && kind !== "case" && kind !== "channel"}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", item.id);
              e.dataTransfer.effectAllowed = "move";
              setDragging(true);
            }}
            onDragEnd={() => setDragging(false)}
          >
            {kind === "case" ? (
              <MessageCircle />
            ) : kind === "channel" ? (
              <Globe />
            ) : kind === "explore" ? (
              <Building kind={item.visual || "shop"} />
            ) : kind === "deliver" ? (
              <Mail />
            ) : (
              <FileText />
            )}
            <div>
              <p className="eyebrow">
                {kind === "case"
                  ? "EL VECINO TE PREGUNTA"
                  : kind === "channel"
                    ? "ENCARGO EN LA TABLET"
                    : kind === "explore"
                      ? "TU OBSERVACIÓN"
                      : kind === "deliver"
                        ? "SOLICITUD POR ENTREGAR"
                        : "FICHA DEL EXPEDIENTE"}
              </p>
              <h3>{item.prompt}</h3>
            </div>
            {kind !== "case" && kind !== "channel" && !locked && (
              <Move size={18} aria-label="Puedes arrastrar esta ficha" />
            )}
          </div>
          <div
            className={`tribute-destinations ${kind === "case" ? "tribute-dialogue-options" : ""}`}
            role="group"
            aria-label={`Destinos para: ${item.prompt}`}
          >
            {item.options.map((option) => (
              <button
                key={option.id}
                className={`tribute-destination ${selected === option.id ? "selected" : ""}`}
                aria-pressed={selected === option.id}
                disabled={locked}
                onClick={() => choose(option.id)}
                onDragOver={(e) => {
                  if (!locked) e.preventDefault();
                }}
                onDrop={(e) => drop(e, option.id)}
              >
                {kind === "deliver" ? (
                  <Landmark />
                ) : kind === "channel" ? (
                  <Globe />
                ) : kind === "case" ? (
                  <MessageCircle />
                ) : (
                  <FolderOpen />
                )}
                <span>{option.label}</span>
                {selected === option.id && <Check size={18} />}
              </button>
            ))}
          </div>
          <div className="tribute-confirm">
            <p aria-live="polite">
              {locked
                ? "Encargo resuelto. Puedes preparar el siguiente."
                : selected
                  ? `Has preparado: ${item.options.find((o) => o.id === selected)?.label}. Confirma tu decisión.`
                  : "Prepara un destino o una respuesta antes de confirmar."}
            </p>
            <button
              className="button"
              disabled={!selected || locked}
              onClick={() => onAnswer(item.id, selected)}
            >
              {desk.action}
              <Check size={18} />
            </button>
          </div>
        </>
      )}
      {answer && <Feedback item={item} answer={answer} />}
    </article>
  );
}
function Feedback({
  item,
  answer,
}: {
  item: Item;
  answer: NonNullable<Progress["answers"][string]>;
}) {
  return (
    <div
      className={`valley-feedback ${answer.correct ? "good" : "review"}`}
      role="status"
    >
      <strong>
        {answer.correct
          ? "✓ Encargo resuelto."
          : "↻ Detente y revisa tu decisión."}
      </strong>
      <p>
        {answer.correct
          ? item.explanation
          : item.options.find((o) => o.id === answer.value)?.feedback}
      </p>
      {!answer.correct && (
        <p>
          Puedes preparar otra decisión o continuar con esta idea por reforzar.
          Tu pasaporte distinguirá ambas situaciones.
        </p>
      )}
      {answer.assisted && (
        <span className="valley-support">Con apoyo registrado</span>
      )}
    </div>
  );
}
function Workflow({
  challenge,
  state,
  onAnswer,
}: {
  challenge: Challenge;
  state: Progress;
  onAnswer: (id: string, value: string) => void;
}) {
  const item = challenge.items[0],
    result = state.answers[item.id];
  const [order, setOrder] = useState(
    () =>
      result?.value.split(",") || ["guardar", "pagar", "revisar", "declarar"],
  );
  const [dragged, setDragged] = useState<string | null>(null);
  const move = (from: number, to: number) => {
    if (result?.correct || from === to) return;
    const next = [...order];
    next.splice(to, 0, next.splice(from, 1)[0]);
    setOrder(next);
  };
  return (
    <section className="tribute-workshop" aria-label="Mesa de trabajo de Rosa">
      <div className="tribute-workshop-heading">
        <FolderOpen size={26} />
        <div>
          <p className="eyebrow">MESA DE TRABAJO · ROSA</p>
          <h3>Construye la ruta de su carpeta</h3>
          <p>
            Arrastra los documentos al lugar que les corresponde en la
            secuencia. También puedes usar los botones subir y bajar.
          </p>
        </div>
      </div>
      <ol className="tribute-workflow">
        {order.map((id, index) => (
          <li
            key={id}
            draggable={!result?.correct}
            onDragStart={(e) => {
              setDragged(id);
              e.dataTransfer.setData("text/plain", id);
            }}
            onDragEnd={() => setDragged(null)}
            onDragOver={(e) => {
              if (!result?.correct) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragged && e.dataTransfer.getData("text/plain") === dragged)
                move(order.indexOf(dragged), index);
              setDragged(null);
            }}
          >
            <span className="valley-number">{index + 1}</span>
            <FileText />
            <strong>{orderLabels[id]}</strong>
            <div>
              <button
                className="button secondary"
                aria-label={`Subir: ${orderLabels[id]}`}
                disabled={index === 0 || !!result?.correct}
                onClick={() => move(index, index - 1)}
              >
                <ArrowUp size={18} />
              </button>
              <button
                className="button secondary"
                aria-label={`Bajar: ${orderLabels[id]}`}
                disabled={index === order.length - 1 || !!result?.correct}
                onClick={() => move(index, index + 1)}
              >
                <ArrowDown size={18} />
              </button>
            </div>
          </li>
        ))}
      </ol>
      <button
        className="button"
        disabled={!!result?.correct}
        onClick={() => onAnswer(item.id, order.join(","))}
      >
        Comprobar orden <Check size={18} />
      </button>
      {result && (
        <div
          className={`valley-feedback ${result.correct ? "good" : "review"}`}
          role="status"
        >
          <strong>
            {result.correct
              ? "✓ Carpeta organizada."
              : "↻ La carpeta todavía necesita revisión."}
          </strong>
          <p>{item.explanation}</p>
          {!result.correct && (
            <p>
              Vuelve a consultar el encargo y reorganiza los documentos antes de
              comprobar de nuevo.
            </p>
          )}
          {result.assisted && (
            <span className="valley-support">Con apoyo registrado</span>
          )}
        </div>
      )}
    </section>
  );
}

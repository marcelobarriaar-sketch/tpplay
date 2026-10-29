import { useEffect, useRef, useState } from "react";
import { GameReaction } from "../reactions/GameReaction";
import { enqueueReactions, type ReactionEvent } from "../reactions/reactions";
import { tributeReactions } from "./reactions";
import { Award, BookOpen, CheckCircle2, Compass, Flag } from "lucide-react";
import { characters, places, type CharacterId } from "./world";
import { concepts, missions, type Mission } from "./content";
import { completed, learning, type Progress } from "./progress";

export const chapters: Record<
  string,
  { setup: string; request: string; goal: string; ending: string }
> = {
  pagos: {
    setup:
      "La Feria del Lago está a punto de abrir. Emilia prepara el puesto de orientación de la plaza cuando llegan tres vecinos con sus comprobantes. Todos han entregado dinero, pero cada uno cuenta una historia diferente. Si el equipo los confunde, la información de la feria partirá con un error.",
    request:
      "«Ayúdame a ordenar estas historias antes de recibir a los visitantes. Necesitamos comprender por qué se realizó cada pago».",
    goal: "Reconstruir las historias de la plaza y orientar a un nuevo vecino.",
    ending:
      "La mesa de la plaza ya tiene sus primeras historias ordenadas. Emilia guarda tus fichas en el pasaporte y te invita a mirar cómo se sostiene la vida de la comunidad.",
  },
  comunidad: {
    setup:
      "Sofía te espera en el mirador del Parque Los Volcanes. Desde allí se ven la escuela, el centro de salud, los senderos y los comercios. En la feria alguien ha dicho que cada impuesto compra un beneficio personal; antes de preparar el panel del barrio, Sofía quiere contrastar esa idea contigo.",
    request:
      "«Observa la ciudad. ¿Qué necesidades compartimos y qué decisiones corresponden a una compra personal? Construyamos una explicación que ayude a los vecinos».",
    goal: "Observar cuatro lugares y preparar la explicación para el panel comunitario.",
    ending:
      "El panel del mirador permite distinguir necesidades compartidas y compras personales. Sofía te entrega una nueva insignia; en la biblioteca necesitan ayuda para ordenar los conceptos.",
  },
  archivo: {
    setup:
      "En la Biblioteca del Valle, Elisa prepara un archivo de consulta para la feria. Durante el traslado se mezclaron las fichas y algunas palabras parecidas quedaron juntas aunque no significan lo mismo. Los vecinos necesitan explicaciones claras, no etiquetas elegidas solo por su nombre.",
    request:
      "«Ayúdame a reconstruir los estantes. Después comprobaremos las fichas con las dudas de nuestros visitantes».",
    goal: "Organizar el archivo y aplicar las distinciones a situaciones nuevas.",
    ending:
      "Elisa vuelve a abrir el archivo de consulta. Tus decisiones quedan en el pasaporte y las ideas que requieren apoyo tendrán otra oportunidad de ponerse a prueba.",
  },
  cartas: {
    setup:
      "Una ráfaga de viento cruzó el Barrio Cívico y mezcló la correspondencia que Tomás debía repartir. Hay consultas sobre declaraciones, deudas y permisos comerciales. Entregar un sobre a la oficina equivocada dejaría a un vecino esperando una respuesta que no corresponde a ese lugar.",
    request:
      "«Lee cada solicitud y ayúdame a encontrar su destino. Lo importante no es reconocer el edificio, sino comprender qué puede resolver cada institución».",
    goal: "Repartir las solicitudes entre SII, Tesorería y Municipalidad.",
    ending:
      "La correspondencia ya tiene destino. Tomás anota las entregas en tu pasaporte y te cuenta que Rosa necesita ordenar los documentos de su puesto del mercado.",
  },
  tramites: {
    setup:
      "Rosa está preparando su puesto del Mercado del Lago. Sobre el mesón hay antecedentes, una constancia de declaración y un comprobante de pago. Al mirar los papeles, se da cuenta de que no sabe qué acredita cada uno ni si su carpeta está completa.",
    request:
      "«Presenté una declaración, pero no quiero dar por hecho lo que todavía debo revisar. ¿Me ayudas a ordenar los pasos y los respaldos?».",
    goal: "Armar la secuencia del trámite y revisar qué acredita cada documento.",
    ending:
      "La carpeta de Rosa vuelve a estar ordenada. Ella puede distinguir cada respaldo y las gestiones pendientes. Tu siguiente parada es el Paseo de los Emprendedores.",
  },
  canales: {
    setup:
      "Diego instaló una mesa con una tablet en el Paseo de los Emprendedores. Los vecinos llegan con trámites diferentes y enlaces recibidos por distintos medios. Abrir cualquier página por apuro puede desviar la gestión; hace falta reconocer el canal y comprobar los antecedentes.",
    request:
      "«Acompáñame a revisar cada encargo. Elijamos con cuidado dónde buscar orientación y qué hacer frente a un aviso pendiente».",
    goal: "Construir una ruta de canales oficiales y revisar una obligación vencida.",
    ending:
      "La mesa digital está lista para orientar a los vecinos. Diego guarda las rutas revisadas y te invita al último encuentro: la Feria del Lago.",
  },
  feria: {
    setup:
      "La Feria del Lago abre sus puertas. Emilia reúne el material que construiste durante el recorrido y te invita a atender el puesto de orientación. Llegan visitantes con nuevas historias: ahora tendrás que conectar lo aprendido sin depender de que el caso sea igual al anterior.",
    request:
      "«Ya conoces el valle. Escucha a cada visitante, revisa sus antecedentes y explica tu decisión. Si necesitas apoyo, tu pasaporte y el glosario siguen contigo».",
    goal: "Integrar lo aprendido y orientar a los nuevos visitantes de la feria.",
    ending:
      "El puesto de orientación ya puede acompañar a los visitantes. Completaste el recorrido de la feria; tu pasaporte muestra tanto tus avances como las ideas que puedes seguir fortaleciendo.",
  },
};
const cast: Record<string, number> = {
  emilia: 0,
  sofia: 1,
  elisa: 2,
  tomas: 3,
  rosa: 4,
  diego: 5,
};
export function CitizenPortrait({ character }: { character: CharacterId }) {
  const index = cast[character] ?? 0;
  return (
    <div className="tribute-portrait">
      <img
        src="/images/tributos-vecinos.webp"
        alt={`${characters[character].name}, ${characters[character].role.toLowerCase()}.`}
        width="1800"
        height="1800"
        style={{
          transform: `translate(-${((index % 3) * 100) / 3}%, -${Math.floor(index / 3) * 50}%)`,
        }}
      />
    </div>
  );
}
export function ChapterBrief({
  mission,
  onBegin,
  disabled,
}: {
  mission: Mission;
  onBegin: () => void;
  disabled: boolean;
}) {
  const chapter = chapters[mission.id],
    person = characters[mission.character];
  return (
    <div className="tribute-brief">
      <CitizenPortrait character={mission.character} />
      <div>
        <p className="eyebrow">
          EL ENCARGO · {places.find((p) => p.id === mission.place)?.name}
        </p>
        <h2>{person.name} necesita tu ayuda</h2>
        <p>{chapter.setup}</p>
        <blockquote>{chapter.request}</blockquote>
        <p>
          <strong>Tu objetivo:</strong> {chapter.goal}
        </p>
        <button className="button" disabled={disabled} onClick={onBegin}>
          Comenzar investigación <Compass size={18} />
        </button>
        <details className="valley-explanations">
          <summary>Preparar el encargo · contenidos para comenzar</summary>
          {mission.lesson.map((text, i) => (
            <p key={i}>{text}</p>
          ))}
        </details>
      </div>
    </div>
  );
}
export function TributeHUD({ state }: { state: Progress }) {
  const done = missions.filter((m) => completed(state, m.id)).length;
  const active = missions.findIndex((m) => m.id === state.active);
  const understood = concepts.filter(
    (c) => learning(state, c.id) === "Comprendido",
  ).length;
  return (
    <section
      className="simulation-hud tribute-hud"
      aria-label="Estado de tu recorrido"
    >
      <div>
        <Compass />
        <span>
          Capítulo
          <strong>
            {active < 0
              ? "Mapa del valle"
              : `${active + 1} de ${missions.length}`}
          </strong>
        </span>
      </div>
      <div>
        <CheckCircle2 />
        <span>
          Decisiones comprobadas
          <strong>{Object.keys(state.answers).length}</strong>
        </span>
      </div>
      <div>
        <Flag />
        <span>
          Capítulos completados
          <strong>
            {done} / {missions.length}
          </strong>
        </span>
      </div>
      <div>
        <BookOpen />
        <span>
          Conceptos comprendidos
          <strong>
            {understood} / {concepts.length}
          </strong>
        </span>
      </div>
      <div>
        <Award />
        <span>
          Insignias<strong>{done}</strong>
        </span>
      </div>
    </section>
  );
}

export function TributeReactions({ state }: { state: Progress }) {
  const previous = useRef(state);
  const [queue, setQueue] = useState<ReactionEvent[]>([]);
  useEffect(() => {
    const before = previous.current;
    previous.current = state;
    if (!state.started) {
      setQueue([]);
      return;
    }
    const incoming = tributeReactions(before, state);
    if (incoming.length)
      setQueue((current) => enqueueReactions(current, incoming));
  }, [state]);
  return queue[0] ? (
    <GameReaction
      key={queue[0].id}
      event={queue[0]}
      onFinished={() => setQueue((current) => current.slice(1))}
    />
  ) : null;
}

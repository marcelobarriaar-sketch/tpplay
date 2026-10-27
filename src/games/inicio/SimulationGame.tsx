import { useState } from "react";
import { ReactionQueue } from "../reactions/GameReaction";
import {
  Landmark,
  Building2,
  Wallet,
  Laptop,
  Truck,
  FileText,
  Sparkles,
  Heart,
  CalendarDays,
  Award,
  MapPin,
  ArrowRight,
  Check,
  MessageCircle,
  FolderOpen,
} from "lucide-react";
import type { Attempt } from "../../progress";
import {
  openingMission as mission,
  openingPlaces,
  openingDocuments,
  simulationSummary,
  type SimulationAction,
} from "./simulation";
import { CamilaPortrait } from "./story";
import { decisionImpact } from "./economy";
import { inicioSteps } from "./content";
export function GameHUD({ attempt }: { attempt: Attempt }) {
  const h = simulationSummary(attempt);
  return (
    <section className="simulation-hud" aria-label="Estado del negocio">
      <div>
        <Wallet size={19} />
        <span>
          Caja disponible<strong>${h.balance} Coihues</strong>
        </span>
      </div>
      <div>
        <Sparkles size={19} />
        <span>
          XP de gestión<strong>{h.xp} XP</strong>
        </span>
      </div>
      <div>
        <Heart size={19} />
        <span>
          Reputación<strong>{h.reputation}%</strong>
        </span>
      </div>
      <div>
        <CalendarDays size={19} />
        <span>
          Etapa {Math.min(attempt.index + 1, 9)}
          <strong>Jornada {h.day}</strong>
        </span>
      </div>
      <div>
        <Award size={19} />
        <span>
          Insignias<strong>{h.badges.length}</strong>
        </span>
      </div>
    </section>
  );
}
const placeIcons = {
  landmark: Landmark,
  building: Building2,
  bank: Wallet,
  laptop: Laptop,
  truck: Truck,
  file: FileText,
};
export function OpeningSimulation({
  attempt,
  onAction,
  onNext,
  busy = false,
}: {
  attempt: Attempt;
  onAction: (event: SimulationAction) => void;
  onNext: () => void;
  busy?: boolean;
}) {
  const s = attempt.simulation!,
    h = simulationSummary(attempt);
  const [place, setPlace] = useState(""),
    [document, setDocument] = useState("");
  const active = openingPlaces.find((p) => p.id === place);
  const good = attempt.answers[0] === "0";
  const impact = decisionImpact(0, attempt.answers[0] || "");
  const action = (event: SimulationAction) => {
    if (!busy) onAction(event);
  };
  return (
    <section
      className="simulation-game"
      aria-label="Simulación empresarial: El encargo de Camila"
    >
      <ReactionQueue attempt={attempt} />
      <div className="simulation-heading">
        <span className="pill">MISIÓN 01 · {mission.mission}</span>
        <span className="muted">La Mesa del Coihue · {mission.scenario}</span>
      </div>
      <h1>{mission.title}</h1>
      <div className="simulation-progress" aria-label="Tareas del encargo">
        {[
          "Escuchar a Camila",
          "Elegir la gestión",
          "Separar los pendientes",
          "Preparar el encargo",
        ].map((t, i) => (
          <span className={h.tasks[i] ? "done" : ""} key={t}>
            {h.tasks[i] ? <Check size={15} /> : <span>{i + 1}</span>}
            {t}
          </span>
        ))}
      </div>
      {s.phase === "briefing" && (
        <div className="simulation-intro">
          <CamilaPortrait
            look={0}
            alt="Camila, con delantal en La Mesa del Coihue, antes de abrir."
          />
          <div>
            <p className="eyebrow">EL LOCAL AÚN ESTÁ CERRADO</p>
            <h2>Un restaurante listo. Un primer paso por ordenar.</h2>
            <p>
              Camila está próxima a levantar la cortina de{" "}
              <strong>La Mesa del Coihue</strong>. Tiene el local, las mesas y
              sus recetas listas. Antes de recibir clientes, necesita ordenar
              los trámites para poner en marcha su negocio.
            </p>
            <blockquote>
              «Sé preparar un buen almuerzo. ¿Me ayudas a organizar lo que falta
              para abrir?»
            </blockquote>
            <p>
              Tu encargo: identificar la primera gestión tributaria y
              distinguirla de los otros permisos. Cuentas con{" "}
              <strong>$300 Coihues</strong> para todo el recorrido. Los desvíos
              pueden consumir dinero y jornadas de preparación.
            </p>
            <button
              className="button"
              disabled={busy}
              onClick={() => action({ action: "begin" })}
            >
              Conversar con Camila <MessageCircle size={18} />
            </button>
            <p className="small muted">
              Sin reloj ni vidas. Cada acción confirmada queda guardada. Los XP
              de gestión describen este recorrido; el saldo personal de Coihues
              conserva sus reglas.
            </p>
          </div>
        </div>
      )}
      {s.phase === "dialogue" && (
        <div className="simulation-dialogue">
          <CamilaPortrait
            look={0}
            alt="Camila conversa contigo en el restaurante."
          />
          <div>
            <p className="eyebrow">DIÁLOGO · CAMILA</p>
            <h2>Antes de salir, escucha el encargo.</h2>
            <p>
              Explora los dos asuntos de la conversación y reúne la información
              para acompañarla.
            </p>
            <div className="valley-actions">
              <button
                className="button secondary"
                disabled={busy || s.facts.includes("business")}
                onClick={() => action({ action: "talk", value: "business" })}
              >
                ¿Qué hará tu negocio?
              </button>
              <button
                className="button secondary"
                disabled={busy || s.facts.includes("pending")}
                onClick={() => action({ action: "talk", value: "pending" })}
              >
                ¿Qué tienes pendiente?
              </button>
            </div>
            {s.facts.includes("business") && (
              <blockquote>
                Camila: «Prepararé y venderé comidas. El negocio lo iniciaré
                como persona natural; no estoy ofreciendo una asesoría
                profesional».
              </blockquote>
            )}
            {s.facts.includes("pending") && (
              <blockquote>
                Camila: «Todavía no presento el aviso de inicio de actividades.
                También tengo que revisar los permisos del restaurante. No
                quiero confundir unos con otros».
              </blockquote>
            )}
            <button
              className="button"
              disabled={busy || s.facts.length !== 2}
              onClick={() => action({ action: "map" })}
            >
              Salir al Barrio Cívico <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
      {s.phase === "map" && (
        <>
          <p className="eyebrow">ELIGE TU RECORRIDO</p>
          <h2>¿A dónde llevamos el encargo?</h2>
          <p>
            Explora los lugares y revisa qué gestión ofrecen. El costo aparece
            antes de confirmar tu recorrido.
          </p>
          <div
            className="simulation-map"
            role="group"
            aria-label="Mapa del Barrio Cívico"
          >
            {openingPlaces.map((p) => {
              const Icon = placeIcons[p.icon];
              return (
                <button
                  className={`simulation-place ${place === p.id ? "selected" : ""}`}
                  style={{ gridColumn: p.col, gridRow: p.row }}
                  key={p.id}
                  aria-pressed={place === p.id}
                  disabled={busy}
                  onClick={() => setPlace(p.id)}
                >
                  <Icon size={30} />
                  <span>{p.title}</span>
                </button>
              );
            })}
            <div className="simulation-map-street" aria-hidden="true">
              Barrio Cívico · Avenida Coihue
            </div>
          </div>
          <div className="simulation-location" aria-live="polite">
            {active ? (
              <>
                <h3>
                  <MapPin size={20} /> {active.title}
                </h3>
                <p>{active.description}</p>
                {"answer" in active ? (
                  <>
                    <p className="simulation-cost">
                      Costo de esta gestión:{" "}
                      <strong>
                        ${decisionImpact(0, active.answer)?.cost || 0} Coihues
                      </strong>
                      .{" "}
                      {active.answer === "0"
                        ? "Conservas recursos para el expediente."
                        : "Incluye traslado o corrección del encargo si la gestión no corresponde."}
                    </p>
                    <button
                      className="button"
                      disabled={busy}
                      onClick={() =>
                        action({ action: "travel", value: active.id })
                      }
                    >
                      Confirmar este recorrido <ArrowRight size={18} />
                    </button>
                  </>
                ) : (
                  <p className="notice">
                    Exploración de orientación, sin costo. Este lugar no recibe
                    el aviso tributario; el encargo sigue pendiente. Selecciona
                    otra gestión en el mapa.
                  </p>
                )}
              </>
            ) : (
              <p>
                Selecciona un lugar del mapa para explorarlo. Todavía no has
                gastado recursos.
              </p>
            )}
          </div>
        </>
      )}
      {s.phase === "consequence" && (
        <div
          className={`simulation-consequence ${good ? "positive" : "detour"}`}
        >
          <p className="eyebrow">LA DECISIÓN MUEVE LA HISTORIA</p>
          <h2>
            {good
              ? "Camila encuentra el primer camino."
              : "El recorrido deja una gestión pendiente."}
          </h2>
          <p>
            {good
              ? "Paula ayuda a ordenar el encargo al SII. Camila conserva su presupuesto y comprende que aún deberá consultar por separado los permisos del restaurante."
              : attempt.answers[0] === "1"
                ? "En la municipalidad, Camila consulta por su patente. Al organizar el aviso tributario descubre que esa gestión no comunica automáticamente el inicio de actividades al SII. Debe reorganizar su agenda."
                : "La ficha de honorarios describe un servicio profesional. Al contrastarla con la preparación y venta de comidas, Camila descubre que el encargo no corresponde a su negocio. Hay que corregirlo."}
          </p>
          <div className="simulation-deltas">
            <span>
              Caja: {impact?.cost ? `−$${impact.cost}` : "$0 de gasto"} Coihues
            </span>
            <span>Reputación: {good ? "+10" : "−12"} puntos</span>
            <span>
              {good ? "Jornada conservada" : "Una jornada adicional de gestión"}
            </span>
          </div>
          <details>
            <summary>Entender qué ocurrió</summary>
            <p>{inicioSteps[0].feedback[Number(attempt.answers[0])]}</p>
            <p>
              Los gastos representan recursos del negocio dentro del recorrido;
              no son aranceles ni multas del SII.
            </p>
          </details>
          <button
            className="button"
            disabled={busy}
            onClick={() => action({ action: "investigate" })}
          >
            Abrir la carpeta de pendientes <FolderOpen size={18} />
          </button>
        </div>
      )}
      {s.phase === "folder" && (
        <>
          <p className="eyebrow">CARPETA DE CAMILA</p>
          <h2>Cada gestión, en la institución que corresponde.</h2>
          <p>
            Arrastra cada tarjeta a su bandeja. También puedes tocar una tarjeta
            y después su destino, o usar Tab y Enter.
          </p>
          <div className="simulation-document-tray">
            {openingDocuments.map((d) => (
              <button
                draggable={!busy}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", d.id);
                  setDocument(d.id);
                }}
                key={d.id}
                className={`simulation-document ${document === d.id ? "selected" : ""}`}
                aria-pressed={document === d.id}
                disabled={busy}
                onClick={() => setDocument(d.id)}
              >
                <FileText size={25} />
                <strong>{d.title}</strong>
                <span>{d.description}</span>
                <small>
                  {s.folder[d.id]
                    ? `En bandeja: ${s.folder[d.id] === "sii" ? "SII" : "Municipalidad"}`
                    : "Sin asignar"}
                </small>
              </button>
            ))}
          </div>
          <div className="simulation-folders">
            {[
              { id: "sii", title: "SII · Gestión tributaria" },
              {
                id: "municipality",
                title: "Municipalidad · Permisos del local",
              },
            ].map((f) => (
              <button
                className="simulation-folder"
                key={f.id}
                disabled={busy}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const value = e.dataTransfer.getData("text/plain");
                  if (openingDocuments.some((d) => d.id === value))
                    action({ action: "place", value, target: f.id });
                }}
                onClick={() => {
                  if (document)
                    action({ action: "place", value: document, target: f.id });
                }}
              >
                <FolderOpen size={32} />
                <strong>{f.title}</strong>
                <span>
                  {openingDocuments
                    .filter((d) => s.folder[d.id] === f.id)
                    .map((d) => d.title)
                    .join(" · ") || "Coloca aquí la gestión"}
                </span>
              </button>
            ))}
          </div>
          {s.notice && (
            <p className="notice" role="status">
              {s.notice} Reputación: −4 puntos; se suma una jornada de revisión.
            </p>
          )}
          <button
            className="button"
            disabled={busy || !s.folder.notice || !s.folder.permit}
            onClick={() => action({ action: "prepare" })}
          >
            Revisar la carpeta con Paula
          </button>
        </>
      )}
      {s.phase === "desk" && (
        <div className="simulation-workdesk">
          <div className="simulation-desk-header">
            <Landmark size={32} />
            <div>
              <p className="eyebrow">MESA DE GESTIÓN · PAULA</p>
              <h2>Prepara la ficha del encargo.</h2>
            </div>
          </div>
          <p>
            Usa lo que contó Camila. Esta ficha organiza la tarea; el expediente
            completo se revisará en las siguientes etapas. No ingresa
            información al SII.
          </p>
          <aside className="case-note">
            <strong>Apunte de Camila</strong>
            <p>
              «Iniciaré el negocio como persona natural. Prepararé y venderé
              comidas en La Mesa del Coihue; todavía no presento el aviso de
              inicio».
            </p>
          </aside>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action({ action: "submit" });
            }}
          >
            <fieldset disabled={busy} className="simulation-fields">
              <legend>
                Ficha del negocio · sin datos personales del alumno
              </legend>
              <label className="field">
                Quién inicia el negocio
                <select
                  required
                  value={s.draft?.person || ""}
                  onChange={(e) =>
                    action({
                      action: "draft",
                      value: "person",
                      target: e.target.value,
                    })
                  }
                >
                  <option value="" disabled>
                    Selecciona según el encargo
                  </option>
                  <option value="natural">Camila como persona natural</option>
                  <option value="company">Una sociedad ya constituida</option>
                </select>
              </label>
              <label className="field">
                Actividad que realizará
                <select
                  required
                  value={s.draft?.activity || ""}
                  onChange={(e) =>
                    action({
                      action: "draft",
                      value: "activity",
                      target: e.target.value,
                    })
                  }
                >
                  <option value="" disabled>
                    Describe la actividad observada
                  </option>
                  <option value="meals">Preparación y venta de comidas</option>
                  <option value="transport">Transporte de pasajeros</option>
                  <option value="professional">Asesorías profesionales</option>
                </select>
              </label>
              <label className="field">
                Gestión tributaria que prepararás
                <select
                  required
                  value={s.draft?.procedure || ""}
                  onChange={(e) =>
                    action({
                      action: "draft",
                      value: "procedure",
                      target: e.target.value,
                    })
                  }
                >
                  <option value="" disabled>
                    Selecciona el trámite del encargo
                  </option>
                  <option value="start">
                    Aviso de inicio de actividades al SII
                  </option>
                  <option value="permit">
                    Patente municipal como único aviso
                  </option>
                  <option value="honorarios">
                    Boleta de honorarios por las comidas
                  </option>
                </select>
              </label>
              {s.notice && (
                <p className="notice" role="status">
                  {s.notice} Reputación: −4 puntos; una jornada de revisión
                  adicional.
                </p>
              )}
              <button className="button" type="submit">
                Presentar el encargo a Paula
              </button>
            </fieldset>
          </form>
        </div>
      )}
      {s.phase === "reward" && (
        <div className="simulation-reward">
          <Award size={58} />
          <p className="eyebrow">MISIÓN 01 COMPLETADA</p>
          <h2>Camila ya sabe qué paso organizar.</h2>
          <p>
            «Ahora distingo lo que debo informar al SII de los permisos que
            revisaré con otras instituciones. Sigamos con mi expediente».
          </p>
          <div className="simulation-reward-grid">
            <div>
              <strong>
                +{good ? mission.xp.success : mission.xp.repair} XP
              </strong>
              <span>Gestión del encargo</span>
            </div>
            <div>
              <strong>${h.balance} Coihues</strong>
              <span>Caja restante del recorrido</span>
            </div>
            <div>
              <strong>{h.reputation}%</strong>
              <span>Reputación</span>
            </div>
            <div>
              <strong>{mission.badge.name}</strong>
              <span>Insignia desbloqueada</span>
            </div>
          </div>
          <details>
            <summary>Entender el resultado del encargo</summary>
            <p>{mission.feedback}</p>
            <p>
              {good
                ? "Elegiste la gestión inicial adecuada."
                : "El desvío conserva su costo y su registro. La carpeta corregida te permite continuar sin borrar lo ocurrido."}{" "}
              Quedan siete decisiones y una nota final en el desafío; la nota
              escolar conserva la escala y las reglas del curso.
            </p>
          </details>
          <button className="button" disabled={busy} onClick={onNext}>
            Continuar: Dos puertas, un mismo servicio <ArrowRight size={18} />
          </button>
        </div>
      )}
      {busy && (
        <p className="simulation-saving" role="status">
          Guardando tu acción…
        </p>
      )}
    </section>
  );
}

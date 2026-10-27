import {
  useState,
  useRef,
  useEffect,
  type ReactNode,
  type DragEvent,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Archive,
  Building2,
  Check,
  FileText,
  Laptop,
  Mail,
  MapPin,
  ShieldCheck,
  Utensils,
} from "lucide-react";
import type { Attempt } from "../../progress";
import { inicioSteps, dossierCards } from "./content";
import { CamilaChapter } from "./story";
import { BusinessBudget } from "./Budget";
import { budgetSummary, decisionImpact } from "./economy";
import {
  managementStages,
  managementRecord,
  managementAnswer,
  savedManagementFields,
  type ManagementAction,
} from "./management";

function Tile({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`management-tile ${selected ? "selected" : ""}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      {children}
      {selected && <Check size={17} aria-hidden="true" />}
    </button>
  );
}
export function ManagementGame({
  attempt,
  onAction,
  onConfirm,
  onNext,
  busy = false,
}: {
  attempt: Attempt;
  onAction: (event: ManagementAction) => void;
  onConfirm: () => void;
  onNext: () => void;
  busy?: boolean;
}) {
  const index = attempt.index,
    config = managementStages[index],
    step = inicioSteps[index],
    f = savedManagementFields(attempt),
    confirmed = !!attempt.confirmed[index];
  const [document, setDocument] = useState(""),
    [month, setMonth] = useState("");
  const heading = useRef<HTMLHeadingElement>(null),
    consequence = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = confirmed ? consequence.current : heading.current;
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "start" });
  }, [index, confirmed]);
  const answer = managementAnswer(index, f),
    impact = decisionImpact(index, answer),
    budget = budgetSummary(attempt);
  const set = (field: string, value: string) => {
    if (!busy && !confirmed) onAction({ field, value });
  };
  const toggle = (field: string) => set(field, f[field] === "1" ? "0" : "1");
  const destination = (id: string) => {
    if (document) set(document, id);
  };
  const drop = (e: DragEvent, where: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (dossierCards.some((d) => d.id === id)) set(id, where);
  };
  const correct = confirmed && Number(attempt.answers[index]) === step.correct;
  return (
    <section className="management-game" aria-labelledby="management-title">
      <p className="eyebrow">
        MISIÓN {index + 1} DE 9 · {config.mechanic}
      </p>
      <h1 ref={heading} tabIndex={-1} id="management-title">
        {step.title}
      </h1>
      <div
        className="management-progress"
        role="progressbar"
        aria-label="Avance del expediente"
        aria-valuemin={0}
        aria-valuemax={9}
        aria-valuenow={index + (confirmed ? 1 : 0)}
      >
        <span
          style={{ width: `${((index + (confirmed ? 1 : 0)) / 9) * 100}%` }}
        />
      </div>
      <CamilaChapter index={index} />
      {index > 1 && attempt.confirmed[index - 1] && (
        <p className="management-continuity">
          {Number(attempt.answers[index - 1]) === inicioSteps[index - 1].correct
            ? "La gestión anterior dejó un antecedente útil para este encargo."
            : "La gestión anterior dejó una corrección pendiente. Consulta sus antecedentes antes de decidir."}{" "}
          Caja actual: <strong>${budget.balance} Coihues</strong>.
        </p>
      )}
      <section className="panel management-workspace">
        <h2>Tu encargo</h2>
        <p>{config.task}</p>
        <details>
          <summary>Consultar los antecedentes del caso</summary>
          <p>{step.context}</p>
        </details>
        {!confirmed && (
          <fieldset disabled={busy} className="management-controls">
            <legend className="sr-only">Acciones de {step.title}</legend>
            {index === 1 && (
              <>
                <p className="management-dialogue">
                  <strong>Paula, oficina del SII:</strong> «Puedes pedir
                  orientación aquí y trabajar por internet desde el terminal o
                  desde el restaurante. El aviso no lo presenta una
                  fiscalizadora por ti».
                </p>
                <h3>Ubica tu mesa de trabajo</h3>
                <div className="management-map">
                  <Tile
                    selected={f.origin === "office"}
                    onClick={() => set("origin", "office")}
                  >
                    <Building2 />
                    Terminal de la oficina del SII
                  </Tile>
                  <Tile
                    selected={f.origin === "restaurant"}
                    onClick={() => set("origin", "restaurant")}
                  >
                    <Utensils />
                    Computador del restaurante
                  </Tile>
                </div>
                {f.origin && (
                  <>
                    <div className="management-terminal">
                      <span className="pill">
                        {f.origin === "office"
                          ? "Terminal del Barrio Cívico"
                          : "La Mesa del Coihue · conexión disponible"}
                      </span>
                      <h3>Organiza la siguiente gestión</h3>
                      <div className="management-grid">
                        <Tile
                          selected={f.channel === "portal"}
                          onClick={() => set("channel", "portal")}
                        >
                          <Laptop />
                          Conectar con el portal del SII para preparar el aviso
                        </Tile>
                        <Tile
                          selected={f.channel === "wait"}
                          onClick={() => set("channel", "wait")}
                        >
                          <Mail />
                          Dejar un recado: esperar a que una fiscalizadora
                          presente el aviso
                        </Tile>
                        <Tile
                          selected={f.channel === "treasury"}
                          onClick={() => set("channel", "treasury")}
                        >
                          <MapPin />
                          Cambiar el destino del expediente a Tesorería
                        </Tile>
                      </div>
                    </div>
                    {f.channel && (
                      <p role="status">
                        Recorrido preparado:{" "}
                        {f.origin === "office"
                          ? "oficina del SII"
                          : "restaurante"}{" "}
                        →{" "}
                        {f.channel === "portal"
                          ? "portal del SII"
                          : f.channel === "wait"
                            ? "esperar una visita"
                            : "Tesorería"}
                        . Todavía no has confirmado el gasto.
                      </p>
                    )}
                  </>
                )}
              </>
            )}
            {index === 2 && (
              <>
                <div className="management-dialogue">
                  <strong>Registro del restaurante</strong>
                  <p>
                    Menú: almuerzos preparados en el local. Pedido: servir
                    comidas a vecinos y visitantes. Cobro: venta de los platos.
                    El letrero dice «La Mesa del Coihue».
                  </p>
                </div>
                <h3>Construye la descripción desde la operación</h3>
                <p>
                  Toca las piezas que llevarás al registro. Puedes retirar una
                  pieza tocándola otra vez.
                </p>
                <div className="management-grid">
                  {[
                    ["food", "Preparar comidas"],
                    ["sale", "Vender y servir los platos"],
                    ["transport", "Transportar turistas"],
                    ["name", "Usar solo el nombre del letrero"],
                  ].map(([id, title]) => (
                    <Tile
                      key={id}
                      selected={f[id] === "1"}
                      onClick={() => toggle(id)}
                    >
                      <Utensils />
                      {title}
                    </Tile>
                  ))}
                </div>
                <div className="management-tray" role="status">
                  <strong>Descripción que estás construyendo</strong>
                  <p>
                    {[
                      f.food === "1" ? "Preparación de comidas" : "",
                      f.sale === "1" ? "venta de platos" : "",
                      f.transport === "1" ? "transporte de turistas" : "",
                      f.name === "1"
                        ? "La Mesa del Coihue (solo nombre comercial)"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Todavía no has agregado operaciones."}
                  </p>
                </div>
                <h3>Contrasta el registro</h3>
                <div className="management-grid">
                  <Tile
                    selected={f.catalog === "yes"}
                    onClick={() => set("catalog", "yes")}
                  >
                    <FileText />
                    Llevar esta descripción al catálogo oficial para verificar
                    su clasificación
                  </Tile>
                  <Tile
                    selected={f.catalog === "no"}
                    onClick={() => set("catalog", "no")}
                  >
                    Cerrar el registro sin contrastarlo con el catálogo
                  </Tile>
                </div>
              </>
            )}
            {index === 3 && (
              <>
                <div className="management-calendar">
                  <p className="eyebrow">12 · SEPTIEMBRE · 2026</p>
                  <h3>Primer acto de inicio del caso</h3>
                  <p>
                    Organiza los dos meses siguientes al mes de inicio. No estás
                    contando sesenta días.
                  </p>
                </div>
                <p>
                  Arrastra los meses a los espacios de la agenda, o
                  selecciónalos con los controles.
                </p>
                <div className="management-months">
                  {[
                    ["sep", "Septiembre"],
                    ["oct", "Octubre"],
                    ["nov", "Noviembre"],
                  ].map(([id, title]) => (
                    <button
                      key={id}
                      type="button"
                      draggable
                      aria-pressed={month === id}
                      className="management-tile"
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/plain", id)
                      }
                      onClick={() => setMonth(id)}
                    >
                      {title}
                    </button>
                  ))}
                </div>
                <div className="management-grid">
                  {[
                    ["first", "Primer mes siguiente"],
                    ["second", "Segundo mes siguiente"],
                  ].map(([field, label]) => (
                    <label
                      className="field management-calendar-slot"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const id = e.dataTransfer.getData("text/plain");
                        if (["sep", "oct", "nov"].includes(id)) set(field, id);
                      }}
                      key={field}
                    >
                      {label}
                      {month && (
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => set(field, month)}
                        >
                          Colocar aquí el mes seleccionado
                        </button>
                      )}
                      <select
                        value={f[field] || ""}
                        onChange={(e) => set(field, e.target.value)}
                      >
                        <option value="" disabled>
                          Coloca el mes en la agenda
                        </option>
                        <option value="sep">Septiembre 2026</option>
                        <option value="oct">Octubre 2026</option>
                        <option value="nov">Noviembre 2026</option>
                      </select>
                    </label>
                  ))}
                </div>
                <h3>Programa el cierre</h3>
                <div className="management-grid">
                  <Tile
                    selected={f.deadline === "month-end"}
                    onClick={() => set("deadline", "month-end")}
                  >
                    Reservar el último día del segundo mes de mi agenda
                  </Tile>
                  <Tile
                    selected={f.deadline === "first-customer"}
                    onClick={() => set("deadline", "first-customer")}
                  >
                    Dejar la gestión sin fecha hasta conseguir el primer cliente
                  </Tile>
                </div>
                <div className="management-tray" role="status">
                  Inicio: septiembre → primer mes: {f.first || "por ubicar"} →
                  segundo mes: {f.second || "por ubicar"} →{" "}
                  {f.deadline === "month-end"
                    ? "cierre agendado"
                    : f.deadline === "first-customer"
                      ? "sin fecha"
                      : "cierre pendiente"}
                  .
                </div>
              </>
            )}
            {index === 4 && (
              <>
                <p>
                  Abre cada antecedente y decide dónde archivarlo. Puedes
                  arrastrarlo a una bandeja o tocarlo y después tocar su
                  destino. Completa el destino de los cuatro documentos.
                </p>
                <div className="management-grid">
                  {dossierCards.map((d) => (
                    <button
                      type="button"
                      draggable
                      key={d.id}
                      onDragStart={(e) => {
                        setDocument(d.id);
                        e.dataTransfer.setData("text/plain", d.id);
                      }}
                      onClick={() => setDocument(d.id)}
                      aria-pressed={document === d.id}
                      className={`management-tile ${document === d.id ? "selected" : ""}`}
                    >
                      <FileText />
                      <strong>{d.title}</strong>
                      <p>{d.text}</p>
                      <small>
                        {f[d.id] === "folder"
                          ? "En carpeta"
                          : f[d.id] === "outside"
                            ? "Fuera del expediente"
                            : "Sin revisar"}
                      </small>
                    </button>
                  ))}
                </div>
                <div className="management-grid">
                  {[
                    ["folder", "Carpeta para Paula"],
                    ["outside", "Fuera del expediente"],
                  ].map(([id, title]) => (
                    <button
                      type="button"
                      key={id}
                      className="management-tray"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => drop(e, id)}
                      onClick={() => destination(id)}
                      aria-disabled={!document}
                    >
                      <Archive />
                      <strong>{title}</strong>
                      <ul>
                        {dossierCards
                          .filter((d) => f[d.id] === id)
                          .map((d) => (
                            <li key={d.id}>{d.title}</li>
                          ))}
                      </ul>
                      <small>Colocar aquí el documento seleccionado</small>
                    </button>
                  ))}
                </div>
              </>
            )}
            {index === 5 && (
              <>
                <div className="management-grid">
                  <aside className="management-tray">
                    <h3>Carpeta de referencia</h3>
                    <p>
                      Camila Soto · prepara y vende comidas · Avenida Coihue 120
                      · inicio 12/09/2026.
                    </p>
                    <p>
                      El borrador de Avenida Coihue 210 corresponde al inmueble
                      descartado.
                    </p>
                    {attempt.management?.drafts[4] && (
                      <p>
                        Documentos que archivaste:{" "}
                        {dossierCards
                          .filter(
                            (d) =>
                              attempt.management!.drafts[4][d.id] === "folder",
                          )
                          .map((d) => d.title)
                          .join(" · ") || "carpeta sin respaldos"}
                        . Contrasta la carpeta con el caso.
                      </p>
                    )}
                  </aside>
                  <div className="management-terminal">
                    <p className="eyebrow">
                      PORTAL DE PRÁCTICA · REVISIÓN DEL RESUMEN
                    </p>
                    <p>Trabaja solo con los datos de Camila del expediente.</p>
                    <label className="field">
                      Actividad declarada
                      <select
                        value={f.activity || ""}
                        onChange={(e) => set("activity", e.target.value)}
                      >
                        <option value="" disabled>
                          Traslada la actividad
                        </option>
                        <option value="meals">
                          Preparación y venta de comidas
                        </option>
                        <option value="transport">
                          Transporte de pasajeros
                        </option>
                      </select>
                    </label>
                    <label className="field">
                      Domicilio declarado
                      <select
                        value={f.address || ""}
                        onChange={(e) => set("address", e.target.value)}
                      >
                        <option value="" disabled>
                          Contrasta el domicilio
                        </option>
                        <option value="120">Avenida Coihue 120</option>
                        <option value="210">Avenida Coihue 210</option>
                      </select>
                    </label>
                    <Tile
                      selected={f.date === "2026-09-12"}
                      onClick={() => set("date", "2026-09-12")}
                    >
                      Trasladar la fecha del expediente: 12/09/2026
                    </Tile>
                  </div>
                </div>
                <p className="small muted">
                  Esta mesa no transmite datos al SII ni solicita credenciales
                  personales.
                </p>
              </>
            )}
            {index === 6 && (
              <>
                <div className="management-inbox">
                  <Mail />
                  <h3>Solicitud de Elena · canal oficial del SII</h3>
                  <p>
                    Verificación de actividad para la primera emisión de
                    facturas con derecho a crédito fiscal en esta rama del caso.
                  </p>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => set("opened", "yes")}
                  >
                    Abrir la solicitud coordinada
                  </button>
                </div>
                {f.opened && (
                  <>
                    {attempt.management?.drafts[4] && (
                      <aside className="management-tray">
                        <strong>Archivo que preparaste anteriormente</strong>
                        <ul>
                          {dossierCards
                            .filter(
                              (d) =>
                                attempt.management!.drafts[4][d.id] ===
                                "folder",
                            )
                            .map((d) => (
                              <li key={d.id}>
                                {d.title} · {d.text}
                              </li>
                            ))}
                        </ul>
                        <p>
                          Contrasta esta selección con lo solicitado por Elena
                          antes de responder.
                        </p>
                      </aside>
                    )}
                    <p className="management-dialogue">
                      <strong>Elena:</strong> «Necesito contrastar los
                      antecedentes de actividad y domicilio. Cuando corresponda
                      coordinaremos la visita. Aclara cualquier diferencia por
                      el canal oficial; no necesito tu contraseña».
                    </p>
                    <h3>Prepara la bandeja de respuesta</h3>
                    <div className="management-grid">
                      <Tile
                        selected={f.documents === "truthful"}
                        onClick={() => set("documents", "truthful")}
                      >
                        Reunir respaldos verdaderos del domicilio y la actividad
                        y aclarar diferencias
                      </Tile>
                      <Tile
                        selected={f.documents === "hide"}
                        onClick={() => set("documents", "hide")}
                      >
                        Ocultar los antecedentes que no coinciden
                      </Tile>
                    </div>
                    <h3>Protege el acceso</h3>
                    <div className="management-grid">
                      <Tile
                        selected={f.privacy === "private"}
                        onClick={() => set("privacy", "private")}
                      >
                        <ShieldCheck />
                        Mantener privada la contraseña y usar el canal oficial
                      </Tile>
                      <Tile
                        selected={f.privacy === "share"}
                        onClick={() => set("privacy", "share")}
                      >
                        Adjuntar una nota entregando la contraseña
                      </Tile>
                    </div>
                    <h3>Identifica qué respalda tu respuesta</h3>
                    <div className="management-grid">
                      <Tile
                        selected={f.scope === "review"}
                        onClick={() => set("scope", "review")}
                      >
                        Antecedentes para una revisión distinta del aviso de
                        inicio
                      </Tile>
                      <Tile
                        selected={f.scope === "all-permits"}
                        onClick={() => set("scope", "all-permits")}
                      >
                        Promesa de que el aviso ya garantiza todos los permisos
                        y autorizaciones
                      </Tile>
                    </div>
                  </>
                )}
              </>
            )}
            {index === 7 && (
              <>
                <div className="management-tray">
                  <FileText />
                  <h3>Archivo del trámite tributario</h3>
                  <p>
                    Organiza el archivo del trámite y el tablero de gestiones
                    pendientes. El registro del aviso no reúne las
                    autorizaciones de todas las instituciones. Si quedó una
                    corrección pendiente, debe resolverse antes de dar la
                    gestión por terminada.
                  </p>
                  <Tile
                    selected={f.receipt === "archived"}
                    onClick={() => set("receipt", "archived")}
                  >
                    Archivar los respaldos y el registro del trámite
                  </Tile>
                </div>
                <h3>Tablero de instituciones antes de abrir</h3>
                <div className="management-grid">
                  {[
                    ["municipal", "Municipalidad · permisos del local"],
                    [
                      "health",
                      "Autoridad sanitaria · exigencias para el restaurante",
                    ],
                  ].map(([field, title]) => (
                    <label className="field management-tray" key={field}>
                      {title}
                      <select
                        value={f[field] || ""}
                        onChange={(e) => set(field, e.target.value)}
                      >
                        <option value="" disabled>
                          Define el siguiente paso
                        </option>
                        <option value="consult">
                          Consultar por separado lo que corresponda y verificar
                          sus permisos
                        </option>
                        <option value="approved">
                          Marcar todo aprobado solo por el aviso al SII
                        </option>
                        <option value="fine">
                          Dar por segura una multa debido a la visita
                        </option>
                      </select>
                    </label>
                  ))}
                </div>
                <div className="management-dialogue">
                  <strong>Camila:</strong> «Antes de anunciar la apertura,
                  ¿tenemos claro qué quedó respaldado y qué debemos consultar
                  por separado?»
                </div>
              </>
            )}
          </fieldset>
        )}
        {confirmed && (
          <div
            ref={consequence}
            tabIndex={-1}
            className={`management-consequence ${correct ? "done" : "repair"}`}
            role="status"
          >
            <p className="eyebrow">
              {correct
                ? "GESTIÓN RESUELTA"
                : "EL EXPEDIENTE TIENE UNA CONSECUENCIA"}
            </p>
            <h2>
              {correct
                ? "Camila suma un antecedente para avanzar."
                : "Camila necesita reorganizar este paso."}
            </h2>
            <p>
              {impact?.reason ||
                decisionImpact(index, attempt.answers[index])?.reason}
            </p>
            <p>{step.feedback[Number(attempt.answers[index])]}</p>
            <p>
              <strong>Caja actual: ${budget.balance} Coihues.</strong> La
              decisión y sus costos quedan guardados; continuar no borra sus
              consecuencias.
            </p>
            <details>
              <summary>Ver la gestión que confirmaste</summary>
              <dl>
                {managementRecord(attempt)
                  .find((r) => r.index === index)
                  ?.rows.map((row) => (
                    <div key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
              </dl>
            </details>
            <details>
              <summary>Entender qué ocurrió</summary>
              <p>{step.hint}</p>
            </details>
          </div>
        )}
        {!confirmed && (
          <details className="spaced">
            <summary>Consultar una pista sin costo</summary>
            <p>{step.hint}</p>
          </details>
        )}
      </section>
      <div className="management-actions">
        {confirmed ? (
          <button
            type="button"
            className="button"
            disabled={busy}
            onClick={onNext}
          >
            {index === 7
              ? "Continuar: Explícaselo a Camila"
              : "Continuar a la siguiente misión"}
            <ArrowRight size={18} />
          </button>
        ) : (
          <>
            <p role="status">
              {answer === ""
                ? "Completa el encargo para revisar su consecuencia."
                : `Al confirmar: $${impact?.cost || 0} Coihues de gasto de gestión. Esta decisión quedará registrada.`}
            </p>
            <button
              type="button"
              className="button"
              disabled={busy || answer === ""}
              onClick={onConfirm}
            >
              {busy ? "Guardando…" : config.submit}
              <ArrowRight size={18} />
            </button>
          </>
        )}
      </div>
      <BusinessBudget attempt={attempt} />
      <Link className="text-link spaced" to="/desafios/inicio-actividades">
        Consultar los contenidos del expediente
      </Link>
    </section>
  );
}

export function ManagementRecord({ attempt }: { attempt: Attempt }) {
  return (
    <section aria-label="Acciones del expediente de Camila">
      {managementRecord(attempt).map((record) => (
        <details className="panel spaced" key={record.index}>
          <summary>
            Etapa {record.index + 1} · {record.title} ·{" "}
            {record.confirmed ? "Confirmada" : "En preparación"}
          </summary>
          <dl>
            {record.rows.map((row) => (
              <div key={row.label}>
                <dt>
                  <strong>{row.label}</strong>
                </dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </details>
      ))}
    </section>
  );
}

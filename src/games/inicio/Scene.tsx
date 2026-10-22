import { CamilaChapter } from "./story";
import { useState } from "react";
import {
  inicioPlaces,
  inicioSteps,
  dossierCards,
  inicioSlug,
  inicioSources,
} from "./content";
export function InicioScene({
  index,
  confirmed,
}: {
  index: number;
  confirmed: boolean[];
}) {
  const active =
    inicioPlaces.find((p) => p.levels.some((i) => i === index)) ||
    inicioPlaces[0];
  const [visit, setVisit] = useState<string | null>(null);
  const place = inicioPlaces.find((p) => p.id === visit) || active;
  return (
    <section
      className="inicio-scene"
      aria-label="Villa del Coihue: recorrido del expediente"
    >
      <CamilaChapter index={index} />
      <div className="inicio-scene-heading">
        <div>
          <p className="eyebrow">VILLA DEL COIHUE · BARRIO CÍVICO</p>
          <p className="inicio-scene-title">Un expediente conecta la ciudad</p>
        </div>
        <span className="pill">
          {confirmed.filter(Boolean).length} / {inicioSteps.length} decisiones
          revisadas
        </span>
      </div>
      <p>
        Ayuda a Camila a preparar su restaurante. Puedes explorar los lugares;
        los niveles avanzan al revisar cada decisión, sin tiempo límite.
      </p>
      <div
        className="inicio-town"
        role="group"
        aria-label="Explorar lugares de la historia"
      >
        {inicioPlaces.map((p) => (
          <button
            type="button"
            key={p.id}
            className={`inicio-building ${place.id === p.id ? "selected" : ""}`}
            aria-pressed={place.id === p.id}
            onClick={() => setVisit(p.id)}
          >
            <span aria-hidden="true">{p.icon}</span>
            <strong>{p.name}</strong>
            <small>
              {active.id === p.id
                ? "Tu nivel actual está aquí"
                : "Explorar lugar"}
            </small>
          </button>
        ))}
      </div>
      <div className="inicio-dialogue" role="status">
        <strong>{place.name}</strong>
        <p>{place.description}</p>
        {place.id === "sii" && (
          <p>
            Paula: «Te orientamos en la oficina; el aviso se realiza por
            internet como regla general. Si corresponde una visita, Elena
            coordinará la salida desde aquí. No esperes una fiscalización para
            presentar tu aviso».
          </p>
        )}
      </div>
      <details className="inicio-route">
        <summary>Ver los nueve niveles · {Math.min(index + 1, 9)} de 9</summary>
        <ol className="inicio-levels" aria-label="Niveles del expediente">
          {inicioSteps.map((s, i) => (
            <li
              key={s.title}
              className={index === i ? "current" : ""}
              aria-current={index === i ? "step" : undefined}
            >
              <span aria-hidden="true">{confirmed[i] ? "✓" : i + 1}</span>
              <span>
                {s.title}
                <small>
                  {confirmed[i]
                    ? "Decisión revisada"
                    : index === i
                      ? "Nivel actual"
                      : "Se abre al avanzar"}
                </small>
              </span>
            </li>
          ))}
          <li className={index === inicioSteps.length ? "current" : ""}>
            <span aria-hidden="true">9</span>
            <span>
              La nota para Camila<small>Evidencia de cierre</small>
            </span>
          </li>
        </ol>
      </details>
      <p className="small muted">
        Simulación educativa independiente. No es un portal del SII, no presenta
        declaraciones ni acredita una autorización de funcionamiento.
      </p>
    </section>
  );
}
export function InicioDocuments({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const mask = value === "" ? 0 : Number(value);
  return (
    <div
      className="inicio-documents"
      role="group"
      aria-label="Seleccionar antecedentes ficticios"
    >
      <p>
        Marca las tarjetas que incorporarías. Puedes combinar varias antes de
        comprobar.
      </p>
      <div className="inicio-document-grid">
        {dossierCards.map((doc, i) => (
          <label
            className={`inicio-document ${mask & (1 << i) ? "chosen" : ""}`}
            key={doc.id}
          >
            <input
              type="checkbox"
              checked={!!(mask & (1 << i))}
              disabled={disabled}
              onChange={() => onChange(String(mask ^ (1 << i)))}
            />
            <strong>{doc.title}</strong>
            <span>{doc.text}</span>
          </label>
        ))}
      </div>
      <p role="status">
        {dossierCards.filter((_, i) => mask & (1 << i)).length} tarjetas
        seleccionadas. No adjuntes archivos reales.
      </p>
    </div>
  );
}
export function InicioBrief() {
  return (
    <section className="panel spaced">
      <p className="eyebrow">VILLA DEL COIHUE · OFICINA DEL SII</p>
      <h2>La primera apertura</h2>
      <p>
        Ocho niveles de decisiones y un cierre: recibe el encargo, elige el
        canal, describe el negocio, resuelve el calendario, arma una carpeta con
        tarjetas, revisa el portal de práctica y acompaña una visita coordinada.
      </p>
      <p>
        En la oficina ficticia trabajan Paula, orientadora, y Elena,
        fiscalizadora. Las visitas son posibles cuando corresponda, no
        universales. El aviso se realiza por internet como regla general, salvo
        excepciones legales.
      </p>
      <p>
        Las tarjetas y personajes son propios de TP PLAY. No se usa logo del SII
        ni se pide RUT, clave o documentos reales.
      </p>
      <details>
        <summary>Fuentes oficiales y revisión del caso</summary>
        <p>
          Versión inicio-1.0 · Revisión documental 21 de octubre de 2026 ·
          Pilotaje. Se debe volver a contrastar el procedimiento antes de una
          nueva edición.
        </p>
        <ul>
          {inicioSources.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title}
              </a>
              {s.updatedAt && ` · actualización de la fuente: ${s.updatedAt}`}
            </li>
          ))}
        </ul>
        <p>
          Alcance curricular: inducción aplicada a Gestión comercial y
          tributaria de 3.º medio. No acredita por sí sola un OA o criterio
          oficial completo; requiere validación pedagógica docente.
        </p>
      </details>
    </section>
  );
}
export const isInicio = (slug?: string) => slug === inicioSlug;

import type { Attempt } from "../../progress.js";
export type ManagementFields = Record<string, string>;
export type ManagementAction = { field: string; value: string };
export type ManagementState = {
  version: 1;
  drafts: Record<string, ManagementFields>;
};
const bits = ["0", "1"];
export const managementStages: Record<
  number,
  {
    mechanic: string;
    task: string;
    submit: string;
    fields: Record<string, string[]>;
  }
> = {
  1: {
    mechanic: "Recorrido conectado",
    task: "Organiza dónde trabajarás y cómo presentarás el aviso de Camila.",
    submit: "Poner en marcha el recorrido",
    fields: {
      origin: ["office", "restaurant"],
      channel: ["portal", "wait", "treasury"],
    },
  },
  2: {
    mechanic: "Mesa de operaciones",
    task: "Reconstruye la actividad desde lo que ocurre en el restaurante y decide cómo contrastarla.",
    submit: "Registrar la actividad del negocio",
    fields: {
      food: bits,
      sale: bits,
      transport: bits,
      name: bits,
      catalog: ["yes", "no"],
    },
  },
  3: {
    mechanic: "Agenda del expediente",
    task: "Ordena los meses siguientes al inicio y reserva el cierre del plazo.",
    submit: "Guardar el plan de fechas",
    fields: {
      first: ["sep", "oct", "nov"],
      second: ["sep", "oct", "nov"],
      deadline: ["month-end", "first-customer"],
    },
  },
  4: {
    mechanic: "Archivo de respaldos",
    task: "Lleva cada documento a la carpeta que presentarás o déjalo fuera del expediente.",
    submit: "Entregar la carpeta a Paula",
    fields: {
      arriendo: ["folder", "outside"],
      equipamiento: ["folder", "outside"],
      antiguo: ["folder", "outside"],
      clave: ["folder", "outside"],
    },
  },
  5: {
    mechanic: "Revisión cruzada del portal",
    task: "Construye el resumen utilizando la carpeta y revisa sus tres datos antes de enviarlo.",
    submit: "Enviar el resumen revisado",
    fields: {
      activity: ["meals", "transport"],
      address: ["120", "210"],
      date: ["2026-09-12"],
    },
  },
  6: {
    mechanic: "Bandeja de Elena",
    task: "Abre la solicitud oficial, prepara los antecedentes y decide cómo responder.",
    submit: "Responder a Elena por el canal oficial",
    fields: {
      opened: ["yes"],
      documents: ["truthful", "hide"],
      privacy: ["private", "share"],
      scope: ["review", "all-permits"],
    },
  },
  7: {
    mechanic: "Tablero de apertura",
    task: "Archiva lo logrado y organiza lo pendiente antes de preparar el anuncio del restaurante.",
    submit: "Entregar el plan de apertura a Camila",
    fields: {
      receipt: ["archived"],
      municipal: ["consult", "approved", "fine"],
      health: ["consult", "approved", "fine"],
    },
  },
};
function valid(
  ok: unknown,
  message = "Esa acción no corresponde a la gestión actual.",
): asserts ok {
  if (!ok) throw Error(message);
}
export function managementAnswer(index: number, f: ManagementFields): string {
  const config = managementStages[index];
  if (!config) return "";
  if (index === 2) {
    if (
      !["food", "sale", "transport", "name"].some((k) => f[k] === "1") ||
      !f.catalog
    )
      return "";
    return f.transport === "1"
      ? "1"
      : f.food === "1" &&
          f.sale === "1" &&
          f.name !== "1" &&
          f.catalog === "yes"
        ? "2"
        : "0";
  }
  if (Object.keys(config.fields).some((k) => !f[k])) return "";
  if (index === 1)
    return f.channel === "portal" ? "1" : f.channel === "wait" ? "0" : "2";
  if (index === 3)
    return f.deadline === "first-customer"
      ? "2"
      : f.first === "oct" && f.second === "nov"
        ? "1"
        : "0";
  if (index === 4)
    return String(
      ["arriendo", "equipamiento", "antiguo", "clave"].reduce(
        (mask, k, i) => mask + (f[k] === "folder" ? 1 << i : 0),
        0,
      ),
    );
  if (index === 5)
    return f.activity === "transport" ? "0" : f.address === "210" ? "1" : "2";
  if (index === 6)
    return f.documents === "hide" || f.privacy === "share"
      ? "0"
      : f.scope === "all-permits"
        ? "2"
        : "1";
  return f.municipal === "approved" || f.health === "approved"
    ? "0"
    : f.municipal === "fine" || f.health === "fine"
      ? "1"
      : "2";
}
export function applyManagement(
  previous: Attempt,
  event: ManagementAction,
): Attempt {
  valid(
    previous.missionSlug === "inicio-actividades" &&
      !previous.completedAt &&
      !previous.confirmed[previous.index],
  );
  const config = managementStages[previous.index];
  valid(
    config &&
      event &&
      typeof event.field === "string" &&
      typeof event.value === "string" &&
      Object.hasOwn(config.fields, event.field) &&
      config.fields[event.field].includes(event.value),
  );
  const a = structuredClone(previous);
  a.management ??= { version: 1, drafts: {} };
  const f = { ...savedManagementFields(previous), [event.field]: event.value };
  a.management.drafts[a.index] = f;
  a.answers[a.index] = managementAnswer(a.index, f);
  return a;
}
export function savedManagementFields(a: Attempt): ManagementFields {
  const saved = a.management?.drafts[a.index];
  if (saved) return saved;
  // Preserve a choice made in the historical interface when resuming an unfinished stage.
  const answer = a.answers[a.index];
  if (answer === undefined || answer === "") return {};
  switch (a.index) {
    case 1:
      return {
        origin: "office",
        channel:
          answer === "1" ? "portal" : answer === "0" ? "wait" : "treasury",
      };
    case 2:
      return {
        food: answer === "2" ? "1" : "0",
        sale: answer === "2" ? "1" : "0",
        name: answer === "0" ? "1" : "0",
        transport: answer === "1" ? "1" : "0",
        catalog: answer === "2" ? "yes" : "no",
      };
    case 3:
      return {
        first: answer === "0" ? "sep" : "oct",
        second: "nov",
        deadline: answer === "2" ? "first-customer" : "month-end",
      };
    case 4:
      return Object.fromEntries(
        ["arriendo", "equipamiento", "antiguo", "clave"].map((k, i) => [
          k,
          Number(answer) & (1 << i) ? "folder" : "outside",
        ]),
      );
    case 5:
      return {
        activity: answer === "0" ? "transport" : "meals",
        address: answer === "1" ? "210" : "120",
        date: "2026-09-12",
      };
    case 6:
      return {
        opened: "yes",
        documents: answer === "0" ? "hide" : "truthful",
        privacy: "private",
        scope: answer === "2" ? "all-permits" : "review",
      };
    case 7:
      return {
        receipt: "archived",
        municipal:
          answer === "0" ? "approved" : answer === "1" ? "fine" : "consult",
        health: "consult",
      };
    default:
      return {};
  }
}

const labels: Record<string, string> = {
  origin: "Mesa de trabajo",
  channel: "Canal elegido",
  food: "Preparación de comidas",
  sale: "Venta de platos",
  transport: "Transporte",
  name: "Solo nombre comercial",
  catalog: "Consulta al catálogo",
  first: "Primer mes siguiente",
  second: "Segundo mes siguiente",
  deadline: "Cierre de la agenda",
  arriendo: "Contrato del local actual",
  equipamiento: "Respaldo de equipamiento",
  antiguo: "Borrador descartado",
  clave: "Nota con contraseña",
  activity: "Actividad del resumen",
  address: "Domicilio del resumen",
  date: "Fecha del inicio",
  opened: "Solicitud de Elena",
  documents: "Antecedentes para Elena",
  privacy: "Protección de acceso",
  scope: "Alcance de la respuesta",
  receipt: "Archivo del trámite",
  municipal: "Municipalidad",
  health: "Autoridad sanitaria",
};
const values: Record<string, string> = {
  "0": "No incluido",
  "1": "Incluido",
  office: "Terminal de la oficina del SII",
  restaurant: "Computador del restaurante",
  portal: "Portal del SII",
  wait: "Esperar a una fiscalizadora",
  treasury: "Tesorería",
  yes: "Sí",
  no: "No",
  sep: "Septiembre",
  oct: "Octubre",
  nov: "Noviembre",
  "month-end": "Último día del segundo mes",
  "first-customer": "Esperar al primer cliente sin agendar",
  folder: "En la carpeta",
  outside: "Fuera del expediente",
  meals: "Preparación y venta de comidas",
  transport: "Transporte de pasajeros",
  "120": "Avenida Coihue 120",
  "210": "Avenida Coihue 210",
  "2026-09-12": "12/09/2026",
  truthful: "Antecedentes verdaderos y aclaración de diferencias",
  hide: "Ocultar diferencias",
  private: "Mantener privada la contraseña",
  share: "Entregar contraseña",
  review: "Revisión distinta del aviso",
  "all-permits": "Afirmar todas las autorizaciones",
  archived: "Respaldos archivados",
  consult: "Consultar y verificar por separado",
  approved: "Dar por aprobado por el aviso al SII",
  fine: "Suponer una multa automática",
};
export function managementRecord(a: Attempt) {
  return Object.entries(a.management?.drafts || {})
    .filter(([i]) => managementStages[Number(i)])
    .map(([i, fields]) => ({
      index: Number(i),
      title: managementStages[Number(i)].mechanic,
      confirmed: !!a.confirmed[Number(i)],
      rows: Object.entries(fields).map(([field, value]) => ({
        label: labels[field] || field,
        value: values[value] || value,
      })),
    }));
}

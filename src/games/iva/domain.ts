import type { Attempt } from "../../progress.js";
export type IvaFields = Record<string, string>;
export type IvaState = { version: 1; drafts: Record<number, IvaFields> };
export type IvaAction = { action: "save" | "check"; fields: IvaFields };
const schemas: Record<number, Record<string, string[] | "money">> = {
  0: { a: ["purchase", "sale", "review"], b: ["purchase", "sale", "review"] },
  1: { base: ["200000", "238000"], amount: "money" },
  2: {
    debit: ["38000", "19000"],
    credit: ["38000", "19000"],
    operation: ["subtract", "add", "ignore"],
    amount: "money",
  },
};
export function validateIvaFields(index: number, raw: unknown): IvaFields {
  const schema = schemas[index];
  if (!schema || !raw || typeof raw !== "object" || Array.isArray(raw))
    throw Error("Preparación de IVA no válida.");
  const fields: IvaFields = {};
  for (const [key, value] of Object.entries(raw)) {
    const rule = schema[key];
    if (
      !rule ||
      typeof value !== "string" ||
      (value !== "" &&
        (rule === "money" ? !/^\d{1,9}$/.test(value) : !rule.includes(value)))
    )
      throw Error("Revisa los datos de la mesa de IVA.");
    fields[key] = value;
  }
  return fields;
}
export function ivaAnswer(index: number, fields: IvaFields): string {
  if (!Object.keys(schemas[index] || {}).every((key) => fields[key]?.trim()))
    return "";
  if (index === 0)
    return fields.a === "purchase" && fields.b === "sale" ? "1" : "0";
  if (index === 1)
    return fields.base === "200000" ? String(Number(fields.amount)) : "0";
  return fields.debit === "38000" &&
    fields.credit === "19000" &&
    fields.operation === "subtract" &&
    Number(fields.amount) === 19000
    ? "1"
    : fields.operation === "ignore"
      ? "2"
      : "0";
}
/** Shared by the browser and server. Only canonical answers feed the existing grading scale. */
export function applyIva(previous: Attempt, raw: unknown): Attempt {
  const event = raw as IvaAction;
  if (
    previous.missionSlug !== "mision-iva" ||
    previous.completedAt ||
    previous.confirmed[previous.index]
  )
    throw Error("Esta mesa ya está cerrada. Continúa a la siguiente etapa.");
  if (!event || !["save", "check"].includes(event.action))
    throw Error("Acción de IVA no válida.");
  const fields = validateIvaFields(previous.index, event.fields);
  const answer = ivaAnswer(previous.index, fields);
  if (event.action === "check" && !answer)
    throw Error("Completa todos los espacios antes de entregar el encargo.");
  const next = structuredClone(previous);
  next.iva = {
    version: 1,
    drafts: { ...next.iva?.drafts, [next.index]: fields },
  };
  next.answers[next.index] = answer;
  if (event.action === "check") next.confirmed[next.index] = true;
  return next;
}

export function ivaFeedback(index: number, fields: IvaFields): string {
  if (index === 0)
    return ivaAnswer(index, fields) === "1"
      ? "Ordenaste ambos documentos: la factura recibida corresponde a una compra de Bosque Sur y la emitida a una venta. El registro ya distingue las dos operaciones."
      : "Revisa ambos destinos: Bosque Sur compra materiales en la factura A y vende cuadernos en la factura B. Recibir una factura no significa realizar una venta.";
  if (index === 1)
    return ivaAnswer(index, fields) === "38000"
      ? "Usaste el neto como base: $200.000 × 19% = $38.000 de IVA de ventas."
      : `Tu preparación utilizó ${fields.base === "238000" ? "el total con IVA" : "el neto"} e ingresaste $${Number(fields.amount).toLocaleString("es-CL")}. El cálculo del caso parte del neto: $200.000 × 19% = $38.000.`;
  return ivaAnswer(index, fields) === "1"
    ? "Ubicaste ventas como débito y compras admitidas como crédito. El saldo del caso es $38.000 − $19.000 = $19.000."
    : "Revisa la ubicación de las fichas, la operación y el monto ingresado. Las ventas corresponden al débito y las compras admitidas al crédito; en este caso se descuenta el crédito: $38.000 − $19.000 = $19.000. No es una declaración tributaria.";
}

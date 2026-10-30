import type { Attempt } from "../../progress.js";
import { observations } from "./content.js";
export type FieldDraft = Record<string, string>;
export type GreenhouseState = {
  version: 1;
  drafts: Record<number, FieldDraft>;
};
export type GreenhouseAction = { action: "save" | "check"; fields: FieldDraft };
const ids = Object.keys(observations);
const schemas: Record<number, Record<string, string[]>> = {
  0: {
    temperature: ["seen"],
    soil: ["seen"],
    ventilation: ["seen"],
    leaves: ["seen"],
    hypothesis: ["heat", "water", "pest"],
    evidence1: ids,
    evidence2: ids,
  },
  1: {
    authorization: ["seen"],
    ventilation: ["open", "closed"],
    irrigation: ["hold", "continuous"],
    products: ["none", "apply"],
    record: ["record", "skip"],
  },
  2: {
    temperature: ["25", "32", "39"],
    trend: ["down", "same", "up"],
    crop: ["partial", "resolved", "worse"],
    next: ["consult", "close", "water"],
  },
};
export function validateFieldDraft(index: number, raw: unknown): FieldDraft {
  const schema = schemas[index];
  if (!schema || !raw || typeof raw !== "object" || Array.isArray(raw))
    throw Error("Registro de campo no válido.");
  const fields: FieldDraft = {};
  for (const [key, value] of Object.entries(raw)) {
    if (
      !Object.hasOwn(schema, key) ||
      typeof value !== "string" ||
      (value !== "" && !schema[key].includes(value))
    )
      throw Error("Revisa los datos del cuaderno de campo.");
    fields[key] = value;
  }
  return fields;
}
export function greenhouseAnswer(index: number, fields: FieldDraft): string {
  const schema = schemas[index];
  if (!schema || !Object.keys(schema).every((key) => fields[key]?.trim()))
    return "";
  if (index === 0) {
    if (fields.evidence1 === fields.evidence2) return "";
    const evidence = [fields.evidence1, fields.evidence2];
    return fields.hypothesis === "heat" &&
      evidence.includes("temperature") &&
      evidence.includes("ventilation")
      ? "1"
      : fields.hypothesis === "pest"
        ? "2"
        : "0";
  }
  if (index === 1)
    return fields.ventilation === "open" &&
      fields.irrigation === "hold" &&
      fields.products === "none" &&
      fields.record === "record"
      ? "2"
      : fields.products === "apply"
        ? "0"
        : "1";
  return fields.temperature === "25" &&
    fields.trend === "down" &&
    fields.crop === "partial" &&
    fields.next === "consult"
    ? "1"
    : fields.next === "water"
      ? "2"
      : "0";
}
export function applyGreenhouse(previous: Attempt, raw: unknown): Attempt {
  const event = raw as GreenhouseAction;
  if (
    previous.missionSlug !== "rescate-invernadero" ||
    previous.completedAt ||
    previous.confirmed[previous.index]
  )
    throw Error("Esta ronda ya fue entregada. Continúa a la siguiente etapa.");
  if (!event || !["save", "check"].includes(event.action))
    throw Error("Acción de campo no válida.");
  const fields = validateFieldDraft(previous.index, event.fields),
    answer = greenhouseAnswer(previous.index, fields);
  if (event.action === "check" && !answer)
    throw Error(
      previous.index === 0
        ? "Recorre las cuatro estaciones, elige una hipótesis y conecta dos señales distintas antes de entregar."
        : "Completa el plan o el registro antes de entregarlo.",
    );
  const next = structuredClone(previous);
  next.greenhouse = {
    version: 1,
    drafts: { ...next.greenhouse?.drafts, [next.index]: fields },
  };
  next.answers[next.index] = answer;
  if (event.action === "check") next.confirmed[next.index] = true;
  return next;
}
export function greenhouseFeedback(index: number, fields: FieldDraft): string {
  const correct = greenhouseAnswer(index, fields) === ["1", "2", "1"][index];
  if (index === 0)
    return correct
      ? "Relacionaste la temperatura y las ventanas cerradas para proponer revisar acumulación de calor. El suelo húmedo obliga a contrastar la idea de falta de agua; las hojas solas no confirman una plaga. Es una hipótesis, no un diagnóstico."
      : "Las hojas decaídas no bastan para diagnosticar. Relaciona los 32 °C con las ventanas cerradas y contrasta esa hipótesis con el suelo húmedo. No hay evidencia que confirme una plaga ni falta de agua.";
  if (index === 1)
    return correct
      ? "Preparaste ventilación supervisada, evitaste aumentar el riego sin evidencia y no propusiste productos sin diagnóstico. La hora, temperatura y estado del cultivo permitirán comprobar el efecto."
      : "Revisa el conjunto del plan: Teresa autoriza ventilación supervisada y registro de hora, temperatura y estado de las hojas. El suelo está húmedo; no corresponde regar continuamente ni aplicar productos sin antecedentes. Teresa revisa y corrige el plan antes de intervenir.";
  return correct
    ? "Registraste la disminución de 32 a 25 °C y una mejoría parcial. Las plantas que siguen decaídas requieren seguimiento y consulta; la lectura de 25 °C es un dato de este registro, no una temperatura objetivo universal."
    : "Una menor temperatura y una mejoría parcial no permiten cerrar el caso como resuelto. Registra los 25 °C, identifica las plantas que siguen decaídas y consulta a Teresa antes de intensificar el riego u otra intervención.";
}

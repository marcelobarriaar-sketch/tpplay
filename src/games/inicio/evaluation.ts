// Versioned, deterministic pedagogical evaluator. No external requests or credentials.
// The interface allows a future semantic provider without changing stored evidence.
export type CriterionId =
  "information" | "address" | "channel" | "verification" | "permits";
export type CriterionResult = {
  id: CriterionId;
  title: string;
  points: 0 | 5 | 10 | 15 | 20;
  feedback: string;
};
export type EvidenceEvaluation = {
  version: string;
  method: "contextual-rules";
  response: string;
  evaluatedAt: string;
  attempt: number;
  total: number;
  criteria: CriterionResult[];
  strengths: string[];
  improvements: string[];
};
export interface EvidenceEvaluator {
  version: string;
  evaluate(response: string, attempt: number, at?: string): EvidenceEvaluation;
}
export const evidenceRubric: {
  id: CriterionId;
  title: string;
  hint: string;
}[] = [
  {
    id: "information",
    title: "Información comunicada al SII",
    hint: "Piensa qué necesita conocer el SII sobre el comienzo del negocio y para qué se le informa.",
  },
  {
    id: "address",
    title: "Domicilio comercial",
    hint: "Piensa qué relación tiene Avenida Coihue 120 con el lugar donde funciona el negocio.",
  },
  {
    id: "channel",
    title: "Canal del trámite",
    hint: "Recuerda los canales que Paula presentó y explica cuál usarías para este trámite.",
  },
  {
    id: "verification",
    title: "Inicio de actividades versus verificación",
    hint: "Compara el propósito de comunicar el comienzo con el de revisar posteriormente los antecedentes.",
  },
  {
    id: "permits",
    title: "Otros permisos necesarios",
    hint: "Piensa qué otras instituciones intervienen antes de que un restaurante pueda abrir.",
  },
];
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(activida|atividad|actibidad)\b/g, "actividad")
    .replace(/\b(domisilio|domicilo)\b/g, "domicilio")
    .replace(/\b(berificacion|verificasion|verificacon)\b/g, "verificacion")
    .replace(/\b(interned|interner)\b/g, "internet")
    .replace(/\b(negosio|negocioo)\b/g, "negocio")
    .replace(/\b(comersial)\b/g, "comercial")
    .replace(/\b(sanitarioa|sanitariaa)\b/g, "sanitaria");
}
const has = (s: string, p: RegExp) => p.test(s);
const negated = (s: string, p: RegExp) => has(s, p);
export const contextualEvaluator: EvidenceEvaluator = {
  version: "camila-contextual-1",
  evaluate(response, attempt, at = new Date().toISOString()) {
    const text = normalize(response),
      words = text.match(/[a-z0-9]+/g) || [];
    const clauses = text
      .split(/[.!?;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const relation =
      /\b(es|son|sera|esta|estan|funciona\w*|atiende\w*|vende\w*|prepara\w*|comienza\w*|inicia\w*|avis\w*|comunic\w*|inform\w*|declar\w*|registr\w*|identific\w*|indica\w*|corresponde\w*|necesita\w*|requiere\w*|debe\w*|tiene\w*|realiz\w*|har\w*|haria|us\w*|utiliz\w*|entr\w*|acced\w*|tramita\w*|present\w*|revis\w*|comprob\w*|control\w*|valid\w*|inspecc\w*|verific\w*|permite\w*|autoriza\w*|sustitu\w*|reemplaza\w*|obtien\w*|conseguir|pedir|solicitar|falta\w*|queda\w*)\b/;
    const explained = clauses.filter(
      (s) => s.split(/\s+/).length >= 6 && relation.test(s) && !/^(que informacion|por que|que medio|cual es la diferencia|escribe|redacta|en tu respuesta)/.test(s),
    );
    const quality =
      words.length >= 12 &&
      new Set(words).size >= 8 &&
      new Set(words).size / Math.max(words.length, 1) > 0.18;
    const info = explained.filter(
      (s) =>
        has(
          s,
          /inform\w*|avis\w*|declar\w*|comunic\w*|registr\w*|present\w*/,
        ) && !has(s, /tesoreria|municipalidad/),
    );
    const start = /inicio|inici\w*|comien\w*|comenz\w*|apertura|abrir|empez\w*/;
    const business =
      /actividad|giro|negocio|comercial|empresa|restaurante|economica|venta|comida/;
    const details =
      /domicilio|direccion|giro|actividad|fecha|identifica\w*|contribuyente|representante|rut|nombre/;
    const address = explained.filter((s) =>
      has(s, /coihue\s*120|avenida\s+coihue|direccion|domicilio|ubicacion/),
    );
    const channel = explained.filter((s) =>
      has(
        s,
        /internet|\bweb\b|online|en linea|digital|virtual|portal|plataforma|pagina|sitio/,
      ),
    );
    const verify = explained.filter((s) =>
      has(
        s,
        /verifica\w*|revis\w*|comprueb\w*|comprob\w*|inspecc\w*|fiscaliz\w*|control\w*|valid\w*/,
      ),
    );
    const permits = explained.filter((s) =>
      has(s, /permis\w*|patente|autoriz\w*|sanitari\w*|municipal\w*/),
    );
    let points: (0 | 5 | 10 | 15 | 20)[] = [0, 0, 0, 0, 0];
    if (quality) {
      points[0] = info.some(
        (s) => has(s, start) && has(s, business) && has(s, details),
      )
        ? 20
        : info.some((s) => has(s, start) && has(s, business))
          ? 15
          : info.some((s) => has(s, business) || has(s, details))
            ? 10
            : info.length
              ? 5
              : 0;
      points[1] = address.some(
        (s) =>
          has(
            s,
            /coihue\s*120|(?:esa|esta|la) direccion|(?:ese|este|el) domicilio/,
          ) &&
          has(
            s,
            /funciona\w*|ubic\w*|local|lugar|desarroll\w*|opera\w*|atiende\w*|vende\w*|direccion del|domicilio del/,
          ) &&
          has(s, business),
      )
        ? 20
        : address.some(
              (s) =>
                has(s, /coihue\s*120/) &&
                has(s, /domicilio|direccion|ubicacion|local/),
            )
          ? 15
          : address.some(
                (s) => has(s, /domicilio|direccion/) && has(s, business),
              )
            ? 10
            : address.length
              ? 5
              : 0;
      points[2] = channel.some(
        (s) =>
          has(s, /sii|impuestos internos/) &&
          has(
            s,
            /tramite|inicio|actividad|avis\w*|declar\w*|inform\w*|har\w*|haria|usaria|utiliz\w*|realiz\w*|present\w*/,
          ),
      )
        ? 20
        : channel.some((s) =>
              has(
                s,
                /tramite|inicio|actividad|har\w*|haria|usaria|realiz\w*|present\w*/,
              ),
            )
          ? 15
          : channel.length
            ? 10
            : 0;
      const declared = info.some((s) => has(s, start) && has(s, business));
      const review = verify.some((s) =>
        has(
          s,
          /antecedent\w*|dato\w*|declarad\w*|informad\w*|condicion\w*|local|negocio/,
        ),
      );
      const later = verify.some((s) =>
        has(
          s,
          /despues|posterior|luego|mas adelante|eventual|podria|puede|posible|si corresponde/,
        ),
      );
      points[3] =
        declared && review && later
          ? 20
          : declared && review
            ? 15
            : review || verify.some((s) => has(s, /despues|posterior|luego/))
              ? 10
              : verify.length
                ? 5
                : 0;
      const additional = permits.some((s) =>
        has(
          s,
          /no (significa|basta|reemplaza|sustituye|autoriza|incluye|otorga|da|aprueba)|no .{0,45}(todos|permisos|autorizad)|ademas|tambien|otros|otras|aparte|por separado|aun|todavia|faltan|necesita|requiere|debe (pedir|solicitar|obtener|conseguir)/,
        ),
      );
      const named = permits.some((s) => has(s, /patente|municipal|sanitari/));
      points[4] =
        additional && named
          ? 20
          : additional
            ? 15
            : named
              ? 10
              : permits.length
                ? 5
                : 0;
      // Contradictory claims take precedence over otherwise positive vocabulary.
      if (
        info.some((s) =>
          negated(
            s,
            /no (hay que|debe\w*|necesita\w*|es necesario) .{0,20}(inform|avis|declar|comunic)/,
          ),
        )
      )
        points[0] = 0;
      if (
        address.some(
          (s) =>
            has(s, /coihue\s*120/) &&
            has(
              s,
              /casa de|domicilio personal|direccion inventada|no .{0,20}(funciona|corresponde|local)/,
            ),
        )
      )
        points[1] = 0;
      if (
        channel.some(
          (s) =>
            has(s, /tesoreria|municipalidad/) &&
            !has(s, /no (en|ante|por)|no es/),
        )
      )
        points[2] = 0;
      if (
        verify.some(
          (s) =>
            has(
              s,
              /nunca .{0,20}(posterior|despues)|no .{0,15}(revisa|comprueba|verifica)|antes de (avisar|declarar|informar|iniciar)|es lo mismo|son lo mismo|mismo tramite|siempre .{0,20}(previa|antes)/,
            ) && !has(s, /no (es|son)/),
        )
      )
        points[3] = 0;
      if (
        permits.some((s) =>
          has(
            s,
            /no (necesita\w*|requiere\w*|hace falta|debe pedir|debe solicitar).{0,40}(permis|patente|autoriz|sanitari|municipal)|no hay .{0,15}(otros permisos|otras autorizaciones)|sii.{0,20}(da|entrega|otorga).{0,20}(patente|autorizacion sanitaria)/,
          ),
        )
      )
        points[4] = 0;
      if (
        permits.some(
          (s) =>
            has(
              s,
              /(inicio|aviso|sii).{0,70}(todos los permisos|autoriza .{0,20}(abrir|funcionar)|reemplaza .{0,20}(permis|patente))/,
            ) && !has(s, /\bno\b|tampoco/),
        )
      )
        points[4] = 0;
    }
    const criteria = evidenceRubric.map((c, i) => ({
      id: c.id,
      title: c.title,
      points: points[i],
      feedback:
        points[i] === 20
          ? `Explicaste con claridad: ${c.title.toLowerCase()}.`
          : c.hint,
    }));
    return {
      version: this.version,
      method: "contextual-rules",
      response,
      evaluatedAt: at,
      attempt,
      total: points.reduce<number>((a, b) => a + b, 0),
      criteria,
      strengths: criteria.filter((c) => c.points === 20).map((c) => c.feedback),
      improvements: criteria
        .filter((c) => c.points < 20)
        .map((c) => c.feedback),
    };
  },
};
export function bestEvaluation(history: EvidenceEvaluation[] = []) {
  return history.reduce<EvidenceEvaluation | undefined>(
    (best, item) => (!best || item.total > best.total ? item : best),
    undefined,
  );
}
export function evidenceOutcome(history: EvidenceEvaluation[] = []) {
  const best = bestEvaluation(history);
  return !best
    ? "Sin evaluar"
    : best.total >= 80
      ? "Misión superada"
      : history.length >= 3
        ? "Misión completada con apoyo"
        : best.total >= 60
          ? "Casi lo logras"
          : "Debes revisar algunos conceptos";
}
export function canCompleteEvidence(history: EvidenceEvaluation[] = []) {
  return (bestEvaluation(history)?.total ?? 0) >= 80 || history.length >= 3;
}
export function evaluateNext(
  response: string,
  history: EvidenceEvaluation[] = [],
): EvidenceEvaluation[] {
  if (!response.trim())
    throw new Error("Escribe tu nota para Camila antes de evaluarla.");
  if (response.length > 2500)
    throw new Error("La nota admite hasta 2500 caracteres.");
  if (history.length >= 3 || canCompleteEvidence(history))
    throw new Error("La evaluación de esta nota ya terminó.");
  return [
    ...history,
    contextualEvaluator.evaluate(response, history.length + 1),
  ];
}

export function summarizeEvidence(history: EvidenceEvaluation[]) {
  const best = bestEvaluation(history)!;
  return {
    bestScore: best.total,
    bestAttempt: best.attempt,
    attempts: history.length,
    outcome: evidenceOutcome(history),
  };
}

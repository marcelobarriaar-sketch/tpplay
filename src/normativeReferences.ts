/** Referencias de edición: no recalcular intentos históricos al actualizar normativa. */
export const normativeReferences = {
  iva: {
    caseRatePercent: 19,
    sourceUrl:
      "https://www.sii.cl/preguntas_frecuentes/impuestos_mensuales/001_130_0572.htm",
    reviewedAt: "2026-10-21",
    sourceUpdatedAt: "2025-06-10",
    version: "iva-caso-2026.10",
    note: "Tasa del caso educativo. La normativa aplicable y sus excepciones deben verificarse antes de cada nueva edición.",
  },
  labor: {
    sourceUrl: "https://www.dt.gob.cl/portal/1626/w3-channel.html",
    reviewedAt: null,
    note: "Montos, topes, jornadas y procedimientos pendientes de revisión específica antes de crear misiones laborales.",
  },
  indexedValues: {
    sourceUrl: "https://www.sii.cl/valores_y_fechas/",
    note: "Consultar UTM/UF por período. No se fija un monto vigente en este catálogo.",
  },
};

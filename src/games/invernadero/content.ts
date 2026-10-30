export const greenhouseCurriculum = {
  module: "Técnicas de cultivo de especies vegetales",
  grade: 4,
  specialty: "Agropecuaria · Mención Agricultura",
  objective:
    "OA 1: aplicar técnicas de cultivo considerando las características de las plantas y del sistema de producción, también en ambientes forzados.",
  learning: "AE 3: manejo cultural en cultivos al aire libre y bajo cubierta.",
  criterion:
    "Criterio 3.6: uso de medios de protección y ventilación según las especificaciones técnicas.",
  source: "https://www.curriculumnacional.cl/614/w3-article-81804.html",
  reviewedAt: "2026-10-30",
};
export const observations = {
  temperature: {
    name: "Leer el termómetro",
    short: "Temperatura",
    value: "32 °C a las 11:00",
    detail:
      "El termómetro del invernadero marca 32 °C. Registra la hora y relaciona esta lectura con las demás señales antes de proponer una causa.",
  },
  soil: {
    name: "Revisar el suelo",
    short: "Suelo",
    value: "Suelo húmedo",
    detail:
      "La revisión del bancal indica suelo húmedo. No hay un dato que confirme falta de agua. Regar por costumbre podría pasar por alto la causa del problema.",
  },
  ventilation: {
    name: "Observar las ventanas",
    short: "Ventilación",
    value: "Ventanas cerradas",
    detail:
      "Las ventanas laterales están cerradas. Revisa cómo puede relacionarse esta condición con el ambiente interior; cualquier apertura debe seguir la indicación de Teresa.",
  },
  leaves: {
    name: "Observar las hojas",
    short: "Hojas",
    value: "Hojas decaídas",
    detail:
      "Varias lechugas tienen hojas decaídas. Esta señal por sí sola no identifica una plaga, una enfermedad ni falta de agua. Necesitas contrastarla con el ambiente y el suelo.",
  },
} as const;
export type ObservationId = keyof typeof observations;
export const greenhouseChapters = [
  {
    title: "La ronda de observación",
    story:
      "En la Huerta del Coihue preparan lechugas para los comercios y restaurantes del valle. Martina llega a su jornada de práctica y encuentra algunas hojas decaídas. Teresa, la encargada, detiene las tareas para revisar qué está pasando. Antes de tocar el riego o intervenir las plantas, te invita a recorrer el invernadero con ellas.",
    request:
      "«No actuemos solo por lo que parece. Reunamos las señales y preparemos una hipótesis que podamos comprobar».",
  },
  {
    title: "Un manejo con fundamento",
    story:
      "Tu registro llega a la mesa de Teresa. El equipo debe decidir cómo continuar sin gastar agua ni aplicar productos a ciegas. Ella pide una propuesta de manejo que respete las condiciones observadas y deje un registro para comparar después.",
    request:
      "«Yo superviso la intervención. Prepara los controles y dime qué vas a registrar; una acción sin seguimiento nos dejaría con la misma duda».",
  },
  {
    title: "Volver a mirar el cultivo",
    story:
      "Teresa revisó el plan y el equipo realizó la ventilación autorizada. Veinte minutos después vuelven al mismo bancal con el termómetro y la bitácora. Algunas plantas recuperan su aspecto, pero otras siguen decaídas. Ahora debes distinguir una mejoría de una solución comprobada.",
    request:
      "«Compara lo de antes y lo de ahora. ¿Qué podemos afirmar y qué necesita una nueva revisión?».",
  },
  {
    title: "La bitácora para el siguiente turno",
    story:
      "La jornada continúa y otro equipo recibirá el invernadero. Martina quiere dejar algo más útil que una marca de “listo”: necesita explicar qué observaron, qué hicieron y qué queda por revisar. Tu nota ayudará a que el siguiente turno no empiece de cero.",
    request:
      "«Cuéntale a Teresa cómo conectaste las señales con tu decisión y qué comprobarías en la próxima ronda».",
  },
];

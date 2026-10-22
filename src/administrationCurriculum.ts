// Fuente curricular única. Resúmenes propios; ver CURRICULUM_ADMINISTRACION.md.
export type ContentStatus =
  | "draft"
  | "curricular_review"
  | "pedagogical_review"
  | "pilot"
  | "published"
  | "archived";
export const statusLabels: Record<ContentStatus, string> = {
  draft: "Borrador",
  curricular_review: "Revisión curricular",
  pedagogical_review: "Revisión pedagógica",
  pilot: "Pilotaje",
  published: "Publicado",
  archived: "Archivado",
};
export const curriculumDisclaimer =
  "TP PLAY es una plataforma educativa independiente y utiliza como referencia curricular documentos oficiales del Ministerio de Educación de Chile. No corresponde a una plataforma oficial del Ministerio de Educación.";
export const administrationSpecialty = {
  name: "Administración",
  sector: "Administración",
  mention: "Recursos Humanos",
  otherMention: "Logística",
  version: "2026.10.1",
  lastReviewedAt: "2026-10-21",
  sourceUrl:
    "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
};
export const administrationModules = [
  {
    moduleId: "ADM-UIC",
    slug: "utilizacion-de-informacion-contable",
    legacySlugs: ["utilizacion-de-la-informacion-contable"],
    legacyName: "Utilización de la Información Contable",
    officialModuleName: "Utilización de información contable",
    displayName: "Información contable",
    grade: 3,
    hours: 152,
    officialObjectives: [
      {
        code: "OA 1 · Plan común",
        summary:
          "Interpretar información contable para comprender la marcha de una empresa.",
      },
    ],
    learningOutcomes: [
      "Registros con normas contables y tributarias",
      "Lectura de información para evaluar la marcha de la empresa",
    ],
    description:
      "Interpretar información contable para comprender la marcha de una empresa.",
    source: "MINEDUC · Programa de Estudio Administración (2015)",
    sourceUrl:
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    sourcePages: "19, 21–26 (paginación impresa)",
    version: "2026.10.1",
    lastReviewedAt: "2026-10-21",
    status: "curricular_review",
    order: 1,
    zoneId: "oficina",
  },
  {
    moduleId: "ADM-GCT",
    slug: "gestion-comercial-y-tributaria",
    legacySlugs: ["gestion-comercial-y-tributaria"],
    legacyName: "Gestión Comercial y Tributaria",
    officialModuleName: "Gestión comercial y tributaria",
    displayName: "Gestión comercial y tributaria",
    grade: 3,
    hours: 152,
    officialObjectives: [
      {
        code: "OA 1 · Plan común",
        summary:
          "Relacionar documentos comerciales y obligaciones tributarias con sus respaldos.",
      },
    ],
    learningOutcomes: [
      "Documentación de importaciones y exportaciones",
      "Seguimiento de obligaciones tributarias",
    ],
    description:
      "Relacionar documentos comerciales y obligaciones tributarias con sus respaldos.",
    source: "MINEDUC · Programa de Estudio Administración (2015)",
    sourceUrl:
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    sourcePages: "19, 21–26 (paginación impresa)",
    version: "2026.10.1",
    lastReviewedAt: "2026-10-21",
    status: "curricular_review",
    order: 2,
    zoneId: "comercial",
  },
  {
    moduleId: "ADM-PAD",
    slug: "procesos-administrativos",
    legacySlugs: ["procesos-administrativos"],
    legacyName: "Procesos Administrativos",
    officialModuleName: "Procesos administrativos",
    displayName: "Procesos administrativos",
    grade: 3,
    hours: 190,
    officialObjectives: [
      {
        code: "OA 2 y OA 3 · Plan común",
        summary:
          "Planificar actividades y comunicar sus avances con evidencia.",
      },
    ],
    learningOutcomes: [
      "Disponibilidad de recursos",
      "Programación de actividades",
      "Seguimiento del programa",
      "Informe de avances y retrasos",
    ],
    description:
      "Planificar actividades y comunicar sus avances con evidencia.",
    source: "MINEDUC · Programa de Estudio Administración (2015)",
    sourceUrl:
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    sourcePages: "19, 21–26 (paginación impresa)",
    version: "2026.10.1",
    lastReviewedAt: "2026-10-21",
    status: "curricular_review",
    order: 3,
    zoneId: "oficina",
  },
  {
    moduleId: "ADM-ACL",
    slug: "atencion-de-clientes",
    legacySlugs: ["servicio-de-atencion-de-clientes"],
    legacyName: "Servicio de Atención de Clientes",
    officialModuleName: "Atención de clientes",
    displayName: "Atención de clientes",
    grade: 3,
    hours: 152,
    officialObjectives: [
      {
        code: "OA 4 · Plan común",
        summary:
          "Escuchar necesidades y responder de manera clara y respetuosa.",
      },
    ],
    learningOutcomes: [
      "Atención de clientes externos",
      "Comunicación con clientes internos",
    ],
    description:
      "Escuchar necesidades y responder de manera clara y respetuosa.",
    source: "MINEDUC · Programa de Estudio Administración (2015)",
    sourceUrl:
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    sourcePages: "19, 21–26 (paginación impresa)",
    version: "2026.10.1",
    lastReviewedAt: "2026-10-21",
    status: "curricular_review",
    order: 4,
    zoneId: "comercial",
  },
  {
    moduleId: "ADM-OOF",
    slug: "organizacion-de-oficinas",
    legacySlugs: ["organizacion-de-oficinas"],
    legacyName: "Organización de Oficinas",
    officialModuleName: "Organización de oficinas",
    displayName: "Organización de oficinas",
    grade: 3,
    hours: 76,
    officialObjectives: [
      {
        code: "OA 5 · Plan común",
        summary:
          "Ordenar recursos e información para recuperarlos oportunamente.",
      },
    ],
    learningOutcomes: [
      "Disponibilidad de información y materiales",
      "Orden de recursos físicos y digitales",
    ],
    description:
      "Ordenar recursos e información para recuperarlos oportunamente.",
    source: "MINEDUC · Programa de Estudio Administración (2015)",
    sourceUrl:
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    sourcePages: "19, 21–26 (paginación impresa)",
    version: "2026.10.1",
    lastReviewedAt: "2026-10-21",
    status: "curricular_review",
    order: 5,
    zoneId: "oficina",
  },
  {
    moduleId: "ADM-AIG",
    slug: "aplicaciones-informaticas-para-la-gestion-administrativa",
    legacySlugs: ["aplicaciones-informaticas"],
    legacyName: "Aplicaciones Informáticas",
    officialModuleName:
      "Aplicaciones informáticas para la gestión administrativa",
    displayName: "Herramientas digitales",
    grade: 3,
    hours: 114,
    officialObjectives: [
      {
        code: "OA 6 · Plan común",
        summary:
          "Usar herramientas digitales para resolver tareas administrativas con eficiencia.",
      },
    ],
    learningOutcomes: [
      "Uso eficiente de equipos",
      "Comunicación y procesamiento de información",
      "Software de propósito general",
    ],
    description:
      "Usar herramientas digitales para resolver tareas administrativas con eficiencia.",
    source: "MINEDUC · Programa de Estudio Administración (2015)",
    sourceUrl:
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    sourcePages: "19, 21–26 (paginación impresa)",
    version: "2026.10.1",
    lastReviewedAt: "2026-10-21",
    status: "curricular_review",
    order: 6,
    zoneId: "oficina",
  },
  {
    moduleId: "ADM-LL",
    slug: "legislacion-laboral",
    legacySlugs: ["legislacion-laboral"],
    legacyName: "Legislación Laboral",
    officialModuleName: "Legislación laboral",
    displayName: "Legislación laboral",
    grade: 4,
    hours: 152,
    officialObjectives: [
      {
        code: "OA 1 · Mención Recursos Humanos",
        summary:
          "Revisar documentación de una relación laboral según la normativa aplicable.",
      },
    ],
    learningOutcomes: [
      "Formalización de contratos",
      "Tramitación de remuneraciones",
      "Documentos del término de la relación laboral",
    ],
    description:
      "Revisar documentación de una relación laboral según la normativa aplicable.",
    source: "MINEDUC · Programa de Estudio Administración (2015)",
    sourceUrl:
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    sourcePages: "19, 21–26 (paginación impresa)",
    version: "2026.10.1",
    lastReviewedAt: "2026-10-21",
    status: "curricular_review",
    order: 7,
    zoneId: "empresa",
  },
  {
    moduleId: "ADM-REM",
    slug: "calculo-de-remuneracion-finiquitos-y-obligaciones-laborales",
    legacySlugs: ["calculo-de-remuneraciones"],
    legacyName: "Cálculo de Remuneraciones",
    officialModuleName:
      "Cálculo de remuneración, finiquitos y obligaciones laborales",
    displayName: "Remuneraciones y finiquitos",
    grade: 4,
    hours: 228,
    officialObjectives: [
      {
        code: "OA 2 · Mención Recursos Humanos",
        summary:
          "Calcular haberes, descuentos y obligaciones con parámetros fechados y respaldados.",
      },
    ],
    learningOutcomes: [
      "Cálculo de remuneraciones",
      "Cálculo de finiquitos",
      "Obligaciones previsionales y tributarias",
    ],
    description:
      "Calcular haberes, descuentos y obligaciones con parámetros fechados y respaldados.",
    source: "MINEDUC · Programa de Estudio Administración (2015)",
    sourceUrl:
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    sourcePages: "19, 21–26 (paginación impresa)",
    version: "2026.10.1",
    lastReviewedAt: "2026-10-21",
    status: "curricular_review",
    order: 8,
    zoneId: "empresa",
  },
  {
    moduleId: "ADM-DBP",
    slug: "desarrollo-y-bienestar-del-personal",
    legacySlugs: ["desarrollo-y-bienestar-organizacional"],
    legacyName: "Desarrollo y Bienestar Organizacional",
    officialModuleName: "Desarrollo y bienestar del personal",
    displayName: "Bienestar del personal",
    grade: 4,
    hours: 228,
    officialObjectives: [
      {
        code: "OA 3 · Mención Recursos Humanos",
        summary:
          "Registrar y tramitar información de desarrollo y bienestar protegiendo los datos.",
      },
    ],
    learningOutcomes: [
      "Registro de información del personal",
      "Archivo de respaldos",
      "Tramitación de formularios y solicitudes",
    ],
    description:
      "Registrar y tramitar información de desarrollo y bienestar protegiendo los datos.",
    source: "MINEDUC · Programa de Estudio Administración (2015)",
    sourceUrl:
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    sourcePages: "19, 21–26 (paginación impresa)",
    version: "2026.10.1",
    lastReviewedAt: "2026-10-21",
    status: "curricular_review",
    order: 9,
    zoneId: "empresa",
  },
  {
    moduleId: "ADM-DPE",
    slug: "dotacion-de-personal",
    legacySlugs: ["dotacion-de-personal"],
    legacyName: "Dotación de Personal",
    officialModuleName: "Dotación de personal",
    displayName: "Dotación de personal",
    grade: 4,
    hours: 152,
    officialObjectives: [
      {
        code: "OA 4 · Mención Recursos Humanos",
        summary:
          "Apoyar la descripción de cargos, el reclutamiento y la incorporación de personas.",
      },
    ],
    learningOutcomes: [
      "Apoyo a descripción de cargos",
      "Apoyo al reclutamiento",
      "Apoyo al proceso de selección descrito en el programa",
    ],
    description:
      "Apoyar la descripción de cargos, el reclutamiento y la incorporación de personas.",
    source: "MINEDUC · Programa de Estudio Administración (2015)",
    sourceUrl:
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    sourcePages: "19, 21–26 (paginación impresa)",
    version: "2026.10.1",
    lastReviewedAt: "2026-10-21",
    status: "curricular_review",
    order: 10,
    zoneId: "empresa",
  },
  {
    moduleId: "ADM-EYE",
    slug: "emprendimiento-y-empleabilidad",
    legacySlugs: ["emprendimiento-y-empleabilidad"],
    legacyName: "Emprendimiento y empleabilidad",
    officialModuleName: "Emprendimiento y empleabilidad",
    displayName: "Emprendimiento y empleabilidad",
    grade: 4,
    hours: 76,
    officialObjectives: [
      {
        code: "Objetivos genéricos EMTP · Sin OA de especialidad propio",
        summary:
          "Preparar proyectos y decisiones de trayectoria formativa y laboral.",
      },
    ],
    learningOutcomes: [
      "Proyecto de emprendimiento",
      "Derechos y deberes laborales",
      "Preparación para incorporarse al trabajo",
      "Alternativas de formación y financiamiento",
    ],
    description:
      "Preparar proyectos y decisiones de trayectoria formativa y laboral.",
    source: "MINEDUC · Programa de Estudio Administración (2015)",
    sourceUrl:
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    sourcePages: "19, 21–26 (paginación impresa)",
    version: "2026.10.1",
    lastReviewedAt: "2026-10-21",
    status: "curricular_review",
    order: 11,
    zoneId: "emprendimiento",
  },
];
export const administrationMissions = [
  {
    id: "ADM-UIC-001",
    slug: "las-cuentas-del-almacen",
    title: "Las cuentas del almacén",
    subtitle: "Distinguir ingresos, costos y respaldos.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 3,
    moduleId: "ADM-UIC",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective: "Distinguir ingresos, costos y respaldos.",
    learningOutcome: null,
    competency:
      "Interpretar información contable para comprender la marcha de una empresa.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 1,
    available: false,
    href: null,
    location: {
      zoneId: "oficina",
      building: "Oficina TP",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Distinguir ingresos, costos y respaldos.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-UIC-002",
    slug: "una-decision-con-numeros",
    title: "Una decisión con números",
    subtitle: "Interpretar un informe contable sencillo.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 3,
    moduleId: "ADM-UIC",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective: "Interpretar un informe contable sencillo.",
    learningOutcome: null,
    competency:
      "Interpretar información contable para comprender la marcha de una empresa.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 2,
    available: false,
    href: null,
    location: {
      zoneId: "oficina",
      building: "Oficina TP",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Interpretar un informe contable sencillo.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-GCT-001",
    slug: "mision-tributos",
    title: "Tributos en Valle del Coihue",
    subtitle:
      "Reconocer el sentido de los tributos y los organismos que intervienen.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 3,
    moduleId: "ADM-GCT",
    curriculumAlignment: {
      status: "partial",
      description:
        "Inducción conceptual al módulo GCT. No acredita el OA 1 ni el AE 2; alineación con un criterio específico pendiente de revisión.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective:
      "Reconocer el sentido de los tributos y los organismos que intervienen.",
    learningOutcome: null,
    competency:
      "Relacionar documentos comerciales y obligaciones tributarias con sus respaldos.",
    duration: "25–35 min",
    difficulty: "Inicial",
    xp: 700,
    prerequisites: [],
    status: "pilot",
    version: "1",
    reviewedAt: "2026-10-21",
    updatedAt: "2026-10-21",
    order: 3,
    available: true,
    href: "/juegos/mision-tributos",
    location: {
      zoneId: "comercial",
      building: "Barrio comercial",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence:
        "Reconocer el sentido de los tributos y los organismos que intervienen.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-GCT-002",
    slug: "mision-iva",
    title: "Misión IVA",
    subtitle:
      "Distinguir compras, ventas, débito y crédito en un caso simplificado.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 3,
    moduleId: "ADM-GCT",
    curriculumAlignment: {
      status: "partial",
      description:
        "Relación parcial con OA 1 del plan común y AE 2 de GCT; práctica acotada de CE 2.1 y 2.2 (p. 58). No evalúa declaración F29 ni el módulo completo.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective:
      "Distinguir compras, ventas, débito y crédito en un caso simplificado.",
    learningOutcome: "AE 2 · alcance parcial",
    competency:
      "Relacionar documentos comerciales y obligaciones tributarias con sus respaldos.",
    duration: "10–15 min",
    difficulty: "Inicial",
    xp: 100,
    prerequisites: [],
    status: "pilot",
    version: "demo-1.0",
    reviewedAt: "2026-10-21",
    updatedAt: "2026-10-21",
    order: 4,
    available: true,
    href: "/desafios/mision-iva",
    location: {
      zoneId: "comercial",
      building: "Barrio comercial",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence:
        "Distinguir compras, ventas, débito y crédito en un caso simplificado.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-GCT-003",
    slug: "documentos-que-cruzan-fronteras",
    title: "Documentos que cruzan fronteras",
    subtitle: "Organizar antecedentes mercantiles de una importación ficticia.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 3,
    moduleId: "ADM-GCT",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective:
      "Organizar antecedentes mercantiles de una importación ficticia.",
    learningOutcome: null,
    competency:
      "Relacionar documentos comerciales y obligaciones tributarias con sus respaldos.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 5,
    available: false,
    href: null,
    location: {
      zoneId: "comercial",
      building: "Barrio comercial",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence:
        "Organizar antecedentes mercantiles de una importación ficticia.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-GCT-004",
    slug: "del-registro-al-f29",
    title: "Del registro al F29",
    subtitle:
      "Preparar antecedentes y revisar un formulario simulado, sin declarar impuestos reales.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 3,
    moduleId: "ADM-GCT",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective:
      "Preparar antecedentes y revisar un formulario simulado, sin declarar impuestos reales.",
    learningOutcome: null,
    competency:
      "Relacionar documentos comerciales y obligaciones tributarias con sus respaldos.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 6,
    available: false,
    href: null,
    location: {
      zoneId: "comercial",
      building: "Barrio comercial",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence:
        "Preparar antecedentes y revisar un formulario simulado, sin declarar impuestos reales.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-PAD-001",
    slug: "organiza-la-feria-del-valle",
    title: "Organiza la feria del Valle",
    subtitle: "Construir un programa con tareas, responsables y recursos.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 3,
    moduleId: "ADM-PAD",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective:
      "Construir un programa con tareas, responsables y recursos.",
    learningOutcome: null,
    competency: "Planificar actividades y comunicar sus avances con evidencia.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 7,
    available: false,
    href: null,
    location: {
      zoneId: "oficina",
      building: "Oficina TP",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Construir un programa con tareas, responsables y recursos.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-PAD-002",
    slug: "el-plan-cambio",
    title: "El plan cambió",
    subtitle: "Ajustar y comunicar avances usando evidencia.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 3,
    moduleId: "ADM-PAD",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective: "Ajustar y comunicar avances usando evidencia.",
    learningOutcome: null,
    competency: "Planificar actividades y comunicar sus avances con evidencia.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 8,
    available: false,
    href: null,
    location: {
      zoneId: "oficina",
      building: "Oficina TP",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Ajustar y comunicar avances usando evidencia.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-ACL-001",
    slug: "escuchar-antes-de-responder",
    title: "Escuchar antes de responder",
    subtitle: "Identificar la necesidad de un cliente.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 3,
    moduleId: "ADM-ACL",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective: "Identificar la necesidad de un cliente.",
    learningOutcome: null,
    competency:
      "Escuchar necesidades y responder de manera clara y respetuosa.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 9,
    available: false,
    href: null,
    location: {
      zoneId: "comercial",
      building: "Barrio comercial",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Identificar la necesidad de un cliente.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-ACL-002",
    slug: "una-solicitud-entre-equipos",
    title: "Una solicitud entre equipos",
    subtitle: "Derivar y responder un requerimiento interno.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 3,
    moduleId: "ADM-ACL",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective: "Derivar y responder un requerimiento interno.",
    learningOutcome: null,
    competency:
      "Escuchar necesidades y responder de manera clara y respetuosa.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 10,
    available: false,
    href: null,
    location: {
      zoneId: "comercial",
      building: "Barrio comercial",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Derivar y responder un requerimiento interno.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-OOF-001",
    slug: "encuentra-el-documento",
    title: "Encuentra el documento",
    subtitle: "Diseñar un sistema simple de clasificación.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 3,
    moduleId: "ADM-OOF",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective: "Diseñar un sistema simple de clasificación.",
    learningOutcome: null,
    competency:
      "Ordenar recursos e información para recuperarlos oportunamente.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 11,
    available: false,
    href: null,
    location: {
      zoneId: "oficina",
      building: "Oficina TP",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Diseñar un sistema simple de clasificación.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-OOF-002",
    slug: "una-oficina-para-colaborar",
    title: "Una oficina para colaborar",
    subtitle: "Organizar el espacio de trabajo con criterios acordados.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 3,
    moduleId: "ADM-OOF",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective:
      "Organizar el espacio de trabajo con criterios acordados.",
    learningOutcome: null,
    competency:
      "Ordenar recursos e información para recuperarlos oportunamente.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 12,
    available: false,
    href: null,
    location: {
      zoneId: "oficina",
      building: "Oficina TP",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Organizar el espacio de trabajo con criterios acordados.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-AIG-001",
    slug: "la-planilla-confiable",
    title: "La planilla confiable",
    subtitle: "Validar datos y fórmulas de un registro.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 3,
    moduleId: "ADM-AIG",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective: "Validar datos y fórmulas de un registro.",
    learningOutcome: null,
    competency:
      "Usar herramientas digitales para resolver tareas administrativas con eficiencia.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 13,
    available: false,
    href: null,
    location: {
      zoneId: "oficina",
      building: "Oficina TP",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Validar datos y fórmulas de un registro.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-AIG-002",
    slug: "un-informe-que-se-entiende",
    title: "Un informe que se entiende",
    subtitle: "Comunicar resultados con herramientas digitales.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 3,
    moduleId: "ADM-AIG",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective: "Comunicar resultados con herramientas digitales.",
    learningOutcome: null,
    competency:
      "Usar herramientas digitales para resolver tareas administrativas con eficiencia.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 14,
    available: false,
    href: null,
    location: {
      zoneId: "oficina",
      building: "Oficina TP",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Comunicar resultados con herramientas digitales.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-LL-001",
    slug: "antes-de-firmar",
    title: "Antes de firmar",
    subtitle: "Reconocer cláusulas y antecedentes de un contrato ficticio.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 4,
    moduleId: "ADM-LL",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective:
      "Reconocer cláusulas y antecedentes de un contrato ficticio.",
    learningOutcome: null,
    competency:
      "Revisar documentación de una relación laboral según la normativa aplicable.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 15,
    available: false,
    href: null,
    location: {
      zoneId: "empresa",
      building: "Empresa del Valle",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Reconocer cláusulas y antecedentes de un contrato ficticio.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-LL-002",
    slug: "del-contrato-a-la-carpeta",
    title: "Del contrato a la carpeta",
    subtitle: "Organizar la documentación laboral y su tramitación.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 4,
    moduleId: "ADM-LL",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective: "Organizar la documentación laboral y su tramitación.",
    learningOutcome: null,
    competency:
      "Revisar documentación de una relación laboral según la normativa aplicable.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 16,
    available: false,
    href: null,
    location: {
      zoneId: "empresa",
      building: "Empresa del Valle",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Organizar la documentación laboral y su tramitación.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-LL-003",
    slug: "un-cierre-responsable",
    title: "Un cierre responsable",
    subtitle: "Revisar los documentos del término de una relación laboral.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 4,
    moduleId: "ADM-LL",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective:
      "Revisar los documentos del término de una relación laboral.",
    learningOutcome: null,
    competency:
      "Revisar documentación de una relación laboral según la normativa aplicable.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 17,
    available: false,
    href: null,
    location: {
      zoneId: "empresa",
      building: "Empresa del Valle",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Revisar los documentos del término de una relación laboral.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-REM-001",
    slug: "lee-tu-liquidacion",
    title: "Lee tu liquidación",
    subtitle: "Distinguir haberes y descuentos en un caso ficticio.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 4,
    moduleId: "ADM-REM",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective: "Distinguir haberes y descuentos en un caso ficticio.",
    learningOutcome: null,
    competency:
      "Calcular haberes, descuentos y obligaciones con parámetros fechados y respaldados.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 18,
    available: false,
    href: null,
    location: {
      zoneId: "empresa",
      building: "Empresa del Valle",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Distinguir haberes y descuentos en un caso ficticio.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-REM-002",
    slug: "la-remuneracion-paso-a-paso",
    title: "La remuneración paso a paso",
    subtitle: "Calcular una liquidación con parámetros del caso.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 4,
    moduleId: "ADM-REM",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective: "Calcular una liquidación con parámetros del caso.",
    learningOutcome: null,
    competency:
      "Calcular haberes, descuentos y obligaciones con parámetros fechados y respaldados.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 19,
    available: false,
    href: null,
    location: {
      zoneId: "empresa",
      building: "Empresa del Valle",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Calcular una liquidación con parámetros del caso.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-REM-003",
    slug: "finiquito-con-respaldo",
    title: "Finiquito con respaldo",
    subtitle: "Justificar cálculos según causal y antecedentes simulados.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 4,
    moduleId: "ADM-REM",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective:
      "Justificar cálculos según causal y antecedentes simulados.",
    learningOutcome: null,
    competency:
      "Calcular haberes, descuentos y obligaciones con parámetros fechados y respaldados.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 20,
    available: false,
    href: null,
    location: {
      zoneId: "empresa",
      building: "Empresa del Valle",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Justificar cálculos según causal y antecedentes simulados.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-REM-004",
    slug: "obligaciones-al-dia",
    title: "Obligaciones al día",
    subtitle: "Identificar obligaciones y verificar sus respaldos.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 4,
    moduleId: "ADM-REM",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective: "Identificar obligaciones y verificar sus respaldos.",
    learningOutcome: null,
    competency:
      "Calcular haberes, descuentos y obligaciones con parámetros fechados y respaldados.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 21,
    available: false,
    href: null,
    location: {
      zoneId: "empresa",
      building: "Empresa del Valle",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Identificar obligaciones y verificar sus respaldos.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-DBP-001",
    slug: "un-plan-para-aprender",
    title: "Un plan para aprender",
    subtitle: "Organizar antecedentes de capacitación.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 4,
    moduleId: "ADM-DBP",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective: "Organizar antecedentes de capacitación.",
    learningOutcome: null,
    competency:
      "Registrar y tramitar información de desarrollo y bienestar protegiendo los datos.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 22,
    available: false,
    href: null,
    location: {
      zoneId: "empresa",
      building: "Empresa del Valle",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Organizar antecedentes de capacitación.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-DBP-002",
    slug: "bienestar-con-informacion-responsable",
    title: "Bienestar con información responsable",
    subtitle: "Tramitar una solicitud con datos ficticios mínimos.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 4,
    moduleId: "ADM-DBP",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective: "Tramitar una solicitud con datos ficticios mínimos.",
    learningOutcome: null,
    competency:
      "Registrar y tramitar información de desarrollo y bienestar protegiendo los datos.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 23,
    available: false,
    href: null,
    location: {
      zoneId: "empresa",
      building: "Empresa del Valle",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Tramitar una solicitud con datos ficticios mínimos.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-DPE-001",
    slug: "que-necesita-el-equipo",
    title: "¿Qué necesita el equipo?",
    subtitle: "Construir una descripción de cargo con criterios pertinentes.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 4,
    moduleId: "ADM-DPE",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective:
      "Construir una descripción de cargo con criterios pertinentes.",
    learningOutcome: null,
    competency:
      "Apoyar la descripción de cargos, el reclutamiento y la incorporación de personas.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 24,
    available: false,
    href: null,
    location: {
      zoneId: "empresa",
      building: "Empresa del Valle",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Construir una descripción de cargo con criterios pertinentes.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-DPE-002",
    slug: "un-proceso-transparente",
    title: "Un proceso transparente",
    subtitle: "Organizar antecedentes ficticios de reclutamiento sin sesgos.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 4,
    moduleId: "ADM-DPE",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective:
      "Organizar antecedentes ficticios de reclutamiento sin sesgos.",
    learningOutcome: null,
    competency:
      "Apoyar la descripción de cargos, el reclutamiento y la incorporación de personas.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 25,
    available: false,
    href: null,
    location: {
      zoneId: "empresa",
      building: "Empresa del Valle",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Organizar antecedentes ficticios de reclutamiento sin sesgos.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-EYE-001",
    slug: "primera-entrevista",
    title: "Tu primera entrevista",
    subtitle:
      "Comunicar habilidades con ejemplos y reconocer lo que falta aprender.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 4,
    moduleId: "ADM-EYE",
    curriculumAlignment: {
      status: "partial",
      description:
        "Relación parcial con AE 3 de Emprendimiento y empleabilidad (p. 26). La entrevista no cubre toda la preparación para incorporarse al trabajo.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective:
      "Comunicar habilidades con ejemplos y reconocer lo que falta aprender.",
    learningOutcome: "AE 3 · alcance parcial",
    competency:
      "Preparar proyectos y decisiones de trayectoria formativa y laboral.",
    duration: "8–12 min",
    difficulty: "Inicial",
    xp: 100,
    prerequisites: [],
    status: "pilot",
    version: "demo-1.0",
    reviewedAt: "2026-10-21",
    updatedAt: "2026-10-21",
    order: 26,
    available: true,
    href: "/desafios/primera-entrevista",
    location: {
      zoneId: "emprendimiento",
      building: "Centro de emprendimiento",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence:
        "Comunicar habilidades con ejemplos y reconocer lo que falta aprender.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-EYE-002",
    slug: "una-idea-para-el-valle",
    title: "Una idea para el Valle",
    subtitle: "Proponer un proyecto con acciones y presupuesto.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 4,
    moduleId: "ADM-EYE",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective: "Proponer un proyecto con acciones y presupuesto.",
    learningOutcome: null,
    competency:
      "Preparar proyectos y decisiones de trayectoria formativa y laboral.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 27,
    available: false,
    href: null,
    location: {
      zoneId: "emprendimiento",
      building: "Centro de emprendimiento",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Proponer un proyecto con acciones y presupuesto.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
  {
    id: "ADM-EYE-003",
    slug: "tu-siguiente-paso",
    title: "Tu siguiente paso",
    subtitle: "Comparar oportunidades de formación y financiamiento.",
    specialty: "Administración",
    mention: "Recursos Humanos",
    grade: 4,
    moduleId: "ADM-EYE",
    curriculumAlignment: {
      status: "pending",
      description:
        "Propuesta TP PLAY. Alineación curricular pendiente de revisión; no se asigna un criterio oficial todavía.",
      sourceUrl:
        "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    },
    learningObjective: "Comparar oportunidades de formación y financiamiento.",
    learningOutcome: null,
    competency:
      "Preparar proyectos y decisiones de trayectoria formativa y laboral.",
    duration: null,
    difficulty: "Por diseñar",
    xp: null,
    prerequisites: [],
    status: "draft",
    version: "0.1-plan",
    reviewedAt: null,
    updatedAt: "2026-10-21",
    order: 28,
    available: false,
    href: null,
    location: {
      zoneId: "emprendimiento",
      building: "Centro de emprendimiento",
    },
    teacher: {
      methodology: "Caso situado, decisiones justificadas y cierre reflexivo.",
      evidence: "Comparar oportunidades de formación y financiamiento.",
      criteria:
        "Criterios observables TP PLAY; no equivalen a certificación curricular.",
      answerGuideStatus: "Pendiente de validación docente",
      accommodations: [
        "Lectura por etapas",
        "Pistas sin penalización",
        "Tiempo flexible",
        "Respuesta diversificada con acompañamiento",
      ],
      plannedSupports: ["Audio", "Lectura simplificada", "Apoyos visuales"],
    },
    bibliography: [
      "https://www.curriculumnacional.cl/614/articles-34310_programa.pdf",
    ],
  },
];
export const modulePath = (m: (typeof administrationModules)[number]) =>
  `/especialidades/administracion/modulos/${m.slug}`;
export const findAdministrationModule = (slug?: string) =>
  administrationModules.find(
    (m) => m.slug === slug || m.legacySlugs.includes(slug || ""),
  );
export const administrationCommercialName = administrationModules.find(
  (m) => m.moduleId === "ADM-GCT",
)!.legacyName;

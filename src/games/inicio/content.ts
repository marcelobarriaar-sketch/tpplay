import { administrationCommercialName } from "../../administrationCurriculum";
import type { Mission, Step } from "../../data";
export const inicioSlug = "inicio-actividades";
export const inicioSources = [
  {
    title: "SII · Inicio de actividades por internet y excepciones",
    url: "https://www.sii.cl/preguntas_frecuentes/rut_inicio_actividades/001_105_3790.htm",
    updatedAt: "2025-05-08",
  },
  {
    title: "SII · Información del aviso de inicio de actividades",
    url: "https://www.sii.cl/destacados/educacion/ciclo_vida_contribuyente/paso_02.html",
    updatedAt: null,
  },
  {
    title: "SII · Verificación de actividad y eventuales visitas",
    url: "https://www.sii.cl/preguntas_frecuentes/rut_inicio_actividades/001_105_1920.htm",
    updatedAt: "2025-12-09",
  },
  {
    title: "SII · Cuándo solicitar verificación para emitir facturas",
    url: "https://www.sii.cl/preguntas_frecuentes/rut_inicio_actividades/001_105_6426.htm",
    updatedAt: null,
  },
  {
    title: "SII · Plazo del aviso y ejemplo del cómputo por meses",
    url: "https://www.sii.cl/ayudas/nuevos_contribuyentes/boleta-honorarios.html",
    updatedAt: null,
  },
];
export const dossierCards = [
  {
    id: "arriendo",
    title: "Contrato del local actual",
    text: "Camila Soto · Avenida Coihue 120, Villa del Coihue · uso del local del restaurante. Documento ficticio.",
    help: "Respalda el uso del domicilio declarado en este caso.",
  },
  {
    id: "equipamiento",
    title: "Respaldo de equipamiento",
    text: "Compra de mesas y equipamiento para La Mesa del Coihue. Destino: Avenida Coihue 120. Documento ficticio.",
    help: "Aporta antecedentes coherentes de la actividad descrita.",
  },
  {
    id: "antiguo",
    title: "Borrador del local descartado",
    text: "Propuesta sin firmar para Avenida Coihue 210. Camila descartó ese inmueble.",
    help: "Corresponde a otro domicilio; no respalda el local actual.",
  },
  {
    id: "clave",
    title: "Nota con una contraseña",
    text: "Un vecino propone adjuntar la clave personal de Camila. La clave no se muestra ni se solicita.",
    help: "Una contraseña es privada; no se adjunta a un expediente.",
  },
] as const;
export const dossierCorrectMask = 3;
export const dossierOptions = Array.from({ length: 16 }, (_, mask) =>
  mask === 0
    ? "Carpeta vacía"
    : dossierCards
        .filter((_, i) => mask & (1 << i))
        .map((d) => d.title)
        .join(" + "),
);
const dossierFeedback = Array.from({ length: 16 }, (_, mask) =>
  mask === dossierCorrectMask
    ? "La carpeta contiene respaldos coherentes de domicilio y actividad, sin incluir la contraseña ni el borrador de otro local. Es una selección didáctica: el SII puede exigir antecedentes adicionales según el caso."
    : `${mask & 8 ? "La contraseña nunca debe adjuntarse. " : ""}${mask & 4 ? "El borrador corresponde a un local descartado. " : ""}${(mask & 3) !== 3 ? "Revisa los respaldos del local actual y del equipamiento. " : ""}La decisión queda registrada para revisarla al cierre; no equivale a una aprobación del SII.`,
);
export const inicioSteps: Step[] = [
  {
    title: "El encargo de Camila",
    context:
      "En Villa del Coihue, Camila abrirá La Mesa del Coihue: prepara y vende comidas. Actúa como persona natural y pide tu apoyo administrativo. Todavía no presenta el aviso de inicio de actividades. Su negocio y todos sus antecedentes son ficticios.",
    prompt: "¿Qué situación debes ayudar a resolver?",
    options: [
      "Informar al SII el inicio de una actividad económica, sin confundirlo con obtener todos los permisos del restaurante",
      "Conseguir una patente municipal y asumir que eso avisa automáticamente al SII",
      "Solicitar una boleta de honorarios por vender las comidas del restaurante",
    ],
    correct: 0,
    feedback: [
      "Identificaste el encargo. El aviso al SII es distinto de los permisos de otros organismos. El caso trata de un negocio de venta de comidas, no de un servicio profesional a honorarios.",
      "La patente y el aviso al SII son trámites distintos. No supongas que uno reemplaza al otro.",
      "La venta de comidas del negocio no se debe clasificar automáticamente como honorarios profesionales. Primero identifica la actividad real.",
    ],
    hint: "Distingue quién realiza la actividad, qué ofrece y ante qué organismo se presenta el aviso.",
    criterion: "Diferencia aviso al SII de otros permisos",
  },
  {
    title: "Dos puertas, un mismo servicio",
    context:
      "Llegas a la oficina ficticia del SII del Barrio Cívico. Paula, orientadora, explica: «Podemos orientar. La regla general del aviso es por internet, salvo excepciones legales. No necesitas esperar una visita para empezar a revisar tus antecedentes». En la oficina también trabaja el equipo fiscalizador del pueblo.",
    prompt: "¿Qué recorrido eliges para este caso con conexión a internet?",
    options: [
      "Esperar en el restaurante a que un fiscalizador haga el aviso por Camila",
      "Usar el portal oficial para el trámite y la oficina para orientación cuando se necesite",
      "Ir a Tesorería, porque siempre realiza el inicio de actividades",
    ],
    correct: 1,
    feedback: [
      "El contribuyente presenta su aviso; no debe esperar una fiscalización para hacerlo.",
      "Puedes trabajar desde el terminal de orientación o desde el negocio. La oficina y el portal cumplen funciones complementarias; no se impone una visita presencial general.",
      "El aviso se presenta ante el SII, no ante Tesorería. Revisa la competencia de cada servicio.",
    ],
    hint: "El portal es un canal del SII; la oficina no desaparece por existir un trámite en línea.",
    criterion:
      "Reconoce el canal digital y el rol de orientación de la oficina",
  },
  {
    title: "La actividad detrás del letrero",
    context:
      "Camila vende comidas preparadas para consumo de sus clientes. El letrero dice «La Mesa del Coihue». El portal requiere identificar la actividad económica; un nombre comercial no basta. En la simulación no utilizamos códigos reales.",
    prompt: "¿Cómo prepararías la descripción de la actividad?",
    options: [
      "Escribir solo «La Mesa del Coihue», sin explicar qué hace",
      "Elegir transporte turístico porque hay turistas entre los clientes",
      "Describir la preparación y venta de comidas y contrastarla con el catálogo oficial del SII",
    ],
    correct: 2,
    feedback: [
      "El nombre de fantasía no describe por sí mismo la actividad económica.",
      "Que un cliente sea turista no transforma un restaurante en transporte turístico.",
      "La descripción debe corresponder a lo que efectivamente realiza el negocio. En un caso real se verifica el código y su clasificación en el catálogo vigente; aquí no se inventan códigos.",
    ],
    hint: "Mira la operación del negocio, no solo su nombre ni el tipo de visitante.",
    criterion: "Relaciona la actividad declarada con la operación del negocio",
  },
  {
    title: "El reloj del expediente",
    context:
      "El caso fija el primer acto necesario para desarrollar la actividad, generador de impuestos, el 12 de septiembre de 2026. El aviso se presenta dentro de los dos meses siguientes al mes de inicio. Es un calendario de aprendizaje, sin cuenta regresiva ni multas simuladas.",
    prompt: "¿Qué fecha límite corresponde a este caso?",
    options: [
      "30 de septiembre de 2026",
      "30 de noviembre de 2026",
      "Cuando Camila consiga su primer cliente, aunque pasen varios meses",
    ],
    correct: 1,
    feedback: [
      "El cómputo del caso considera los dos meses siguientes al mes de inicio: octubre y noviembre.",
      "En el caso, los dos meses siguientes a septiembre son octubre y noviembre; el límite es el 30 de noviembre. No se debe esperar indefinidamente a la primera venta. Verifica siempre la norma y las circunstancias reales.",
      "El plazo no se posterga indefinidamente por no haber atendido al primer cliente. El caso ya fijó un acto de inicio relevante.",
    ],
    hint: "Septiembre es el mes de inicio. Cuenta octubre y noviembre, no sesenta días desde el 12.",
    criterion: "Interpreta un plazo por meses en un caso acotado",
  },
  {
    title: "La mesa de los respaldos",
    context:
      "La carpeta de Camila debe sostener dos afirmaciones del caso: usa el local de Avenida Coihue 120 y está preparando allí su restaurante. Hay dos antecedentes coherentes y dos distractores. Selecciona las tarjetas que llevarías a la mesa de revisión; no se cargan archivos reales.",
    prompt:
      "Arma una carpeta coherente para domicilio y actividad, protegiendo las credenciales.",
    options: dossierOptions,
    correct: dossierCorrectMask,
    feedback: dossierFeedback,
    hint: "Comprueba dirección, relación con la actividad y privacidad. El borrador del local descartado no acredita el local actual.",
    criterion: "Selecciona respaldos pertinentes y protege información privada",
  },
  {
    title: "Portal de práctica: revisa antes de enviar",
    context:
      "La ficha revisada dice: Camila Soto; preparación y venta de comidas; Avenida Coihue 120; inicio 12/09/2026. El portal del juego es una maqueta educativa: no pide RUT, claves, dinero ni documentos personales, y no se conecta al SII.",
    prompt: "¿Qué resumen enviarías en la simulación?",
    options: [
      "Actividad de transporte · Avenida Coihue 120 · 12/09/2026",
      "Restaurante · Avenida Coihue 210 · 12/09/2026",
      "Preparación y venta de comidas · Avenida Coihue 120 · 12/09/2026",
    ],
    correct: 2,
    feedback: [
      "La actividad no coincide con el negocio del expediente. Corrige antes de enviar.",
      "La dirección corresponde al local descartado. Revisa los antecedentes del domicilio actual.",
      "El resumen coincide con los antecedentes. En un trámite real deben revisarse también todos los campos y acreditaciones que solicite la aplicación. El envío de este juego no presenta un aviso real.",
    ],
    hint: "Cruza tres datos: actividad, domicilio y fecha. No basta que dos coincidan.",
    criterion: "Detecta inconsistencias entre declaración y antecedentes",
  },
  {
    title: "La fiscalizadora sale de la oficina",
    context:
      "En esta rama ficticia, Camila necesita emitir por primera vez facturas que dan derecho a crédito fiscal y solicita verificación de actividad por el canal oficial. El SII revisa antecedentes y, cuando corresponda, puede coordinar una visita. En la historia, la fiscalizadora Elena sale de la oficina del Barrio Cívico hacia el restaurante tras coordinarla con Camila. No todos los inicios reciben visita.",
    prompt: "¿Cómo preparas esta revisión?",
    options: [
      "Ocultar las diferencias y entregar la contraseña para acelerar la visita",
      "Presentar antecedentes verdaderos y coherentes, atender lo solicitado por el canal oficial y distinguir aviso de verificación",
      "Afirmar que el aviso de inicio ya garantiza toda autorización para emitir facturas y todos los permisos",
    ],
    correct: 1,
    feedback: [
      "Las inconsistencias se aclaran con antecedentes; las contraseñas no se entregan.",
      "El aviso y la verificación de actividad tienen finalidades distintas. En este caso la visita es una posibilidad coordinada, no un requisito universal ni una autorización automática.",
      "Iniciar actividades no reemplaza la verificación cuando corresponde ni todos los permisos de otras autoridades.",
    ],
    hint: "Revisa qué se está verificando y aporta evidencia. No confundas una constancia del aviso con toda autorización.",
    criterion: "Distingue aviso, verificación y eventual visita del SII",
  },
  {
    title: "La apertura responsable",
    context:
      "El expediente educativo está revisado. Camila pregunta si puede anunciar «todos los permisos aprobados». La oficina del SII no reemplaza a la municipalidad ni a las otras autoridades competentes. El juego no emite certificados oficiales ni autoriza la apertura del negocio.",
    prompt: "¿Qué le explicarías a Camila?",
    options: [
      "El aviso tributario resuelve todos los permisos del restaurante",
      "La visita significa necesariamente que recibirá una multa",
      "Conservar los respaldos del trámite y consultar por separado los permisos y obligaciones que correspondan a su actividad",
    ],
    correct: 2,
    feedback: [
      "Un trámite tributario no concentra todas las competencias públicas.",
      "La verificación no implica por sí misma una multa. No inventes consecuencias automáticas.",
      "La buena gestión distingue competencias, conserva respaldos y revisa obligaciones. Completaste un expediente de aprendizaje; la formalización real requiere seguir las instrucciones vigentes de cada organismo.",
    ],
    hint: "Una gestión responsable verifica el alcance de cada trámite; evita prometer más de lo que acredita.",
    criterion:
      "Explica el alcance del aviso y los siguientes pasos responsables",
  },
];
export const inicioMission: Mission = {
  slug: inicioSlug,
  title: "La primera apertura: expediente Coihue",
  subtitle: "Un negocio, dos puertas y una carpeta que debes reconstruir.",
  area: "administracion",
  module: administrationCommercialName,
  level: "3",
  duration: "20–30 min",
  difficulty: "Inicial",
  version: "inicio-1.0",
  curriculumId: "ADM-GCT-005",
  status: "pilot",
  context:
    "En Villa del Coihue, Camila necesita iniciar las actividades de su restaurante La Mesa del Coihue. Recorrerás el Barrio Cívico, la oficina ficticia del SII, su portal de práctica y el negocio. Cada nivel te entrega una pieza del expediente. Toda la información es ficticia; no realizas trámites reales.",
  goal: "Preparar y revisar un aviso simulado de inicio de actividades, distinguir sus canales y reconocer la función de la verificación y de los fiscalizadores.",
  evidence:
    "Redacta una nota para Camila: qué se comunica al SII, por qué el expediente usa Avenida Coihue 120, qué canal utilizarías y cómo se diferencia el aviso de una eventual verificación. Aclara por qué una constancia del juego no autoriza todos los permisos del restaurante. No incluyas datos personales.",
  sourceIds: [
    "sii-inicio-actividades",
    "sii-verificacion-actividad",
    "programa-administracion",
  ],
  steps: inicioSteps,
};
export const inicioPlaces = [
  {
    id: "barrio",
    name: "La Mesa del Coihue",
    icon: "🍲",
    description:
      "El restaurante de Camila. Aquí contrastas lo que declara con lo que realmente hará el negocio.",
    levels: [0, 2, 7],
  },
  {
    id: "sii",
    name: "Oficina del SII",
    icon: "🏛️",
    description:
      "Oficina ficticia del Barrio Cívico: Paula orienta y el equipo fiscalizador coordina sus salidas. No es una dependencia real ni una ruta obligatoria para todos los trámites.",
    levels: [1, 3, 4, 6],
  },
  {
    id: "portal",
    name: "Portal de práctica",
    icon: "💻",
    description:
      "Canal digital simulado de la historia. En la vida real se usa sii.cl; aquí no se solicitan credenciales ni se envían antecedentes al SII.",
    levels: [5],
  },
] as const;

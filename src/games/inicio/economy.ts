export const startingBudget=300;
export type BudgetAttempt={economyVersion?:number;missionSlug:string;answers:string[];confirmed:boolean[]};
type Impact={cost:number;reason:string;repair:string};
const impacts:Impact[][]=[
 [{cost:0,reason:'Separaste los trámites desde el comienzo.',repair:'Conserva una lista de obligaciones por organismo.'},{cost:20,reason:'Camila debe rehacer su agenda al confundir la patente con el aviso.',repair:'Separa el aviso al SII de los permisos municipales.'},{cost:25,reason:'Hay que rehacer la clasificación preparada para un servicio que no corresponde.',repair:'Describe primero la venta de comidas.'}],
 [{cost:15,reason:'Camila pierde una jornada de preparación esperando una gestión que debe iniciar ella.',repair:'Retoma el aviso por el canal del SII.'},{cost:0,reason:'Elegiste el canal adecuado y evitaste un viaje innecesario.',repair:'Consulta orientación si surge una duda.'},{cost:10,reason:'El traslado a Tesorería consume recursos sin resolver el aviso.',repair:'Identifica al organismo competente antes de salir.'}],
 [{cost:15,reason:'El nombre del local obliga a rehacer la descripción incompleta.',repair:'Explica qué prepara y vende el negocio.'},{cost:25,reason:'La clasificación de transporte exige rehacer los antecedentes.',repair:'Contrasta la operación del restaurante con el catálogo.'},{cost:0,reason:'La actividad y el negocio coinciden.',repair:'Conserva los antecedentes de la actividad.'}],
 [{cost:5,reason:'El plazo demasiado corto obliga a reorganizar innecesariamente la agenda.',repair:'Cuenta los meses siguientes al mes de inicio.'},{cost:0,reason:'La agenda usa el plazo del caso.',repair:'Planifica con margen para revisar antecedentes.'},{cost:20,reason:'Dejar el aviso sin fecha genera una demora y una nueva jornada de gestión.',repair:'Fija la fecha del calendario antes de continuar.'}],
 [],
 [{cost:25,reason:'La actividad equivocada exige una nueva revisión del resumen.',repair:'Compara la actividad con la carpeta.'},{cost:30,reason:'El domicilio descartado obliga a rehacer el resumen y los respaldos.',repair:'Usa Avenida Coihue 120.'},{cost:0,reason:'La revisión evitó costos de corrección.',repair:'Conserva la copia revisada.'}],
 [{cost:40,reason:'Ocultar diferencias y compartir una clave exige detener la revisión y dedicar recursos a proteger el acceso.',repair:'Aclara las diferencias por el canal oficial y protege las credenciales.'},{cost:0,reason:'Los antecedentes coherentes permiten preparar la revisión.',repair:'Atiende lo solicitado por el canal oficial.'},{cost:25,reason:'Prometer autorizaciones que faltan obliga a reorganizar la apertura.',repair:'Distingue aviso, verificación y permisos.'}],
 [{cost:30,reason:'Anunciar todos los permisos sin revisarlos exige corregir la planificación y la comunicación.',repair:'Revisa los permisos con cada autoridad competente.'},{cost:10,reason:'Suponer una multa desvía tiempo hacia una gestión innecesaria.',repair:'Comprueba el alcance de la visita antes de actuar.'},{cost:0,reason:'La planificación distingue lo logrado de lo pendiente.',repair:'Mantén la lista de siguientes pasos.'}],
];
export function decisionImpact(index:number,answer:string):Impact|null{
 if(!/^\d+$/.test(answer))return null;const n=Number(answer);
 if(index===4){if(n>15)return null;const missing=2-Number(!!(n&1))-Number(!!(n&2));const cost=missing*10+(n&4?15:0)+(n&8?25:0);return {cost,reason:cost?'Reorganizar respaldos incompletos, resolver el domicilio descartado o proteger el acceso consume recursos de la carpeta.':'La carpeta reúne respaldos coherentes sin exponer claves.',repair:'Incluye el contrato y equipamiento del local actual; excluye el borrador y la contraseña.'};}
 return impacts[index]?.[n]||null;
}
export function budgetSummary(a:BudgetAttempt){
 const entries=a.confirmed.flatMap((confirmed,index)=>{const impact=confirmed?decisionImpact(index,a.answers[index]||''):null;return impact?[{index,...impact}]:[];});
 const spent=entries.reduce((sum,e)=>sum+e.cost,0);return {initial:startingBudget,spent,balance:Math.max(0,startingBudget-spent),entries};
}

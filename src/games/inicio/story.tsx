import { useState, type ReactNode } from 'react';

export const camilaChapters = [
  {look:0, title:'Una idea empieza a tomar forma', text:'Camila levanta la cortina de La Mesa del Coihue. Durante meses imaginó un lugar donde vecinos y visitantes pudieran compartir un almuerzo. Ahora tiene el local, las mesas y sus recetas. Pero entre las cajas encuentra una pregunta que todavía no sabe responder: «¿Cómo aviso que mi negocio comienza?».'},
  {look:1, title:'La carpeta sale a recorrer el pueblo', text:'Camila cambia el delantal por su chaqueta y lleva una carpeta al Barrio Cívico. Paula la recibe en la oficina del SII: «Podemos orientarte aquí; el aviso se realiza por internet como regla general». Camila también podrá continuar desde el computador del restaurante.'},
  {look:1, title:'Lo que dice el letrero y lo que hace el negocio', text:'De vuelta con sus apuntes, Camila escribe el nombre del restaurante en una hoja. Se detiene: «El nombre cuenta mi sueño, pero ¿explica lo que voy a hacer?». Necesita describir la actividad que realmente realizará.'},
  {look:1, title:'Una fecha entre los papeles', text:'Al ordenar los antecedentes, Camila encuentra la fecha del primer acto del caso: 12 de septiembre. Mira el calendario: «No quiero dejar esto para después de abrir». Te pide interpretar el plazo antes de seguir.'},
  {look:1, title:'Dos direcciones en una misma mesa', text:'Camila extiende los papeles. Hay un respaldo del local actual y un viejo borrador de otro inmueble. «¡Casi guardo todo junto!», dice. Tu tarea es construir una carpeta coherente y dejar fuera lo que no corresponde.'},
  {look:1, title:'Un último vistazo antes del clic', text:'En el computador del restaurante, Camila compara el resumen con su carpeta. La dirección del local que descartó todavía aparece en un borrador. «Revisemos cada dato antes de avanzar».'},
  {look:0, title:'Elena prepara su salida', text:'En esta rama del caso, Camila solicita verificación para emitir sus primeras facturas con derecho a crédito fiscal. Elena revisa los antecedentes en la oficina y coordina una visita cuando corresponde. Camila vuelve a su delantal y prepara el local: «Que los papeles cuenten lo mismo que se ve aquí».'},
  {look:2, title:'El letrero todavía tiene una pregunta', text:'Camila coloca el menú sobre el mostrador. Está más tranquila, pero antes de anunciar la apertura pregunta: «¿Este aviso significa que ya tengo todos los permisos?». Tu última decisión debe ayudarla a distinguir lo logrado de lo que aún necesita revisar.'},
  {look:2, title:'Una nota para seguir con confianza', text:'La carpeta está ordenada. Camila te pide una nota que pueda releer: qué comunica al SII, qué datos revisaron y cómo se diferencia el aviso de una posible verificación. Ahora te toca explicar el recorrido con tus propias palabras.'},
] as const;

export function CamilaPortrait({look, alt}:{look:number;alt:string}) {
  return <div className="camila-portrait"><img src="/images/camila-fotografia.webp" alt={alt} width="1774" height="887" style={{transform:`translateX(-${look*100/3}%)`}} /></div>;
}
export function CamilaChapter({index=0,ending=false}:{index?:number;ending?:boolean}) {
 const chapter=camilaChapters[Math.min(Math.max(index,0),8)];
 return <section className="camila-chapter" aria-label={ending?'Desenlace de Camila':'La historia de Camila'}>
  <CamilaPortrait look={ending?2:chapter.look} alt={`Camila, ${ending||chapter.look!==1?'con delantal en su restaurante':'con chaqueta y carpeta preparando el trámite'}.`} />
  <div><p className="eyebrow">{ending?'EPÍLOGO · VILLA DEL COIHUE':'CAMILA · LA MESA DEL COIHUE'}</p><h2>{ending?'Una carpeta y un siguiente paso':chapter.title}</h2><p>{ending?'«Ahora tengo más claro qué revisar y qué preguntar», dice Camila. Guarda su carpeta y anota los permisos que deberá consultar por separado. Tu recorrido termina aquí; la historia de su restaurante continúa.':chapter.text}</p></div>
 </section>;
}
export function InicioStoryGate({enabled,children}:{enabled:boolean;children:ReactNode}) {
 const [accepted,setAccepted]=useState(false);
 if(!enabled||accepted)return <>{children}</>;
 return <section className="panel inicio-prologue"><p className="eyebrow">ANTES DE COMENZAR · VILLA DEL COIHUE</p><h1>Camila tiene un sueño. Tú tienes un encargo.</h1><CamilaChapter/><p>Una vecina le habló de la oficina del SII del pueblo. Camila te pide acompañarla: «Sé preparar las recetas; necesito ayuda para ordenar este primer paso de mi negocio».</p><p><strong>Tu papel:</strong> apoyar la gestión administrativa, contrastar antecedentes y explicar tus decisiones. Conocerás a Paula, que orienta desde la oficina, y a Elena, del equipo fiscalizador.</p><p>Camila reserva 300 Coihues para la gestión. Tus decisiones pueden consumir recursos en traslados, demoras y correcciones. Antes de confirmar verás el costo posible. La historia avanza en ocho decisiones y una nota final, sin reloj ni vidas.</p><button className="button" onClick={()=>{setAccepted(true); requestAnimationFrame(()=>document.getElementById('contenido')?.focus());}}>Aceptar el encargo de Camila</button></section>;
}

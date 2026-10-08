import { areas, missions, resources, slugify } from './data';
export const siteOrigin = 'https://www.tpplay.cl';
export type SeoPage = { path:string; title:string; description:string; label:string };
export const seoPages: SeoPage[] = [
{path:'/',title:'TP PLAY | Aprende jugando: educación técnico profesional en Chile',description:'Explora desafíos de Administración, Agropecuaria y empleabilidad para 3.º y 4.º medio TP. Proyecto educativo de Marcelo Barría Arismendi, desde Los Lagos, Chile.',label:'Inicio'},
{path:'/especialidades',title:'Especialidades técnico profesionales | TP PLAY Chile',description:'Explora Administración con mención Recursos Humanos, Agropecuaria y Atención de Párvulos. Conoce módulos y misiones educativas de demostración.',label:'Especialidades'},
{path:'/desafios',title:'Desafíos y juegos educativos para estudiantes TP | TP PLAY',description:'Aprende haciendo con Misión IVA, Rescate del invernadero y Tu primera entrevista. Casos ficticios con decisiones, pistas y actividades para estudiantes TP.',label:'Desafíos'},
{path:'/recursos',title:'Recursos de educación técnico profesional en Chile | TP PLAY',description:'Consulta referencias de MINEDUC y SII para complementar desafíos de educación técnico profesional. Fuentes públicas y condiciones de uso.',label:'Recursos'},
{path:'/como-funciona',title:'Cómo aprender con desafíos técnico profesionales | TP PLAY',description:'Elige una misión, toma decisiones, entiende tus resultados y vuelve a intentarlo. Conoce cómo usar los desafíos educativos de TP PLAY.',label:'Cómo funciona'},
{path:'/docente',title:'Proyecto educativo para docentes TP | TP PLAY Chile',description:'Conoce el proyecto TP PLAY y su próxima etapa para acompañar cursos y revisar evidencias. Espacio explicativo, aún sin cursos conectados.',label:'Docentes'},
{path:'/ayuda',title:'Ayuda y contacto de TP PLAY | Marcelo Barría Arismendi',description:'Aprende a usar TP PLAY y contacta a su creador, el docente técnico profesional Marcelo Barría Arismendi, desde la Región de Los Lagos, Chile.',label:'Ayuda'},
...areas.map(a=>({path:`/especialidades/${a.id}`,title:`${a.fullName} | TP PLAY Chile`,description:a.description+' Explora sus módulos y la disponibilidad de desafíos educativos de demostración para estudiantes técnico profesionales.',label:a.name})),
...missions.map(m=>({path:`/desafios/${m.slug}`,title:`${m.title}: actividad técnico profesional | TP PLAY`,description:m.subtitle+' '+m.goal,label:m.title})),
...resources.map(r=>({path:`/recursos/${r.slug}`,title:`${r.title} | Biblioteca TP PLAY`,description:r.description,label:r.title})),
...areas.flatMap(a=>a.modules.filter(module=>missions.some(m=>m.area===a.id&&m.module===module)).map(module=>({path:`/especialidades/${a.id}/modulos/${slugify(module)}`,title:`${module} | ${a.name} | TP PLAY`,description:`Explora la misión de demostración de ${module} en ${a.fullName}. Actividad educativa con decisiones, pistas y evidencia final.`,label:module})))
];
export function seoFor(path:string) { return seoPages.find(page=>page.path===path.replace(/\/$/,'') || page.path===path); }
export function structuredData(page:SeoPage) {
 const publisher={'@type':'Organization','@id':siteOrigin+'/#project',name:'TP PLAY',url:siteOrigin,description:'Proyecto educativo técnico profesional creado desde la Región de Los Lagos, Chile.',founder:{'@type':'Person',name:'Marcelo Barría Arismendi',jobTitle:'Docente técnico profesional'},areaServed:{'@type':'Country',name:'Chile'}};
 return {'@context':'https://schema.org','@graph':[publisher,{'@type':'WebSite','@id':siteOrigin+'/#website',name:'TP PLAY',alternateName:'TPPlay',url:siteOrigin,inLanguage:'es-CL',publisher:{'@id':siteOrigin+'/#project'}},{'@type':'WebPage','@id':siteOrigin+page.path,name:page.title,description:page.description,url:siteOrigin+page.path,inLanguage:'es-CL',isPartOf:{'@id':siteOrigin+'/#website'}}]};
}

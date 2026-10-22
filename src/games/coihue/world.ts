/** Shared setting: other games can attach missions to these stable place IDs. */
export const places = [
 {id:'plaza',name:'Plaza del Coihue',x:35,y:54,icon:'plaza',description:'El punto de encuentro del valle. Aquí comienza tu investigación.'},
 {id:'biblioteca',name:'Biblioteca del Valle',x:20,y:35,icon:'book',description:'Un archivo de ideas para aprender y volver a consultar.'},
 {id:'civico',name:'Barrio Cívico',x:52,y:29,icon:'civic',description:'Municipalidad, SII y Tesorería: tres instituciones con funciones distintas.'},
 {id:'mercado',name:'Mercado del Lago',x:73,y:57,icon:'market',description:'Comerciantes que preparan sus puestos para la feria.'},
 {id:'paseo',name:'Paseo de los Emprendedores',x:52,y:71,icon:'shop',description:'Pequeños negocios, grandes preguntas sobre trámites.'},
 {id:'oficios',name:'Centro de Oficios',x:17,y:69,icon:'work',description:'Emilia te espera para revisar tu pasaporte y orientar tu recorrido.'},
 {id:'parque',name:'Parque Los Volcanes',x:76,y:29,icon:'tree',description:'Mira la ciudad desde sus senderos y descubre las necesidades de la comunidad.'},
 {id:'feria',name:'Feria del Lago',x:82,y:77,icon:'fair',description:'El encuentro final donde ayudarás a nuevos vecinos.'},
] as const;
export type PlaceId=typeof places[number]['id'];
export const characters={
 emilia:{name:'Emilia',role:'Coordinadora del Centro de Orientación Ciudadana',color:'#c7a4ff',portrait:'E'},
 nicolas:{name:'Nicolás',role:'Estudiante del valle',color:'#9edbff',portrait:'N'},
 antonia:{name:'Antonia',role:'Voluntaria de la comunidad',color:'#ffc59f',portrait:'A'},
 ernesto:{name:'Don Ernesto',role:'Vecino de la plaza',color:'#cbdf8d',portrait:'E'},
 sofia:{name:'Sofía',role:'Guardaparque',color:'#b5e5b9',portrait:'S'},
 elisa:{name:'Elisa',role:'Bibliotecaria del valle',color:'#bcaaff',portrait:'E'},
 tomas:{name:'Tomás',role:'Encargado de correspondencia',color:'#f4cb84',portrait:'T'},
 rosa:{name:'Rosa',role:'Comerciante del mercado',color:'#ffb5ba',portrait:'R'},
 diego:{name:'Diego',role:'Emprendedor del paseo',color:'#9edbff',portrait:'D'},
} as const;
export type CharacterId=keyof typeof characters;
export const avatars=[{id:'lago',name:'Lago',symbol:'◈'},{id:'bosque',name:'Bosque',symbol:'♧'},{id:'volcan',name:'Volcán',symbol:'△'},{id:'estrella',name:'Estrella del sur',symbol:'✦'}] as const;

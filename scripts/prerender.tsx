import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { DemoProvider } from '../src/store';
import { Home, Catalog, Specialties, Specialty, MissionDetail, Library, ResourceDetail, HowItWorks, Teacher, Info } from '../src/pages';
import { seoPages, siteOrigin, structuredData } from '../src/seo';
const template=readFileSync('dist/index.html','utf8');
const escape=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
for(const page of seoPages){
 const content=renderToString(<MemoryRouter initialEntries={[page.path]}><DemoProvider><header className="container"><a href="/">TP PLAY</a><nav><a href="/especialidades">Especialidades</a> · <a href="/desafios">Desafíos</a> · <a href="/recursos">Recursos</a></nav></header><main className="container"><Routes><Route path="/" element={<Home/>}/><Route path="/especialidades" element={<Specialties/>}/><Route path="/especialidades/:slug" element={<Specialty/>}/><Route path="/especialidades/:slug/modulos/:modulo" element={<Specialty/>}/><Route path="/desafios" element={<Catalog/>}/><Route path="/desafios/:slug" element={<MissionDetail/>}/><Route path="/recursos" element={<Library/>}/><Route path="/recursos/:slug" element={<ResourceDetail/>}/><Route path="/como-funciona" element={<HowItWorks/>}/><Route path="/docente" element={<Teacher/>}/><Route path="/ayuda" element={<Info kind="ayuda"/>}/></Routes></main><footer className="container"><p>Sitio creado por el docente TP Marcelo Barría Arismendi, desde la Región de Los Lagos, Chile.</p><a href="tel:+56930357842">+56 9 3035 7842</a> · <a href="mailto:marcelo.barriaar@gmail.com">marcelo.barriaar@gmail.com</a></footer></DemoProvider></MemoryRouter>);
 const head=`<title>${escape(page.title)}</title><meta name="description" content="${escape(page.description)}"/><meta name="robots" content="index,follow,max-image-preview:large"/><link rel="canonical" href="${siteOrigin+page.path}"/><meta property="og:type" content="website"/><meta property="og:site_name" content="TP PLAY"/><meta property="og:locale" content="es_CL"/><meta property="og:title" content="${escape(page.title)}"/><meta property="og:description" content="${escape(page.description)}"/><meta property="og:url" content="${siteOrigin+page.path}"/><meta property="og:image" content="${siteOrigin}/images/campus-los-lagos.webp"/><meta name="twitter:card" content="summary_large_image"/><script type="application/ld+json" id="seo-schema">${JSON.stringify(structuredData(page)).replace(/</g,'\\u003c')}</script>`;
 const html=template.replace(/<title>.*?<\/title>/s,'').replace(/<meta name="description"[^>]*\/>/,'').replace('</head>',head+'</head>').replace('<div id="root"></div>',`<div id="root">${content}</div>`);
 const folder=page.path==='/'?'dist':'dist'+page.path;mkdirSync(folder,{recursive:true});writeFileSync(folder+'/index.html',html);
}
// Non-public app routes start with noindex in raw HTML; do not rely on Google running JavaScript.
writeFileSync('dist/app.html',template.replace('</head>','<meta name="robots" content="noindex,follow"/></head>'));
writeFileSync('dist/robots.txt',`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${siteOrigin}/sitemap.xml\n`);
writeFileSync('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${seoPages.map(page=>`<url><loc>${siteOrigin}${escape(page.path)}</loc></url>`).join('')}</urlset>`);
console.log(`Generated ${seoPages.length} public HTML pages and sitemap.`);

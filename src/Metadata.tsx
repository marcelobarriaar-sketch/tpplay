import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { seoFor, siteOrigin, structuredData } from './seo';
export default function Seo() {
 const {pathname}=useLocation();
 useEffect(()=>{
  const page=seoFor(pathname);
  document.title=page?.title||'TP PLAY | Acceso y aprendizaje';
  function meta(key:string,value:string,property=false){let tag=document.querySelector<HTMLMetaElement>(`meta[${property?'property':'name'}="${key}"]`);if(!tag){tag=document.createElement('meta');tag.setAttribute(property?'property':'name',key);document.head.append(tag);}tag.content=value;}
  meta('description',page?.description||'Espacio personal y administrativo de TP PLAY.');meta('robots',page?'index,follow,max-image-preview:large':'noindex,follow');
  let canonical=document.querySelector<HTMLLinkElement>('link[rel="canonical"]');if(page){if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.append(canonical);}canonical.href=siteOrigin+page.path;}else canonical?.remove();
  meta('og:title',document.title,true);meta('og:description',page?.description||'TP PLAY',true);meta('og:url',siteOrigin+pathname,true);
  let json=document.querySelector<HTMLScriptElement>('#seo-schema');if(page){if(!json){json=document.createElement('script');json.id='seo-schema';json.type='application/ld+json';document.head.append(json);}json.textContent=JSON.stringify(structuredData(page));}else json?.remove();
 },[pathname]);return null;
}

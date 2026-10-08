import { writeFileSync } from 'node:fs';
import { seoPages } from '../src/seo';
writeFileSync('vercel.json',JSON.stringify({rewrites:[...seoPages.map(p=>({source:p.path,destination:p.path==='/'?'/index.html':p.path+'/index.html'})),{source:'/((?!api/|assets/|images/|favicon.svg|robots.txt|sitemap.xml).*)',destination:'/app.html'}]},null,2)+'\n');

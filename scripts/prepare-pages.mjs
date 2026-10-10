import {readFile,writeFile,mkdir,readdir,copyFile,lstat} from 'node:fs/promises';
import {resolve,relative,dirname,extname,posix} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const config=JSON.parse(await readFile(resolve(root,'publish-config.local.json'),'utf8'));
const source=resolve(config.source),out=resolve(root,'docs');
const siteUrl=config.siteUrl?new URL(config.siteUrl).href.replace(/\/?$/,'/'):null;
const allowed=new Set(['.html','.css','.js','.jpg','.png','.svg','.webp','.pdf','.json','.txt','.woff2','.woff']);
const localUrl=/https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?[^\s<>"'`]*/gi;
const files=[];
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){const path=resolve(dir,item.name);if((await lstat(path)).isSymbolicLink())throw Error('Symlink rejected');if(item.isDirectory())await walk(path);else files.push(path);}}
await walk(source);await mkdir(out,{recursive:true});
let hiddenLinks=0;
for(const path of files){
 const rel=relative(source,path).replaceAll('\\','/'),ext=extname(path);
 if(!allowed.has(ext)||/(^|\/)(?:\.|node_modules|src|build|migrations)/.test(rel))throw Error('Unexpected publish asset: '+rel);
 const target=resolve(out,rel);await mkdir(dirname(target),{recursive:true});
 if(['.jpg','.png','.webp','.pdf','.woff2','.woff'].includes(ext)){await copyFile(path,target);continue;}
 let text=await readFile(path,'utf8');
 if(rel==='activity.js' && config.statsApi){
  const api=new URL(config.statsApi);if(api.protocol!=='https:')throw Error('Stats API must use HTTPS');
  text=text.replace(/const apiRoot=.*?;/,'const apiRoot='+JSON.stringify(api.origin)+';');
  text=text.replace(/location.protocol==='file:'\?'For live updates, run Start-Preview.cmd and use the local preview.':/,'');
 }
 if(/sk-(?:proj-)?[A-Za-z0-9_-]{24,}|-----BEGIN (?:RSA )?PRIVATE KEY-----|C:[\\/]Users[\\/]/.test(text))throw Error('Potential secret or local path in '+rel);
 if(ext==='.html'){
  if(rel==='index.html'){
   text=text.replace(/(<section[^>]*id="work"[^>]*>)/,'$1<span id="projects" aria-hidden="true"></span><span id="collection" aria-hidden="true"></span>');
   text=text.replace(/(<section[^>]*id="about"[^>]*>)/,'$1<span id="research" aria-hidden="true"></span>');
  }
  text=text.replace(/<a\b[^>]*href="https?:\/\/(?:127\.0\.0\.1|localhost)[^"]*"[^>]*>[\s\S]*?<\/a>/gi,()=>{hiddenLinks++;return '';});
  if(rel.startsWith('projects/')&&!rel.includes('ai-behavior-study'))text=text.replace('<div class="showcase-actions">','<p class="public-demo-note">Explore the screenshots, walkthrough and measured results below. The interactive application currently runs locally; <a href="mailto:gowthamreddych.97@gmail.com?subject=Project%20demo%20request">contact me for a demonstration</a>.</p><div class="showcase-actions">');
  text=text.replace('name="robots" content="noindex,nofollow"','name="robots" content="index,follow"');
  text=text.replace(/\b(href|src)="\/(?!\/)([^"]*)"/g,(_m,attr,dest)=>{
   const suffix=dest.match(/[?#].*$/)?.[0]||'',pathname=dest.slice(0,dest.length-suffix.length);
   const from=posix.dirname(rel),to=pathname||'.';let value=posix.relative(from,to)||'.';
   if(!value.startsWith('.'))value='./'+value;if(!pathname||pathname.endsWith('/'))value+='/';
   return `${attr}="${value}${suffix}"`;
  });
  if(siteUrl){
   const canonical=new URL(rel==='index.html'?'':rel.replace(/index\.html$/,''),siteUrl).href;
   const title=text.match(/<title>(.*?)<\/title>/)?.[1]||'Gowtham Reddy';
   const description=text.match(/name="description" content="([^"]*)"/)?.[1]||'Software engineering portfolio';
   text=text.replace('</head>',`<link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${canonical}"></head>`);
   if(rel==='404.html')text=text.replace('<head>',`<head><base href="${siteUrl}">`);
  }
 }
 text=text.replace(localUrl,'[local development service]');
 await writeFile(target,text.replace(/[ \t]+$/gm,'').trimEnd()+'\n');
}
await writeFile(resolve(out,'.nojekyll'),'');
await writeFile(resolve(out,'robots.txt'),'User-agent: *\nAllow: /\n'+(siteUrl?'Sitemap: '+siteUrl+'sitemap.xml\n':''));
if(siteUrl){files.length=0;await walk(out);const urls=files.map(f=>relative(out,f).replaceAll('\\','/')).filter(f=>f.endsWith('index.html')).map(f=>new URL(f.replace(/index\.html$/,''),siteUrl).href);await writeFile(resolve(out,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(url=>`<url><loc>${url}</loc></url>`).join('')+'</urlset>');}
console.log(JSON.stringify({files:files.length,removedLocalDemoLinks:hiddenLinks,output:'docs',sourceProjectsCopied:false}));

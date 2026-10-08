import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
const root=resolve(import.meta.dirname,'../docs');let pages=0,links=0,total=0;
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const path=resolve(dir,entry.name);if(entry.isDirectory()){await walk(path);continue;}total++;if(!/\.(html|css|js|json|txt)$/.test(path))continue;const text=await readFile(path,'utf8');
 if(/https?:\/\/(?:127\.0\.0\.1|localhost)|sk-(?:proj-)?[A-Za-z0-9_-]{24,}|-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(text))throw Error('Unsafe content: '+relative(root,path));
 if(!path.endsWith('.html'))continue;pages++;if(text.includes('noindex'))throw Error('Search indexing still disabled');
 for(const match of text.matchAll(/\b(?:href|src)="([^"]+)"/g)){const value=match[1].replaceAll('&amp;','&');if(/^(?:https?:|mailto:|data:|#)/.test(value))continue;if(value.startsWith('/'))throw Error('Nonportable root URL '+value);const [pathname,fragment]=value.split('#'),target=resolve(dirname(path),pathname.split('?')[0]);if(!target.startsWith(root))throw Error('Escaping asset path');const info=await stat(target);const actual=info.isDirectory()?resolve(target,'index.html'):target;await stat(actual);if(fragment&&actual.endsWith('.html')){const destination=await readFile(actual,'utf8');if(!destination.includes(`id="${fragment}"`))throw Error('Missing anchor '+value);}links++;}
 }}
await walk(root);console.log(JSON.stringify({pages,localLinksVerified:links,totalFiles:total,localhostLinks:0,secretPatterns:0}));

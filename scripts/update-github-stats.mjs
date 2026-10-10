import {writeFile,mkdir} from 'node:fs/promises';
import {createStatsService} from './public-stats.cjs';
const token=process.env.GITHUB_TOKEN;
const service=createStatsService({fetchImpl:(url,options)=>fetch(url,{...options,headers:{...options.headers,...(token&&new URL(url).hostname==='api.github.com'?{Authorization:'Bearer '+token}:{})}})});
const data=await service.get('github','gowthamreddy-ch');
if(!data.calendar || data.stars===null)throw Error('Incomplete GitHub data; retain previous feed.');
await mkdir('data',{recursive:true});
await writeFile('data/github.json',JSON.stringify({...data,source:'github-actions'},null,2)+'\n');
console.log(JSON.stringify({username:data.username,repositories:data.repositories,contributions:data.calendar.total,updatedAt:data.updatedAt}));

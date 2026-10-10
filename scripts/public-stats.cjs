'use strict';
// Public profiles only. No credentials or third-party proxy services are used.
const USERNAMES = {github: /^(?!-)[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i, leetcode: /^[a-z\d_-]{1,30}$/i};
class StatsError extends Error {
  constructor(message, status = 502) { super(message); this.status = status; }
}
function validate(platform, username) {
  if (!USERNAMES[platform] || !USERNAMES[platform].test(username || '')) throw new StatsError('Enter a valid public username, not an email or password.', 400);
}
function parseContributions(html) {
  const tips = new Map([...html.matchAll(/<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/g)].map(([,attributes,content]) => {
    const id = attributes.match(/\bfor="([^"]+)"/)?.[1];
    const text = content.replace(/<[^>]+>/g,'').trim();
    const count = text.match(/^([\d,]+) contributions?/i);
    return [id, /^No contributions/i.test(text) ? 0 : count ? Number(count[1].replaceAll(',','')) : null];
  }));
  const days = [...html.matchAll(/<td\b([^>]*\bdata-date="[^"]+"[^>]*)>/g)].map(([,attrs]) => {
    const attr = name => attrs.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1];
    return {date:attr('data-date'),level:Number(attr('data-level')),count:tips.get(attr('id')) ?? null};
  }).filter(day=>/^\d{4}-\d{2}-\d{2}$/.test(day.date) && Number.isInteger(day.level) && day.level>=0 && day.level<=4).sort((a,b)=>a.date.localeCompare(b.date));
  const total = html.match(/id="js-contribution-activity-description"[^>]*>\s*([\d,]+)\s+contributions?/);
  if (!days.length || !total) throw new StatsError('GitHub’s contribution calendar is temporarily unavailable.');
  return {total:Number(total[1].replaceAll(',','')),days};
}
function createStatsService({fetchImpl = fetch, now = Date.now, ttl = 15 * 60_000} = {}) {
  const cache = new Map(), pending = new Map();
  async function upstream(url, options = {}) {
    const response = await fetchImpl(url, {signal:AbortSignal.timeout(12_000), ...options, headers:{'User-Agent':'Gowtham-Portfolio-Public-Stats', ...options.headers}});
    if (!response.ok) {
      if (response.status===404) throw new StatsError('That public profile was not found. Check the username.',404);
      if ([403,429].includes(response.status)) {
        const error=new StatsError('The platform is limiting requests. Please try again later.',503);
        const retry=response.headers.get('retry-after');
        const retryAt=retry ? (/^\d+$/.test(retry)?now()+Number(retry)*1000:Date.parse(retry)) : 0;
        const reset=response.headers.get('x-ratelimit-remaining')==='0'?Number(response.headers.get('x-ratelimit-reset'))*1000:0;
        error.retryAt=Math.max(now()+60_000,Number.isFinite(retryAt)?retryAt:0,Number.isFinite(reset)?reset:0);
        throw error;
      }
      throw new StatsError('The platform could not be reached. Please try again later.');
    }
    return response;
  }
  async function github(username) {
    const encoded = encodeURIComponent(username);
    const headers = {'Accept':'application/vnd.github+json'};
    const profilePromise = upstream(`https://api.github.com/users/${encoded}`,{headers}).then(r=>r.json());
    const calendarPromise = upstream(`https://github.com/users/${encoded}/contributions`,{headers:{'Accept-Language':'en-US'}}).then(r=>r.text()).then(parseContributions);
    const reposPromise = (async()=>{
      let stars=0,forks=0;
      for(let page=1;page<=10;page++) {
        const response=await upstream(`https://api.github.com/users/${encoded}/repos?per_page=100&type=owner&page=${page}`,{headers});
        const repos=await response.json();
        if(!Array.isArray(repos)) throw new StatsError('Repository statistics are unavailable.');
        for(const repo of repos){stars+=Number(repo.stargazers_count)||0;forks+=Number(repo.forks_count)||0;}
        if(!(response.headers.get('link')||'').includes('rel="next"')) return {stars,forks};
      }
      throw new StatsError('Repository totals could not be fully loaded.');
    })();
    const [profile,calendar,repos] = await Promise.allSettled([profilePromise,calendarPromise,reposPromise]);
    if(profile.status!=='fulfilled') throw profile.reason;
    const warnings=[];
    if(calendar.status==='rejected') warnings.push('Contribution calendar unavailable.');
    if(repos.status==='rejected') warnings.push('Star and fork totals unavailable.');
    return {username:profile.value.login,repositories:profile.value.public_repos,followers:profile.value.followers,stars:repos.status==='fulfilled'?repos.value.stars:null,forks:repos.status==='fulfilled'?repos.value.forks:null,calendar:calendar.status==='fulfilled'?calendar.value:null,warnings};
  }
  async function leetcode(username) {
    const query = async query => (await upstream('https://leetcode.com/graphql/',{method:'POST',headers:{'Content-Type':'application/json','Referer':'https://leetcode.com/'},body:JSON.stringify({query,variables:{username}})})).json();
    // Keep the optional calendar separate: a private calendar must not hide solved totals.
    const [stats,calendar] = await Promise.allSettled([
      query('query($username:String!){matchedUser(username:$username){username submitStatsGlobal{acSubmissionNum{difficulty count}}} allQuestionsCount{difficulty count}}'),
      query('query($username:String!){matchedUser(username:$username){userCalendar{streak totalActiveDays submissionCalendar}}}')
    ]);
    if(stats.status!=='fulfilled') throw stats.reason;
    if(stats.value.errors?.length) throw new StatsError('LeetCode statistics are temporarily unavailable.');
    const user=stats.value.data?.matchedUser;
    if(!user) throw new StatsError('That public LeetCode profile was not found. Check the username.',404);
    const solved=Object.fromEntries((user.submitStatsGlobal?.acSubmissionNum||[]).map(v=>[v.difficulty.toLowerCase(),v.count]));
    const totals=Object.fromEntries((stats.value.data.allQuestionsCount||[]).map(v=>[v.difficulty.toLowerCase(),v.count]));
    if(!['all','easy','medium','hard'].every(key=>Number.isFinite(solved[key]) && Number.isFinite(totals[key]))) throw new StatsError('LeetCode returned an incomplete problem breakdown.');
    const activity=calendar.status==='fulfilled'?calendar.value.data?.matchedUser?.userCalendar:null;
    let days=null;
    try{if(activity) days=Object.entries(JSON.parse(activity.submissionCalendar)).filter(([timestamp,count])=>/^\d+$/.test(timestamp)&&Number.isFinite(count)&&count>=0).map(([timestamp,count])=>({date:new Date(Number(timestamp)*1000).toISOString().slice(0,10),count})).sort((a,b)=>a.date.localeCompare(b.date));}catch{}
    return {username:user.username,solved,totals,activity:days?{days,streak:activity.streak,activeDays:activity.totalActiveDays}:null,warnings:days?[]:['LeetCode’s activity calendar is private or temporarily unavailable.']};
  }
  async function get(platform,username) {
    validate(platform,username);
    const key=`${platform}:${username.toLowerCase()}`, current=now(), existing=cache.get(key);
    if(existing?.expires>current){if(existing.value)return {...existing.value,cached:true,stale:!!existing.error,...(existing.error?{warning:existing.error.message}:{})};throw existing.error;}
    if(pending.has(key)) return pending.get(key);
    const request=(async()=>{
      try{
        const data=await (platform==='github'?github(username):leetcode(username));
        const value={platform,...data,updatedAt:new Date(now()).toISOString(),cached:false,stale:false};
        cache.set(key,{value,expires:now()+ttl});
        if(cache.size>64)cache.delete(cache.keys().next().value);
        return value;
      }catch(error){
        const safeError=error instanceof StatsError?error:new StatsError('The platform is temporarily unavailable. Please try again later.');
        const value=existing?.value && now()-Date.parse(existing.value.updatedAt)<86_400_000?existing.value:null;
        cache.set(key,{value,error:safeError,expires:safeError.retryAt||now()+60_000});
        if(cache.size>64)cache.delete(cache.keys().next().value);
        if(value)return {...value,cached:true,stale:true,warning:safeError.message};
        throw safeError;
      }finally{pending.delete(key);}
    })();
    pending.set(key,request);
    return request;
  }
  return {get};
}
module.exports={createStatsService,parseContributions,validate,StatsError};

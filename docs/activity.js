'use strict';
(() => {
  const platforms=['github','leetcode'];
  // Public page always shows the owner's configured profiles, never visitor overrides.
  const profiles={...window.PORTFOLIO_PROFILES};
  const controllers={};
  const numbers=new Intl.NumberFormat();
  const dateFormat=new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
  const apiRoot="https://gowtham-portfolio-stats.readyamber2.chatgpt.site";
  const card=platform=>document.getElementById(`${platform}-activity`);
  const $=(platform,selector)=>card(platform).querySelector(selector);
  const set=(platform,selector,value)=>{$(platform,selector).textContent=value;};
  const format=value=>Number.isFinite(value)?numbers.format(value):'—';
  const profileUrl=(platform,username)=>platform==='github'?`https://github.com/${encodeURIComponent(username)}`:`https://leetcode.com/u/${encodeURIComponent(username)}/`;
  function calendar(platform,days,total,label) {
    const graph=$(platform,'.activity-heatmap');
    graph.replaceChildren();
    if(!days?.length){graph.hidden=true;return;}
    graph.hidden=false;
    graph.setAttribute('aria-label',`${format(total)} ${label}. From ${days[0].date} to ${days.at(-1).date}. Daily values are available below.`);
    const fragment=document.createDocumentFragment();
    const months=document.createElement('div');months.className='calendar-months';months.setAttribute('aria-hidden','true');
    const pad=new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
    let previousMonth='';
    days.forEach((day,index)=>{const month=day.date.slice(0,7);if(month!==previousMonth){previousMonth=month;const label=document.createElement('span');label.style.gridColumn=String(Math.floor((index+pad)/7)+1);label.textContent=new Intl.DateTimeFormat(undefined,{month:'short',timeZone:'UTC'}).format(new Date(`${day.date}T00:00:00Z`));months.append(label);}});
    const scroll=graph.parentElement;scroll.querySelector('.calendar-months')?.remove();scroll.prepend(months);
    for(let i=0;i<pad;i++){const empty=document.createElement('span');empty.className='heatmap-spacer';fragment.append(empty);}
    for(const day of days){const cell=document.createElement('span');cell.dataset.level=day.level;cell.title=`${day.date}: ${day.count===null?'count unavailable':format(day.count)} ${label}`;fragment.append(cell);}
    graph.append(fragment);
    requestAnimationFrame(()=>{scroll.scrollLeft=scroll.scrollWidth;});
    const table=$(platform,'.daily-data tbody');table.replaceChildren();
    for(const day of [...days].reverse().filter(d=>d.count>0||d.count===null)){
      const row=document.createElement('tr');const date=document.createElement('th');date.scope='row';date.textContent=day.date;const count=document.createElement('td');count.textContent=format(day.count);row.append(date,count);table.append(row);
    }
    if(!table.children.length){const row=document.createElement('tr');const cell=document.createElement('td');cell.colSpan=2;cell.textContent='No activity reported in this period.';row.append(cell);table.append(row);}
  }
  function render(platform,data,state='live') {
    $(platform,'.activity-content').hidden=false;
    $(platform,'.stats-empty').hidden=true;
    const snapshot=state==='snapshot', stale=snapshot||data.stale;
    set(platform,'.source-state',stale?'Saved snapshot':'Connected');
    card(platform).dataset.state=stale?'stale':'ready';
    set(platform,'.updated-at',`${stale?'Saved':'Updated'} ${dateFormat.format(new Date(data.updatedAt))}`);
    if(platform==='github'){
      for(const metric of ['repositories','stars','forks','followers'])set(platform,`[data-metric="${metric}"]`,format(data[metric]));
      $(platform,'.calendar-block').hidden=!data.calendar;
      if(data.calendar){set(platform,'.contribution-total',`${format(data.calendar.total)} contributions`);calendar(platform,data.calendar.days,data.calendar.total,'contributions');}
    }else{
      set(platform,'.solved-total',format(data.solved.all));
      set(platform,'.problem-total',`of ${format(data.totals.all)} problems`);
      for(const difficulty of ['easy','medium','hard']){
        set(platform,`[data-difficulty="${difficulty}"] .difficulty-count`,`${format(data.solved[difficulty])} / ${format(data.totals[difficulty])}`);
        const meter=$(platform,`[data-difficulty="${difficulty}"] meter`);meter.max=Math.max(1,data.totals[difficulty]);meter.value=data.solved[difficulty];
      }
      set(platform,'[data-metric="active-days"]',format(data.activity?.activeDays));
      set(platform,'[data-metric="streak"]',format(data.activity?.streak));
      const recent=data.activity?.days.filter(day=>day.count>0).at(-1);
      set(platform,'.leetcode-activity-note',!data.activity?'Activity calendar unavailable.':recent?`Latest reported activity: ${recent.date}.`:'No submissions reported in the current calendar period.');
    }
    set(platform,'.stats-message',data.warning||data.warnings?.join(' ')||'');
  }
  function savedData(platform,username){
    try{const cached=JSON.parse(localStorage.getItem(`gr-stats-${platform}:${username.toLowerCase()}`));if(cached?.updatedAt)return cached;}catch{}
    const snapshot=window.PORTFOLIO_STATS_SNAPSHOT?.[platform];
    return snapshot?.username?.toLowerCase()===username.toLowerCase()?snapshot:null;
  }
  async function load(platform){
    controllers[platform]?.abort();
    const controller=new AbortController();controllers[platform]=controller;
    const username=profiles[platform];
    const element=card(platform), button=$(platform,'.refresh-stats'), link=$(platform,'.stats-profile');
    element.setAttribute('aria-busy','false');
    set(platform,'.account-name',username?`@${username}`:'No profile added');
    link.hidden=!username;if(username)link.href=profileUrl(platform,username);
    button.disabled=!username;
    $(platform,'.activity-content').hidden=true;
    $(platform,'.stats-empty').hidden=false;
    set(platform,'.updated-at','');set(platform,'.stats-message','');
    if(!username){set(platform,'.source-state','Not connected');set(platform,'.stats-empty','Public profile not configured.');element.dataset.state='empty';return;}
    const previous=savedData(platform,username);
    if(previous)render(platform,previous,'snapshot');
    else{set(platform,'.source-state','Connecting…');set(platform,'.stats-empty','Loading public profile…');element.dataset.state='loading';}
    button.disabled=true;element.setAttribute('aria-busy','true');
    const timeout=setTimeout(()=>controller.abort(),35_000);
    try{
      const response=await fetch(`${apiRoot}/api/stats/${platform}?username=${encodeURIComponent(username)}`,{signal:controller.signal,credentials:'omit'});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||'Profile statistics are unavailable.');
      if(controllers[platform]!==controller)return;
      render(platform,data);
      try{localStorage.setItem(`gr-stats-${platform}:${username.toLowerCase()}`,JSON.stringify(data));}catch{}
    }catch(error){
      if(controllers[platform]!==controller)return;
      if(!previous){set(platform,'.source-state','Unavailable');element.dataset.state='error';set(platform,'.stats-empty','Could not load this public profile.');}
      const message=error.name==='AbortError'?'The request timed out. Try refreshing in a moment.':error.message==='Failed to fetch'?'Could not reach the stats service. Check your connection and try again.':error.message;
      set(platform,'.stats-message',`${previous?'Showing previously fetched data. ':''}${message}`);
    }finally{clearTimeout(timeout);if(controllers[platform]===controller){button.disabled=false;element.setAttribute('aria-busy','false');}}
  }
  for(const platform of platforms)$(platform,'.refresh-stats').addEventListener('click',()=>load(platform));
  matchMedia('(max-width:800px)').addEventListener('change',()=>requestAnimationFrame(()=>{const scroll=document.querySelector('.heatmap-scroll');scroll.scrollLeft=scroll.scrollWidth;}));
  let started=false;
  const start=()=>{if(started)return;started=true;platforms.forEach(load);};
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();start();}},{rootMargin:'250px'});observer.observe(document.getElementById('activity'));}else start();
  // Re-check when a visitor returns after 15 minutes; the server applies its own cache.
  let lastCheck=Date.now();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&started&&Date.now()-lastCheck>15*60_000){lastCheck=Date.now();platforms.forEach(load);}});
  setInterval(()=>{if(started&&!document.hidden&&Date.now()-lastCheck>=15*60_000){lastCheck=Date.now();platforms.forEach(load);}},60_000);
})();

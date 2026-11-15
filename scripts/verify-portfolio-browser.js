async page => {
  const context=await page.context().browser().newContext();page=await context.newPage();
  try {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  // Serve docs locally on port 4199 before running this playwright-cli script.
  const url='http://127.0.0.1:4199/#activity';
  await page.route('**/api/stats/**',async route=>{
    const platform=route.request().url().includes('/github?')?'github':'leetcode';
    const data=await page.evaluate(p=>({...window.PORTFOLIO_STATS_SNAPSHOT[p],updatedAt:new Date().toISOString(),stale:false}),platform);
    await route.fulfill({json:data});
  });
  await page.goto(url);
  await page.evaluate(()=>{for(const p of ['github','leetcode'])localStorage.setItem(`gr-stats-${p}:${window.PORTFOLIO_PROFILES[p]}`,JSON.stringify(p==='github'?{updatedAt:'not-a-date'}:{...window.PORTFOLIO_STATS_SNAPSHOT[p],warnings:{invalid:true},updatedAt:new Date().toISOString()}));});
  await page.reload();
  await page.locator('#activity').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>['github','leetcode'].every(p=>document.getElementById(p+'-activity').dataset.state==='ready'),{},{timeout:6000});
  if(errors.length)throw Error(errors.join('; '));
  await page.unroute('**/api/stats/**');
  await page.route('**/api/stats/**',route=>route.fulfill({json:{updatedAt:'invalid'}}));
  await page.locator('#github-activity .refresh-stats').click();
  await page.waitForFunction(()=>document.getElementById('github-activity').getAttribute('aria-busy')==='false');
  if(await page.locator('#github-activity').getAttribute('data-state')!=='stale')throw Error('Malformed response must retain valid snapshot');
  const savedTime=await page.locator('#github-activity .updated-at').textContent();
  const savedRepositories=await page.locator('#github-activity [data-metric="repositories"]').textContent();
  await page.unroute('**/api/stats/**');
  await page.route('**/api/stats/**',async route=>{
    const data=await page.evaluate(()=>({...window.PORTFOLIO_STATS_SNAPSHOT.github,updatedAt:'2020-01-01T00:00:00Z',repositories:999}));
    await route.fulfill({json:data});
  });
  await page.locator('#github-activity .refresh-stats').click();
  await page.waitForFunction(()=>document.getElementById('github-activity').getAttribute('aria-busy')==='false');
  if(await page.locator('#github-activity .updated-at').textContent()!==savedTime||await page.locator('#github-activity [data-metric="repositories"]').textContent()!==savedRepositories)throw Error('Older service response overwrote newer data');
  await page.unroute('**/api/stats/**');
  await page.route('**/api/stats/**',route=>route.abort('failed'));
  await page.locator('#leetcode-activity .refresh-stats').click();
  await page.waitForFunction(()=>document.getElementById('leetcode-activity').getAttribute('aria-busy')==='false');
  if(await page.locator('#leetcode-activity').getAttribute('data-state')!=='stale')throw Error('Offline data must be marked stale');
  let recoveryRequests=0;
  await page.unroute('**/api/stats/**');
  await page.route('**/api/stats/**',async route=>{
    recoveryRequests++;
    const platform=route.request().url().includes('/github?')?'github':'leetcode';
    const data=await page.evaluate(p=>({...window.PORTFOLIO_STATS_SNAPSHOT[p],updatedAt:new Date().toISOString(),stale:false}),platform);
    await route.fulfill({json:data});
  });
  await page.evaluate(()=>dispatchEvent(new Event('online')));
  await page.waitForFunction(()=>['github','leetcode'].every(p=>document.getElementById(p+'-activity').dataset.state==='ready'));
  if(recoveryRequests!==2)throw Error('Reconnect must refresh both profiles');
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:900});
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Overflow at '+width);
  }
  await page.locator('#tab-findwise').click();
  await page.evaluate(()=>{const u=new URL(location.href);u.searchParams.set('project','reellab');history.replaceState(null,'',u);dispatchEvent(new PopStateEvent('popstate'));});
  if(await page.locator('#tab-reellab').getAttribute('aria-selected')!=='true')throw Error('History navigation must restore project tab');
  await page.evaluate(()=>{const u=new URL(location.href);u.searchParams.set('skill','python');history.replaceState(null,'',u);dispatchEvent(new PopStateEvent('popstate'));});
  if(await page.locator('[data-skill="python"]').getAttribute('aria-pressed')!=='true')throw Error('History navigation must restore pinned skill');
  await page.locator('#tab-reellab').focus();
  await page.keyboard.press('End');
  if(await page.locator('[role="tab"]').last().getAttribute('aria-selected')!=='true')throw Error('End key must select last project');
  await page.keyboard.press('Home');
  if(await page.locator('[role="tab"]').first().getAttribute('aria-selected')!=='true')throw Error('Home key must select first project');
  await page.setViewportSize({width:390,height:844});
  await page.locator('.menu-toggle').click();
  if(await page.locator('.menu-toggle').getAttribute('aria-expanded')!=='true')throw Error('Mobile menu must open');
  await page.keyboard.press('Escape');
  if(await page.locator('.menu-toggle').getAttribute('aria-expanded')!=='false'||!await page.locator('.menu-toggle').evaluate(el=>el===document.activeElement))throw Error('Escape must close menu and restore focus');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.querySelector('.stack-motion').disabled);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage denied','SecurityError');}});});
  await page.reload();
  await page.locator('#activity').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>['github','leetcode'].every(p=>document.getElementById(p+'-activity').dataset.state==='ready'));
  if(errors.length)throw Error(errors.join('; '));
  return {checks:'corrupt cache, malformed/older responses, offline/reconnect, denied storage, four viewports, project/skill history, keyboard tabs, mobile menu focus, reduced motion',errors};
  } finally {await context.close();}
}

async page => {
  const context=await page.context().browser().newContext();page=await context.newPage();
  try {
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const paths=['','404.html',...['ai-behavior-study','ai-product-feedback','evidence-lab','findwise','network-incident-triage','network-recovery-toolkit','reellab','reviewlens'].map(p=>'projects/'+p+'/')];
  const failures=[];
  for(const path of paths){
    const response=await page.goto('http://127.0.0.1:4199/'+path);
    if(!response.ok())failures.push({path,status:response.status()});
    for(const width of [320,390,1440]){
      await page.setViewportSize({width,height:900});
      const result=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,brokenImages:[...document.images].filter(img=>img.complete&&!img.naturalWidth).map(img=>img.getAttribute('src')),duplicates:[...document.querySelectorAll('[id]')].map(el=>el.id).filter((id,i,ids)=>ids.indexOf(id)!==i)}));
      if(result.overflow||result.brokenImages.length||result.duplicates.length)failures.push({path,width,...result});
    }
  }
  if(failures.length||errors.length)throw Error(JSON.stringify({failures,errors}));
  return {pages:paths.length,widths:[320,390,1440],failures,errors};
  } finally {await context.close();}
}

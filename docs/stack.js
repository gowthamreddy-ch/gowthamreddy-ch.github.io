'use strict';
(() => {
  // Verified case-study mappings and asset sources: research/STACK-SOURCES.md.
  const skills = [
    {id:'react', name:'React', projects:['reviewlens','findwise']},
    {id:'typescript', name:'TypeScript', projects:['reviewlens','findwise']},
    {id:'nextjs', name:'Next.js', projects:['findwise']},
    {id:'nodejs', name:'Node.js', projects:['reviewlens']},
    {id:'python', name:'Python', projects:['reellab','evidence']},
    {id:'dotnetcore', name:'ASP.NET Core', projects:['findwise']},
    {id:'postgresql', name:'PostgreSQL', projects:['findwise']},
    {id:'sqlite', name:'SQLite', projects:['reviewlens']},
    {id:'javascript', name:'JavaScript', projects:['evidence']},
  ];
  const section = document.querySelector('.tech-stack');
  const badges = section.querySelector('.stack-badges');
  const result = section.querySelector('#stack-result');
  const clear = section.querySelector('.stack-clear');
  const projects = [...document.querySelectorAll('.project-index [role=tab]')].map(tab => {
    const label = document.createElement('span');
    label.className = 'project-stack-label';
    tab.querySelector('strong').parentElement.append(label);
    return {id:tab.id.replace('tab-',''), name:tab.querySelector('strong').textContent, tab, label};
  });
  const requested = new URL(location.href).searchParams.get('skill');
  let pinned = skills.find(skill => skill.id === requested) || null;
  let hovered = null;
  let focused = null;
  let rendered;
  function save() {
    const url = new URL(location.href);
    if (pinned) url.searchParams.set('skill', pinned.id); else url.searchParams.delete('skill');
    try { history.replaceState(null, '', url); } catch { /* Local file previews still support highlighting. */ }
  }
  function render() {
    const active = hovered || focused || pinned;
    skills.forEach(skill => {
      skill.controls.forEach(control => {
        control.classList.toggle('is-preview', skill === active);
        if (control.tagName === 'BUTTON') control.setAttribute('aria-pressed', String(skill === pinned));
      });
    });
    projects.forEach(project => {
      const matches = !!active?.projects.includes(project.id);
      project.tab.classList.toggle('stack-match', matches);
      project.tab.classList.toggle('stack-other', !!active && !matches);
      project.label.textContent = matches ? `Uses ${active.name}` : 'View project';
    });
    clear.disabled = !active;
    const state = `${active?.id || ''}:${pinned?.id || ''}`;
    if (state === rendered) return;
    rendered = state;
    result.replaceChildren();
    if (!active) { result.textContent = 'Choose a skill to see where I’ve used it.'; return; }
    const title = document.createElement('strong');
    title.textContent = `${active.name}${active === pinned ? ' · Pinned' : ''}`;
    result.append(title, document.createElement('br'), projects.filter(project => active.projects.includes(project.id)).map(project => project.name).join(' + '));
  }
  const midpoint = Math.ceil(skills.length / 2);
  [skills.slice(0, midpoint), skills.slice(midpoint)].forEach(rowSkills => {
    const viewport = document.createElement('div'); viewport.className = 'stack-viewport';
    const track = document.createElement('div'); track.className = 'stack-track';
    for (const duplicate of [false,true]) {
      const group = document.createElement('div'); group.className = `stack-group${duplicate ? ' stack-copy-group' : ''}`;
      if (duplicate) group.setAttribute('aria-hidden','true');
      rowSkills.forEach(skill => {
        const button = document.createElement(duplicate ? 'div' : 'button');
        if (!duplicate) { button.type = 'button'; button.dataset.skill = skill.id; }
        else { button.dataset.copySkill = skill.id; }
        button.className = `stack-badge${duplicate ? ' stack-copy' : ''}`;
        const icon = document.createElement('img');
        icon.src = `assets/stack/${skill.id}.svg`; icon.alt = ''; icon.width = 25; icon.height = 25;
        button.append(icon, document.createTextNode(skill.name));
        (skill.controls ||= []).push(button);
        button.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') { hovered = skill; render(); } });
        button.addEventListener('pointerleave', () => { if (hovered === skill) { hovered = null; render(); } });
        button.addEventListener('focus', () => { if (button.matches(':focus-visible')) { focused = skill; render(); } });
        button.addEventListener('blur', () => { if (focused === skill) { focused = null; render(); } });
        button.addEventListener('click', () => { pinned = pinned === skill ? null : skill; hovered = focused = null; save(); render(); });
        group.append(button);
      });
      track.append(group);
    }
    viewport.append(track); badges.append(viewport);
  });
  function reset() { pinned = hovered = focused = null; save(); render(); }
  clear.addEventListener('click', reset);
  document.querySelector('#work').addEventListener('keydown', event => {
    if (event.key === 'Escape') { reset(); event.preventDefault(); }
  });
  render(); section.hidden = false;
})();

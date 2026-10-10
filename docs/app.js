'use strict';
(() => {
  const root = document.documentElement;

  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.navigation');
  function closeMenu(returnFocus = false) {
    nav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
    menuButton.querySelector('img').src = 'assets/icons/menu-2.svg';
    if (returnFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => {
    const opening = menuButton.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('is-open', opening);
    menuButton.setAttribute('aria-expanded', String(opening));
    menuButton.setAttribute('aria-label', opening ? 'Close menu' : 'Open menu');
    menuButton.querySelector('img').src = `assets/icons/${opening ? 'x' : 'menu-2'}.svg`;
    if (opening) nav.querySelector('a').focus();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav.classList.contains('is-open')) closeMenu(true); });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
  matchMedia('(min-width: 801px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function selectProject(tab, updateUrl = true) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(item.getAttribute('aria-controls'));
      panel.hidden = !selected;
      panel.classList.toggle('is-entering', selected);
    });
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set('project', tab.id.replace('tab-', ''));
      try { history.replaceState(null, '', url); } catch { /* file previews can still change tabs */ }
    }
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectProject(tab));
    tab.addEventListener('keydown', event => {
      let next = null;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== null) { event.preventDefault(); selectProject(tabs[next]); tabs[next].focus(); }
    });
  });
  const projectName = new URL(location.href).searchParams.get('project');
  const initialTab = tabs.find(tab => tab.id === `tab-${projectName}`);
  if (initialTab) selectProject(initialTab, false);
  const tabOrientation = matchMedia('(max-width: 800px)');
  const updateOrientation = () => document.querySelector('[role="tablist"]').setAttribute('aria-orientation', tabOrientation.matches ? 'horizontal' : 'vertical');
  updateOrientation(); tabOrientation.addEventListener('change', updateOrientation);

  const copyButton = document.querySelector('.copy-email');
  const copyStatus = document.querySelector('#copy-status');
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('gowthamreddych.97@gmail.com');
      copyStatus.textContent = 'Email address copied.';
      copyButton.textContent = 'Copied';
    } catch {
      copyStatus.textContent = 'Copy is unavailable here. Select the email address, or click it to open your email app.';
    }
  });

  if ('IntersectionObserver' in window) {
    const navLinks = [...nav.querySelectorAll('a')];
    const sectionObserver = new IntersectionObserver(entries => {
      entries.filter(entry => entry.isIntersecting).forEach(entry => navLinks.forEach(link => {
        const current = link.hash === `#${entry.target.id}`;
        link.classList.toggle('is-active', current);
        if (current) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      }));
    }, {rootMargin: '-18% 0px -50% 0px', threshold: 0});
    document.querySelectorAll('main > section[id]').forEach(section => sectionObserver.observe(section));
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
    }), {rootMargin: '0px 0px 40px 0px', threshold: .05});
    document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) root.classList.add('motion-ready');
  }
})();

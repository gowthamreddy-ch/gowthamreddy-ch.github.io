'use strict';
(() => {
  const items = document.querySelector('.focus-items');
  const copy = items.cloneNode(true);
  copy.setAttribute('aria-hidden','true');
  copy.classList.add('motion-copy');
  items.parentElement.append(copy);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  for (const [selector, parent, label] of [
    ['.focus-motion','.focus-band','focus band'],
    ['.stack-motion','.tech-stack','technology scrolling'],
  ]) {
    const button = document.querySelector(selector);
    const region = document.querySelector(parent);
    let paused = false;
    function render() {
      region.classList.toggle('is-paused', paused);
      button.disabled = reduced.matches;
      button.textContent = reduced.matches ? 'Still' : paused ? 'Play' : 'Pause';
      button.setAttribute('aria-pressed', String(paused || reduced.matches));
      button.setAttribute('aria-label', reduced.matches ? `${label} motion disabled by your preference` : `${paused ? 'Resume' : 'Pause'} ${label}`);
    }
    button.addEventListener('click', () => { paused = !paused; render(); });
    reduced.addEventListener('change', render);
    render();
  }
})();

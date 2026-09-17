"use strict";
(() => {
  const intro = document.getElementById('brand-intro');
  if (!intro) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let seen = false;
  try { seen = sessionStorage.getItem('arra-intro-seen') === '1'; } catch { /* Storage is optional. */ }
  if (seen || reduced.matches || location.hash || scrollY > 20) return;
  try { sessionStorage.setItem('arra-intro-seen', '1'); } catch { /* Still allow access. */ }
  intro.hidden = false;
  const finish = () => {
    intro.hidden = true;
    window.removeEventListener('wheel', finish);
    window.removeEventListener('touchstart', finish);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('pageshow', onPageShow);
    reduced.removeEventListener('change', finish);
  };
  const onKey = event => { if (event.key === 'Escape' || event.key === 'Tab') finish(); };
  const onPageShow = event => { if (event.persisted) finish(); };
  intro.querySelector('button').addEventListener('click', finish);
  window.addEventListener('wheel', finish, {passive:true});
  window.addEventListener('touchstart', finish, {passive:true});
  window.addEventListener('keydown', onKey);
  window.addEventListener('pageshow', onPageShow);
  reduced.addEventListener('change', finish);
  setTimeout(() => intro.classList.add('is-opening'), 800);
  setTimeout(finish, 1900);
})();

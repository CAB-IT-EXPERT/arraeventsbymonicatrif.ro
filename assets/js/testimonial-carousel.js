"use strict";

function createTestimonialCarousel({ reviews, slider, track, counter, previous, next }) {
  const escape = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const wrap = index => ((index % reviews.length) + reviews.length) % reviews.length;
  const sourceName = review => /instagram\.com/i.test(review.source) ? 'Instagram' : 'Facebook';
  let current = 0;
  let touchStart = null;

  track.innerHTML = reviews.map((review, index) => `
    <figure class="testimonial${index === 0 ? ' current' : ''}" aria-hidden="${index !== 0}" ${index !== 0 ? 'inert' : ''}>
      <figcaption class="review-person">
        <img src="${escape(review.photo)}" width="48" height="48" loading="lazy" alt="${escape(review.author)} — fotografia de profil ${sourceName(review)}">
        <div><cite>${escape(review.author)}</cite><small>${escape(review.category)}</small></div>
      </figcaption>
      <div class="review-body" role="region" aria-label="Recomandarea de la ${escape(review.author)}">
        ${review.text.trim()
          ? `<blockquote cite="${escape(review.source)}">${escape(review.text)}</blockquote>`
          : `<p class="review-endorsement"><span aria-hidden="true">♡</span>Recomandă ARRA pe ${sourceName(review)}</p>`}
      </div>
      <p class="review-scroll-hint" aria-hidden="true">Derulează pentru a citi întreaga recenzie ↓</p>
      <a class="review-source" href="${escape(review.source)}" target="_blank" rel="noopener noreferrer">Vezi recomandarea pe ${sourceName(review)} <span aria-hidden="true">↗</span></a>
    </figure>`).join('');
  const slides = Array.from(track.querySelectorAll('.testimonial'));

  function updateOverflow() {
    const slide = slides[current];
    if (!slide) return;
    const body = slide.querySelector('.review-body');
    const overflowing = body.scrollHeight > body.clientHeight + 2;
    slide.classList.toggle('has-long-review', overflowing);
    body.tabIndex = overflowing ? 0 : -1;
  }

  function show(index) {
    if (!reviews.length) return;
    current = wrap(index);
    slides.forEach((slide, position) => {
      const active = position === current;
      slide.classList.toggle('current', active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
      if (active) slide.querySelector('.review-body').scrollTop = 0;
    });
    counter.textContent = `${String(current + 1).padStart(2, '0')} / ${reviews.length}`;
    counter.setAttribute('aria-label', `Recomandarea ${current + 1} din ${reviews.length}: ${reviews[current].author}`);
    updateOverflow();
  }

  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  slider.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    // Do not leave keyboard focus in an inert slide when changing its content.
    if (track.contains(event.target)) (event.key === 'ArrowRight' ? next : previous).focus({ preventScroll: true });
    show(current + (event.key === 'ArrowRight' ? 1 : -1));
  });
  track.addEventListener('touchstart', event => {
    touchStart = event.touches.length === 1 && !event.target.closest('a, button')
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  track.addEventListener('touchmove', event => {
    if (!touchStart) return;
    // Once the gesture becomes vertical, leave it to the scrollable full review.
    if (event.touches.length !== 1 || Math.abs(event.touches[0].clientY - touchStart.y) > 30) touchStart = null;
  }, { passive: true });
  track.addEventListener('touchend', event => {
    if (!touchStart || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
  }, { passive: true });
  track.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(updateOverflow).observe(track);
  if (typeof document !== 'undefined') document.fonts?.ready.then(updateOverflow);
  show(0);
  // Intentionally manual: no timer and no play/pause control while reading.
  return { show };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { createTestimonialCarousel };

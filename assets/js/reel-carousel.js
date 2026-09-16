"use strict";
// Desktop only. Rotate the eight existing cards instead of cloning videos.
window.createDesktopReelCarousel = ({track, previous, next, reduced, saveData, onChange, isModalOpen}) => {
  const desktop = matchMedia('(min-width: 1024px)');
  const cards = [...track.children];
  const region = track.closest('.reels-section');
  let step = 0, frame = 0, timer, settleTimer;
  let visible = false, hovered = false, paused = false, dragging = null;
  let moving = false, queue = 0, suppressClickUntil = 0, manualPreview = false;
  let hoveredVideo = null, announcedVideo = null;
  let layoutWidth = -1, layoutDesktop;
  const previewDuration = 5500;

  function activeVideo() {
    return desktop.matches && step ? hoveredVideo || track.children[1]?.querySelector('video') : null;
  }
  function syncButtons() {
    previous.disabled = !desktop.matches && track.scrollLeft < 5;
    next.disabled = !desktop.matches && track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;
    track.setAttribute('aria-label', desktop.matches ? 'Galerie video circulară. Săgeți stânga și dreapta pentru navigare. Spațiu pentru pauză sau reluarea derulării automate.' : 'Galerie video, derulează orizontal pentru mai multe filme');
  }
  function refresh() {
    clearTimeout(timer);
    syncButtons();
    if (!desktop.matches || !visible || paused || hovered || moving || dragging || reduced.matches || saveData || document.hidden || isModalOpen() || region.contains(document.activeElement)) return;
    timer = setTimeout(() => move(1, false), previewDuration);
  }
  // Maintain a one-card buffer on the left. DOM shifts are compensated in the
  // same frame, so neither the first nor last item forms a visual boundary.
  function setPosition(position) {
    if (!step) return;
    while (position < step - 1) {
      track.prepend(track.lastElementChild);
      position += step;
    }
    while (position >= 2 * step - 1) {
      track.append(track.firstElementChild);
      position -= step;
    }
    track.scrollLeft = Math.abs(position - step) < 1 ? step : Math.max(step, position);
  }
  function announceCurrent() {
    const video = activeVideo();
    if (video && video !== announcedVideo) {
      try { video.currentTime = 0; } catch { /* Poster remains until metadata loads. */ }
      track.dataset.currentPreview = video.getAttribute('title') || '';
      announcedVideo = video;
    }
    onChange();
  }
  function animate(distance, userInitiated) {
    clearTimeout(timer);
    cancelAnimationFrame(frame);
    clearTimeout(settleTimer);
    moving = true;
    if (userInitiated) manualPreview = true;
    const targetCard = distance > .1 ? track.children[2] :
      (distance < -.1 && track.scrollLeft + distance < step - 1 ? track.children[0] : track.children[1]);
    let previousProgress = 0;
    const start = performance.now();
    const duration = reduced.matches ? 0 : 650;
    function tick(now) {
      const progress = duration ? Math.min(1, (now - start) / duration) : 1;
      const eased = 1 - Math.pow(1 - progress, 3);
      setPosition(track.scrollLeft + distance * (eased - previousProgress));
      previousProgress = eased;
      if (progress < 1) frame = requestAnimationFrame(tick);
      else {
        // Snap by identity rather than accumulated pixels (subpixel rounding).
        for (let i = 0; track.children[1] !== targetCard && i < cards.length; i++) track.append(track.firstElementChild);
        track.scrollLeft = step;
        moving = false;
        announceCurrent();
        if (queue) { const direction = Math.sign(queue); queue -= direction; move(direction, true); }
        else refresh();
      }
    }
    frame = requestAnimationFrame(tick);
  }
  function move(direction, userInitiated = true) {
    if (!desktop.matches) {
      track.scrollBy({left: direction * track.clientWidth * .8, behavior: reduced.matches ? 'instant' : 'smooth'});
      return;
    }
    if (!step) return;
    if (moving) { if (userInitiated) queue = Math.max(-8, Math.min(8, queue + direction)); return; }
    const position = track.scrollLeft;
    animate(direction > 0 ? 2 * step - position : (position > step + 2 ? step : 0) - position, userInitiated);
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('keydown', event => {
    if (desktop.matches && event.code === 'Space' && event.target === track) {
      event.preventDefault(); paused = !paused; refresh();
    }
    if (desktop.matches && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
    }
  });

  track.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' || event.button !== 0) return;
    clearTimeout(timer);
    dragging = {id:event.pointerId, startX:event.clientX, lastX:event.clientX, moved:false};
  });
  track.addEventListener('pointermove', event => {
    if (!dragging || event.pointerId !== dragging.id) return;
    if (!dragging.moved && Math.abs(event.clientX - dragging.startX) < 7) return;
    if (!dragging.moved) {
      dragging.moved = true;
      cancelAnimationFrame(frame); moving = false; queue = 0;
      track.setPointerCapture(event.pointerId);
      track.classList.add('is-dragging');
    }
    event.preventDefault();
    const position = track.scrollLeft + dragging.lastX - event.clientX;
    if (desktop.matches) setPosition(position);
    else track.scrollLeft = position;
    dragging.lastX = event.clientX;
  });
  function endDrag(event) {
    if (!dragging || event.pointerId !== dragging.id) return;
    const didDrag = dragging.moved;
    dragging = null;
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    track.classList.remove('is-dragging');
    if (didDrag) {
      suppressClickUntil = performance.now() + 500;
      const position = track.scrollLeft;
      if (desktop.matches) animate((position >= step * 1.5 ? 2 * step : step) - position, true);
      else {
        const mobileStep = cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
        track.scrollTo({left: Math.round(position / mobileStep) * mobileStep, behavior: reduced.matches ? 'instant' : 'smooth'});
        refresh();
      }
    } else refresh();
  }
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  track.addEventListener('lostpointercapture', endDrag);
  track.addEventListener('pointerleave', event => { if (dragging && !dragging.moved) endDrag(event); });
  track.addEventListener('click', event => {
    if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  track.addEventListener('dragstart', event => event.preventDefault());
  track.addEventListener('mouseenter', () => { hovered = true; refresh(); });
  track.addEventListener('pointerover', event => {
    if (!desktop.matches || event.pointerType === 'touch' || dragging) return;
    const video = event.target.closest('.reel')?.querySelector('video');
    if (video && video !== hoveredVideo) {
      hoveredVideo = video;
      manualPreview = true;
      announceCurrent();
    }
  });
  track.addEventListener('mouseleave', () => {
    hovered = false; hoveredVideo = null;
    announceCurrent(); refresh();
  });
  region.addEventListener('focusin', refresh);
  region.addEventListener('focusout', () => setTimeout(refresh, 0));
  track.addEventListener('scroll', () => {
    syncButtons();
    if (!desktop.matches || moving || dragging) return;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => {
      setPosition(track.scrollLeft);
      // Native trackpad or keyboard scrolling also selects a fresh preview.
      announceCurrent(); refresh();
    }, 140);
  }, {passive:true});

  function layout() {
    const width = track.clientWidth;
    // Browser chrome changes viewport height during mobile swipes; do not reset.
    if (layoutWidth === width && layoutDesktop === desktop.matches) return;
    layoutWidth = width; layoutDesktop = desktop.matches;
    cancelAnimationFrame(frame); clearTimeout(timer); clearTimeout(settleTimer);
    moving = false; queue = 0; dragging = null; hoveredVideo = null;
    track.classList.remove('is-dragging');
    track.classList.toggle('reels-desktop-loop', desktop.matches);
    track.replaceChildren(...cards);
    if (desktop.matches) {
      step = cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
      track.prepend(cards[cards.length - 1]);
      track.scrollLeft = step;
    } else { step = 0; track.scrollLeft = 0; }
    syncButtons();
    requestAnimationFrame(() => { onChange(); refresh(); });
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .45;
    if (!visible) manualPreview = false;
    refresh(); onChange();
  }, {threshold:[0,.45,.75]}).observe(track);
  window.addEventListener('resize', layout);
  reduced.addEventListener('change', () => { manualPreview = false; refresh(); });
  layout();
  return {
    get desktop() { return desktop.matches; },
    get activeVideo() { return activeVideo(); },
    get allowPreview() { return manualPreview || (!reduced.matches && !saveData); },
    refresh
  };
};

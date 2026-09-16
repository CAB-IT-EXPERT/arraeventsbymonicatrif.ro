"use strict";
(() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.querySelector(".site-header");
  const hero = document.querySelector('.hero');
  const whatsapp = document.querySelector('.floating-whatsapp');
  let whatsappVisible = false;
  let tooltipTimer;
  function restartWhatsAppTooltip() {
    clearTimeout(tooltipTimer);
    whatsapp?.classList.remove('is-teasing');
    if (!whatsapp || !whatsappVisible || document.hidden || reduced.matches) return;
    function showTooltip() {
      if (!whatsappVisible || document.hidden || reduced.matches) return;
      whatsapp.classList.add('is-teasing');
      tooltipTimer = setTimeout(() => {
        whatsapp.classList.remove('is-teasing');
        tooltipTimer = setTimeout(showTooltip, 5000);
      }, 2500);
    }
    tooltipTimer = setTimeout(showTooltip, 950);
  }
  function updateWhatsApp(visible) {
    if (!whatsapp || visible === whatsappVisible) return;
    whatsappVisible = visible;
    whatsapp.classList.toggle('is-visible', visible);
    whatsapp.inert = !visible;
    whatsapp.setAttribute('aria-hidden', String(!visible));
    whatsapp.tabIndex = visible ? 0 : -1;
    restartWhatsAppTooltip();
  }
  const progress = document.querySelector(".scroll-progress");
  const parallax = [...document.querySelectorAll("[data-parallax]")];
  const sections = [...document.querySelectorAll("main section[id]:not([hidden])")];
  const timeline = document.querySelector('.scroll-timeline');
  const timelineSteps = timeline ? [...timeline.children] : [];
  const links = [...document.querySelectorAll(".desktop-nav a:not([hidden])")];
  let lastScrollY = scrollY;
  let scrollDirection = 'down';
  let layout = { heroEnd: 0, length: 0, sections: [], badges: [] };
  // Geometry is measured on layout changes, not on every scroll frame.
  function measure() {
    layout = {
      heroEnd: hero.getBoundingClientRect().bottom + scrollY,
      length: document.documentElement.scrollHeight - innerHeight,
      sections: sections.map(section => ({id: section.id, top: section.getBoundingClientRect().top + scrollY})),
      badges: timelineSteps.map(step => {
        const rect = step.querySelector(':scope > span').getBoundingClientRect();
        return rect.top + scrollY + rect.height / 2;
      }),
    };
    if (timeline && layout.badges.length) {
      const first = layout.badges[0], last = layout.badges.at(-1);
      timeline.style.setProperty('--line-top', `${first - timeline.getBoundingClientRect().top - scrollY}px`);
      timeline.style.setProperty('--line-height', `${last - first}px`);
    }
    draw();
  }
  let scheduled = false;
  function draw() {
    scheduled = false;
    if (Math.abs(scrollY - lastScrollY) > 2) {
      scrollDirection = scrollY > lastScrollY ? 'down' : 'up';
      document.body.classList.toggle('scrolling-up', scrollDirection === 'up');
      lastScrollY = scrollY;
    }
    header.classList.toggle("scrolled", scrollY > 30);
    const pastHero = scrollY + header.offsetHeight >= layout.heroEnd;
    header.classList.toggle('past-hero', pastHero);
    updateWhatsApp(pastHero);
    if (timeline && timelineSteps.length) {
      const start = layout.badges[0];
      const end = layout.badges.at(-1);
      const readLine = scrollY + innerHeight * .68;
      const filled = reduced.matches ? 1 : Math.max(0, Math.min(1, (readLine - start) / (end - start)));
      timeline.style.setProperty('--timeline-progress', filled);
      timelineSteps.forEach((step, i) => {
        step.classList.toggle('is-reached', reduced.matches || layout.badges[i] <= readLine);
      });
    }
    const length = layout.length;
    progress.style.transform = `scaleX(${length > 0 ? scrollY / length : 0})`;
    if (!document.body.classList.contains('editorial-preview') && !reduced.matches && innerWidth > 767)
      parallax.forEach((el) => {
        const rect = el.parentElement.getBoundingClientRect();
        const isHero = el.classList.contains('hero-image');
        if (isHero && innerWidth < 1024) { el.style.transform = ''; return; }
        if (rect.bottom > 0 && rect.top < innerHeight) {
          const travel = isHero ? Math.max(0, -rect.top) : -rect.top;
          el.style.transform = `translate3d(0,${travel * Number(el.dataset.parallax)}px,0)`;
        }
      });
    else
      parallax.forEach((el) => {
        el.style.transform = "";
      });
    let active = "acasa";
    layout.sections.forEach((section) => {
      if (
        section.top - scrollY <= 150 &&
        links.some((a) => a.hash === "#" + section.id)
      )
        active = section.id;
    });
    links.forEach((link) =>
      link.classList.toggle("active", link.hash === "#" + active),
    );
  }
  addEventListener(
    "scroll",
    () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(draw);
      }
    },
    { passive: true },
  );
  addEventListener("resize", measure, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
  document.fonts?.ready.then(measure);
  if ("IntersectionObserver" in window && !reduced.matches) {
    document
      .querySelectorAll(".stagger")
      .forEach((group) =>
        [...group.children].forEach((el, i) =>
          el.style.setProperty("--delay", Math.min(i * 100, 400) + "ms"),
        ),
      );
    const revealElements = [...document.querySelectorAll('.reveal')];
    revealElements.forEach(el => {
      const group = el.parentElement;
      if (el.matches('.story-visual, .philosophy-heading')) el.dataset.revealFrom = 'left';
      else if (el.matches('.story-copy, .philosophy-content')) el.dataset.revealFrom = 'right';
      else if (group.matches('.stagger')) {
        const index = [...group.children].indexOf(el);
        el.dataset.revealFrom = index % 3 === 0 ? 'left' : index % 3 === 2 ? 'right' : 'bottom';
      } else el.dataset.revealFrom = 'bottom';
    });
    const reveal = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          } else if (entry.boundingClientRect.top >= innerHeight - 25) {
            // Rearm only after leaving below the viewport. Upward reading stays
            // fully visible; a subsequent downward entry animates again.
            entry.target.classList.remove('visible');
          }
        }),
      { threshold: 0.08, rootMargin: "0px 0px -25px 0px" },
    );
    revealElements.forEach((el) => reveal.observe(el));
    document.body.classList.add("motion-ready");
  }
  reduced.addEventListener("change", () => {
    if (reduced.matches) {
      document.body.classList.remove("motion-ready");
      parallax.forEach((el) => (el.style.transform = ""));
    }
    draw();
  });
  measure();
  reduced.addEventListener('change', restartWhatsAppTooltip);
  document.addEventListener('visibilitychange', restartWhatsAppTooltip);
})();

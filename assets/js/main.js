"use strict";
function buildWhatsAppMessage(details) {
  const clean = (name) => String(details[name] || "").trim();
  const eventDate = clean("date")
    ? new Date(`${clean("date")}T12:00:00`).toLocaleDateString("ro-RO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "De stabilit";
  return [
    "Bună, Monica! Aș dori să discutăm despre un eveniment alături de ARRA Events.",
    "",
    `Nume: ${clean("name")}`,
    `Telefon: ${clean("phone")}`,
    ...(clean("email") ? [`Email: ${clean("email")}`] : []),
    `Eveniment: ${clean("event")}`,
    `Data: ${eventDate}`,
    `Locație: ${clean("location") || "De stabilit"}`,
    `Invitați: ${clean("guests") || "De stabilit"}`,
    "",
    `Povestea / ideile mele: ${clean("message") || "Mi-ar plăcea să le discutăm împreună."}`,
    "",
    "Mesaj pregătit prin arraeventsbymonicatrif.ro.",
  ].join("\n");
}
function buildWhatsAppURL(phone, message) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
function selectInlinePreview({candidates, visibility, reel, reelVisibility = 0, hoveredReel}) {
  // An explicit hover wins over an adjacent automatic film. Otherwise play
  // the most visible candidate, not the panorama merely because it is visible.
  if (reel && reel === hoveredReel && reelVisibility >= .45) return reel;
  const ranked = candidates
    .filter(video => !video.hasAttribute('data-reel'))
    .map(video => ({video, ratio: visibility.get(video) || 0}));
  if (reel && reelVisibility >= .45) ranked.push({video: reel, ratio: reelVisibility});
  ranked.sort((a, b) => b.ratio - a.ratio || Number(b.video === reel) - Number(a.video === reel));
  return ranked[0]?.video;
}
if (typeof module !== "undefined" && module.exports)
  module.exports = { buildWhatsAppMessage, buildWhatsAppURL, selectInlinePreview };
if (typeof document !== "undefined")
  (() => {
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [
      ...root.querySelectorAll(selector),
    ];
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const escape = (value) =>
      String(value).replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
    const syncLock = () =>
      document.body.classList.toggle("locked", !!$("dialog[open]"));
    const menu = document.querySelector("#mobile-menu");
    const toggle = document.querySelector(".menu-toggle");
    let menuCloseTimer;
    function closeMenu() {
      if (!menu.open || menu.classList.contains('is-closing')) return;
      if (reduced.matches) { menu.close(); return; }
      menu.classList.add('is-closing');
      // Keep the modal and focus trap until its exit animation completes.
      menuCloseTimer = setTimeout(() => menu.close(), 430);
    }
    toggle.addEventListener("click", () => {
      clearTimeout(menuCloseTimer);
      menu.classList.remove('is-closing');
      menu.showModal();
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("locked");
    });
    menu
      .querySelector("[data-close-menu]")
      .addEventListener("click", closeMenu);
    menu
      .querySelectorAll("a")
      .forEach((link) => link.addEventListener("click", closeMenu));
    menu.addEventListener("close", () => {
      clearTimeout(menuCloseTimer);
      menu.classList.remove('is-closing');
      toggle.setAttribute("aria-expanded", "false");
      syncLock();
    });
    menu.addEventListener('cancel', event => { event.preventDefault(); closeMenu(); });
    $$("[data-event]").forEach((link) =>
      link.addEventListener("click", () => {
        $("#contact-form select[name=event]").value = link.dataset.event;
      }),
    );
    $("#copyright-year").textContent = new Date().getFullYear();
    $$('[data-location]').forEach(link => link.addEventListener('click', () => {
      $('#contact-form [name="location"]').value = link.dataset.location;
    }));

    // Portfolio: local, progressive and usable with a keyboard or touch.
    let filtered = ARRA.gallery.slice(),
      visibleCount = 9,
      photoIndex = 0;
    const gallery = $("#gallery-grid"),
      photoDialog = $("#gallery-dialog");
    function renderGallery() {
      gallery.classList.toggle('is-filtered', filtered.length !== ARRA.gallery.length);
      gallery.style.setProperty('--gallery-columns', Math.min(3, filtered.length));
      gallery.innerHTML = filtered
        .slice(0, visibleCount)
        .map(
          (item) =>
            `<article class="gallery-card" style="--ratio:${item.ratio}"><button type="button" data-photo="${item.id}" aria-label="Mărește imaginea: ${escape(item.title)}"><img src="assets/images/photo-${item.id}-480.webp" srcset="assets/images/photo-${item.id}-480.webp 480w, assets/images/photo-${item.id}-900.webp 900w, assets/images/photo-${item.id}-1440.webp 1440w" sizes="(max-width:767px) 45vw, 30vw" loading="lazy" decoding="async" width="900" height="1100" alt="${escape(item.alt)}"><span class="gallery-zoom" aria-hidden="true"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m16 16 5 5M10.5 7.5v6M7.5 10.5h6"></path></svg></span><span class="gallery-card-info"><small>${escape(item.category)}</small><strong>${escape(item.title)}</strong><span>DESCOPERĂ POVESTEA</span></span></button></article>`,
        )
        .join("");
      const count = Math.min(visibleCount, filtered.length);
      $("#gallery-count").textContent =
        `${count} din ${filtered.length} fotografii`;
      $("#gallery-status").textContent =
        `${filtered.length} fotografii în selecția curentă. ${count} afișate.`;
      $("#gallery-empty").hidden = filtered.length > 0;
      $("#gallery-more").hidden = count >= filtered.length;
    }
    renderGallery();
    $$('[data-filter]').forEach(button => {
      button.hidden = button.dataset.filter !== 'Toate' &&
        !ARRA.gallery.some(item => item.category === button.dataset.filter);
    });
    $$("[data-filter]").forEach((button) =>
      button.addEventListener("click", () => {
        $$("[data-filter]").forEach((b) => {
          b.classList.toggle("selected", b === button);
          b.setAttribute("aria-pressed", b === button ? "true" : "false");
        });
        filtered = ARRA.gallery.filter(
          (item) =>
            button.dataset.filter === "Toate" ||
            item.category === button.dataset.filter,
        );
        visibleCount = 9;
        renderGallery();
      }),
    );
    $("#gallery-more").addEventListener("click", () => {
      const previousCount = visibleCount;
      visibleCount += 9;
      renderGallery();
      // Keep keyboard focus in the newly revealed content if the button disappears.
      if ($("#gallery-more").hidden)
        $$("[data-photo]", gallery)[previousCount]?.focus({
          preventScroll: true,
        });
    });
    function showPhoto(index) {
      photoIndex = (index + filtered.length) % filtered.length;
      const item = filtered[photoIndex];
      $("#lightbox-image").src = `assets/images/photo-${item.id}-1440.webp`;
      $("#lightbox-image").alt = item.alt;
      $("#lightbox-category").textContent = item.category;
      $("#lightbox-title").textContent = item.title;
      $("#lightbox-description").textContent = item.description;
      $("#lightbox-count").textContent =
        `${photoIndex + 1} / ${filtered.length}`;
    }
    gallery.addEventListener("click", (event) => {
      const button = event.target.closest("[data-photo]");
      if (!button) return;
      showPhoto(filtered.findIndex((item) => item.id === button.dataset.photo));
      photoDialog.showModal();
      syncLock();
    });
    $(".previous", photoDialog).addEventListener("click", () =>
      showPhoto(photoIndex - 1),
    );
    $(".next", photoDialog).addEventListener("click", () =>
      showPhoto(photoIndex + 1),
    );
    photoDialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        showPhoto(photoIndex + (event.key === "ArrowRight" ? 1 : -1));
      }
    });
    let swipeStart;
    $(".lightbox-image-wrap").addEventListener(
      "touchstart",
      (event) => {
        const t = event.changedTouches[0];
        swipeStart = { x: t.clientX, y: t.clientY };
      },
      { passive: true },
    );
    $(".lightbox-image-wrap").addEventListener(
      "touchend",
      (event) => {
        if (!swipeStart) return;
        const t = event.changedTouches[0],
          dx = t.clientX - swipeStart.x,
          dy = t.clientY - swipeStart.y;
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy))
          showPhoto(photoIndex + (dx < 0 ? 1 : -1));
        swipeStart = null;
      },
      { passive: true },
    );
    $("[data-gallery-contact]").addEventListener("click", () =>
      photoDialog.close(),
    );
    $$("dialog").forEach((dialog) => {
      $(".modal-close", dialog)?.addEventListener("click", () =>
        dialog.close(),
      );
      dialog.addEventListener("close", syncLock);
      dialog.addEventListener("click", (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          dialog.close();
      });
    });

    // Only nearby videos are loaded; just one visible reel previews at a time.
    const reels = $("#reels-track");
    reels.innerHTML = ARRA.reels
      .map(
        (item) =>
          `<article class="reel"><div class="reel-frame"><video data-reel data-src="assets/video/${item.file}" muted loop playsinline preload="none" poster="assets/posters/${item.code}.webp" width="720" height="1280" title="${escape(item.title)}"></video><button type="button" class="reel-open" data-open-video="${item.file}" aria-label="Redă filmul: ${escape(item.title)}"><span class="reel-duration">${item.duration}</span><span class="reel-play" aria-hidden="true">▷</span><span class="reel-title">${escape(item.title)}</span></button></div><p>${escape(item.caption)}</p></article>`,
      )
      .join("");
    const videos = $$("video[data-src]"),
      videoDialog = $("#video-dialog"),
      modalVideo = $("#modal-video");
    const visibility = new Map(),
      manuallyPaused = new WeakSet();
    const saveData = !!navigator.connection?.saveData;
    let reelCarousel;
    function prepareVideo(video) {
      if (!video.getAttribute("src")) {
        // Use the highest-quality local master for both inline and modal playback.
        video.src = video.dataset.src + (video.dataset.mediaVersion ? `?v=${encodeURIComponent(video.dataset.mediaVersion)}` : '');
        video.load();
      }
    }
    function playQuietly(video) {
      // One decoder at a time also applies to explicit play and sound controls.
      videos.forEach(other => { if (other !== video) other.pause(); });
      const promise = video.play();
      if (promise) promise.catch(() => {});
    }
    function coordinateVideos() {
      if (document.hidden || videoDialog.open) {
        videos.forEach((v) => v.pause());
        return;
      }
      const candidates = videos.filter(
        (v) => (visibility.get(v) || 0) >= 0.5 && !manuallyPaused.has(v),
      );
      const reel = reelCarousel?.desktop ? reelCarousel.activeVideo : candidates
        .filter((v) => v.hasAttribute("data-reel"))
        .sort((a, b) => visibility.get(b) - visibility.get(a))[0];
      let reelVisibility = reel ? visibility.get(reel) || 0 : 0;
      if (reel && reelCarousel?.desktop) {
        // Card rotation can precede IntersectionObserver's next notification.
        // Check the selected frame directly so each new preview starts reliably.
        const frame = reel.getBoundingClientRect(), rail = reels.getBoundingClientRect();
        const width = Math.max(0, Math.min(frame.right, rail.right, innerWidth) - Math.max(frame.left, rail.left, 0));
        const height = Math.max(0, Math.min(frame.bottom, rail.bottom, innerHeight) - Math.max(frame.top, rail.top, 0));
        reelVisibility = frame.width && frame.height ? width * height / (frame.width * frame.height) : 0;
      }
      const active = selectInlinePreview({
        candidates, visibility, reel, reelVisibility,
        hoveredReel: reelCarousel?.hoveredVideo
      });
      videos.forEach(video => { if (video !== active) video.pause(); });
      if (active && ((!reduced.matches && !saveData) ||
        (active === reel && reelCarousel?.desktop && reelCarousel.allowPreview))) {
        prepareVideo(active);
        if (active.paused) playQuietly(active);
      }
    }
    videos.forEach(video => {
      video.addEventListener('loadedmetadata', () => {
        const frame = video.closest('.video-frame, .reel-frame, .landscape-media');
        if (frame && video.videoWidth && video.videoHeight)
          frame.style.setProperty('--video-ratio', `${video.videoWidth} / ${video.videoHeight}`);
      });
    });
    if ("IntersectionObserver" in window) {
      const playObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) =>
            visibility.set(entry.target, entry.intersectionRatio),
          );
          coordinateVideos();
        },
        { threshold: [0, 0.25, 0.5, 0.75, 1] },
      );
      videos.forEach((video) => {
        playObserver.observe(video);
      });
    }
    $$("[data-video-card]").forEach((card) => {
      const video = $("video", card),
        play = $("[data-play]", card),
        sound = $("[data-sound]", card);
      function syncPlay() {
        play.textContent = video.paused ? "▷" : "Ⅱ";
        play.setAttribute(
          "aria-label",
          video.paused ? "Redă filmul" : "Pune filmul pe pauză",
        );
        play.setAttribute("aria-pressed", video.paused ? "false" : "true");
      }
      function syncSound() {
        sound.innerHTML = `<span aria-hidden="true">♫</span> ${video.muted ? "Activează sunetul" : "Oprește sunetul"}`;
        sound.setAttribute("aria-pressed", String(!video.muted));
        sound.setAttribute(
          "aria-label",
          video.muted ? "Activează sunetul" : "Oprește sunetul",
        );
      }
      play.addEventListener("click", () => {
        if (video.paused) {
          manuallyPaused.delete(video);
          prepareVideo(video);
          playQuietly(video);
        } else {
          manuallyPaused.add(video);
          video.pause();
        }
      });
      sound.addEventListener("click", () => {
        const unmute = video.muted;
        videos.forEach((other) => {
          if (other !== video) other.muted = true;
        });
        video.muted = !unmute;
        if (unmute) {
          manuallyPaused.delete(video);
          prepareVideo(video);
          playQuietly(video);
        }
      });
      video.addEventListener("play", syncPlay);
      video.addEventListener("pause", syncPlay);
      video.addEventListener("volumechange", syncSound);
      video.addEventListener("timeupdate", () => {
        $(".video-progress", card).style.transform =
          `scaleX(${video.duration ? video.currentTime / video.duration : 0})`;
      });
      video.addEventListener("error", () => {
        play.setAttribute("aria-label", "Reîncearcă redarea filmului");
      });
      syncPlay();
      syncSound();
    });
    const panorama = $('[data-panorama]');
    if (panorama) {
      const media = panorama.closest('.landscape-media');
      const control = $('.landscape-play', media);
      let hideControlTimer;
      function hideControl() {
        clearTimeout(hideControlTimer);
        media.classList.remove('show-controls');
      }
      function syncPanorama() {
        media.classList.toggle('is-paused', panorama.paused);
        control.setAttribute('aria-label', panorama.paused ? 'Redă filmul panoramic' : 'Pune filmul panoramic pe pauză');
        control.setAttribute('aria-pressed', String(!panorama.paused));
        hideControl();
      }
      media.addEventListener('pointerenter', event => {
        if (event.pointerType === 'mouse' && !panorama.paused) media.classList.add('show-controls');
      });
      media.addEventListener('pointerleave', hideControl);
      media.addEventListener('click', event => {
        if (event.target.closest('.landscape-play') || panorama.paused) return;
        media.classList.add('show-controls');
        clearTimeout(hideControlTimer);
        hideControlTimer = setTimeout(hideControl, 2500);
      });
      control.addEventListener('click', event => {
        event.stopPropagation();
        if (panorama.paused) {
          manuallyPaused.delete(panorama);
          prepareVideo(panorama);
          hideControl();
          playQuietly(panorama);
        } else {
          manuallyPaused.add(panorama);
          panorama.pause();
        }
      });
      panorama.addEventListener('play', syncPanorama);
      panorama.addEventListener('pause', syncPanorama);
      panorama.addEventListener('error', () => {
        media.classList.add('is-paused');
        control.setAttribute('aria-label', 'Reîncearcă redarea filmului panoramic');
      });
      syncPanorama();
    }
    const allowedFiles = new Set([
      ...videos.map((v) => v.dataset.src.split("/").pop()),
      "2026-01-14_DTfQlqzgg9I.mp4",
    ]);
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-open-video]");
      if (!button || !allowedFiles.has(button.dataset.openVideo)) return;
      videos.forEach((video) => video.pause());
      const sourceVideo = videos.find(video => video.dataset.src === `assets/video/${button.dataset.openVideo}`);
      const mediaVersion = sourceVideo?.dataset.mediaVersion;
      modalVideo.src = `assets/video/${button.dataset.openVideo}` + (mediaVersion ? `?v=${encodeURIComponent(mediaVersion)}` : '');
      modalVideo.classList.toggle(
        "landscape",
        button.dataset.openVideo.includes("DTfQlqzgg9I"),
      );
      modalVideo.muted = true;
      modalVideo.loop = false;
      videoDialog.showModal();
      reelCarousel?.refresh();
      syncLock();
      playQuietly(modalVideo);
    });
    videoDialog.addEventListener("close", () => {
      modalVideo.pause();
      modalVideo.removeAttribute("src");
      modalVideo.load();
      coordinateVideos();
      reelCarousel?.refresh();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) modalVideo.pause();
      coordinateVideos();
      reelCarousel?.refresh();
      scheduleReview();
    });
    reduced.addEventListener("change", () => {
      if (reduced.matches) videos.forEach((v) => v.pause());
      else coordinateVideos();
      scheduleReview();
    });
    reelCarousel = createDesktopReelCarousel({
      track: reels, previous: $('#reels-prev'), next: $('#reels-next'),
      reduced, saveData,
      onChange: coordinateVideos, isModalOpen: () => videoDialog.open
    });
    $$('video[data-reel]').forEach(video => {
      video.addEventListener('play', () => video.closest('.reel').classList.add('is-previewing'));
      video.addEventListener('pause', () => video.closest('.reel').classList.remove('is-previewing'));
    });

    // Only render approved, sourced reviews, with the full original wording.
    // Keep future unapproved entries out of the public carousel.
    const reviewSection = $("#testimoniale"),
      reviews = ARRA.testimonials.filter(item => item.verified === true),
      reviewTrack = $("#testimonials-track"),
      reviewDots = $("#review-dots"),
      reviewPause = $("#review-autoplay");
    let reviewIndex = 0,
      reviewTimer,
      reviewsVisible = false,
      reviewsPaused = true,
      reviewsHovered = false;
    if (reviews.length < 3) {
      reviewSection.hidden = true;
      $$('a[href="#testimoniale"]').forEach(link => { link.hidden = true; });
    }
    reviewTrack.innerHTML = reviews
      .map(
        (item, index) =>
          `<figure class="testimonial${index === 0 ? " current" : ""}" aria-hidden="${index !== 0}" ${index !== 0 ? "inert" : ""}><figcaption class="review-person"><img src="${escape(item.photo)}" width="48" height="48" loading="lazy" alt="${escape(item.author)} — fotografia de profil Facebook"><div><cite>${escape(item.author)}</cite><small>${escape(item.category)}</small></div></figcaption><blockquote cite="${escape(item.source)}">${escape(item.text)}</blockquote><a class="review-source" href="${escape(item.source)}" target="_blank" rel="noopener noreferrer">Vezi recenzia pe Facebook <span aria-hidden="true">↗</span></a></figure>`,
      )
      .join("");
    reviewDots.innerHTML = reviews
      .map(
        (_, i) =>
          `<button type="button" aria-label="Testimonialul ${i + 1}" aria-pressed="${i === 0}" class="${i === 0 ? "active" : ""}"></button>`,
      )
      .join("");
    function scheduleReview() {
      clearTimeout(reviewTimer);
      if (
        !reviewSection.hidden &&
        reviews.length >= 3 &&
        !reviewsPaused &&
        reviewsVisible &&
        !reviewsHovered &&
        !reduced.matches &&
        !document.hidden &&
        !$(".testimonial-slider").contains(document.activeElement)
      )
        reviewTimer = setTimeout(() => setReview(reviewIndex + 1), Math.max(12000, reviews[reviewIndex].text.split(/\s+/).length * 400));
    }
    function setReview(index) {
      if (!reviews.length) return;
      reviewIndex =
        (index + reviews.length) % reviews.length;
      $$(".testimonial").forEach((slide, i) => {
        slide.classList.toggle("current", i === reviewIndex);
        slide.setAttribute("aria-hidden", String(i !== reviewIndex));
        slide.inert = i !== reviewIndex;
      });
      $$("button", reviewDots).forEach((dot, i) => {
        dot.classList.toggle("active", i === reviewIndex);
        dot.setAttribute("aria-pressed", String(i === reviewIndex));
      });
      scheduleReview();
    }
    $("#reviews-prev").addEventListener("click", () =>
      setReview(reviewIndex - 1),
    );
    $("#reviews-next").addEventListener("click", () =>
      setReview(reviewIndex + 1),
    );
    $$("button", reviewDots).forEach((dot, i) =>
      dot.addEventListener("click", () => setReview(i)),
    );
    reviewPause.addEventListener("click", () => {
      reviewsPaused = !reviewsPaused;
      reviewPause.textContent = reviewsPaused ? "▷" : "Ⅱ";
      reviewPause.setAttribute(
        "aria-label",
        reviewsPaused
          ? "Pornește derularea automată"
          : "Oprește derularea automată",
      );
      reviewPause.setAttribute("aria-pressed", String(reviewsPaused));
      scheduleReview();
    });
    $(".testimonial-slider").addEventListener("mouseenter", () => {
      reviewsHovered = true;
      scheduleReview();
    });
    $(".testimonial-slider").addEventListener("mouseleave", () => {
      reviewsHovered = false;
      scheduleReview();
    });
    $(".testimonial-slider").addEventListener("focusin", scheduleReview);
    $(".testimonial-slider").addEventListener("focusout", () =>
      setTimeout(scheduleReview, 0),
    );
    if (!reviewSection.hidden && "IntersectionObserver" in window)
      new IntersectionObserver(
        (entries) => {
          reviewsVisible = entries[0].isIntersecting;
          scheduleReview();
        },
        { threshold: 0.25 },
      ).observe(reviewTrack);

    // Nothing is sent by this page: WhatsApp opens a draft for the visitor to review.
    const form = $("#contact-form"),
      formError = $("#form-error");
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    form.elements.date.min = today.toISOString().slice(0, 10);
    form.addEventListener("input", (event) => {
      event.target.removeAttribute("aria-invalid");
      $("#form-result").hidden = true;
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      formError.hidden = true;
      $$("[aria-invalid]", form).forEach((field) =>
        field.removeAttribute("aria-invalid"),
      );
      const value = (name) => form.elements[name].value.trim();
      const invalid = [];
      if (value("name").length < 2)
        invalid.push(["name", "Te rugăm să completezi numele."]);
      if (
        !/^[+()\d\s.-]+$/.test(value("phone")) ||
        value("phone").replace(/\D/g, "").length < 8 ||
        value("phone").replace(/\D/g, "").length > 15
      )
        invalid.push([
          "phone",
          "Completează un număr de telefon valid (8–15 cifre).",
        ]);
      if (value("email") && !form.elements.email.validity.valid)
        invalid.push(["email", "Verifică adresa de email."]);
      if (!value("event"))
        invalid.push(["event", "Alege tipul evenimentului."]);
      if (!form.elements.date.validity.valid)
        invalid.push([
          "date",
          "Alege o dată viitoare sau lasă data necompletată.",
        ]);
      if (!form.elements.guests.validity.valid)
        invalid.push([
          "guests",
          "Introdu un număr întreg de invitați, mai mare decât zero.",
        ]);
      if (!form.elements.consent.checked)
        invalid.push([
          "consent",
          "Confirmă că ai citit informarea și dorești să deschizi mesajul în WhatsApp.",
        ]);
      if (invalid.length) {
        invalid.forEach(([name]) =>
          form.elements[name].setAttribute("aria-invalid", "true"),
        );
        formError.textContent = invalid[0][1];
        formError.hidden = false;
        form.elements[invalid[0][0]].focus();
        return;
      }
      const message = buildWhatsAppMessage(
        Object.fromEntries(new FormData(form)),
      );
      const url = buildWhatsAppURL(ARRA.company.phone, message);
      $("#whatsapp-result-link").href = url;
      $("#message-preview").textContent = message;
      $("#form-result").hidden = false;
      window.open(url, "_blank", "noopener,noreferrer");
    });
  })();

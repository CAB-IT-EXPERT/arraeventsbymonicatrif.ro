"use strict";

(() => {
  const mediaRoot = "assets/images/locations/";
  const photo = (file, title, description, category) => ({
    type: "image",
    src: `${mediaRoot}${file}-1600.webp`,
    thumb: `${mediaRoot}${file}-480.webp`,
    title,
    description,
    category,
  });
  const film = (src, poster, title, description, category) => ({
    type: "video",
    src,
    poster,
    thumb: poster,
    title,
    description,
    category,
  });

  const collections = {
    zona: [
      photo("zona-lacul-bolboci", "Lacul dintre brazi", "Un cadru montan amplu, pentru evenimente care respiră odată cu natura.", "ÎMPREJURIMI"),
      photo("zona-izvor-munte", "Apa și liniștea muntelui", "Peisajele din zonă completează firesc o celebrare departe de agitația orașului.", "ÎMPREJURIMI"),
      photo("zona-padure-lac", "Priveliște printre brazi", "Verde, lumină filtrată și lacul care apare dintre copaci.", "ÎMPREJURIMI"),
      photo("zona-poiana-eveniment", "Poiana pregătită pentru o poveste", "Un spațiu deschis, încadrat de pădure, gata să primească oamenii dragi.", "ATMOSFERĂ"),
    ],
    golf: [
      film(
        "assets/video/2026-01-14_DTfQlqzgg9I.mp4",
        "assets/posters/DTfQlqzgg9I.webp?v=20260916-panorama",
        "Tur panoramic al domeniului",
        "Descoperă spațiile, lumina și deschiderea către natură ale National Golf and Country Club.",
        "PREZENTARE VIDEO"
      ),
      {
        type: "image",
        src: "assets/images/the-green-preview.jpg",
        thumb: "assets/images/the-green-preview.jpg",
        title: "The Green Events",
        description: "O privire de ansamblu asupra experiențelor și spațiilor pregătite pentru evenimente.",
        category: "PREZENTAREA LOCAȚIEI",
      },
    ],
    laptici: [
      photo("laptici-cina-candelabre", "Cină sub candelabre", "O masă lungă, lumină caldă și pădurea care devine parte din decor.", "CINĂ ÎN NATURĂ"),
      film(
        "assets/video/locations/cabana-laptici-candelabre.mp4",
        `${mediaRoot}laptici-cina-candelabre-480.webp`,
        "Lumini printre brazi",
        "Candelabrele suspendate transformă seara într-un decor spectaculos și intim.",
        "FILM · ATMOSFERĂ"
      ),
      photo("laptici-masa-padure", "Masa care unește", "Un cadru generos pentru mese festive, cine private și seri petrecute sub cerul liber.", "RECEPȚIE ÎN AER LIBER"),
      photo("laptici-seara-poveste", "Seară de poveste", "Lumânări, cristale și reflexii aurii într-un decor natural.", "DECOR DE SEARĂ"),
      photo("laptici-gradina-festiva", "Grădina pregătită de sărbătoare", "O masă amplă, înconjurată de pădure, pentru oameni care vor să rămână aproape.", "EVENIMENT PRIVAT"),
      photo("laptici-candy-bar", "Dulce, atent așezat", "Candy barul devine parte din scenografie, nu doar un detaliu al meniului.", "CANDY BAR"),
      photo("laptici-fruit-bar", "Culoare și prospețime", "Un fruit bar luminos, integrat firesc în atmosfera cabanei.", "FRUIT BAR"),
      photo("laptici-poiana-flori", "Poiana înflorită", "Spațiul exterior prinde contur prin aranjamente florale calde și detalii naturale.", "SPAȚIU EXTERIOR"),
    ],
    padina: [
      photo("padina-receptie-romantica", "O seară în roșu", "Sala cabanei se transformă într-un decor romantic, intens și memorabil.", "PETRECERE TEMATICĂ"),
      photo("padina-masa-de-doi", "Masa de onoare", "Roșu, auriu și lumină caldă pentru un moment construit în jurul celor doi.", "CINĂ PRIVATĂ"),
      photo("padina-sala-panoramica", "Salonul pregătit pentru invitați", "Un spațiu cald și flexibil, amenajat în funcție de povestea evenimentului.", "SPAȚIU INTERIOR"),
      photo("padina-decor-rosu", "Decor cu personalitate", "Flori bogate, accente aurii și o paletă cromatică puternică.", "DESIGN DE EVENIMENT"),
      photo("padina-detalii-aurii", "Detalii care schimbă atmosfera", "Veselă aurie, flori roșii și reflexii atent dozate.", "STYLING DE MASĂ"),
      photo("padina-botez-bleu", "Un început în bleu", "Flori delicate și tonuri luminoase pentru o celebrare de familie.", "BOTEZ"),
      photo("padina-ceremonie", "Ceremonie cu flori pastel", "Decor floral în bleu și alb pentru un moment intim și senin.", "CEREMONIE"),
      film(
        "assets/video/locations/poarta-padina-cer.mp4",
        `${mediaRoot}zona-padure-lac-480.webp`,
        "Cerul de deasupra Padinei",
        "Un scurt moment de atmosferă din liniștea muntelui.",
        "FILM · ÎMPREJURIMI"
      ),
    ],
  };

  const dialog = document.querySelector("#location-media-dialog");
  if (!dialog) return;
  const modalImage = dialog.querySelector("[data-location-modal-image]");
  const modalVideo = dialog.querySelector("[data-location-modal-video]");
  const modalCategory = dialog.querySelector("[data-location-modal-category]");
  const modalTitle = dialog.querySelector("[data-location-modal-title]");
  const modalDescription = dialog.querySelector("[data-location-modal-description]");
  const modalCount = dialog.querySelector("[data-location-modal-count]");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let modalCollection = [];
  let modalIndex = 0;

  function renderModal() {
    const item = modalCollection[modalIndex];
    modalImage.hidden = item.type !== "image";
    modalVideo.hidden = item.type !== "video";
    modalVideo.pause();
    modalVideo.removeAttribute("src");
    if (item.type === "image") {
      modalImage.src = item.src;
      modalImage.alt = item.title;
    } else {
      modalVideo.poster = item.poster;
      modalVideo.src = item.src;
      modalVideo.load();
      modalVideo.play().catch(() => {});
    }
    modalCategory.textContent = item.category;
    modalTitle.textContent = item.title;
    modalDescription.textContent = item.description;
    modalCount.textContent = `${String(modalIndex + 1).padStart(2, "0")} / ${String(modalCollection.length).padStart(2, "0")}`;
  }

  function openModal(collection, index) {
    modalCollection = collection;
    modalIndex = (index + collection.length) % collection.length;
    renderModal();
    dialog.showModal();
    document.body.classList.add("locked");
  }

  function moveModal(step) {
    modalIndex = (modalIndex + step + modalCollection.length) % modalCollection.length;
    renderModal();
  }

  dialog.querySelector("[data-location-modal-prev]").addEventListener("click", () => moveModal(-1));
  dialog.querySelector("[data-location-modal-next]").addEventListener("click", () => moveModal(1));
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      moveModal(event.key === "ArrowRight" ? 1 : -1);
    }
  });
  dialog.addEventListener("close", () => {
    modalVideo.pause();
    modalVideo.removeAttribute("src");
    modalVideo.load();
  });

  document.querySelectorAll("[data-location-scene]").forEach((button) => {
    const index = Number(button.dataset.locationScene);
    const item = collections.zona[index];
    const image = button.querySelector("img");
    image.src = item.src;
    image.alt = item.title;
    button.setAttribute("aria-label", `Mărește imaginea: ${item.title}`);
    button.addEventListener("click", () => openModal(collections.zona, index));
  });

  document.querySelectorAll("[data-location-carousel]").forEach((carousel) => {
    const collection = collections[carousel.dataset.locationCarousel];
    const stage = carousel.querySelector("[data-location-stage]");
    const thumbs = carousel.querySelector("[data-location-thumbs]");
    const count = carousel.querySelector("[data-location-count]");
    const previous = carousel.querySelector("[data-location-prev]");
    const next = carousel.querySelector("[data-location-next]");
    let activeIndex = 0;
    let timer;
    let touchStart;

    thumbs.innerHTML = collection.map((item, index) => `
      <button type="button" data-location-thumb="${index}" aria-label="Arată: ${item.title}">
        <img src="${item.thumb}" alt="" loading="lazy" decoding="async">
        ${item.type === "video" ? '<span class="location-thumb-film">FILM</span>' : ""}
      </button>`).join("");

    function render() {
      const item = collection[activeIndex];
      const media = item.type === "video"
        ? `<video src="${item.src}" poster="${item.poster}" muted loop autoplay playsinline preload="metadata" aria-label="${item.title}"></video>`
        : `<img src="${item.src}" alt="${item.title}" decoding="async">`;
      stage.innerHTML = `
        <button type="button" class="location-stage-open" aria-label="Mărește: ${item.title}">
          ${media}
          <span class="location-stage-shade" aria-hidden="true"></span>
          <span class="location-stage-caption">
            <small>${item.category}</small>
            <strong>${item.title}</strong>
            <span>${item.description}</span>
          </span>
          <span class="location-expand" aria-hidden="true">↗</span>
        </button>`;
      stage.querySelector("button").addEventListener("click", () => openModal(collection, activeIndex));
      thumbs.querySelectorAll("button").forEach((button, index) => {
        button.classList.toggle("is-active", index === activeIndex);
        button.setAttribute("aria-current", index === activeIndex ? "true" : "false");
      });
      const activeThumb = thumbs.querySelector('[aria-current="true"]');
      if (activeThumb) {
        const left = activeThumb.offsetLeft - (thumbs.clientWidth - activeThumb.offsetWidth) / 2;
        thumbs.scrollTo({ left, behavior: reducedMotion.matches ? "auto" : "smooth" });
      }
      count.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(collection.length).padStart(2, "0")}`;
    }

    function restartTimer() {
      clearInterval(timer);
      if (reducedMotion.matches) return;
      timer = setInterval(() => {
        if (!document.hidden && !carousel.matches(":hover") && !carousel.matches(":focus-within")) {
          activeIndex = (activeIndex + 1) % collection.length;
          render();
        }
      }, 6500);
    }

    function move(step) {
      activeIndex = (activeIndex + step + collection.length) % collection.length;
      render();
      restartTimer();
    }

    previous.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    thumbs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-location-thumb]");
      if (!button) return;
      activeIndex = Number(button.dataset.locationThumb);
      render();
      restartTimer();
    });
    stage.addEventListener("touchstart", (event) => { touchStart = event.changedTouches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", (event) => {
      if (touchStart == null) return;
      const distance = event.changedTouches[0].clientX - touchStart;
      if (Math.abs(distance) > 55) move(distance < 0 ? 1 : -1);
      touchStart = null;
    }, { passive: true });
    render();
    restartTimer();
  });
})();

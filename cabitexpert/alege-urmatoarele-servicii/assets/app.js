(function () {
  'use strict';

  const config = window.CABIT_CONFIG;
  const apiUrl = 'api.php';
  const money = new Intl.NumberFormat('ro-RO', {maximumFractionDigits:0});
  const monthName = new Intl.DateTimeFormat('ro-RO', {month:'long', year:'numeric'});
  const clientId = sessionStorage.getItem('cabit-client-id') || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
  sessionStorage.setItem('cabit-client-id', clientId);

  const allStandardItems = config.categories.flatMap(category => category.bundles?.flatMap(bundle => bundle.items) || []);
  const allItems = [...allStandardItems, ...config.store.extras, ...config.automation.items];
  const items = Object.fromEntries(allItems.map(item => [item.id, item]));
  const choiceGroups = {};
  allItems.forEach(item => { if (item.choiceGroup) (choiceGroups[item.choiceGroup] ||= []).push(item.id); });

  const currentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  };
  const defaultState = () => ({
    version: config.version,
    clientName: 'ARRA Events by Monica Trif',
    startMonth: currentMonth(),
    selected: {},
    months: {},
    dates: {},
    startDates: {},
    storePackage: '',
    exportSections: [],
    notes: ''
  });
  let state = defaultState();
  let revision = 0;
  let saveTimer = null;
  let pollTimer = null;
  let saving = false;
  let loaded = false;

  const $ = selector => document.querySelector(selector);
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const lei = value => `${money.format(Math.round(value || 0))} lei`;
  const billingLabel = billing => billing === 'monthly' ? '/ lună' : billing === 'daily' ? '/ zi' : 'o singură dată';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || min));
  const packageById = id => config.store.packages.find(pack => pack.id === id);
  const itemPrice = item => item.dynamicPrice ? (packageById(state.storePackage)?.[item.dynamicPrice] || 0) : item.price;
  const selected = id => Boolean(state.selected[id]);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  function normalize(raw) {
    const next = defaultState();
    if (!raw || typeof raw !== 'object') return next;
    next.clientName = String(raw.clientName || next.clientName).slice(0,100);
    next.startMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(raw.startMonth || '') ? raw.startMonth : next.startMonth;
    next.notes = String(raw.notes || '').slice(0,1500);
    if (packageById(raw.storePackage)) next.storePackage = raw.storePackage;
    if (raw.selected && typeof raw.selected === 'object') {
      allItems.forEach(item => { if (raw.selected[item.id] === true) next.selected[item.id] = true; });
    }
    if (raw.months && typeof raw.months === 'object') {
      allItems.filter(item => item.billing === 'monthly').forEach(item => {
        if (next.selected[item.id]) next.months[item.id] = clamp(raw.months[item.id], item.minMonths || 1, 24);
      });
    }
    if (raw.dates && typeof raw.dates === 'object') {
      allItems.filter(item => item.billing === 'daily').forEach(item => {
        if (!next.selected[item.id]) return;
        const valid = Array.isArray(raw.dates[item.id]) ? raw.dates[item.id].filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date)).slice(0,366) : [];
        next.dates[item.id] = [...new Set(valid)].sort();
      });
    }
    if (raw.startDates && typeof raw.startDates === 'object') {
      [...allItems.map(item => item.id), 'store_package', 'exports'].forEach(id => {
        if (typeof raw.startDates[id] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.startDates[id])) next.startDates[id] = raw.startDates[id];
      });
    }
    const allowedExports = new Set(config.automation.exportSections.map(option => option.id));
    next.exportSections = Array.isArray(raw.exportSections) ? [...new Set(raw.exportSections.filter(id => allowedExports.has(id)))] : [];
    enforceDependencies(next, false);
    const fallbackDate = next.startMonth === currentMonth() ? today : `${next.startMonth}-01`;
    allItems.forEach(item => {
      if (next.selected[item.id] && item.billing !== 'daily') next.startDates[item.id] ||= fallbackDate;
      if (!next.selected[item.id]) delete next.startDates[item.id];
    });
    if (next.storePackage) next.startDates.store_package ||= fallbackDate;
    else delete next.startDates.store_package;
    if (next.exportSections.length) next.startDates.exports ||= fallbackDate;
    else delete next.startDates.exports;
    return next;
  }

  function enforceDependencies(target = state, notify = true) {
    if (target.selected.store_status && !target.selected.store_email) {
      target.selected.store_email = true;
      if (notify) toast('Am adăugat email-urile personalizate, necesare pentru notificările de status.');
    }
    if (target.selected.store_spv && !target.selected.store_billing) {
      target.selected.store_billing = true;
      if (notify) toast('Am adăugat programul de facturare, necesar pentru trimiterea în SPV.');
    }
    if (!target.selected.store_email && target.selected.store_status) delete target.selected.store_status;
    if (!target.selected.store_billing && target.selected.store_spv) delete target.selected.store_spv;
    if (!target.selected.seo_basic) delete target.selected.seo_basic_monitor;
  }

  function icon(name) {
    const paths = {
      compass:'<circle cx="12" cy="12" r="8"/><path d="m15 9-2 4-4 2 2-4 4-2Z"/>',
      target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="m15 9 5-5M16 4h4v4"/>',
      spark:'<path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>',
      pin:'<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
      bag:'<path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
      grid:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
      calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18"/>',
      repeat:'<path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3"/>',
      once:'<path d="M12 3v18M8 7h6a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h6"/>',
      chart:'<path d="M4 19V9m6 10V5m6 14v-7m4 7H2"/>',
      search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5M7 10h6m-3-3v6"/>',
      phone:'<path d="M7 3h3l1.2 5-2 1.3a16 16 0 0 0 5.5 5.5l1.3-2 5 1.2v3a4 4 0 0 1-4 4C9.3 21 3 14.7 3 7a4 4 0 0 1 4-4Z"/>',
      megaphone:'<path d="m4 13 1 5h3l-1-5m-3 0V8h4l10-4v13L8 13H4Z"/><path d="M18 8a3 3 0 0 1 0 5"/>',
      play:'<path d="m9 7 8 5-8 5V7Z"/><circle cx="12" cy="12" r="9"/>',
      mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
      invoice:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6m-6 4h6"/>',
      stock:'<path d="m4 8 8-4 8 4-8 4-8-4Z"/><path d="m4 8v8l8 4 8-4V8M12 12v8"/>',
      sheet:'<path d="M5 3h10l4 4v14H5V3Z"/><path d="M14 3v5h5M8 12h8m-8 4h8"/>',
      blog:'<path d="M4 5h16v14H4V5Z"/><path d="M8 9h8m-8 4h8m-8 3h5"/>',
      check:'<path d="m5 12 4 4L19 6"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.check}</svg>`;
  }

  function serviceIcon(id) {
    if (id === 'analytics_tools') return icon('chart');
    if (id.startsWith('seo_')) return icon('search');
    if (id.startsWith('google_call')) return icon('phone');
    if (id.startsWith('google_') || id.startsWith('shopping_')) return icon('target');
    if (id.startsWith('meta_')) return icon('megaphone');
    if (id.startsWith('tiktok_')) return icon('play');
    if (id === 'store_email' || id === 'store_newsletter' || id === 'store_status') return icon('mail');
    if (id === 'store_billing' || id === 'store_spv') return icon('invoice');
    if (id === 'store_stock') return icon('stock');
    if (id === 'excel_custom') return icon('sheet');
    if (id.startsWith('blog_')) return icon('blog');
    if (id.startsWith('store_')) return icon('bag');
    return icon('spark');
  }

  function renderNav() {
    $('#category-nav').innerHTML = config.categories.map((category, index) => `
      <a href="#category-${category.id}" class="${index === 0 ? 'active' : ''}" data-nav-category="${category.id}">
        ${icon(category.icon)}<span>${escapeHtml(category.nav)}</span>
      </a>`).join('');
  }

  function renderItem(item) {
    const isSelected = selected(item.id);
    const price = itemPrice(item);
    const disabled = item.parent && !selected(item.parent);
    const months = state.months[item.id] || item.defaultMonths || item.minMonths || 1;
    const dates = state.dates[item.id] || [];
    return `<article class="service-option ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}" data-option="${item.id}">
      <div class="option-main">
        <button class="switch" type="button" role="switch" aria-checked="${isSelected}" data-action="toggle" data-id="${item.id}" ${disabled ? 'disabled' : ''}><span></span></button>
        <div class="option-copy">
          <div class="option-title-line"><span class="service-glyph">${serviceIcon(item.id)}</span><h4>${escapeHtml(item.label)}</h4>${item.recommended ? '<span class="mini-badge">Recomandat</span>' : ''}</div>
          <div class="price-line"><strong>${item.pricePrefix ? `${item.pricePrefix} ` : ''}${lei(price)}</strong><span>${billingLabel(item.billing)}</span>${item.resultWindow ? `<small>rezultate estimate ${item.resultWindow}</small>` : ''}</div>
        </div>
        <button class="info-button" type="button" aria-label="Explicație pentru ${escapeHtml(item.label)}" aria-expanded="false" data-action="tooltip" data-tip="tip-${item.id}">i</button>
        <div class="tooltip" id="tip-${item.id}" role="tooltip">${escapeHtml(item.detail)}</div>
      </div>
      ${item.billing === 'monthly' && isSelected ? monthControl(item, months) : ''}
      ${item.billing === 'daily' && isSelected ? dateControl(item, dates) : ''}
      ${item.billing !== 'daily' && isSelected ? startDateControl(item.id) : ''}
    </article>`;
  }

  function monthControl(item, months) {
    const minimum = item.minMonths || 1;
    return `<div class="period-control">
      <div>${icon('repeat')}<span><strong>Câte luni?</strong><small>${minimum > 1 ? `Minimum ${minimum} luni conform ofertei` : 'Poți modifica perioada'}</small></span></div>
      <div class="stepper" aria-label="Număr luni pentru ${escapeHtml(item.label)}">
        <button type="button" data-action="month" data-id="${item.id}" data-delta="-1" aria-label="Scade o lună">−</button>
        <output>${months} ${months === 1 ? 'lună' : 'luni'}</output>
        <button type="button" data-action="month" data-id="${item.id}" data-delta="1" aria-label="Adaugă o lună">+</button>
      </div>
    </div>`;
  }

  function defaultStartDate() {
    const month = state.startMonth || currentMonth();
    return month === currentMonth() ? today : `${month}-01`;
  }

  function startDateControl(id, label = 'Data de începere') {
    const value = state.startDates[id] || defaultStartDate();
    return `<label class="start-date-control">${icon('calendar')}<span><strong>${label}</strong><small>Costul va fi inclus în luna acestei date.</small></span><input type="date" value="${value}" data-start-date="${id}" aria-label="${escapeHtml(label)}"></label>`;
  }

  function dateControl(item, dates) {
    return `<div class="date-control">
      <div class="date-heading">${icon('calendar')}<span><strong>Alege zilele dorite</strong><small>${dates.length ? `${dates.length} ${dates.length === 1 ? 'zi selectată' : 'zile selectate'} · ${lei(dates.length * item.price)}` : 'Selectează datele exacte din calendar'}</small></span></div>
      <div class="date-add"><input type="date" min="${today}" data-date-input="${item.id}" aria-label="Dată pentru ${escapeHtml(item.label)}"><button type="button" data-action="add-date" data-id="${item.id}">Adaugă ziua</button></div>
      ${dates.length ? `<div class="date-chips">${dates.map(date => `<button type="button" data-action="remove-date" data-id="${item.id}" data-date="${date}" title="Elimină ziua">${formatDate(date)} <span>×</span></button>`).join('')}</div>` : ''}
    </div>`;
  }

  function formatDate(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('ro-RO',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(year,month-1,day));
  }

  function renderCategory(category) {
    if (category.special === 'store') return renderStore(category);
    if (category.special === 'automation') return renderAutomation(category);
    return `<section class="category" id="category-${category.id}">
      <header class="category-heading"><div class="category-icon">${icon(category.icon)}</div><div><p>${category.eyebrow}</p><h2>${category.title}</h2><span>${category.description}</span></div></header>
      ${category.notice ? `<div class="category-notice"><b>Notă importantă</b><span>${category.notice}</span></div>` : ''}
      <div class="bundle-list">${category.bundles.map(bundle => `<section class="bundle"><header><div><h3>${bundle.title}</h3><p>${bundle.description}</p></div><span>${bundle.badge}</span></header><div class="option-list">${bundle.items.map(renderItem).join('')}</div></section>`).join('')}</div>
    </section>`;
  }

  function renderStore(category) {
    const pack = packageById(state.storePackage);
    const extrasDisabled = !pack;
    const discount = storeDiscountInfo();
    return `<section class="category" id="category-${category.id}">
      <header class="category-heading"><div class="category-icon">${icon(category.icon)}</div><div><p>${category.eyebrow}</p><h2>${category.title}</h2><span>${category.description}</span></div></header>
      <section class="bundle store-packages"><header><div><h3>1. Alege dimensiunea magazinului</h3><p>Poți selecta un singur pachet de bază.</p></div>${pack ? '<button class="text-button" type="button" data-action="clear-store">Elimină pachetul</button>' : '<span>Un singur pachet</span>'}</header>
        <div class="package-grid">${config.store.packages.map(option => `<button type="button" class="package-card ${state.storePackage === option.id ? 'selected' : ''}" data-action="store-package" data-id="${option.id}"><span class="package-check">${icon('check')}</span><span class="package-symbol">${icon('bag')}</span><small>MAGAZIN ONLINE</small><strong>${option.label}</strong><b>${lei(option.price)}</b><p>${option.detail}</p></button>`).join('')}</div>
        ${pack ? `<div class="package-start">${startDateControl('store_package','Data începerii magazinului')}</div>` : ''}
      </section>
      <section class="bundle ${extrasDisabled ? 'bundle-disabled' : ''}"><header><div><h3>2. Alege modulele suplimentare</h3><p>${extrasDisabled ? 'Selectează mai întâi un pachet de magazin.' : 'Modulele selectate pot activa automat discountul de 10% sau 15%.'}</p></div><span>${discount.count} subopțiuni</span></header>
        <div class="option-list">${config.store.extras.map(renderItem).join('')}</div>
        <div class="discount-progress ${discount.rate ? 'active' : ''}">
          <div class="discount-progress-copy"><span>Discount automat</span><strong>${discount.rate ? `Ai activat reducerea de ${discount.rate}%` : discount.nextMessage}</strong></div>
          <div class="discount-meter"><span style="width:${discount.progress}%"></span></div>
          <small>10%: minimum 3 subopțiuni și peste 350 lei · 15%: minimum 2 subopțiuni și peste 700 lei</small>
        </div>
      </section>
    </section>`;
  }

  function renderAutomation(category) {
    const exports = state.exportSections;
    const exportCost = Math.min(exports.length * 50, 200);
    return `<section class="category" id="category-${category.id}">
      <header class="category-heading"><div class="category-icon">${icon(category.icon)}</div><div><p>${category.eyebrow}</p><h2>${category.title}</h2><span>${category.description}</span></div></header>
      <section class="bundle"><header><div><h3>Automatizări și blog</h3><p>Alege funcționalitățile care îți reduc munca manuală.</p></div><span>Cost unic</span></header><div class="option-list">${config.automation.items.map(renderItem).join('')}</div></section>
      <section class="bundle export-bundle"><header><div><h3>Exporturi Excel &amp; PDF</h3><p>50 lei pentru fiecare secțiune, cu plafon automat de 200 lei pentru pachetul complet.</p></div><span>${exports.length ? lei(exportCost) : 'Neselectat'}</span></header>
        <div class="export-grid">${config.automation.exportSections.map(option => `<button type="button" class="export-chip ${exports.includes(option.id) ? 'selected' : ''}" data-action="export" data-id="${option.id}"><span>${icon('check')}</span>${option.label}</button>`).join('')}</div>
        ${exports.length >= 4 ? '<p class="export-cap">✓ Pachetul complet este activ: costul rămâne 200 lei indiferent de câte secțiuni mai alegi.</p>' : `<p class="export-cap muted">Mai alege ${4-exports.length} ${4-exports.length === 1 ? 'secțiune' : 'secțiuni'} pentru plafonul de 200 lei.</p>`}
        ${exports.length ? `<div class="package-start">${startDateControl('exports','Data începerii exporturilor')}</div>` : ''}
      </section>
    </section>`;
  }

  function renderCatalog() {
    $('#catalog').innerHTML = config.categories.map(renderCategory).join('');
    requestAnimationFrame(() => config.categories.forEach(category => {
      const node = document.getElementById(`category-${category.id}`);
      if (node) observer.observe(node);
    }));
  }

  function monthKeyAdd(start, offset) {
    const [year, month] = start.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
  }

  function dateAddMonths(startDate, offset) {
    const [year, month, day] = startDate.split('-').map(Number);
    const target = new Date(year, month - 1 + offset, 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    return `${target.getFullYear()}-${String(target.getMonth()+1).padStart(2,'0')}-${String(Math.min(day,lastDay)).padStart(2,'0')}`;
  }

  function monthLabel(key, index) {
    const [year, month] = key.split('-').map(Number);
    const label = monthName.format(new Date(year, month-1, 1));
    return `${index === 0 ? 'Luna 1' : `Luna ${index+1}`} · ${label.charAt(0).toUpperCase()+label.slice(1)}`;
  }

  function storeDiscountInfo(invoiceMonth = (state.startDates.store_package || defaultStartDate()).slice(0,7)) {
    const extras = config.store.extras.filter(item => selected(item.id) && (state.startDates[item.id] || defaultStartDate()).slice(0,7) === invoiceMonth);
    const sum = extras.reduce((total,item) => total + itemPrice(item),0);
    let rate = 0;
    if (extras.length >= 2 && sum > 700) rate = 15;
    else if (extras.length >= 3 && sum > 350) rate = 10;
    const progress10 = Math.min(100, Math.min(extras.length/3, sum/351) * 100);
    const progress15 = Math.min(100, Math.min(extras.length/2, sum/701) * 100);
    let nextMessage = 'Selectează subopțiuni pentru a activa reducerea';
    if (extras.length) {
      const missing10Count = Math.max(0,3-extras.length);
      const missing10Value = Math.max(0,351-sum);
      nextMessage = missing10Count ? `Încă ${missing10Count} ${missing10Count === 1 ? 'subopțiune' : 'subopțiuni'} pentru pragul de 10%` : `Încă ${lei(missing10Value)} în subopțiuni pentru pragul de 10%`;
    }
    return {count:extras.length,sum,rate,progress:Math.max(progress10,progress15),nextMessage};
  }

  function calculatePlan() {
    const lines = [];
    const schedule = new Map();
    const start = state.startMonth || currentMonth();
    const addCharge = (month, label, amount, meta={}) => {
      if (!schedule.has(month)) schedule.set(month,[]);
      schedule.get(month).push({label,amount,...meta});
    };
    for (const item of allItems) {
      if (!selected(item.id)) continue;
      const price = itemPrice(item);
      if (!price) continue;
      if (item.billing === 'once') {
        const serviceDate = state.startDates[item.id] || defaultStartDate();
        lines.push({id:item.id,label:item.label,total:price,meta:`${item.pricePrefix ? `${item.pricePrefix} · ` : ''}${formatDate(serviceDate)}`});
        addCharge(serviceDate.slice(0,7),`${item.label} · ${formatDate(serviceDate)}`,price);
      } else if (item.billing === 'monthly') {
        const months = state.months[item.id] || item.defaultMonths || item.minMonths || 1;
        const serviceDate = state.startDates[item.id] || defaultStartDate();
        lines.push({id:item.id,label:item.label,total:price*months,meta:`${months} ${months === 1 ? 'lună' : 'luni'} × ${lei(price)} · din ${formatDate(serviceDate)}`});
        for (let offset=0; offset<months; offset++) {
          const dueDate = dateAddMonths(serviceDate,offset);
          addCharge(dueDate.slice(0,7),`${item.label} · ${formatDate(dueDate)}`,price,{recurring:true});
        }
      } else if (item.billing === 'daily') {
        const dates = state.dates[item.id] || [];
        if (dates.length) {
          lines.push({id:item.id,label:item.label,total:price*dates.length,meta:`${dates.length} ${dates.length === 1 ? 'zi' : 'zile'} × ${lei(price)}`});
          dates.forEach(date => addCharge(date.slice(0,7),`${item.label} · ${formatDate(date)}`,price,{daily:true}));
        } else {
          lines.push({id:item.id,label:item.label,total:0,meta:'Nicio zi selectată',pending:true});
        }
      }
    }
    const pack = packageById(state.storePackage);
    if (pack) {
      const serviceDate = state.startDates.store_package || defaultStartDate();
      lines.push({id:pack.id,label:`Magazin online · ${pack.label}`,total:pack.price,meta:`pachet de bază · ${formatDate(serviceDate)}`});
      addCharge(serviceDate.slice(0,7),`Magazin online · ${pack.label} · ${formatDate(serviceDate)}`,pack.price);
    }
    if (state.exportSections.length) {
      const exportTotal = Math.min(state.exportSections.length*50,200);
      const serviceDate = state.startDates.exports || defaultStartDate();
      lines.push({id:'exports',label:'Exporturi Excel & PDF',total:exportTotal,meta:`${state.exportSections.length >= 4 ? 'pachet complet' : `${state.exportSections.length} × 50 lei`} · ${formatDate(serviceDate)}`});
      addCharge(serviceDate.slice(0,7),`Exporturi Excel & PDF · ${formatDate(serviceDate)}`,exportTotal);
    }
    const gross = lines.reduce((sum,line) => sum + line.total,0);
    const storeMonth = (state.startDates.store_package || defaultStartDate()).slice(0,7);
    const discountInfo = storeDiscountInfo(storeMonth);
    let discount = 0;
    if (pack && discountInfo.rate) {
      const firstInvoice = (schedule.get(storeMonth) || []).reduce((sum,charge)=>sum+charge.amount,0);
      discount = Math.round(firstInvoice * discountInfo.rate / 100);
      addCharge(storeMonth,`Discount magazin ${discountInfo.rate}%`,-discount,{discount:true});
    }
    const chargeMonths = [...schedule.keys()].sort();
    const firstMonth = chargeMonths.length ? [start,chargeMonths[0]].sort()[0] : start;
    const lastMonth = chargeMonths.length ? chargeMonths.at(-1) : start;
    const [firstYear,firstNumber] = firstMonth.split('-').map(Number);
    const [lastYear,lastNumber] = lastMonth.split('-').map(Number);
    const distance = Math.max(0,Math.min(120,(lastYear-firstYear)*12+(lastNumber-firstNumber)));
    const sortedMonths = chargeMonths.length ? Array.from({length:distance+1},(_,index)=>monthKeyAdd(firstMonth,index)).map((key,index) => {
      const charges=schedule.get(key) || []; return {key,label:monthLabel(key,index),charges,total:charges.reduce((sum,c)=>sum+c.amount,0)};
    }) : [];
    return {lines, months:sortedMonths, gross, discount, total:gross-discount, discountInfo, storeMonth};
  }

  function recommendations() {
    const chosenIds = Object.keys(state.selected).filter(id => state.selected[id]);
    const needsMeasurement = chosenIds.some(id => /^(seo_|google_|shopping_|meta_|tiktok_)/.test(id));
    const catalogChosen = chosenIds.some(id => /^(shopping_|meta_catalog|tiktok_catalog)/.test(id));
    const notes = [];
    if (needsMeasurement && !selected('analytics_tools')) notes.push('Instrumentele Analytics + Search Console sunt necesare înainte de SEO și campanii.');
    if (catalogChosen && !state.storePackage) notes.push('Campaniile de catalog și Shopping au nevoie de un magazin și catalog de produse compatibil.');
    return notes;
  }

  function renderSummary() {
    const plan = calculatePlan();
    $('#grand-total').textContent = lei(plan.total);
    $('#mobile-total-value').textContent = lei(plan.total);
    $('#total-caption').textContent = plan.lines.length ? `${plan.lines.length} ${plan.lines.length === 1 ? 'opțiune selectată' : 'opțiuni selectate'}${plan.discount ? ` · economisești ${lei(plan.discount)}` : ''}` : 'Nu ai selectat încă servicii';
    $('#selected-count').textContent = `${plan.lines.length} ${plan.lines.length === 1 ? 'opțiune' : 'opțiuni'}`;
    const warnings = recommendations();
    $('#selected-list').innerHTML = `${warnings.map(text => `<div class="smart-warning"><span>!</span><p>${escapeHtml(text)}</p></div>`).join('')}${plan.lines.length ? plan.lines.map(line => `<div class="selected-line ${line.pending ? 'pending' : ''}"><div><strong>${escapeHtml(line.label)}</strong><small>${escapeHtml(line.meta)}</small></div><b>${lei(line.total)}</b></div>`).join('') : '<p class="empty-state">Alegerile tale vor apărea aici.</p>'}`;
    $('#monthly-plan').innerHTML = plan.months.length ? plan.months.map((month,index) => `<details class="month-card" ${index===0?'open':''}><summary><span><small>${escapeHtml(month.label)}</small><strong>${lei(month.total)}</strong></span><b>+</b></summary><div>${month.charges.map(charge => `<p class="${charge.discount?'discount-line':''}"><span>${escapeHtml(charge.label)}</span><strong>${charge.amount < 0 ? '−' : ''}${lei(Math.abs(charge.amount))}</strong></p>`).join('')}</div></details>`).join('') : '<p class="empty-state">Selectează un serviciu pentru a vedea planul.</p>';
    const discountCard = $('#discount-card');
    discountCard.hidden = !plan.discount;
    if (plan.discount) {
      $('#discount-badge').textContent = `−${plan.discountInfo.rate}%`;
      const [discountYear,discountMonth] = plan.storeMonth.split('-').map(Number);
      const discountMonthLabel = monthName.format(new Date(discountYear,discountMonth-1,1));
      $('#discount-copy').textContent = `${lei(plan.discount)} reducere în factura din ${discountMonthLabel}`;
    }
  }

  function renderAll() {
    renderCatalog();
    renderSummary();
    $('#client-name').value = state.clientName;
    $('#start-month').value = state.startMonth;
    $('#selection-notes').value = state.notes;
  }

  function setSaveState(mode, label) {
    const node = $('#save-state');
    node.className = `save-state ${mode || ''}`;
    $('#save-label').textContent = label;
  }

  function toast(message) {
    const node = $('#toast');
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(node.timer);
    node.timer = setTimeout(()=>node.classList.remove('show'),3200);
  }

  function persistLocal() {
    try { localStorage.setItem('cabit-configurator-state',JSON.stringify(state)); } catch {}
  }

  function scheduleSave() {
    persistLocal();
    clearTimeout(saveTimer);
    setSaveState('pending','Se salvează…');
    saveTimer = setTimeout(saveToServer,420);
  }

  async function saveToServer() {
    if (saving) { scheduleSave(); return; }
    saving = true;
    try {
      const response = await fetch(apiUrl,{method:'POST',headers:{'Content-Type':'application/json','X-Requested-With':'ARRA-Configurator'},body:JSON.stringify({clientId,baseRevision:revision,state}),cache:'no-store'});
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Salvarea nu a reușit');
      revision = data.revision;
      setSaveState('saved',`Salvat automat · ${new Date(data.updatedAt).toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'})}`);
    } catch (error) {
      setSaveState('offline','Salvat doar pe acest dispozitiv');
      console.error(error);
    } finally { saving=false; }
  }

  async function loadFromServer() {
    try {
      const response=await fetch(`${apiUrl}?t=${Date.now()}`,{cache:'no-store',headers:{'X-Requested-With':'ARRA-Configurator'}});
      const data=await response.json();
      if(!response.ok||!data.ok) throw new Error(data.error||'Conectarea nu a reușit');
      revision=data.revision||0;
      if(data.state) state=normalize(data.state);
      else {
        const local=localStorage.getItem('cabit-configurator-state');
        if(local) state=normalize(JSON.parse(local));
      }
      setSaveState('saved',revision?`Salvat automat · ${new Date(data.updatedAt).toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'})}`:'Pregătit pentru selecție');
    } catch(error) {
      try { const local=localStorage.getItem('cabit-configurator-state'); if(local) state=normalize(JSON.parse(local)); } catch {}
      setSaveState('offline','Mod local · reconectare automată');
    }
    loaded=true; renderAll(); startPolling();
  }

  function startPolling() {
    clearInterval(pollTimer);
    pollTimer=setInterval(async()=>{
      if(saving||document.hidden) return;
      try {
        const response=await fetch(`${apiUrl}?since=${revision}&t=${Date.now()}`,{cache:'no-store',headers:{'X-Requested-With':'ARRA-Configurator'}});
        const data=await response.json();
        if(data.ok&&data.revision>revision&&data.updatedBy!==clientId){
          revision=data.revision; state=normalize(data.state); persistLocal(); renderAll();
          setSaveState('synced','Actualizat de pe alt dispozitiv');
          toast('Selecția a fost actualizată în timp real.');
        }
      } catch {}
    },2200);
  }

  function toggleItem(id) {
    const item=items[id]; if(!item) return;
    const turnOn=!selected(id);
    if(item.parent&&!selected(item.parent)){toast('Selectează mai întâi serviciul principal.');return;}
    if(id.startsWith('store_')&&!state.storePackage){toast('Selectează mai întâi dimensiunea magazinului.');return;}
    if(turnOn&&item.choiceGroup){
      (choiceGroups[item.choiceGroup]||[]).forEach(other=>{
        if(other===id)return;
        delete state.selected[other];
        delete state.months[other];
        delete state.dates[other];
        delete state.startDates[other];
      });
    }
    if(turnOn){state.selected[id]=true;if(item.billing==='monthly')state.months[id]=item.defaultMonths||item.minMonths||1;if(item.billing==='daily')state.dates[id]||=[];else state.startDates[id]||=defaultStartDate();}
    else {delete state.selected[id];delete state.months[id];delete state.dates[id];delete state.startDates[id];if(id==='seo_basic')delete state.selected.seo_basic_monitor;if(id==='store_email')delete state.selected.store_status;if(id==='store_billing')delete state.selected.store_spv;}
    enforceDependencies(state,turnOn);
    allItems.forEach(option=>{if(selected(option.id)&&option.billing!=='daily')state.startDates[option.id]||=defaultStartDate();});
    renderCatalog(); renderSummary(); scheduleSave();
  }

  document.addEventListener('click', event => {
    const button=event.target.closest('[data-action]'); if(!button) return;
    const {action,id}=button.dataset;
    if(action==='toggle') toggleItem(id);
    if(action==='tooltip') {
      const tooltip=document.getElementById(button.dataset.tip); const open=button.getAttribute('aria-expanded')==='true';
      document.querySelectorAll('.info-button[aria-expanded="true"]').forEach(other=>{other.setAttribute('aria-expanded','false');document.getElementById(other.dataset.tip)?.classList.remove('open');});
      button.setAttribute('aria-expanded',String(!open)); tooltip?.classList.toggle('open',!open);
    }
    if(action==='month') {
      const item=items[id], current=state.months[id]||item.minMonths||1;
      state.months[id]=clamp(current+Number(button.dataset.delta),item.minMonths||1,24);renderCatalog();renderSummary();scheduleSave();
    }
    if(action==='add-date') {
      const input=document.querySelector(`[data-date-input="${id}"]`); if(!input?.value){toast('Alege mai întâi o dată din calendar.');return;}
      state.dates[id]=[...new Set([...(state.dates[id]||[]),input.value])].sort();renderCatalog();renderSummary();scheduleSave();
    }
    if(action==='remove-date') {state.dates[id]=(state.dates[id]||[]).filter(date=>date!==button.dataset.date);renderCatalog();renderSummary();scheduleSave();}
    if(action==='store-package') {state.storePackage=id;state.startDates.store_package||=defaultStartDate();renderCatalog();renderSummary();scheduleSave();}
    if(action==='clear-store') {state.storePackage='';delete state.startDates.store_package;config.store.extras.forEach(item=>{delete state.selected[item.id];delete state.startDates[item.id];});renderCatalog();renderSummary();scheduleSave();}
    if(action==='export') {state.exportSections=state.exportSections.includes(id)?state.exportSections.filter(value=>value!==id):[...state.exportSections,id];if(state.exportSections.length)state.startDates.exports||=defaultStartDate();else delete state.startDates.exports;renderCatalog();renderSummary();scheduleSave();}
  });

  document.addEventListener('change',event=>{
    const input=event.target.closest('[data-start-date]'); if(!input) return;
    if(input.value) state.startDates[input.dataset.startDate]=input.value; else delete state.startDates[input.dataset.startDate];
    renderCatalog();renderSummary();scheduleSave();
  });

  $('#client-name').addEventListener('input',event=>{state.clientName=event.target.value.slice(0,100);scheduleSave();});
  $('#start-month').addEventListener('change',event=>{state.startMonth=event.target.value||currentMonth();renderSummary();scheduleSave();});
  $('#selection-notes').addEventListener('input',event=>{state.notes=event.target.value.slice(0,1500);scheduleSave();});
  $('#reset-selection').addEventListener('click',()=>{
    if(!window.confirm('Resetezi toate serviciile, datele și observațiile selectate?'))return;
    state=defaultState();
    renderAll();
    scheduleSave();
    toast('Selecția a fost resetată și se salvează automat.');
  });
  $('#mobile-total').addEventListener('click',()=>$('#summary').scrollIntoView({behavior:'smooth',block:'start'}));
  document.addEventListener('click',event=>{if(!event.target.closest('.info-button,.tooltip'))document.querySelectorAll('.tooltip.open').forEach(t=>{t.classList.remove('open');document.querySelector(`[data-tip="${t.id}"]`)?.setAttribute('aria-expanded','false');});});

  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){document.querySelectorAll('[data-nav-category]').forEach(link=>link.classList.toggle('active',link.dataset.navCategory===entry.target.id.replace('category-','')));}}),{rootMargin:'-20% 0px -70%'});

  renderNav(); renderAll();
  loadFromServer();

  window.CABIT_CALCULATOR={calculatePlan,normalize,storeDiscountInfo};
})();

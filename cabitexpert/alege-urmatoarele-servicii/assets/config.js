(function () {
  const item = (id, label, price, billing, detail, extra = {}) => ({id, label, price, billing, detail, ...extra});

  window.CABIT_CONFIG = {
    version: 1,
    currency: 'RON',
    categories: [
      {
        id: 'foundation',
        nav: 'Fundație & SEO',
        icon: 'compass',
        eyebrow: '01 · FUNDAȚIA DIGITALĂ',
        title: 'Măsurare și creștere organică',
        description: 'Începem prin a măsura corect, apoi alegem nivelul de optimizare potrivit.',
        bundles: [
          {
            id: 'measurement',
            title: 'Instrumente de măsurare',
            badge: 'Recomandat la început',
            description: 'Baza necesară pentru a urmări traficul și rezultatele campaniilor.',
            items: [
              item('analytics_tools', 'Google Analytics + Search Console + cont Google', 250, 'once', 'Configurare unică pentru măsurare, indexare și conectarea website-ului. Este necesară înainte de SEO sau campanii plătite.', {recommended:true})
            ]
          },
          {
            id: 'seo',
            title: 'SEO — alege nivelul',
            badge: 'Rezultate în timp',
            description: 'Pachetele SEO sunt alternative: poți selecta un singur nivel de lucru.',
            items: [
              item('seo_basic', 'Implementare SEO Basic', 650, 'once', 'Optimizare tehnică de bază, meta titluri, meta descrieri și structurarea informațiilor pentru Google.', {choiceGroup:'seo-plan', resultWindow:'8–12 luni'}),
              item('seo_basic_monitor', 'Monitorizare SEO Basic — 15 zile', 200, 'once', 'Urmărim preluarea modificărilor, erorile evidente și funcționarea corectă a instrumentelor.', {parent:'seo_basic', recommended:true}),
              item('seo_advanced', 'SEO Advanced', 1300, 'monthly', 'SEO tehnic și on-page, keyword research, strategie de conținut, link building standard și optimizări continue.', {choiceGroup:'seo-plan', minMonths:3, defaultMonths:3, resultWindow:'6–8 luni'}),
              item('seo_pro', 'SEO PRO', 2200, 'monthly', 'Nivelul complet: SEO tehnic, on-page și off-page, backlinks, strategie avansată și monitorizare continuă.', {choiceGroup:'seo-plan', minMonths:2, defaultMonths:2, resultWindow:'3–6 luni'})
            ]
          }
        ]
      },
      {
        id: 'google',
        nav: 'Google Ads',
        icon: 'target',
        eyebrow: '02 · GOOGLE ADS',
        title: 'Campanii pentru cerere activă',
        description: 'Fiecare tip de campanie are costuri separate de inițializare, mentenanță, monitorizare și conversii.',
        notice: 'Bugetul efectiv cheltuit în Google Ads este separat și nu intră în totalul de mai jos.',
        bundles: [
          {
            id: 'google-search', title: 'Google Search', badge: 'Servicii & căutări', description: 'Pentru persoanele care caută activ servicii relevante în Google.', budgetNotice: 'Costurile serviciilor CAB-IT Expert sunt separate de bugetul alocat reclamelor Google Ads.',
            items: [
              item('google_search_setup', 'Inițializare campanie', 450, 'once', 'Structură, grupuri de reclame, targetare, cuvinte-cheie, reclame și lansare.'),
              item('google_search_maintenance', 'Mentenanță campanie', 450, 'monthly', 'Administrare recurentă, optimizarea reclamelor și a cuvintelor-cheie.', {minMonths:1,defaultMonths:1}),
              item('google_search_daily', 'Monitorizare zilnică + optimizare', 20, 'daily', 'Alegi exact zilele în care verificăm costurile, clickurile, conversiile și ajustăm performanța.'),
              item('google_search_conversions', 'Implementare conversii', 250, 'once', 'Măsurarea apelurilor, clickurilor WhatsApp, formularelor sau solicitărilor de ofertă.')
            ]
          },
          {
            id: 'google-shopping', title: 'Google Shopping', badge: 'Pentru produse', description: 'Reclame pentru produse; necesită magazin online și un catalog eligibil.', budgetNotice: 'Costurile serviciilor CAB-IT Expert sunt separate de bugetul alocat reclamelor Google Ads.',
            items: [
              item('shopping_setup', 'Inițializare campanie', 450, 'once', 'Crearea și configurarea inițială a campaniei Shopping.'),
              item('shopping_maintenance', 'Mentenanță', 450, 'monthly', 'Administrarea și optimizarea recurentă a campaniei.', {minMonths:1,defaultMonths:1}),
              item('shopping_daily', 'Monitorizare zilnică + optimizare', 15, 'daily', 'Selectezi datele exacte pentru monitorizarea performanței produselor.'),
              item('shopping_conversions', 'Conversii pentru achiziții', 300, 'once', 'Urmărirea comenzilor, valorii comenzilor și performanței produselor.')
            ]
          },
          {
            id: 'google-call', title: 'Campanie pentru apeluri', badge: 'Contact rapid', description: 'Campanie orientată către persoane care vor să contacteze rapid afacerea prin telefon.', budgetNotice: 'Costurile serviciilor CAB-IT Expert sunt separate de bugetul alocat reclamelor Google Ads.',
            items: [
              item('google_call_setup', 'Inițializare campanie', 250, 'once', 'Configurarea campaniei orientate spre apeluri.'),
              item('google_call_maintenance', 'Mentenanță', 350, 'monthly', 'Administrare și optimizare lunară.', {minMonths:1,defaultMonths:1}),
              item('google_call_daily', 'Monitorizare zilnică + optimizare', 15, 'daily', 'Alegi datele în care campania este urmărită și ajustată.'),
              item('google_call_conversions', 'Implementare conversii', 250, 'once', 'Necesară la creare pentru măsurarea apelurilor și clickurilor pe numărul de telefon.', {recommended:true})
            ]
          }
        ]
      },
      {
        id: 'social',
        nav: 'Meta & TikTok',
        icon: 'spark',
        eyebrow: '03 · SOCIAL ADS',
        title: 'Vizibilitate prin conținut vizual',
        description: 'Promovare în Facebook, Instagram și TikTok, pentru postări sau cataloage de produse.',
        notice: 'Bugetele plătite către Meta și TikTok sunt separate de serviciile CAB-IT Expert.',
        bundles: [
          {
            id:'meta-post', title:'Meta — promovare postare', badge:'Facebook + Instagram', description:'Pentru servicii, evenimente, postări, oferte sau branding.', budgetNotice:'Costurile serviciilor CAB-IT Expert sunt separate de bugetul alocat reclamelor Meta Ads pe Facebook și Instagram.',
            items:[
              item('meta_post_setup','Creare campanie',400,'once','Configurarea campaniei, obiectivului, audienței și plasamentelor.'),
              item('meta_post_monitor','Monitorizare campanie',200,'once','Urmărirea campaniei și ajustări de bază pe durata stabilită.'),
              item('meta_post_daily','Monitorizare zilnică + optimizare',10,'daily','Alegi datele exacte în care analizăm și optimizăm performanța.')
            ]
          },
          {
            id:'meta-catalog', title:'Meta — catalog de produse', badge:'E-commerce', description:'Reclame dinamice pentru produse dintr-un catalog compatibil.', budgetNotice:'Costurile serviciilor CAB-IT Expert sunt separate de bugetul alocat reclamelor Meta Ads pe Facebook și Instagram.',
            items:[
              item('meta_catalog_setup','Creare campanie catalog',650,'once','Configurarea campaniei pentru catalog și a structurii necesare; conversiile sunt incluse.'),
              item('meta_catalog_monitor','Monitorizare campanie',350,'once','Urmărirea rezultatelor catalogului.'),
              item('meta_catalog_daily','Monitorizare zilnică + optimizare',15,'daily','Alegi zilele în care campania este analizată și optimizată.')
            ]
          },
          {
            id:'tiktok-post', title:'TikTok — promovare postare', badge:'Video', description:'Promovarea conținutului video pentru vizibilitate, trafic sau contacte.', budgetNotice:'Costurile serviciilor CAB-IT Expert sunt separate de bugetul alocat reclamelor TikTok Ads.',
            items:[
              item('tiktok_post_setup','Creare campanie',200,'once','Configurarea campaniei și a obiectivului potrivit.'),
              item('tiktok_post_monitor','Monitorizare campanie',100,'once','Urmărirea campaniei pe perioada stabilită.'),
              item('tiktok_post_daily','Monitorizare zilnică + optimizare',10,'daily','Selectezi datele exacte pentru optimizare.')
            ]
          },
          {
            id:'tiktok-catalog', title:'TikTok — catalog de produse', badge:'E-commerce', description:'Pentru produse sincronizate și conversii urmărite corect.', budgetNotice:'Costurile serviciilor CAB-IT Expert sunt separate de bugetul alocat reclamelor TikTok Ads.',
            items:[
              item('tiktok_catalog_setup','Creare campanie catalog',650,'once','Configurarea campaniei, catalogului și conversiilor.'),
              item('tiktok_catalog_monitor','Monitorizare campanie',350,'once','Urmărirea campaniei de catalog.'),
              item('tiktok_catalog_daily','Monitorizare zilnică + optimizare',15,'daily','Alegi zilele în care performanța este verificată și ajustată.')
            ]
          }
        ]
      },
      {
        id:'presence', nav:'Google Business', icon:'pin', eyebrow:'04 · PREZENȚĂ LOCALĂ', title:'Compania, mai ușor de găsit', description:'O prezență clară în Google Search și Google Maps.',
        bundles:[
          {id:'google-business',title:'Google Business Profile',badge:'Cost unic',description:'Creare sau configurare inițială a profilului companiei.',items:[
            item('google_business','Creare și configurare profil',350,'once','Date firmă, telefon, website, zonă deservită, program, servicii, descriere și categorii.')
          ]}
        ]
      },
      {
        id:'store', nav:'Magazin online', icon:'bag', eyebrow:'05 · MAGAZIN ONLINE', title:'Magazin și automatizări comerciale', description:'Alege mai întâi dimensiunea catalogului, apoi modulele care simplifică administrarea.', special:'store'
      },
      {
        id:'automation', nav:'Automatizări', icon:'grid', eyebrow:'06 · AUTOMATIZĂRI', title:'Excel, exporturi și blog', description:'Instrumente construite pentru evidență, administrare și conținut.', special:'automation'
      }
    ],
    store: {
      packages: [
        {id:'store_100', label:'0–100 produse', price:1400, uiPrice:200, detail:'Catalog compact, potrivit pentru lansare.'},
        {id:'store_500', label:'100–500 produse', price:1900, uiPrice:230, detail:'Catalog mediu, cu organizare mai amplă.'},
        {id:'store_1000', label:'500–1.000 produse', price:2800, uiPrice:260, detail:'Volum mare de produse și administrare.'},
        {id:'store_plus', label:'Peste 1.000 produse', price:3500, uiPrice:300, detail:'Catalog extins; particularitățile se validează înainte.'}
      ],
      extras: [
        item('store_ui','UI/UX + animații ultra-moderne',0,'once','Aspect premium, tranziții rafinate și o experiență modernă. Prețul depinde de pachet.',{recommended:true,dynamicPrice:'uiPrice'}),
        item('store_email','Email-uri personalizate către client',150,'once','Confirmări de comandă și alte notificări automate.',{recommended:true}),
        item('store_newsletter','Newsletter',100,'once','Mecanism pentru abonați, noutăți, articole și produse.',{recommended:true}),
        item('store_status','Gestionarea statusurilor comenzilor',150,'once','Statusuri precum Nouă, În procesare, Expediată, Livrată sau Anulată.',{requires:'store_email'}),
        item('store_billing','Program de facturare',500,'once','Emiterea și gestionarea facturilor în fluxul magazinului.',{recommended:true}),
        item('store_stock','Program de gestionare a stocurilor',500,'once','Evidența cantităților și corelarea produselor cu disponibilitatea.',{recommended:true}),
        item('store_spv','Trimiterea facturilor emise în SPV',600,'once','Transmiterea facturilor către Spațiul Privat Virtual.',{requires:'store_billing'})
      ]
    },
    automation: {
      items: [
        item('excel_custom','Program Excel automatizat',250,'once','Preț orientativ de pornire. Costul final depinde de foi, formule, automatizări, rapoarte, filtre și dashboard-uri.',{pricePrefix:'de la'}),
        item('blog_standard','Blog + administrare articole',500,'once','Implementarea blogului și a sistemului de administrare.',{choiceGroup:'blog-plan'}),
        item('blog_seo','Blog + optimizare SEO',600,'once','Blog, administrare și structură pregătită pentru o prezentare mai bună în Google.',{choiceGroup:'blog-plan'})
      ],
      exportSections: [
        {id:'stock',label:'Stoc'}, {id:'invoices',label:'Facturi'}, {id:'nir',label:'NIR-uri'}, {id:'orders',label:'Comenzi'},
        {id:'clients',label:'Clienți'}, {id:'subscribers',label:'Abonați'}, {id:'products',label:'Produse'}, {id:'other',label:'Altele'}
      ]
    }
  };
})();

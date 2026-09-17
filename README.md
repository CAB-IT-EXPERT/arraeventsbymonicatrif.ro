# ARRA Events by Monica Trif

Website static pentru Apache: HTML, CSS și JavaScript simplu. Nu necesită Node.js, PHP, baze de date sau instalarea unor pachete pe server. Toate fotografiile, videoclipurile și fonturile sunt locale.

## Previzualizare locală

Din acest director, cu Node.js instalat:

```powershell
node scripts/preview.cjs
```

Deschide `http://127.0.0.1:4173/`. Acesta este doar serverul de dezvoltare, nu o componentă de producție.

## Instalare pe Apache

1. Fă o copie de siguranță a website-ului existent, dacă există.
2. Dezarhivează **ARRA-website-Apache.zip** în rădăcina domeniului, de exemplu `public_html` sau `htdocs`. Fișierul `index.html` trebuie să fie direct în această rădăcină, nu într-un subfolder suplimentar.
3. Încarcă și fișierul ascuns `.htaccess`. Arhiva conține numai paginile publice, resursele și fișierele SEO/configurare; nu include arhiva originală Instagram, fotografiile originale, testele sau scripturile de lucru.
4. Activează certificatul HTTPS pentru `arraeventsbymonicatrif.ro` și `www.arraeventsbymonicatrif.ro`. Domeniul canonic este varianta fără www, pe HTTPS.
5. Apache 2.4 trebuie să permită regulile din `.htaccess` (`AllowOverride` corespunzător). Compresia, cache-ul și redirectările se activează dacă modulele aferente sunt disponibile. Dacă hostingul raportează 500, verifică jurnalul Apache și permisiunile directivelor; nu dezactiva aleator securitatea serverului.
6. Verifică pe domeniul public: pagina principală, `confidentialitate.html`, o adresă inexistentă (404), redarea/derularea videoclipurilor, linkurile sociale și deschiderea mesajului WhatsApp. Verifică redirectările HTTPS/www, MIME-urile și răspunsurile HTTP 206 pentru video.

Website-ul este pregătit pentru rădăcina domeniului, nu pentru publicare într-un subdirector. Configurația Apache și certificatul trebuie verificate pe hostingul real; previzualizarea locală nu execută `.htaccess`.

## Conținut inclus

- 31 de fotografii din selecția furnizată, fiecare cu titlu, descriere și text alternativ. Imagini WebP în trei variante, fără mărire artificială a originalului.
- 11 videoclipuri selectate, inclusiv cele două filme principale `DcbaYvDiBdO` și `DcibFTkCu5D` la 1080 × 1920. Redarea inline și modalul folosesc aceleași fișiere de calitate integrală. Filmul panoramic `DTfQlqzgg9I` este 1280 × 576 după eliminarea benzilor negre; originalul este păstrat în arhiva locală. Filmele verticale își păstrează proporțiile 9:16, fără decupare.
- Galerie filtrabilă, încărcare progresivă, vizualizare mare, navigare cu săgeți/tastatură și gest orizontal pe fotografia din galerie.
- Filme principale cu redare/pauză/sunet, modal video cu controale native, reels orizontale și redare automată limitată la elementele vizibile.
- Design responsive, animații discrete la scroll, preferință de mișcare redusă respectată, navigare de la tastatură și link pentru salt la conținut.
- După hero și introducere, testimonialele apar înainte de poveste pentru vizibilitate crescută. Urmează valorile, serviciile, filmele, filosofia, procesul, portofoliul, reels, diferențiatorii și contactul. Meniurile desktop și mobil respectă noua ordine.
- Instagram: `https://www.instagram.com/arraeventsbymonicatrif/`, reconfirmat explicit de utilizator la 16 septembrie 2026, în linkuri, contact și datele structurate. Adresa istorică `arra.eventplanner` nu este folosită pe site. Facebook și TikTok păstrează adresele furnizate. Blocul „Datele companiei”, IBAN și SWIFT au fost eliminate la cererea utilizatorului.

## Ajustări de design și interacțiune

- Hero cu imaginea generată a mesei lungi (`hero-editorial.webp`), selectată explicit de utilizator la 17 septembrie 2026. Text în stânga pe desktop și deasupra imaginii pe telefon. Motto-ul are ornamente florale simetrice și text centrat inclusiv pe tabletă.
- Logo inițial 116 px pe desktop / 84 px pe telefon, redus la 64 / 52 px la scroll, cu spațiu în antet și intensificarea auriului prin CSS. Deschidere în două panouri, o singură dată per sesiune, maximum 1,9 secunde; se poate sări prin atingere, scroll, Escape, Tab sau buton. Este dezactivată pentru mișcare redusă și linkuri către secțiuni.
- Povestea completă despre Monica și ARRA, furnizată la 17 septembrie, este împărțită între „Povestea” și valorile brandului. Instrucțiunile de strategie web din brief nu sunt publicate ca text de prezentare.
- Catalogul serviciilor include organizare, flori naturale/criogenate/artificiale, buchete și lumânări, invitații, DJ/entertainment/ursitoare/artificii, foto-video/cabină foto/360, baruri tematice și închirieri.
- Secțiunea Locații include National Golf and Country Club, Cabana Lăptici, Cabana Poarta Padina și posibilitatea unei locații alese de client. Fotografiile celor două cabane așteaptă identificarea/furnizarea de către client; nu sunt înlocuite cu imagini de la alte locații.
- Prezentarea The Green Events păstrează toate cele 13 pagini și textul original, comprimată de la 207,5 MB la 5,24 MB; coperta și PDF-ul sunt locale, încărcate la cerere, fără iframe extern.
- Fundaluri albe și pastelate, spațiere aerisită și una–două fotografii integrate în secțiunile principale. Serviciile folosesc imagini reprezentative diferite. Cele două filme au text scurt și layout alternat pe tabletă/desktop. Pe telefon textele editoriale și butoanele sunt centrate; câmpurile formularului rămân aliniate pentru lizibilitate.
- Butonul din antet apelează `+40 753 037 078`; pe telefon afișează numai iconița, fără fundal plin. Butonul WhatsApp apare din dreapta numai după ieșirea din hero.
- Reels desktop: opt carduri reale, fără clone, rotite circular în ambele direcții; săgeți, tastatură, tragere și avans automat la 5,5 secunde. La hover pornește numai videoclipul ales, fără titlu/play peste imagine, cu prioritate față de filmul panoramic. Derularea automată se suspendă la hover, focus de tastatură, modal sau filă ascunsă; un click cu mouse-ul pe săgeată nu o blochează. La ieșirea cursorului, rotația reîncepe. Spațiu pe șina focalizată comută pauza. Nu există buton suplimentar de play sub carusel.
- Redarea automată selectează videoclipul cel mai vizibil, cu prioritate pentru preview-ul curent al caruselului la egalitate; filmul panoramic nu mai oprește un carusel vizibil doar pentru că apare parțial în ecran. Rulează un singur videoclip inline simultan. Mișcarea redusă și economisirea datelor rămân respectate.
- Reels mobil: derulare nativă tactilă, plus tragere cu mouse-ul în preview mobil. Schimbarea doar a înălțimii viewport-ului nu mai resetează poziția. Descrierile rămân pe mobil, sunt ascunse pe desktop.
- Galerie mobilă pe două coloane și desktop pe trei coloane. Filtrarea rearanjează fotografiile pe întreaga lățime, fără coloane goale. Apăsarea fotografiei deschide lightbox-ul. Selecția actuală folosește 31 de fotografii confirmate de client ca ARRA; fotografia cu sigla altei firme și lista nominală de invitați sunt excluse.
- Preview-urile ascund titlul și play-ul inclusiv pe mobil. Filmul panoramic are autoplay mut la scroll și control inline: pauza manuală persistă până la apăsarea Play; controlul dispare la reluare.
- Contactul și formularul sunt full-width pe telefon, cu spațiere interioară. Footerul folosește butoane sociale tactile de 72 × 86 px. Meniul mobil are trei linii descrescătoare, rotunjite, într-o țintă de 48 × 48 px.
- Tooltip WhatsApp: 2,5 secunde vizibil / 5 secunde ascuns, repetat cât butonul și fila sunt vizibile; mișcarea redusă dezactivează ciclul automat. Metadatele de distribuire folosesc sigla originală PNG, titlul și descrierea ARRA.
- Timeline vertical cu progres auriu legat de scroll, alternat pe desktop și pe o coloană pe telefon. Animațiile de intrare se reiau la coborâre; la urcare elementele rămân vizibile, fără reanimare.
- Meniu mobil cu intrare, elemente decalate și ieșire animată; focusul rămâne în dialog până se termină închiderea. Preferința de mișcare redusă dezactivează animațiile.
- Cardurile „De ce ARRA?” sunt pe o singură coloană pe telefon; cardul de contact este adaptat cu iconițe și date lizibile. Creditul CAB-IT este centrat pe desktop și ultimul element în footer pe telefon. Politica de confidențialitate rămâne accesibilă din formular.

## Formularul WhatsApp

Site publicat prin FTPS la https://arraeventsbymonicatrif.ro/ pe 16 septembrie 2026. Verificările și copia configurației anterioare sunt documentate în `qa/VERIFICARE.md`. Nu sunt păstrate parole în proiect.

Butonul validează numele, telefonul, tipul evenimentului, acordul și câmpurile opționale. Pregătește mesajul și deschide `https://wa.me/40753037078?text=...` într-o filă nouă. Vizitatorul confirmă trimiterea în WhatsApp. Dacă browserul blochează fila, rămân vizibile mesajul și linkul alternativ. Nu există trimitere automată de email sau stocare a formularului pe server.

Adresa `contact@arraeventsbymonicatrif.ro` este afișată cu link `mailto:`. Căsuța de email trebuie creată/configurată separat la furnizorul de email; codul website-ului nu o creează.

## De confirmat înainte de lansarea publică

- Cele trei recenzii anonime au fost înlocuite la 17 septembrie 2026 cu recomandările publice citite în fila Facebook indicată de utilizator: Valentina Marinoff, Andreea Tanasa și Oana M. Drăgan. Sunt păstrate textele integrale, fotografiile de profil observate și linkurile directe la postări, fără note/steluțe inventate. Nu sunt folosite embed-uri Facebook sau URL-uri CDN expirabile.
- Câmpul intern `verified: true` semnalează verificarea postării-sursă și autorizarea utilizatorului de a o include, nu o verificare a identității sau un badge acordat de platformă. Titularul site-ului rămâne responsabil pentru drepturile de republicare a textelor și fotografiilor. Recenziile adăugate ulterior trebuie aprobate înainte de publicare; caruselul filtrează intrările neaprobate. Caruselul pornește în pauză pentru lectura textului complet; autoplay-ul opțional ține cont de lungimea recenziei.
- Titlurile portofoliului sunt editoriale, bazate pe fotografii. Nu pretind numele clienților, data, locația exactă sau rezultate neverificate. Filtrele fără fotografii, inclusiv Corporate, nu sunt afișate.
- Clienta trebuie să confirme drepturile de utilizare pe website pentru fotografii, persoanele filmate și muzica din videoclipuri. Disponibilitatea pe Instagram nu confirmă automat licența muzicii pentru un website independent.
- Confirmă că pagina Facebook furnizată (`amazingdecorbyapetreimihaela`) este destinația dorită; linkul este inclus exact conform solicitării, fără a presupune o identitate juridică între pagini.
- Informarea de confidențialitate descrie implementarea tehnică actuală. Proprietarul trebuie să confirme datele operatorului, practicile reale de păstrare a conversațiilor/jurnalelor, furnizorii și orice completări necesare. Nu este un audit juridic. Actualizeaz-o dacă adaugi analytics, pixeli sau servicii externe încorporate.

## Editare și verificare

- Texte și structură: `index.html`.
- Culori, spațiere, responsive: `assets/css/editorial-preview.css`, peste baza `assets/css/style.css`.
- Ajustările aprobate în 17 septembrie: `assets/css/client-refinements.css`; intro accesibil: `assets/js/brand-intro.js`.
- Portofoliul actual: `assets/js/preview-gallery.js`; selecția originală, reels, testimoniale și telefonul formularului: `assets/js/data.js`.
- Interacțiuni și formular: `assets/js/main.js`.
- Animații: `assets/js/animations.js`.
- Carusel circular și gesturi: `assets/js/reel-carousel.js`.
- Telefon/email apar și în HTML și în informarea de confidențialitate; actualizează toate aparițiile dacă se schimbă.
- Licențele OFL ale fonturilor sunt în `assets/fonts/licenses/`.

```powershell
node scripts/check.cjs
node scripts/check-carousel.cjs
node scripts/check-video-preview.cjs
node scripts/check-brand-intro.cjs
npx --yes --package html-validate html-validate index.html confidentialitate.html 404.html
powershell -ExecutionPolicy Bypass -File scripts/package.ps1
```

`test-form.html` este un test exclusiv local: deschide website-ul într-un iframe și interceptează `window.open`, astfel încât formularul poate fi testat fără a contacta WhatsApp. **Nu îl publica.** Arhiva de livrare îl exclude automat.

Nu încărca întregul director de lucru pe server. Publică numai conținutul arhivei finale.

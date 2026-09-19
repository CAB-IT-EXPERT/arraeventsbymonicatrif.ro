/* Local source/asset checks. No external service is contacted. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {buildWhatsAppMessage,buildWhatsAppURL} = require('../assets/js/main.js');
const root = path.resolve(__dirname,'..');
const context = {window:{}}; vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/data.js'),'utf8').replace('window.ARRA =','var ARRA = window.ARRA ='),context);
const data = context.window.ARRA;
const homepage = fs.readFileSync(path.join(root,'index.html'),'utf8');
const instagramUrls = [...homepage.matchAll(/https:\/\/www\.instagram\.com\/[^"\s<]+/g)].map(match => match[0]);
assert.equal(instagramUrls.length, 4, 'Instagram must be present in three links and structured data');
assert(instagramUrls.every(url => url === 'https://www.instagram.com/arraeventsbymonicatrif/'), 'Use the Instagram profile most recently confirmed by the client');
assert(homepage.includes('>@arraeventsbymonicatrif ↗</a'), 'Display the correct Instagram handle');
// The entire photo is the opener, even when the mobile zoom icon is hidden.
const lightboxImage = homepage.match(/<img\b[^>]*\bid="lightbox-image"[^>]*>/)?.[0];
assert(lightboxImage, 'Gallery zoom requires the lightbox image ID');
assert(!/\bsrcset=/.test(lightboxImage), 'A fixed srcset must not override the selected full-size photo');
for (const id of ['gallery-dialog','lightbox-title','lightbox-category','lightbox-description','lightbox-count']) {
  assert(homepage.includes(`id="${id}"`), `Missing gallery control: ${id}`);
}
assert(homepage.includes('property="og:site_name"'));
assert(homepage.includes('https://arraeventsbymonicatrif.ro/assets/images/arra-social-logo.png'));
assert(/property="og:image:type" content="image\/png"/.test(homepage));
const socialLogo = fs.readFileSync(path.join(root,'assets/images/arra-social-logo.png'));
assert.equal(socialLogo.toString('ascii',1,4),'PNG');
assert.equal(socialLogo.readUInt32BE(16),1254);
assert.equal(socialLogo.readUInt32BE(20),1254);
const locationScript = fs.readFileSync(path.join(root,'assets/js/location-carousels.js'),'utf8');
const golfSection = homepage.match(/<article\b[^>]*aria-labelledby="golf-title"[\s\S]*?<\/article>/)?.[0];
assert(golfSection && golfSection.includes('data-location-carousel="golf"'), 'National Golf needs its own media carousel');
for (const venue of ['golf','laptici','padina']) assert(homepage.includes(`data-location-carousel="${venue}"`), `Missing location carousel: ${venue}`);
for (const id of ['location-media-dialog','location-modal-title']) assert(homepage.includes(`id="${id}"`), `Missing location lightbox control: ${id}`);
for (const file of ['assets/video/2026-01-14_DTfQlqzgg9I.mp4','assets/video/locations/cabana-laptici-candelabre.mp4','assets/video/locations/poarta-padina-cer.mp4']) assert(locationScript.includes(file), `Missing venue film: ${file}`);
assert.equal(fs.readdirSync(path.join(root,'assets/images/locations')).filter(file => file.endsWith('.webp')).length,36,'Keep the curated responsive venue image set');
assert.equal(data.gallery.length,31);
assert.equal(new Set(data.gallery.map(p=>p.id)).size,31);
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/preview-gallery.js'),'utf8'),context);
assert.equal(data.gallery.length,30);
assert.equal(new Set(data.gallery.map(p=>p.id)).size,30);
assert(!data.gallery.some(photo => photo.id === 'client15'), 'The removed forest ceremony arch must stay out of the public gallery');
assert.equal(data.reels.length,8);
assert.equal(fs.readdirSync(path.join(root,'assets/video')).filter(f=>f.endsWith('.mp4')).length,11);
assert(!/RO30ING|INGBROBU|company-section/.test(fs.readFileSync(path.join(root,'index.html'),'utf8')),'Removed company/bank block must remain absent');
const required = new Set();
for (const file of ['index.html','confidentialitate.html','404.html']) {
  const html = fs.readFileSync(path.join(root,file),'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size,`Duplicate IDs in ${file}`);
  assert.equal((html.match(/<h1\b/g)||[]).length,1,`Single h1 in ${file}`);
  for (const [,target] of html.matchAll(/\b(?:href|src|poster|data-src)="([^"#]+)"/g)) {
    if (/^(?:https?:|mailto:|tel:)/.test(target)) continue;
    required.add(target.split(/[?#]/)[0].replace(/^\//,''));
  }
  for (const [,id] of html.matchAll(/\bhref="#([^"]+)"/g)) assert(ids.includes(id),`Broken anchor ${id}`);
  for (const [,sources] of html.matchAll(/\bsrcset="([^"]+)"/g)) sources.split(',').forEach(s=>required.add(s.trim().split(' ')[0]));
}
for (const [,url] of fs.readFileSync(path.join(root,'assets/css/style.css'),'utf8').matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) required.add(path.posix.normalize('assets/css/'+url));
data.gallery.forEach(photo => { assert(photo.title && photo.description && photo.alt); [480,900,1440].forEach(size=>required.add(`assets/images/photo-${photo.id}-${size}.webp`)); });
data.reels.forEach(video=>{required.add('assets/video/'+video.file);required.add('assets/posters/'+video.code+'.webp');});
for (const [,file] of locationScript.matchAll(/["`]((?:assets\/)[^"`?#]+\.(?:webp|jpg|mp4))/g)) required.add(file);
required.forEach(file=>assert(fs.existsSync(path.join(root,file)),`Missing local file ${file}`));
for (const file of ['main.js','data.js','preview-gallery.js','animations.js','reel-carousel.js','location-carousels.js']) new vm.Script(fs.readFileSync(path.join(root,'assets/js',file),'utf8'),{filename:file});
const details = {name:'Test local',phone:'0000000000',email:'test@example.invalid',event:'Cerere în căsătorie',date:'2027-06-19',location:'Locație de test',guests:'100',message:'Pastel & auriu + flori\nIdee cu diacritice: șțâîă <3'};
const message = buildWhatsAppMessage(details), url = new URL(buildWhatsAppURL(data.company.phone,message));
assert.equal(url.hostname,'wa.me'); assert.equal(url.pathname,'/40753037078');
assert.equal(url.searchParams.get('text'),message);
for (const field of ['name','phone','email','event','location','guests','message']) assert(message.includes(details[field]),`Missing ${field}`);
assert(message.includes('19 iunie 2027'));
assert(buildWhatsAppMessage({name:'Test',phone:'0000000000',event:'Nuntă'}).includes('De stabilit'));
assert(!buildWhatsAppMessage({name:'Test',phone:'0000000000',event:'Nuntă'}).includes('undefined'));
assert(data.testimonials.length >= 3 && data.testimonials.every(review=>review.verified===true),'Keep the reviews confirmed by the user approved and visible');
assert.equal(data.testimonials.length, 28, 'Keep only the currently approved recommendations');
assert.equal(new Set(data.testimonials.map(review=>review.author)).size, 28, 'Do not duplicate authors');
assert.equal(data.testimonials.filter(review=>review.text.trim()).length, 20, 'Eight endorsements have no readable quote; never invent one');
assert(!data.testimonials.some(review=>review.author === 'Andra Omran'), 'The requested selection is positive recommendations only');
for (const removedAuthor of ['Andreea Chele','Andreea Petre','Alexandru Gabriel Soare','Mihaela Agripina']) {
  assert(!data.testimonials.some(review=>review.author === removedAuthor), `${removedAuthor} must remain removed at the client's request`);
}
assert(data.testimonials.some(review=>review.author === 'Loredana Ștefan' && /facebook\.com\/maria\.loredana\.1496\/posts\/.+4307341192816609/.test(review.source)), 'Include Loredana Ștefan from Facebook');
assert(!homepage.includes('id="review-autoplay"') && !homepage.includes('id="review-dots"'), 'No testimonial play button or oversized pagination dots');
assert(homepage.includes('id="review-count"'), 'Display compact review pagination');
for (const review of data.testimonials) {
  assert(/^(?:https:\/\/www\.facebook\.com\/(?:[^/]+\/posts\/(?:pfbid|.+\/[0-9]+\/?)|permalink\.php\?story_fbid=pfbid)|https:\/\/www\.instagram\.com\/[A-Za-z0-9._]+\/?)/.test(review.source), 'Every review must link to its visible source');
  assert(fs.existsSync(path.join(root,review.photo)), 'Each sourced review needs its actual local author photo');
}
assert(homepage.includes('assets/images/hero-editorial.webp'), 'Use the generated long-table hero selected by the user');
assert(homepage.includes('assets/images/monica-story-card-900.webp'), 'Include the Monica introduction graphic as the second story image');
assert(!homepage.includes('assets/images/photo-client15-'), 'The removed forest ceremony arch must not appear on the page');
for (const text of ['Cabana Lăptici','Cabana Poarta Padina','National Golf','criogenate','Prosecco Bar','ursitoare','mașini']) assert(homepage.toLowerCase().includes(text.toLowerCase()), `Missing requested service/location: ${text}`);
assert(fs.statSync(path.join(root,'assets/documents/the-green-national-golf-country-club.pdf')).size < 10000000, 'The venue PDF must be web-sized');
const testimonialSection = homepage.match(/<section\b[^>]*\bid="testimoniale"[^>]*>/)?.[0];
assert(testimonialSection && !/\bhidden\b/.test(testimonialSection), 'The approved testimonial section must remain visible');
const sectionOrder = [...homepage.matchAll(/<section\b[^>]*\bid="([^"]+)"/g)].map(match=>match[1]);
assert.deepEqual(sectionOrder.slice(0,4), ['acasa','introducere','testimoniale','povestea'], 'Feature reviews directly after the introduction, before the ARRA story');
const testimonialLinks = [...homepage.matchAll(/<a\b[^>]*href="#testimoniale"[^>]*>/g)];
assert(testimonialLinks.length >= 2 && testimonialLinks.every(([link])=>!/\bhidden\b/.test(link)), 'Keep testimonial navigation visible');
assert(!/Texte-model|MODEL DE TESTIMONIAL|Modele de testimoniale|în așteptarea validării/i.test(homepage), 'Remove all public draft labels and pending-validation notices');
assert(fs.readFileSync(path.join(root,'assets/js/main.js'),'utf8').includes('ARRA.testimonials.filter(item => item.verified === true)'), 'Never render unverified testimonials');
assert(!fs.readFileSync(path.join(root,'assets/js/main.js'),'utf8').includes("replace('assets/video/', 'assets/previews/')"),'Inline playback must use full-quality masters');
console.log(`PASS: ${required.size} local files; 30 active client preview photos (31 originals retained); 11 full-quality videos; HTML anchors; unique IDs; JS syntax; WhatsApp encoding/fields/date/fallbacks; approved reviews without draft labels.`);

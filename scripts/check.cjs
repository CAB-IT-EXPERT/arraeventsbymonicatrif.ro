/* Local source/asset checks. No external service or real customer data is used. */
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
assert(homepage.includes('property="og:site_name"'));
assert(homepage.includes('https://arraeventsbymonicatrif.ro/assets/images/arra-social-logo.png'));
assert(/property="og:image:type" content="image\/png"/.test(homepage));
const socialLogo = fs.readFileSync(path.join(root,'assets/images/arra-social-logo.png'));
assert.equal(socialLogo.toString('ascii',1,4),'PNG');
assert.equal(socialLogo.readUInt32BE(16),1254);
assert.equal(socialLogo.readUInt32BE(20),1254);
assert(/<video\s+data-panorama/.test(homepage),'Panoramic preview must be inline');
assert.equal(data.gallery.length,31);
assert.equal(new Set(data.gallery.map(p=>p.id)).size,31);
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/preview-gallery.js'),'utf8'),context);
assert.equal(data.gallery.length,31);
assert.equal(new Set(data.gallery.map(p=>p.id)).size,31);
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
required.forEach(file=>assert(fs.existsSync(path.join(root,file)),`Missing local file ${file}`));
for (const file of ['main.js','data.js','preview-gallery.js','animations.js','reel-carousel.js']) new vm.Script(fs.readFileSync(path.join(root,'assets/js',file),'utf8'),{filename:file});
const details = {name:'Test local',phone:'0000000000',email:'test@example.invalid',event:'Cerere în căsătorie',date:'2027-06-19',location:'Locație de test',guests:'100',message:'Pastel & auriu + flori\nIdee cu diacritice: șțâîă <3'};
const message = buildWhatsAppMessage(details), url = new URL(buildWhatsAppURL(data.company.phone,message));
assert.equal(url.hostname,'wa.me'); assert.equal(url.pathname,'/40753037078');
assert.equal(url.searchParams.get('text'),message);
for (const field of ['name','phone','email','event','location','guests','message']) assert(message.includes(details[field]),`Missing ${field}`);
assert(message.includes('19 iunie 2027'));
assert(buildWhatsAppMessage({name:'Test',phone:'0000000000',event:'Nuntă'}).includes('De stabilit'));
assert(!buildWhatsAppMessage({name:'Test',phone:'0000000000',event:'Nuntă'}).includes('undefined'));
assert(data.testimonials.every(review=>review.verified===false),'Sample testimonials must not be marked verified');
assert(!fs.readFileSync(path.join(root,'assets/js/main.js'),'utf8').includes("replace('assets/video/', 'assets/previews/')"),'Inline playback must use full-quality masters');
console.log(`PASS: ${required.size} local files; 31 client preview photos (31 originals retained); 11 full-quality videos; HTML anchors; unique IDs; JS syntax; WhatsApp encoding/fields/date/fallbacks; draft review labels.`);

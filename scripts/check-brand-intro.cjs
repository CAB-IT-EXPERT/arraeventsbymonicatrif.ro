const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname,'../assets/js/brand-intro.js'),'utf8');
function setup({seen=false,reduced=false,hash='',scrollY=0,storageError=false}={}) {
  const events = new Map(), timers = [], classes = new Set();
  const button = {addEventListener: (_,fn) => events.set('click',fn)};
  const intro = {hidden:true,classList:{add:name=>classes.add(name)},querySelector:()=>button};
  const media = {matches:reduced,addEventListener:(_,fn)=>events.set('change',fn),removeEventListener:()=>events.delete('change')};
  vm.runInNewContext(source,{
    document:{getElementById:()=>intro},matchMedia:()=>media,location:{hash},scrollY,
    sessionStorage:{getItem:()=>{if(storageError)throw Error('Storage blocked');return seen?'1':null;},setItem:()=>{if(storageError)throw Error('Storage blocked');}},
    window:{addEventListener:(type,fn)=>events.set(type,fn),removeEventListener:type=>events.delete(type)},
    setTimeout:(fn,delay)=>timers.push({fn,delay}),
  });
  return {intro,events,timers,classes};
}
for (const options of [{seen:true},{reduced:true},{hash:'#locatii'},{scrollY:200}]) {
  const s=setup(options); assert(s.intro.hidden); assert.equal(s.timers.length,0);
}
for (const options of [{},{storageError:true}]) {
  const s=setup(options); assert(!s.intro.hidden);
  assert.deepEqual(s.timers.map(t=>t.delay),[800,1900]);
  s.timers[0].fn(); assert(s.classes.has('is-opening'));
  s.timers[1].fn(); assert(s.intro.hidden); assert(!s.events.has('wheel'));
}
for (const type of ['click','wheel','touchstart','change']) {
  const s=setup(); s.events.get(type)(); assert(s.intro.hidden);
}
for (const key of ['Escape','Tab']) {
  const s=setup(); s.events.get('keydown')({key}); assert(s.intro.hidden);
}
const s=setup(); s.events.get('pageshow')({persisted:true}); assert(s.intro.hidden);
console.log('PASS: brand reveal, 1.9s fallback, once/session, deep links, reduced motion, blocked storage, touch/wheel/keyboard skip and bfcache.');

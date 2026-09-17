// Deterministic unit checks: actual carousel source, fractional card widths and
// browser-like rounded scrollLeft; no browser automation or network requests.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
let now = 0, id = 0;
const tasks = new Map();
const schedule = (fn, delay) => { const key = ++id; tasks.set(key, {fn, at:now+delay}); return key; };
function advance(ms) {
  const end = now + ms;
  let guard = 10000;
  while (guard--) {
    const next = [...tasks].filter(([,t]) => t.at <= end).sort((a,b)=>a[1].at-b[1].at)[0];
    if (!next) break;
    tasks.delete(next[0]); now = next[1].at; next[1].fn(now);
  }
  assert(guard > 0, 'No event loop feedback'); now = end;
}
function node() {
  const events = {};
  const classes = new Set();
  return {events, dataset:{}, attributes:{},
    matches(selector){return selector === ':focus-visible' && !!this.keyboardFocus;},
    classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),toggle(c,on){if(on)classes.add(c);else classes.delete(c);}},
    addEventListener(name, fn){(events[name] ||= []).push(fn);},
    dispatch(name,event={}){for(const fn of events[name] || [])fn(event);},
    setAttribute(k,v){this.attributes[k]=v;}
  };
}
const track = node(), previous = node(), next = node(), region = node();
const desktop = {...node(),matches:true};
const reduced = {...node(),matches:false};
const document = {hidden:false,activeElement:track};
track.keyboardFocus = true;
region.contains = el => [track,previous,next].includes(el);
const cards = Array.from({length:8},(_,i)=> {
  const video = {title:String(i),currentTime:0,getAttribute(){return this.title;}};
  return {video,querySelector:()=>video,getBoundingClientRect:()=>({width:234.125})};
});
track.children = [...cards]; track.clientWidth = 1240;
Object.defineProperties(track, {
  firstElementChild:{get:()=>track.children[0]},lastElementChild:{get:()=>track.children.at(-1)},
  scrollWidth:{get:()=>8*252.125},
  scrollLeft:{get:()=>track.position||0,set(value){const old=track.position;track.position=Math.round(Math.max(0,Math.min(value,track.scrollWidth-track.clientWidth)));if(old!==track.position)schedule(()=>track.dispatch('scroll'),0);}}
});
track.replaceChildren = (...items) => {track.children=items;};
track.append = card => {track.children.splice(track.children.indexOf(card),1);track.children.push(card);};
track.prepend = card => {track.children.splice(track.children.indexOf(card),1);track.children.unshift(card);};
track.closest = ()=>region;
track.scrollBy = ({left})=>{track.scrollLeft+=left;};
track.scrollTo = ({left})=>{track.scrollLeft=left;};
track.setPointerCapture=()=>{track.captured=true;};
track.hasPointerCapture=()=>track.captured;
track.releasePointerCapture=()=>{track.captured=false;};
const window = node();
let visibilityObserver, modalOpen = false;
const context = {window, document, matchMedia:()=>desktop, getComputedStyle:()=>({columnGap:'18px'}),
  performance:{now:()=>now}, requestAnimationFrame:fn=>schedule(fn,16),cancelAnimationFrame:key=>tasks.delete(key),
  setTimeout:schedule,clearTimeout:key=>tasks.delete(key),
  IntersectionObserver:class {constructor(fn){this.fn=fn;visibilityObserver=fn;}observe(){this.fn([{isIntersecting:true,intersectionRatio:1}]);}}
};
window.IntersectionObserver=context.IntersectionObserver;
vm.createContext(context);
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../assets/js/reel-carousel.js'),'utf8'),context);
const api=window.createDesktopReelCarousel({track,previous,next,reduced,saveData:false,onChange(){},isModalOpen:()=>modalOpen});
advance(200);
assert.equal(api.activeVideo.title,'0');
previous.dispatch('click');advance(1000);assert.equal(api.activeVideo.title,'7','First → last');
next.dispatch('click');advance(1000);assert.equal(api.activeVideo.title,'0','Last → first');
for(let i=1;i<=24;i++){next.dispatch('click');advance(900);assert.equal(api.activeVideo.title,String(i%8));}
for(let i=1;i<=24;i++){previous.dispatch('click');advance(900);assert.equal(api.activeVideo.title,String((8-i%8)%8));}
assert.equal(new Set(track.children).size,8);
const hoveredCard=track.children[4];
track.dispatch('pointerover',{pointerType:'mouse',target:{closest:()=>hoveredCard}});
assert.equal(api.activeVideo,hoveredCard.video,'Hover chooses the exact video');
assert.equal(api.hoveredVideo,hoveredCard.video,'Expose explicit hover to the playback coordinator');
track.dispatch('mouseleave');assert.equal(api.activeVideo.title,'0');
assert.equal(api.hoveredVideo,null,'Clear hover priority when leaving the carousel');
track.dispatch('pointerdown',{pointerType:'mouse',button:0,pointerId:1,clientX:800});
track.dispatch('pointermove',{pointerId:1,clientX:510,preventDefault(){}});
track.dispatch('pointerup',{pointerId:1});advance(900);
assert.equal(api.activeVideo.title,'1','Mouse drag advances');
document.activeElement=null;region.dispatch('focusout');advance(6200);
assert.equal(api.activeVideo.title,'2','Automatic sequential preview');

document.activeElement=next;region.dispatch('focusin');
next.dispatch('click');advance(900);
assert.equal(api.activeVideo.title,'3','A pointer arrow click advances');
advance(6200);
assert.equal(api.activeVideo.title,'4','Autoplay resumes despite the clicked arrow retaining focus');
next.keyboardFocus=true;region.dispatch('focusin');advance(7000);
assert.equal(api.activeVideo.title,'4','Keyboard focus still suspends automatic movement');
next.keyboardFocus=false;api.refresh();

track.dispatch('mouseenter');
const manualCard=track.children[3];
track.dispatch('pointerover',{pointerType:'mouse',target:{closest:()=>manualCard}});
advance(7000);
assert.equal(api.activeVideo,manualCard.video,'Hover preview holds still during the normal rotation interval');
track.dispatch('mouseleave');advance(6200);
assert.equal(api.activeVideo.title,'5','Leaving hover resumes automatic movement without an extra click');

for (const pause of ['hidden','modal','reduced','outside']) {
  const current=api.activeVideo;
  if(pause==='hidden')document.hidden=true;
  if(pause==='modal')modalOpen=true;
  if(pause==='reduced'){reduced.matches=true;reduced.dispatch('change');}
  if(pause==='outside')visibilityObserver([{isIntersecting:false,intersectionRatio:0}]);
  api.refresh();advance(7000);
  assert.equal(api.activeVideo,current,`Do not rotate while ${pause}`);
  document.hidden=false;modalOpen=false;reduced.matches=false;
  visibilityObserver([{isIntersecting:true,intersectionRatio:1}]);
  api.refresh();advance(6200);
  assert.notEqual(api.activeVideo,current,`Resume after ${pause}`);
}
desktop.matches=false;track.clientWidth=335;window.dispatch('resize');advance(200);
assert.equal(api.desktop,false);assert.equal(track.children[0],cards[0]);
track.scrollLeft=504;advance(300);window.dispatch('resize');advance(300);
assert.equal(track.scrollLeft,504,'Height-only resize preserves mobile position');
track.dispatch('pointerdown',{pointerType:'mouse',button:0,pointerId:2,clientX:300});
track.dispatch('pointermove',{pointerId:2,clientX:100,preventDefault(){}});
track.dispatch('pointerup',{pointerId:2});advance(300);
assert(track.scrollLeft>504,'Mouse drag also works at phone width');
console.log('PASS: 48 circular moves; hover priority/pause/resume; autoplay after pointer-focused arrow; keyboard focus; hidden/modal/reduced/offscreen pause/resume; drag and mobile resize.');

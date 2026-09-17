const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {createTestimonialCarousel} = require('../assets/js/testimonial-carousel.js');
const context = {window:{}};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/js/data.js'),'utf8').replace('window.ARRA =','var ARRA = window.ARRA ='),context);
const reviews = context.window.ARRA.testimonials;
const totalReviews = 28;
const quoteReviews = 20;
const endorsementReviews = 8;
function element() {
  return {
    listeners: {}, attributes: {}, classes: new Set(),
    addEventListener(name, callback) { this.listeners[name] = callback; },
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { this.focused = true; },
    fire(name, event={}) { this.listeners[name]?.(event); },
    closest() { return null; },
    get classList() { return {toggle:(name,active)=>active ? this.classes.add(name) : this.classes.delete(name)}; }
  };
}
const slides = reviews.map((review,index) => {
  const slide = element();
  slide.body = {scrollHeight: index === 0 ? 700 : 100, clientHeight: 230, scrollTop:0};
  slide.querySelector = () => slide.body;
  return slide;
});
const track = element(), slider = element(), counter = element(), previous = element(), next = element();
track.querySelectorAll = () => slides;
track.contains = target => target === track;
const carousel = createTestimonialCarousel({reviews,slider,track,counter,previous,next});
const current = () => slides.findIndex(slide=>slide.classes.has('current'));
const verify = index => {
  assert.equal(current(), index);
  assert.equal(slides.filter(slide=>!slide.inert).length,1);
  assert.equal(counter.textContent, `${String(index+1).padStart(2,'0')} / ${totalReviews}`);
  slides.forEach((slide,i)=>assert.equal(slide.attributes['aria-hidden'], String(i !== index)));
};
verify(0);
assert(slides[0].classes.has('has-long-review'));
assert.equal(slides[0].body.tabIndex,0);
assert.equal(reviews.length,totalReviews);
assert.equal((track.innerHTML.match(/<blockquote\b/g)||[]).length,quoteReviews);
assert.equal((track.innerHTML.match(/class="review-endorsement"/g)||[]).length,endorsementReviews);
assert(track.innerHTML.includes('Ne vom revedea curând. 💐🌸🌹🌺🌷🌼🌻'), 'Retain the full longest quote');
assert(track.innerHTML.includes('Vezi recomandarea pe Instagram'), 'Render Instagram review source correctly');
assert(!track.innerHTML.includes('�'));
next.fire('click'); verify(1);
assert.equal(slides[1].body.tabIndex,-1);
previous.fire('click'); verify(0);
previous.fire('click'); verify(totalReviews - 1);
next.fire('click'); verify(0);
slides[0].body.scrollTop = 200;
next.fire('click'); previous.fire('click');
assert.equal(slides[0].body.scrollTop,0);
let prevented = false;
slider.fire('keydown',{key:'ArrowRight',target:track,preventDefault(){prevented=true;}});
verify(1); assert(prevented && next.focused);
slider.fire('keydown',{key:'ArrowRight',ctrlKey:true}); verify(1);
const touch = (x,y) => ({clientX:x,clientY:y});
track.fire('touchstart',{touches:[touch(200,100)],target:track});
track.fire('touchend',{changedTouches:[touch(60,104)]}); verify(2);
track.fire('touchstart',{touches:[touch(60,100)],target:track});
track.fire('touchend',{changedTouches:[touch(200,104)]}); verify(1);
track.fire('touchstart',{touches:[touch(200,100)],target:track});
track.fire('touchmove',{touches:[touch(190,200)]});
track.fire('touchend',{changedTouches:[touch(60,104)]}); verify(1);
track.fire('touchstart',{touches:[touch(200,100)],target:track});
track.fire('touchcancel');
track.fire('touchend',{changedTouches:[touch(60,104)]}); verify(1);
for (let index=0;index<totalReviews;index++) { carousel.show(index); verify(index); }
const source = fs.readFileSync(path.join(__dirname,'../assets/js/testimonial-carousel.js'),'utf8');
assert(!/setTimeout|setInterval/.test(source), 'Reviews must not advance while reading');
assert(!fs.readFileSync(path.join(__dirname,'../assets/js/main.js'),'utf8').includes('scheduleReview'));
const css = fs.readFileSync(path.join(__dirname,'../assets/css/client-refinements.css'),'utf8');
assert(/\.testimonial \{ height: 460px;/.test(css));
assert(/\.testimonial \{ height: 480px;/.test(css));
assert(/\.review-body \{[^}]*overflow-y: auto/.test(css));
console.log('PASS: 28 recommendations; 20 complete quotes; 8 endorsement-only cards; arrows and wrap; keyboard focus; swipe/vertical scroll/cancel; inert states; read position reset; fixed-size layout; no autoplay.');

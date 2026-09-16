const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('assets/js/animations.js', 'utf8');
const start = source.indexOf('  let whatsappVisible');
const end = source.indexOf('  const progress', start);
const classes = new Set();
const tasks = new Map();
let now = 0, sequence = 0;
const whatsapp = {classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),toggle:(c,on)=>on?classes.add(c):classes.delete(c)},setAttribute(){}};
const context = {whatsapp,document:{hidden:false},reduced:{matches:false},setTimeout(fn,ms){const id=++sequence; tasks.set(id,{fn,time:now+ms});return id;},clearTimeout(id){tasks.delete(id);}};
vm.createContext(context);
vm.runInContext(source.slice(start,end),context);
function tick(ms){const target=now+ms;for(;;){const task=[...tasks].sort((a,b)=>a[1].time-b[1].time)[0];if(!task||task[1].time>target)break;now=task[1].time;tasks.delete(task[0]);task[1].fn();}now=target;}
context.updateWhatsApp(true);
tick(950); assert(classes.has('is-teasing'));
for(let cycle=0;cycle<4;cycle++){
  tick(2499);assert(classes.has('is-teasing'));
  tick(1);assert(!classes.has('is-teasing'));
  tick(4999);assert(!classes.has('is-teasing'));
  tick(1);assert(classes.has('is-teasing'));
}
context.updateWhatsApp(false); tick(20000); assert(!classes.has('is-teasing')); assert.equal(tasks.size,0);
context.updateWhatsApp(true); tick(950);context.document.hidden=true;context.restartWhatsAppTooltip();tick(10000);assert.equal(tasks.size,0);
context.document.hidden=false;context.restartWhatsAppTooltip();tick(950);assert(classes.has('is-teasing'));
context.reduced.matches=true;context.restartWhatsAppTooltip();assert.equal(tasks.size,0);assert(!classes.has('is-teasing'));
console.log('PASS: WhatsApp tooltip repeats 2.5s visible / 5s hidden; stops in hero, hidden tab and reduced motion.');

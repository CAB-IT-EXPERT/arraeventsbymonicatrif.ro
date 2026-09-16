// One-time mechanical HTML normalization; original content and layout are preserved.
const fs = require('node:fs');
for (const file of ['index.html','confidentialitate.html','404.html']) {
  let html = fs.readFileSync(file,'utf8');
  html = html.replace('<!doctype html>','<!DOCTYPE html>')
    .replace(/<(?:meta|link|img|br|wbr|input|hr|source|track)\b[^>]*>/g,tag=>tag.replace(/\s*\/>$/,'>'))
    .replace(/<button\b(?![^>]*\btype=)/g,'<button type="button"')
    .replace(/<input\b(?![^>]*\btype=)/g,'<input type="text"')
    .replace(/&(?![a-zA-Z]+;|#\d+;|#x[\da-fA-F]+;)/g,'&amp;')
    .replace(/<video\b[^>]*>/g,tag=>tag.replace('aria-label=','title='))
    .replace('class="testimonial-slider" role="region"','class="testimonial-slider" role="group"')
    .replace('class="review-dots" aria-label','class="review-dots" role="group" aria-label')
    .replace('id="whatsapp-result-link" class','id="whatsapp-result-link" href="https://wa.me/40753037078" class')
    .replace('<img id="lightbox-image" alt="">','<img id="lightbox-image" src="assets/images/photo-01-1440.webp" alt="">')
    .replace('<h2 id="lightbox-title"></h2>','<h2 id="lightbox-title">Poveste din portofoliu</h2>');
  fs.writeFileSync(file,html);
}

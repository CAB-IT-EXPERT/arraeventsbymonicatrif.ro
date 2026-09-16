const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml','.mp4':'video/mp4','.ttf':'font/ttf','.woff2':'font/woff2','.xml':'application/xml','.txt':'text/plain; charset=utf-8'};
http.createServer((req,res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch {res.writeHead(400); return res.end();}
  if (pathname === '/') pathname = '/index.html';
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) || /\/(?:\.git|scripts|qa|media_website_selectie|instagram_arra_eventplanner)\//.test(pathname)) {res.writeHead(403);return res.end();}
  fs.stat(file, (err,stat) => {
    if (err || !stat.isFile()) {res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'}); return res.end(fs.existsSync(path.join(root,'404.html')) ? fs.readFileSync(path.join(root,'404.html')) : 'Pagina nu există.');}
    const headers = {'Content-Type':types[path.extname(file)] || 'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache'};
    const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    let start = 0, end = stat.size - 1, status = 200;
    if (range) { start = Number(range[1]); end = range[2] ? Math.min(Number(range[2]),end) : end; if(start > end){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});return res.end();}status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;}
    headers['Content-Length']=end-start+1;res.writeHead(status,headers);
    if(req.method==='HEAD')return res.end();
    fs.createReadStream(file,{start,end}).pipe(res);
  });
}).listen(4173, '127.0.0.1', () => console.log('ARRA preview: http://127.0.0.1:4173'));

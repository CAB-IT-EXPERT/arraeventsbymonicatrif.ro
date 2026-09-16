const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const origin = 'https://arraeventsbymonicatrif.ro/';
const manifestPath = path.resolve(process.argv[2]);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
(async () => {
  let cursor = 0, checked = 0;
  const publicFiles = manifest.filter(item => item.file !== '.htaccess');
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (cursor < publicFiles.length) {
      const item = publicFiles[cursor++];
      const response = await fetch(origin + item.file, {signal:AbortSignal.timeout(60000)});
      assert.equal(response.status, 200, item.file + ' HTTP status');
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(bytes.length, item.bytes, item.file + ' byte count');
      assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), item.sha256, item.file + ' SHA-256');
      checked++;
    }
  }));
  const home = await fetch(origin);
  const html = await home.text();
  assert.equal(home.status,200);
  assert.equal(crypto.createHash('sha256').update(html).digest('hex'),manifest.find(f=>f.file==='index.html').sha256,'Homepage must serve current index.html');
  assert(html.includes('property="og:image"'));
  assert(html.includes('https://arraeventsbymonicatrif.ro/assets/images/arra-social-logo.png'));
  const denied = await fetch(origin + '.htaccess');
  assert.equal(denied.status,403,'Server configuration must remain private');
  const redirect = await fetch('http://arraeventsbymonicatrif.ro/',{redirect:'manual'});
  assert.equal(redirect.status,301);
  assert.equal(redirect.headers.get('location'),origin);
  const missing = await fetch(origin + 'verificare-pagina-inexistenta-arra');
  assert.equal(missing.status,404);
  const range = await fetch(origin + 'assets/video/2026-01-14_DTfQlqzgg9I.mp4',{headers:{Range:'bytes=0-1023'}});
  assert.equal(range.status,206,'Video byte ranges');
  await range.arrayBuffer();
  const result = {verifiedAt:new Date().toISOString(),origin,filesWithMatchingSHA256:checked,homepage:200,httpRedirect:301,privateHtaccess:403,custom404:404,videoRange:206,openGraphLogo:true};
  fs.writeFileSync(path.join(path.dirname(manifestPath),'verification.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});

// Deploy only this site's public files. Credentials arrive on stdin, never on disk.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const origin = 'ftp://d204.dataserver.ro:21/public_html/';
const baseArgs = ['--config', '-', '--ssl-reqd', '--resolve', 'd204.dataserver.ro:21:80.97.21.122', '--silent', '--show-error', '--connect-timeout', '20', '--max-time', '240', '--retry', '3', '--retry-all-errors'];
const input = [];
process.stdin.on('data', chunk => input.push(chunk));
process.stdin.on('end', async () => {
  try {
    const credentials = JSON.parse(Buffer.concat(input).toString('utf8').replace(/^\uFEFF/, ''));
    const config = 'user = ' + JSON.stringify(credentials.user + ':' + credentials.password) + '\n';
    input.length = 0;
    function ftp(args) {
      return new Promise((resolve, reject) => {
        const child = spawn('curl.exe', [...baseArgs, ...args], { windowsHide: true });
        const out = [], err = [];
        child.stdout.on('data', c => out.push(c));
        child.stderr.on('data', c => err.push(c));
        child.on('error', reject);
        child.on('close', code => code === 0 ? resolve(Buffer.concat(out)) : reject(new Error('FTPS failed: ' + Buffer.concat(err).toString())));
        child.stdin.end(config);
      });
    }
    const listing = (await ftp(['--list-only', origin])).toString();
    const existing = new Set(listing.split(/\r?\n/).filter(Boolean));
    // Resolve new targets from actual directory listings. A failed FTPS request
    // is never treated as evidence that a file is absent.
    const directories = new Map([['', Promise.resolve(existing)]]);
    function directoryEntries(directory) {
      if (!directories.has(directory)) directories.set(directory, (async () => {
        const parent = path.posix.dirname(directory);
        const siblings = await directoryEntries(parent === '.' ? '' : parent);
        if (!siblings.has(path.posix.basename(directory))) return new Set();
        const names = (await ftp(['--list-only', origin + directory + '/'])).toString();
        return new Set(names.split(/\r?\n/).filter(Boolean).map(name => path.posix.basename(name.replace(/\/$/, ''))));
      })());
      return directories.get(directory);
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backup = path.join(root, 'qa', 'deployment-' + stamp);
    fs.mkdirSync(backup, { recursive: true });
    fs.writeFileSync(path.join(backup, 'remote-public-files.txt'), listing);
    const rootFiles = ['404.html', 'confidentialitate.html', 'robots.txt', 'sitemap.xml', '.htaccess', 'index.html'];
    const updatePath = process.argv[2] === '--update' ? process.argv[3] : undefined;
    const previous = updatePath ? JSON.parse(fs.readFileSync(path.resolve(updatePath), 'utf8')) : null;
    const resumeIndex = process.argv.indexOf('--resume');
    const resumePath = resumeIndex < 0 ? null : path.resolve(process.argv[resumeIndex + 1]);
    if (resumePath && (!previous || path.dirname(resumePath) !== path.join(root, 'qa') || !path.basename(resumePath).startsWith('deployment-'))) throw new Error('Invalid interrupted deployment directory.');
    // Refuse an unexpected populated asset tree; do not overwrite another deployment blindly.
    if (existing.has('assets') && !previous) throw new Error('Remote assets already exist. Use --update with the last verified deployment manifest.');
    const publicTrees = ['assets', 'cabitexpert'];
    const assets = publicTrees.flatMap(directory => fs.readdirSync(path.join(root, directory), { recursive: true, withFileTypes: true })
      .filter(entry => entry.isFile()).map(entry => path.relative(root, path.join(entry.parentPath || entry.path, entry.name)).replaceAll('\\', '/')));
    const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
    const manifest = [...assets, ...rootFiles].map(file => {
      const bytes = fs.readFileSync(path.join(root, file));
      return {file, bytes: bytes.length, sha256: hash(bytes)};
    });
    const files = manifest.filter(item => !previous || previous.find(old => old.file === item.file)?.sha256 !== item.sha256).map(item => item.file);
    if (resumePath) {
      const savedIndex = fs.readFileSync(path.join(resumePath, 'index.html'));
      if (hash(savedIndex) !== previous.find(item => item.file === 'index.html')?.sha256) throw new Error('Interrupted deployment backup does not match the previous release.');
    }
    fs.writeFileSync(path.join(backup, 'planned-manifest.json'), JSON.stringify(manifest, null, 2));
    const alreadyUploaded = new Set();
    // Back up every changed deployed file before the first write. Fail if remote state drifted.
    for (const name of files) {
      const old = previous?.find(item => item.file === name);
      if (!old) {
        const parent = path.posix.dirname(name);
        const entries = await directoryEntries(parent === '.' ? '' : parent);
        if (entries.has(path.posix.basename(name)) && previous) {
          if (!resumePath) throw new Error('Untracked remote target already exists: ' + name);
          const remote = await ftp([origin + name]);
          if (hash(remote) === manifest.find(item => item.file === name).sha256) alreadyUploaded.add(name);
          else {
            const destination = path.join(backup, name);
            fs.mkdirSync(path.dirname(destination), {recursive: true});
            fs.writeFileSync(destination, remote);
            console.log('Backed up incomplete transfer ' + name);
          }
        }
      }
      if (old || existing.has(name)) {
        const remote = await ftp([origin + name]);
        if (old && hash(remote) !== old.sha256) {
          if (!resumePath || hash(remote) !== manifest.find(item => item.file === name).sha256) throw new Error('Remote file changed since the last deployment: ' + name);
          alreadyUploaded.add(name);
        }
        const destination = path.join(backup, name);
        fs.mkdirSync(path.dirname(destination), {recursive: true});
        fs.writeFileSync(destination, remote);
        console.log('Backed up existing ' + name);
      }
    }
    let done = 0;
    async function upload(relative) {
      if (alreadyUploaded.has(relative)) return;
      const local = path.join(root, relative);
      const size = fs.statSync(local).size;
      if (hash(fs.readFileSync(local)) !== manifest.find(item => item.file === relative).sha256) throw new Error('Local file changed during deployment: ' + relative);
      const result = await ftp(['--ftp-create-dirs', '--upload-file', local, '--write-out', '%{size_upload}', origin + relative]);
      if (Number(result.toString()) !== size) throw new Error('Upload size mismatch: ' + relative);
      done++;
      if (done % 20 === 0 || relative === 'index.html') console.log('Uploaded ' + done + '/' + files.length + ' public files');
    }
    // Complete all assets before publishing the entry point.
    const changedAssets = assets.filter(file => files.includes(file));
    let next = 0;
    await Promise.all(Array.from({ length: 2 }, async () => { while (next < changedAssets.length) await upload(changedAssets[next++]); }));
    for (const name of rootFiles.filter(file => files.includes(file))) await upload(name);
    fs.writeFileSync(path.join(backup, 'uploaded-manifest.json'), JSON.stringify(manifest, null, 2));
    console.log('Deployment complete. Backup and manifest: ' + path.relative(root, backup));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
});

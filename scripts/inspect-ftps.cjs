// Inspect the public FTPS certificate without logging in or bypassing TLS checks.
const net = require('node:net');
const tls = require('node:tls');
const host = process.argv[2];
if (!host) throw new Error('FTPS hostname required');
const socket = net.connect(21, host);
socket.setTimeout(15000, () => socket.destroy(new Error('Connection timed out')));
let buffer = '';
let awaitingTls = false;
socket.on('error', error => console.log(error.message));
socket.on('data', function onData(data) {
  buffer += data.toString();
  if (!awaitingTls && /(?:^|\r\n)220 [^\r\n]*\r\n/.test(buffer)) {
    awaitingTls = true;
    buffer = '';
    socket.write('AUTH TLS\r\n');
  } else if (awaitingTls && /(?:^|\r\n)234 [^\r\n]*\r\n/.test(buffer)) {
    socket.removeListener('data', onData);
    const secure = tls.connect({
      socket, servername: host, rejectUnauthorized: true,
      checkServerIdentity(name, certificate) {
        console.log(JSON.stringify({ subject: certificate.subject, altNames: certificate.subjectaltname, issuer: certificate.issuer, validTo: certificate.valid_to }));
        return tls.checkServerIdentity(name, certificate);
      }
    });
    secure.on('secureConnect', () => { console.log('TLS certificate verified'); secure.end(); });
    secure.on('error', error => { console.log(error.message); socket.destroy(); });
  }
});

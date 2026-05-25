const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function base64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const usersPath = path.join(__dirname, '..', 'Database', 'Users', 'assets.json');
if (!fs.existsSync(usersPath)) {
  console.error('users file not found:', usersPath);
  process.exit(1);
}
const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
const admin = users.find(u => u.isAdmin === true) || users[0];
if (!admin) {
  console.error('no users found');
  process.exit(1);
}

const header = { alg: 'HS256', typ: 'JWT' };
const payload = { exp: Math.floor(Date.now() / 1000) + 24 * 3600, userId: admin.Id, isAdmin: admin.isAdmin };
const secret = 'GGALKANE';
const unsigned = base64url(header) + '.' + base64url(payload);
const sig = crypto.createHmac('sha256', secret).update(unsigned).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const token = unsigned + '.' + sig;

console.log(token);
// copy to macOS clipboard if available
try {
  const cp = require('child_process');
  const p = cp.spawnSync('pbcopy');
  if (p.status === 0) {
    const w = cp.spawnSync('pbcopy');
    const copy = cp.spawnSync('pbcopy');
    // write token to stdin
    const write = cp.spawnSync('bash', ['-c', `printf "%s" "${token.replace(/\"/g,'\\\"')}" | pbcopy`]);
    console.log('Token copied to clipboard.');
  }
} catch (e) {
  // ignore
}

console.log('Admin user id:', admin.Id, 'name:', admin.Name, 'email:', admin.Email);
console.log('\nRun the following in your browser console:');
console.log(`sessionStorage.setItem('token', '${token}'); location.reload();`);

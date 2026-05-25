const fs = require('fs');
const path = require('path');

const dbDir = path.resolve(__dirname, '..', 'Database');
const usersPath = path.join(dbDir, 'Users', 'assets.json');
const soldPath = path.join(dbDir, 'SoldItems', 'assets.json');

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function saveJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function main() {
  if (!fs.existsSync(usersPath) || !fs.existsSync(soldPath)) {
    console.error('Missing files:', usersPath, soldPath);
    process.exit(2);
  }

  const users = loadJson(usersPath);
  const sold = loadJson(soldPath);

  const emailById = Object.fromEntries(users.map(u => [u.Id, u.Email]));
  let changed = 0;

  for (const s of sold) {
    if ((s.WinnerEmail === undefined || s.WinnerEmail === null || s.WinnerEmail === '') && s.WinnerUserId) {
      const email = emailById[s.WinnerUserId];
      if (email) {
        s.WinnerEmail = email;
        changed++;
      }
    }
  }

  if (changed > 0) {
    saveJson(soldPath, sold);
    console.log(`Updated ${changed} sold item(s) with WinnerEmail.`);
  } else {
    console.log('No updates necessary.');
  }
}

main();

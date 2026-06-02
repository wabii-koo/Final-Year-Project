require('dotenv').config();
const bcrypt = require('bcryptjs');
const passwords = {
  'robert.miller@school.com': 'MillerMath@2026',
  'lisa.green@school.com': 'GreenScience@2026',
  'karen.white@school.com': 'WhiteEnglish@2026'
};
(async () => {
  const hashes = {
    'robert.miller@school.com': '/rIj0vuoQKFORWe1tvSSOY6.',
    'lisa.green@school.com': '$/ZDAjpbftjAF03YsDhHVdeXbjK9FxRqHhS3JPkBVReVgHVoxch0t6',
    'karen.white@school.com': '.35Tvcs6hdggOaBRqZSWF0gZmwJr0O3wpUMZsYq1SPDq'
  };
  for (const email of Object.keys(passwords)) {
    const pass = passwords[email];
    const hash = hashes[email];
    const ok = await bcrypt.compare(pass, hash);
    console.log(email, ok ? 'MATCH' : 'FAIL');
  }
})();

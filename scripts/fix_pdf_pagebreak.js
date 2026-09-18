const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /margin:\s*0\.5,/;
const replacement = `margin:       0.5,
          pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] },`;

code = code.replace(regex, replacement);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed PDF page breaks');
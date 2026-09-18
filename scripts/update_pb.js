const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');
code = code.replace(/margin:\s*0\.5,/, "margin: 0.5, pagebreak: { mode: ['avoid-all', 'css'] },");
fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');

const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// Replace the light gray text color with dark gray
code = code.replace(/<div style=\{\{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' \}\}>/g, `<div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>`);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed text color');

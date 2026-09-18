const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /<div style=\{\{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px', marginBottom: '24px', margin: '0 32px 32px 32px' \}\}>/g;
const replacement = `<div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px', marginBottom: '24px' }}>`;

code = code.replace(regex, replacement);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed margin');
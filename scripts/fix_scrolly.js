const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /html2canvas:\s*\{ scale: 2, useCORS: true \}/g;
const replacement = `html2canvas:  { scale: 2, useCORS: true, scrollY: 0, y: 0 }`;

code = code.replace(regex, replacement);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed scrollY bug');
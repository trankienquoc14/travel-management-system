const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// Fix the ID element width
const oldWrapper = `<div id="ticket-content-to-pdf" style={{ display: 'block', width: '100%' }}>`;
const newWrapper = `<div id="ticket-content-to-pdf" style={{ display: 'block', width: '700px', margin: '0 auto' }}>`;

code = code.replace(oldWrapper, newWrapper);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed ticket width for PDF');

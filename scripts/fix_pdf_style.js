const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /className="print-modal" style=\{\{ position: 'relative', /g;
const replacement = `className="print-modal html2pdf__page-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid', position: 'relative', `;

code = code.replace(regex, replacement);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Added pageBreakInside to inline style');
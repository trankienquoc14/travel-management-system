const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Update html2canvas opt
const optRegex = /html2canvas:\s*\{\s*scale:\s*2,\s*useCORS:\s*true\s*\}/;
code = code.replace(optRegex, "html2canvas:  { scale: 2, useCORS: true, scrollY: 0, y: 0 }");

// 2. Add pagebreak avoid and margin bottom to tickets
const ticketRegex = /className="print-modal" style=\{\{ position: 'relative', background: '#fff', display: 'flex', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba\(0,0,0,0\.3\)', overflow: 'hidden', width: '100%', marginBottom: '24px' \}\}/;
code = code.replace(ticketRegex, `className="print-modal" style={{ position: 'relative', background: '#fff', display: 'flex', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden', width: '100%', marginBottom: '24px', pageBreakInside: 'avoid', breakInside: 'avoid' }}`);

// 3. Make ticket-content-to-pdf a block wrapper so html2canvas doesn't freak out
const wrapperRegex = /<div id="ticket-content-to-pdf" style=\{\{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', alignItems: 'center' \}\}>/;
code = code.replace(wrapperRegex, `<div id="ticket-content-to-pdf" style={{ display: 'block', width: '100%' }}>`);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Applied gentle PDF fix');

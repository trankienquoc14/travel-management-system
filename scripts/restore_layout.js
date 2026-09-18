const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Revert the wrapper
const wrapperRegex = /<div id="ticket-content-to-pdf" style=\{\{ display: "block", width: "100%" \}\}>/g;
code = code.replace(wrapperRegex, `<div id="ticket-content-to-pdf" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', alignItems: 'center' }}>`);

// 2. Revert the ticket wrapper
const ticketRegex = /className="print-modal" style=\{\{ pageBreakInside: 'avoid', breakInside: 'avoid', position: 'relative', background: '#fff', display: 'table', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba\(0,0,0,0\.3\)', overflow: 'hidden', width: '100%', marginBottom: '40px' \}\}>/g;
code = code.replace(ticketRegex, `className="print-modal" style={{ position: 'relative', background: '#fff', display: 'flex', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden', width: '100%', marginBottom: '24px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>`);

// 3. Revert Left Side
const leftRegex = /\{\/\* Left Side \(Main\) \*\/\}\s*<div style=\{\{ display: 'table-cell', verticalAlign: 'top', padding: '32px', borderRight: '2px dashed #cbd5e1', position: 'relative' \}\}>/g;
code = code.replace(leftRegex, `{/* Left Side (Main) */}
                            <div style={{ flex: 1, padding: '32px', borderRight: '2px dashed #cbd5e1', position: 'relative' }}>`);

// 4. Revert Right Side
const rightRegex = /\{\/\* Right Side \(QR\) \*\/\}\s*<div style=\{\{ display: 'table-cell', verticalAlign: 'middle', width: '240px', background: '#f8fafc', padding: '32px', textAlign: 'center' \}\}>/g;
code = code.replace(rightRegex, `{/* Right Side (QR) */}
                            <div style={{ width: '240px', background: '#f8fafc', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>`);

// 5. Revert QR wrapper
const qrWrapperRegex = /<div style=\{\{ width: '150px', height: '150px', background: '#fff', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba\(0,0,0,0\.05\)', marginLeft: 'auto', marginRight: 'auto' \}\}>/g;
code = code.replace(qrWrapperRegex, `<div style={{ width: '150px', height: '150px', background: '#fff', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>`);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Restored original layout');
const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Remove html2pdf__page-break
code = code.replace(/className="print-modal html2pdf__page-break"/g, 'className="print-modal"');

// 2. Change the wrapper from flex to block
const wrapperRegex = /<div id="ticket-content-to-pdf" style=\{\{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', alignItems: 'center' \}\}>/g;
code = code.replace(wrapperRegex, '<div id="ticket-content-to-pdf" style={{ display: "block", width: "100%" }}>');

// 3. Change ticket from flex to table
const ticketRegex = /className="print-modal" style=\{\{ pageBreakInside: 'avoid', breakInside: 'avoid', position: 'relative', background: '#fff', display: 'flex', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba\(0,0,0,0\.3\)', overflow: 'hidden', width: '100%', marginBottom: '24px' \}\}>/g;
code = code.replace(ticketRegex, `className="print-modal" style={{ pageBreakInside: 'avoid', breakInside: 'avoid', position: 'relative', background: '#fff', display: 'table', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden', width: '100%', marginBottom: '40px' }}>`); // Increased marginBottom to 40px

// 4. Change Left Side
const leftRegex = /\{\/\* Left Side \(Main\) \*\/\}\s*<div style=\{\{ flex: 1, padding: '32px', borderRight: '2px dashed #cbd5e1', position: 'relative' \}\}>/g;
code = code.replace(leftRegex, `{/* Left Side (Main) */}
                            <div style={{ display: 'table-cell', verticalAlign: 'top', padding: '32px', borderRight: '2px dashed #cbd5e1', position: 'relative' }}>`);

// 5. Change Right Side
const rightRegex = /\{\/\* Right Side \(QR\) \*\/\}\s*<div style=\{\{ width: '240px', background: '#f8fafc', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' \}\}>/g;
code = code.replace(rightRegex, `{/* Right Side (QR) */}
                            <div style={{ display: 'table-cell', verticalAlign: 'middle', width: '240px', background: '#f8fafc', padding: '32px', textAlign: 'center' }}>`);

// 6. Right Side flex items need adjustment since we removed flex.
// They had:
// <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Mã đặt chỗ / PNR</div>
// <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '1px' }}>...</div>
// <div style={{ ... }}>Đã thanh toán</div>
// We can just use block centering.
// Actually, `textAlign: 'center'` is enough for text. For the QR code image, it's inside a `div`. Let's center it.
const qrWrapperRegex = /<div style=\{\{ width: '150px', height: '150px', background: '#fff', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba\(0,0,0,0\.05\)' \}\}>/g;
code = code.replace(qrWrapperRegex, `<div style={{ width: '150px', height: '150px', background: '#fff', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginLeft: 'auto', marginRight: 'auto' }}>`);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed PDF layout to table');
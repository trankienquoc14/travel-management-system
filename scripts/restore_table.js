const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Remove the wrapper and make print-modal display: table
const innerTicketRegex = /<div key=\{idx\} style=\{\{ pageBreakInside: 'avoid', breakInside: 'avoid', marginBottom: '24px' \}\}>\s*<div className="print-modal" style=\{\{ position: 'relative', background: '#fff', display: 'flex', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba\(0,0,0,0\.3\)', overflow: 'hidden', width: '100%' \}\}>/g;
const innerTicketReplacement = `<div key={idx} className="print-modal" style={{ pageBreakInside: 'avoid', breakInside: 'avoid', position: 'relative', background: '#fff', display: 'table', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden', width: '100%', marginBottom: '40px' }}>`;
code = code.replace(innerTicketRegex, innerTicketReplacement);

// Fix the closing divs
const endRegex = /<\/div>\s*<\/div>\s*\}\)\}\s*<\/div>\s*\{\/\* Actions \(no-print\) \*\/\}/g;
const endReplacement = `</div>\n                            ))}\n                        </div>\n\n                        {/* Actions (no-print) */}`;
code = code.replace(endRegex, endReplacement);

// 2. Change Left Side
const leftRegex = /\{\/\* Left Side \(Main\) \*\/\}\s*<div style=\{\{ flex: 1, padding: '32px', borderRight: '2px dashed #cbd5e1', position: 'relative' \}\}>/g;
const leftReplacement = `{/* Left Side (Main) */}
                            <div style={{ display: 'table-cell', verticalAlign: 'top', padding: '32px', borderRight: '2px dashed #cbd5e1', position: 'relative', width: 'auto' }}>`;
code = code.replace(leftRegex, leftReplacement);

// 3. Change Right Side
const rightRegex = /\{\/\* Right Side \(QR\) \*\/\}\s*<div style=\{\{ width: '240px', background: '#f8fafc', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' \}\}>/g;
const rightReplacement = `{/* Right Side (QR) */}
                            <div style={{ display: 'table-cell', verticalAlign: 'middle', width: '240px', background: '#f8fafc', padding: '32px', textAlign: 'center' }}>`;
code = code.replace(rightRegex, rightReplacement);

// 4. Change QR centering
const qrWrapperRegex = /<div style=\{\{ width: '150px', height: '150px', background: '#fff', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba\(0,0,0,0\.05\)' \}\}>/g;
const qrWrapperReplacement = `<div style={{ width: '150px', height: '150px', background: '#fff', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginLeft: 'auto', marginRight: 'auto' }}>`;
code = code.replace(qrWrapperRegex, qrWrapperReplacement);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Restored table layout');
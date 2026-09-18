const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const wrapperRegex = /<div id="ticket-content-to-pdf" style=\{\{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', alignItems: 'center' \}\}>/g;
code = code.replace(wrapperRegex, `<div id="ticket-content-to-pdf" style={{ display: 'block', width: '100%' }}>`);

const innerRegex = /<div key=\{idx\} className="print-modal" style=\{\{ position: 'relative', background: '#fff', display: 'flex', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba\(0,0,0,0\.3\)', overflow: 'hidden', width: '100%', marginBottom: '24px', pageBreakInside: 'avoid', breakInside: 'avoid' \}\}>/g;

const innerReplacement = `<div key={idx} style={{ pageBreakInside: 'avoid', breakInside: 'avoid', marginBottom: '24px' }}>
                                <div className="print-modal" style={{ position: 'relative', background: '#fff', display: 'flex', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden', width: '100%' }}>`;

code = code.replace(innerRegex, innerReplacement);

const endRegex = /<\/div>\s*\}\)\}\s*<\/div>\s*\{\/\* Actions \(no-print\) \*\/\}/g;
const endReplacement = `</div>\n</div>\n                            ))}\n                        </div>\n\n                        {/* Actions (no-print) */}`;
code = code.replace(endRegex, endReplacement);


fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Wrapped tickets in block container');
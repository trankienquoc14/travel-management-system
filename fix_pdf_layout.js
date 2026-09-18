const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Fix handleDownloadPDF
const optRegex = /html2canvas: \{ scale: 2, useCORS: true, scrollY: 0, y: 0, windowWidth: 800 \},/;
if (code.match(optRegex)) {
    code = code.replace(optRegex, "html2canvas: { scale: 2, useCORS: true, scrollY: 0, y: 0, windowWidth: 900 },");
}

// 2. Fix Flex Layout and Dotted line
// Left Side
const leftSideRegex = /<div style=\{\{ flex: 1, padding: '32px 36px', display: 'flex', flexDirection: 'column', background: '#ffffff' \}\}>/;
if (code.match(leftSideRegex)) {
    code = code.replace(leftSideRegex, "<div style={{ width: '560px', padding: '32px 36px', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>");
}

// Dotted Divider
const dottedRegex = /\{\/\* Dotted Divider \*\/\}\s*<div style=\{\{ width: '2px', background: 'repeating-linear-gradient\(to bottom, #cbd5e1 0, #cbd5e1 8px, transparent 8px, transparent 16px\)' \}\}><\/div>/;
const newDotted = `{/* Dotted Divider */}
                                        <div style={{ width: '0', borderLeft: '3px dashed #cbd5e1' }}></div>`;
if (code.match(dottedRegex)) {
    code = code.replace(dottedRegex, newDotted);
}

// Right Side
const rightSideRegex = /<div style=\{\{ width: '240px', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' \}\}>/;
if (code.match(rightSideRegex)) {
    code = code.replace(rightSideRegex, "<div style={{ width: '240px', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', boxSizing: 'border-box' }}>");
}

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed PDF rendering bugs');

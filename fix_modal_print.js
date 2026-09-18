const fs = require('fs');

let jsx = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Wrapper
jsx = jsx.replace(
    /<div style=\{\{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba\(15, 23, 42, 0\.85\)', backdropFilter: 'blur\(10px\)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 \}\}>/,
    '<div className="ticket-modal-wrapper" style={{ position: \'fixed\', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: \'rgba(15, 23, 42, 0.85)\', backdropFilter: \'blur(10px)\', display: \'flex\', alignItems: \'center\', justifyContent: \'center\', zIndex: 99999 }}>'
);

// 2. Content
jsx = jsx.replace(
    /<div style=\{\{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', alignItems: 'center', maxHeight: '100vh', overflowY: 'auto', padding: '20px' \}\}>/,
    '<div className="ticket-modal-content" style={{ width: \'100%\', maxWidth: \'900px\', display: \'flex\', flexDirection: \'column\', alignItems: \'center\', maxHeight: \'100vh\', overflowY: \'auto\', padding: \'20px\' }}>'
);

// 3. Buttons Footer
jsx = jsx.replace(
    /\{\/\* Buttons Footer \*\/\}\s*<div style=\{\{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '32px' \}\}>/,
    '{/* Buttons Footer */}\n                        <div className="no-print" style={{ display: \'flex\', justifyContent: \'center\', gap: \'16px\', marginTop: \'32px\' }}>'
);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', jsx, 'utf8');

// UPDATE CSS
let css = fs.readFileSync('frontend/src/index.css', 'utf8');

const printRegex = /@media print \{[\s\S]*?\}/;
const newPrintCSS = `@media print {
    @page { margin: 1cm; }
    body * { visibility: hidden; }
    
    .ticket-modal-wrapper, .ticket-modal-wrapper * { visibility: visible; }
    .no-print, .no-print * { display: none !important; }
    
    .ticket-modal-wrapper {
        position: static !important;
        display: block !important;
        background: transparent !important;
        padding: 0 !important;
    }
    
    .ticket-modal-content {
        display: block !important;
        max-height: none !important;
        overflow: visible !important;
        padding: 0 !important;
        margin: 0 !important;
    }
    
    #ticket-content-to-pdf {
        display: block !important;
    }
    
    .print-modal {
        page-break-inside: avoid;
        break-inside: avoid;
        width: 100% !important;
        max-width: none !important;
        margin: 0 auto 20px auto !important;
        border: 2px solid #cbd5e1 !important;
        border-radius: 20px !important;
        box-shadow: none !important;
    }
    
    .html2pdf__page-break {
        page-break-before: always;
        break-before: page;
        height: 0;
        margin: 0;
    }
    ::-webkit-scrollbar { display: none; }
}`;

css = css.replace(printRegex, newPrintCSS);
fs.writeFileSync('frontend/src/index.css', css, 'utf8');

console.log('Fixed Modal Print Alignment and Buttons');

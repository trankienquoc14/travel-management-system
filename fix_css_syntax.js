const fs = require('fs');
let code = fs.readFileSync('frontend/src/index.css', 'utf8');

const printIndex = code.indexOf('@media print');
if (printIndex !== -1) {
    code = code.substring(0, printIndex);
}

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
}
`;

fs.writeFileSync('frontend/src/index.css', code + '\n' + newPrintCSS, 'utf8');
console.log('Fixed CSS syntax');

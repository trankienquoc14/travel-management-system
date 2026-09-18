const fs = require('fs');
let code = fs.readFileSync('frontend/src/index.css', 'utf8');

// Find the first index of @media print
const printIndex = code.indexOf('@media print');
let nonPrintCSS = code;
if (printIndex !== -1) {
    nonPrintCSS = code.substring(0, printIndex);
}

const properPrintCSS = `
@media print {
    @page {
        margin: 1cm;
    }
    body * {
        visibility: hidden;
    }
    #ticket-content-to-pdf, #ticket-content-to-pdf * {
        visibility: visible;
    }
    #ticket-content-to-pdf {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
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
        position: relative !important;
    }
    .html2pdf__page-break {
        page-break-before: always;
        break-before: page;
        height: 0;
        margin: 0;
    }
    .no-print, .no-print * {
        display: none !important;
    }
    ::-webkit-scrollbar {
        display: none;
    }
}
`;

fs.writeFileSync('frontend/src/index.css', nonPrintCSS.trim() + '\n' + properPrintCSS, 'utf8');
console.log('Fixed CSS');

const fs = require('fs');
let code = fs.readFileSync('frontend/src/index.css', 'utf8');

const regex = /#ticket-content-to-pdf \{\s*position: absolute;\s*left: 0;\s*top: 0;\s*width: 100%;\s*display: block !important;\s*\}/;

const newCSS = `#ticket-content-to-pdf {
        width: 100%;
        display: block !important;
        position: relative !important;
    }`;

code = code.replace(regex, newCSS);

// Also remove body * { visibility: hidden } because we now use display:none
code = code.replace(/body \* \{\s*visibility: hidden;\s*\}/, '');
code = code.replace(/#ticket-content-to-pdf, #ticket-content-to-pdf \* \{\s*visibility: visible;\s*\}/, '');

fs.writeFileSync('frontend/src/index.css', code, 'utf8');
console.log('Fixed CSS absolute positioning');

const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Add import
if(!code.includes("import CustomerFooter from './CustomerFooter';")) {
    code = code.replace(
        "import CustomerNavbar from './CustomerNavbar';",
        "import CustomerNavbar from './CustomerNavbar';\nimport CustomerFooter from './CustomerFooter';"
    );
}

// 2. Replace hardcoded footer
const footerStart = '<footer className="home-footer';
const footerEnd = '</footer>';
const startIndex = code.indexOf(footerStart);
if (startIndex !== -1) {
    const endIndex = code.indexOf(footerEnd, startIndex) + footerEnd.length;
    const oldFooter = code.substring(startIndex, endIndex);
    code = code.replace(oldFooter, '<CustomerFooter />');
}

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');

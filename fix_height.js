const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/HomePage.jsx', 'utf8');

// For Promo and Tour slider cards
code = code.replace(
    /minWidth: '280px', maxWidth: '320px', flex: '1 0 auto', scrollSnapAlign: 'start',/g, 
    "minWidth: '280px', maxWidth: '320px', flex: '1 0 auto', scrollSnapAlign: 'start', height: '100%',"
);

// Allow 3 lines for titles to prevent overflow
code = code.replace(/WebkitLineClamp: 2/g, "WebkitLineClamp: 3");
code = code.replace(/height: '42px'/g, "height: '64px'");

fs.writeFileSync('frontend/src/components/HomePage.jsx', code, 'utf8');
console.log('Fixed card height successfully');

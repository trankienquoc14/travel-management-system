const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/HomePage.jsx', 'utf8');

code = code.replace(
    "if (!url) return 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2000';",
    "if (!url || url === 'undefined' || url === 'null') return 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2000';"
);

fs.writeFileSync('frontend/src/components/HomePage.jsx', code, 'utf8');
console.log('Fixed getImageUrl successfully');

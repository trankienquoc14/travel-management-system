const fs = require('fs');
let c = fs.readFileSync('src/components/TourDetail.jsx', 'utf8');

c = c.replace(/dateObj\.getTime\(\)/g, 'd.getTime()');

fs.writeFileSync('src/components/TourDetail.jsx', c);
console.log('Fixed d.getTime()');

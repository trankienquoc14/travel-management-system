const fs = require('fs');
let c = fs.readFileSync('src/components/TourOperationalManager.jsx', 'utf8');

c = c.replace(
    "overflow: 'hidden' }}\n                    {!selectedTour ? (",
    "overflow: 'hidden' }}>\n                    {!selectedTour ? ("
);

fs.writeFileSync('src/components/TourOperationalManager.jsx', c);
console.log('Fixed missing >');

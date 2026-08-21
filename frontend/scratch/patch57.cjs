const fs = require('fs');
let c = fs.readFileSync('src/components/TourOperationalManager.jsx', 'utf8');

c = c.replace(
    "</span>\n                    </h3>\n                    <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px', paddingRight: '0' }}>",
    "</span>\n                    </h3>\n</div>\n                    <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px', paddingRight: '0' }}>"
);

fs.writeFileSync('src/components/TourOperationalManager.jsx', c);
console.log('Fixed missing div');

const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/TourOperationalManager.jsx', 'utf8');

content = content.replace(
    "<div style={{ flex: '0 0 160px', display: 'flex', flexDirection: 'column', gap: '6px' }}>",
    "<div style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', gap: '6px' }}>"
);

content = content.replace(
    "<span style={{ color: '#64748b', fontSize: '12px' }}>(Hòa vốn: {minPax})</span>",
    "<span style={{ color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>(Hòa vốn: {minPax})</span>"
);

fs.writeFileSync('frontend/src/components/TourOperationalManager.jsx', content, 'utf8');

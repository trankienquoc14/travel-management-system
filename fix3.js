const fs = require('fs');
const lines = fs.readFileSync('frontend/src/components/Dashboard.jsx', 'utf8').split('\n');

lines[496] = "                    <span style={{ fontSize: '10px', color: '#64748b' }}>{isServiceRequestGroupOpen ? '▲' : '▼'}</span>";
lines[495] = "                    <span>📦 QUẢN LÝ YÊU CẦU</span>";
lines[480] = lines[480].replace(/isRequestGroupOpen/g, 'isServiceRequestGroupOpen');
lines[499] = lines[499].replace('isRequestGroupOpen', 'isServiceRequestGroupOpen');

fs.writeFileSync('frontend/src/components/Dashboard.jsx', lines.join('\n'));
console.log('Fixed');

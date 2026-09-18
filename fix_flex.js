const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

code = code.replace(/display: 'table-cell', verticalAlign: 'top'/g, "display: 'flex', flexDirection: 'column', flex: 1");

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed flex child');

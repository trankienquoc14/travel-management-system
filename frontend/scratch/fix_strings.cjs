const fs = require('fs');
let c = fs.readFileSync('src/components/BookingForm.jsx', 'utf8');
c = c.split('\\`').join('`');
c = c.split('\\$').join('$');
fs.writeFileSync('src/components/BookingForm.jsx', c);
console.log('Fixed');

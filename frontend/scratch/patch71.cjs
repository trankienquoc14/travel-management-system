const fs = require('fs');
let c = fs.readFileSync('src/components/BookingForm.jsx', 'utf8');
c = c.replace(/\\n\};\\n\\nexport default BookingForm;\\n/g, '');
c = c.trim() + '\n};\n\nexport default BookingForm;\n';
fs.writeFileSync('src/components/BookingForm.jsx', c);
console.log('Fixed properly');

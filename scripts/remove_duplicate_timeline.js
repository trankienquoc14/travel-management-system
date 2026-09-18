const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /\s*\{\/\* Timeline \*\/\}\s*\{!detailBooking\.isService && \(\s*<div style=\{\{ display: 'flex'[\s\S]*?Hoàn thành' \} \]\.map[\s\S]*?<\/div>\s*\)\}\s*(?=\{\/\* Status Bar \*\/\})/;

code = code.replace(regex, "\n                            ");

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Removed duplicate timeline');
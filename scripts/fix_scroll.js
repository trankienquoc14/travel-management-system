const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /backgroundColor: 'rgba\(15, 23, 42, 0\.7\)', backdropFilter: 'blur\(8px\)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px'/;
const replacement = `backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 10000, padding: '40px 20px', overflowY: 'auto'`;

code = code.replace(regex, replacement);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed modal scrolling');
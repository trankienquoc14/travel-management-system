const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const target = `<strong style={{ fontSize: '20px', color: '#059669', fontWeight: '800' }}>{formatCurrency(detailBooking.total_amount)}</strong>`;
const replacement = `<strong style={{ fontSize: '20px', color: '#059669', fontWeight: '800', whiteSpace: 'nowrap', textAlign: 'right' }}>{formatCurrency(detailBooking.total_amount)}</strong>`;

code = code.replace(target, replacement);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed wrap');
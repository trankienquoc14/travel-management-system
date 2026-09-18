const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /<div style=\{\{ fontSize: '28px', color: '#0f172a', fontWeight: '900', marginBottom: '16px' \}\}>#\{ticketBooking\.booking_id\}<\/div>/g;
const newStr = `<div style={{ fontSize: '28px', color: '#0f172a', fontWeight: '900', marginBottom: '16px' }}>#{ticketBooking.booking_id}-{idx + 1}</div>`;

if (code.match(regex)) {
    code = code.replace(regex, newStr);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Fixed PNR code');
} else {
    console.log('Regex failed');
}

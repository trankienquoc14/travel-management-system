const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /<div style=\{\{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' \}\}>([\s\S]*?)<div style=\{\{ fontSize: '17px', color: '#3b82f6', fontWeight: '700' \}\}>\{depTime\} \| \{formatDate\(ticketBooking\.departure_date\)\}<\/div>([\s\S]*?)<div style=\{\{ fontSize: '17px', color: '#0f172a', fontWeight: '700' \}\}>\{depLoc\}<\/div>/;

const newStr = `<div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '28px' }}>$1<div style={{ fontSize: '16px', color: '#3b82f6', fontWeight: '700', whiteSpace: 'nowrap' }}>{depTime} | {formatDate(ticketBooking.departure_date)}</div>$2<div style={{ fontSize: '16px', color: '#0f172a', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{depLoc}</div>`;

if (code.match(regex)) {
    code = code.replace(regex, newStr);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Fixed Grid wrapping');
} else {
    console.log('Regex failed');
}

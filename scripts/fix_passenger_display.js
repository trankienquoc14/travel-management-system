const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /<div style=\{\{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '4px' \}\}>Hành khách: \{detailBooking\.customer_name \|\| 'Khách hàng'\}<\/div>/;
const replacement = `<div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>Hành khách: {detailBooking.customer_name || 'Khách hàng'} {detailBooking.num_people > 1 ? \`(và \${detailBooking.num_people - 1} khách khác)\` : ''}</div>`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
}

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed passenger display in modal');
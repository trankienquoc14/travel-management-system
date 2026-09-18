const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regexName = /<div style=\{\{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '4px' \}\}>\{ticketBooking\.customer_name \|\| 'Khách hàng'\}<\/div>/g;
const replacementName = `<div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{ticketBooking.num_people > 1 ? (idx === 0 ? \`\${ticketBooking.customer_name || 'Khách hàng'} (Đại diện)\` : \`\${ticketBooking.customer_name || 'Khách hàng'} (Khách \${idx + 1})\`) : (ticketBooking.customer_name || 'Khách hàng')}</div>`;
code = code.replace(regexName, replacementName);

// Let's also check if I missed replacing the PNR. Actually the PNR is already updated because it says #3-2 and #3-3.
// But the QR Code URL might be cached by the browser because of the identical URL? No, the URL is different: ...data=TRAVELVN-TICKET-3-1 vs 3-2.
// Let's add a random nonce or timestamp to the QR code URL to prevent caching.
const regexQR = /`https:\/\/api\.qrserver\.com\/v1\/create-qr-code\/\?size=150x150&data=TRAVELVN-TICKET-\$\{ticketBooking\.booking_id\}\$\{ticketBooking\.num_people > 1 \? `-\$\{idx \+ 1\}` : ''\}`/g;
const replacementQR = `\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TRAVELVN-TICKET-\${ticketBooking.booking_id}\${ticketBooking.num_people > 1 ? \`-\${idx + 1}\` : ''}&t=\${Date.now()}\``;
code = code.replace(regexQR, replacementQR);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed passenger name and QR cache');
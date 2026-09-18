const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regexTicket = /<div id="ticket-content-to-pdf" className="print-modal" style=\{\{ position: 'relative'([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*\{\/\* Actions \(no-print\) \*\/\}/;

const innerTicket = `<div id="ticket-content-to-pdf" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', alignItems: 'center' }}>
                            {Array.from({ length: ticketBooking.num_people || 1 }).map((_, idx) => (
                                <div key={idx} className="print-modal" style={{ position: 'relative'$1</div>
                            </div>
                        </div>
                            ))}
                        </div>

                        {/* Actions (no-print) */}`;

code = code.replace(regexTicket, innerTicket);

// Now I need to inject the "(Khách idx+1)" if there is more than 1 ticket.
// Inside the ticket, the name is rendered as {ticketBooking.customer_name}
// Let's replace {ticketBooking.customer_name} with {idx === 0 ? ticketBooking.customer_name : \`\${ticketBooking.customer_name} (Khách \${idx + 1})\`}
// Wait, the regex replace above might not be enough because the exact code for customer_name is:
// <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{ticketBooking.customer_name}</div>
const regexName = /<div style=\{\{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '4px' \}\}>\{ticketBooking\.customer_name\}<\/div>/g;
const replacementName = `<div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{ticketBooking.num_people > 1 ? (idx === 0 ? \`\${ticketBooking.customer_name} (Đại diện)\` : \`\${ticketBooking.customer_name} (Khách \${idx + 1})\`) : ticketBooking.customer_name}</div>`;
code = code.replace(regexName, replacementName);

// Also update the PNR code to be #3-1, #3-2 etc.
const regexPNR = /<div style=\{\{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '1px' \}\}>#\{ticketBooking\.booking_id\}<\/div>/g;
const replacementPNR = `<div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '1px' }}>#{ticketBooking.booking_id}{ticketBooking.num_people > 1 ? \`-\${idx + 1}\` : ''}</div>`;
code = code.replace(regexPNR, replacementPNR);

// And update the QR code data to include the index
const regexQRData = /data=TRAVELVN-TICKET-\$\{ticketBooking\.booking_id\}/g;
const replacementQRData = `data=TRAVELVN-TICKET-\${ticketBooking.booking_id}\${ticketBooking.num_people > 1 ? \`-\${idx + 1}\` : ''}`;
code = code.replace(regexQRData, replacementQRData);


fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Modified tickets to print array');
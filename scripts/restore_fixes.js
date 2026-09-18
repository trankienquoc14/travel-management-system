const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Array loop and passenger mapping
const regexTicket = /<div id="ticket-content-to-pdf" className="print-modal" style=\{\{ position: 'relative'([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*\{\/\* Actions \(no-print\) \*\/\}/;
const innerTicket = `<div id="ticket-content-to-pdf" style={{ display: 'block', width: '100%' }}>
                            {Array.from({ length: ticketBooking.num_people || 1 }).map((_, idx) => (
                                <div key={idx} className="print-modal" style={{ position: 'relative'$1</div>
                            </div>
                        </div>
                            ))}
                        </div>

                        {/* Actions (no-print) */}`;
if (code.match(regexTicket)) {
    code = code.replace(regexTicket, innerTicket);
}

const regexName = /<div style=\{\{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '4px' \}\}>\{ticketBooking\.customer_name \|\| 'Khách hàng'\}<\/div>/g;
const replacementName = `<div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{(() => {
                                            const pList = ticketBooking.passengers_list ? ticketBooking.passengers_list.split('||') : [];
                                            if (pList[idx]) return pList[idx];
                                            return ticketBooking.num_people > 1 ? (idx === 0 ? \`\${ticketBooking.customer_name || 'Khách hàng'} (Đại diện)\` : \`\${ticketBooking.customer_name || 'Khách hàng'} (Khách \${idx + 1})\`) : (ticketBooking.customer_name || 'Khách hàng');
                                        })()}</div>`;
code = code.replace(regexName, replacementName);

const regexPNR = /<div style=\{\{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '1px' \}\}>#\{ticketBooking\.booking_id\}<\/div>/g;
const replacementPNR = `<div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '1px' }}>#{ticketBooking.booking_id}{ticketBooking.num_people > 1 ? \`-\${idx + 1}\` : ''}</div>`;
code = code.replace(regexPNR, replacementPNR);

const regexQRData = /\?size=150x150&data=TRAVELVN-TICKET-\$\{ticketBooking\.booking_id\}/g;
const replacementQRData = `?size=150x150&data=TRAVELVN-TICKET-\${ticketBooking.booking_id}\${ticketBooking.num_people > 1 ? \`-\${idx + 1}\` : ''}&t=\${Date.now()}`;
code = code.replace(regexQRData, replacementQRData);


// 2. Fix scrollY bug
const regexScroll = /html2canvas:\s*\{ scale: 2, useCORS: true \}/g;
const replacementScroll = `html2canvas:  { scale: 2, useCORS: true, scrollY: 0, y: 0 }`;
code = code.replace(regexScroll, replacementScroll);

// 3. Fix pageBreakInside on ticket
const regexStyle = /className="print-modal" style=\{\{ position: 'relative', /g;
const replacementStyle = `className="print-modal" style={{ pageBreakInside: 'avoid', breakInside: 'avoid', position: 'relative', `;
code = code.replace(regexStyle, replacementStyle);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Restored MyBookings.jsx fixes');
const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /\{ticketBooking\.num_people > 1 \? \(idx === 0 \? \`\$\{ticketBooking\.customer_name \|\| 'Khách hàng'\} \(Đại diện\)\` : \`\$\{ticketBooking\.customer_name \|\| 'Khách hàng'\} \(Khách \$\{idx \+ 1\}\)\`\) : \(ticketBooking\.customer_name \|\| 'Khách hàng'\)\}/;
const replacement = `{(() => {
                                            const pList = ticketBooking.passengers_list ? ticketBooking.passengers_list.split('||') : [];
                                            if (pList[idx]) return pList[idx];
                                            return ticketBooking.num_people > 1 ? (idx === 0 ? \`\${ticketBooking.customer_name || 'Khách hàng'} (Đại diện)\` : \`\${ticketBooking.customer_name || 'Khách hàng'} (Khách \${idx + 1})\`) : (ticketBooking.customer_name || 'Khách hàng');
                                        })()}`;

code = code.replace(regex, replacement);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Modified MyBookings.jsx to use passenger list');
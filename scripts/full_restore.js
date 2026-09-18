const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Add import html2pdf
if (!code.includes('import html2pdf')) {
    code = code.replace(/import CustomerNavbar from '.\/CustomerNavbar';/, "import CustomerNavbar from './CustomerNavbar';\nimport html2pdf from 'html2pdf.js';");
}

// 2. Add handleDownloadPDF
if (!code.includes('const handleDownloadPDF')) {
    const fn = `    const handleDownloadPDF = () => {
        const element = document.getElementById('ticket-content-to-pdf');
        if (!element) return;
        const opt = {
          margin:       0.5,
          pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] },
          filename:     \`Ve_Dien_Tu_\${ticketBooking.booking_id}.pdf\`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, scrollY: 0, windowWidth: document.documentElement.offsetWidth, windowHeight: document.documentElement.offsetHeight },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };\n\n`;
    code = code.replace(/const \[selectedBooking, setSelectedBooking\] = useState\(null\);/, fn + "    const [selectedBooking, setSelectedBooking] = useState(null);");
}

// 3. Update button
code = code.replace(/onClick=\{\(\) => window.print\(\)\}/g, "onClick={handleDownloadPDF}");

// 4. Update the wrapper to display block to prevent flex stretch
const wrapperRegex = /<div id="ticket-content-to-pdf" className="print-modal" style=\{\{ position: 'relative'([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*\{\/\* Actions \(no-print\) \*\/\}/;
const innerTicket = `<div id="ticket-content-to-pdf" style={{ display: 'block', width: '100%' }}>
                            {Array.from({ length: ticketBooking.num_people || 1 }).map((_, idx) => (
                                <div key={idx} style={{ pageBreakInside: 'avoid', breakInside: 'avoid', marginBottom: '24px' }}>
                                    <div className="print-modal" style={{ position: 'relative'$1</div>
                                </div>
                            </div>
                        </div>
                                </div>
                            ))}
                        </div>

                        {/* Actions (no-print) */}`;
if (code.match(wrapperRegex)) {
    code = code.replace(wrapperRegex, innerTicket);
}

// 5. Update names
const regexName = /<div style=\{\{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '4px' \}\}>\{ticketBooking\.customer_name \|\| 'Khách hàng'\}<\/div>/g;
const replacementName = `<div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{(() => {
                                            const pList = ticketBooking.passengers_list ? ticketBooking.passengers_list.split('||') : [];
                                            if (pList[idx]) return pList[idx];
                                            return ticketBooking.num_people > 1 ? (idx === 0 ? \`\${ticketBooking.customer_name || 'Khách hàng'} (Đại diện)\` : \`\${ticketBooking.customer_name || 'Khách hàng'} (Khách \${idx + 1})\`) : (ticketBooking.customer_name || 'Khách hàng');
                                        })()}</div>`;
code = code.replace(regexName, replacementName);

// 6. Update PNR
const regexPNR = /<div style=\{\{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '1px' \}\}>#\{ticketBooking\.booking_id\}<\/div>/g;
const replacementPNR = `<div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '1px' }}>#{ticketBooking.booking_id}{ticketBooking.num_people > 1 ? \`-\${idx + 1}\` : ''}</div>`;
code = code.replace(regexPNR, replacementPNR);

// 7. Update QR
const regexQRData = /\?size=150x150&data=TRAVELVN-TICKET-\$\{ticketBooking\.booking_id\}/g;
const replacementQRData = `?size=150x150&data=TRAVELVN-TICKET-\${ticketBooking.booking_id}\${ticketBooking.num_people > 1 ? \`-\${idx + 1}\` : ''}&t=\${Date.now()}`;
code = code.replace(regexQRData, replacementQRData);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fully restored!');
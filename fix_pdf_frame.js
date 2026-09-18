const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /<div id="ticket-content-to-pdf" style=\{\{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' \}\}>([\s\S]*?)return \(\s*<div key=\{idx\} className=\{`print-modal \$\{idx > 0 && idx % 2 === 0 \? 'html2pdf__page-break' : ''\}`\} style=\{\{ display: 'flex', background: '#fff', borderRadius: '20px', overflow: 'hidden', width: '100%', maxWidth: '800px', margin: '0 auto', boxShadow: '0 15px 35px rgba\(0,0,0,0\.15\)' \}\}>/;

const newStr = `<div id="ticket-content-to-pdf" style={{ display: 'block', width: '100%' }}>
                            {Array.from({ length: ticketBooking.num_people || 1 }).map((_, idx) => {
                                let depLoc = 'Hồ Chí Minh';
                                let depTime = '06:00 AM';
                                try {
                                    if (ticketBooking.design_data) {
                                        const d = typeof ticketBooking.design_data === 'string' ? JSON.parse(ticketBooking.design_data) : ticketBooking.design_data;
                                        if (d.departureCity) depLoc = d.departureCity;
                                        if (d.startTime) depTime = d.startTime;
                                    } else if (ticketBooking.requirements) {
                                        const r = typeof ticketBooking.requirements === 'string' ? JSON.parse(ticketBooking.requirements) : ticketBooking.requirements;
                                        if (r.departureCity) depLoc = r.departureCity;
                                        if (r.startTime) depTime = r.startTime;
                                    }
                                } catch(e) {}

                                return (
                                    <React.Fragment key={idx}>
                                        {idx > 0 && idx % 2 === 0 && <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', height: '0', margin: '0' }}></div>}
                                        <div className="print-modal" style={{ display: 'flex', background: '#fff', borderRadius: '20px', overflow: 'hidden', width: '100%', maxWidth: '800px', margin: '0 auto 32px auto', border: '2px solid #cbd5e1', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}>`;

if (code.match(regex)) {
    code = code.replace(regex, newStr);
    
    // Add import React if missing
    if (!code.includes("import React")) {
        code = code.replace("import {", "import React, {");
    }
    
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Fixed PDF page break and frame');
} else {
    console.log('Regex failed');
}

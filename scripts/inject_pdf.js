const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Add import html2pdf
const importStr = "import html2pdf from 'html2pdf.js';";
if (!code.includes(importStr)) {
    code = code.replace("import React, { useEffect, useState } from 'react';", "import React, { useEffect, useState } from 'react';\n" + importStr);
}

// 2. Add handleDownloadPDF function inside MyBookings
const funcStr = `
    const handleDownloadPDF = () => {
        const element = document.getElementById('ticket-content-to-pdf');
        if (!element) return;
        const opt = {
          margin:       0.5,
          filename:     \`Ve_Dien_Tu_\${ticketBooking.booking_id}.pdf\`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };
`;
if (!code.includes('handleDownloadPDF')) {
    code = code.replace("const [ticketBooking, setTicketBooking] = useState(null);", "const [ticketBooking, setTicketBooking] = useState(null);\n" + funcStr);
}

// 3. Add id="ticket-content-to-pdf" to print-modal
const regexModal = /<div className="print-modal"/;
code = code.replace(regexModal, '<div id="ticket-content-to-pdf" className="print-modal"');

// 4. Update the "Tải PDF" button
const regexBtn = /<button onClick=\{\(\) => window\.print\(\)\} style=\{\{ padding: '12px 32px', background: '#0f172a'[\s\S]*?📥 Tải PDF\s*<\/button>/s;
const newBtn = `<button onClick={handleDownloadPDF} style={{ padding: '12px 32px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(15,23,42,0.3)' }} title="Tải trực tiếp file PDF về máy">
            📥 Tải PDF
        </button>`;

code = code.replace(regexBtn, newBtn);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Injected html2pdf');
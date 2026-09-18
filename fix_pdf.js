const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// Fix handleDownloadPDF
const oldHandleDownloadPDF = `    const handleDownloadPDF = () => {
        const element = document.getElementById('ticket-content-to-pdf');
        if (!element) return;
        const opt = {
          margin: 0.5, pagebreak: { mode: ['avoid-all', 'css'] },
          pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] },
          filename:     \`Ve_Dien_Tu_\${ticketBooking.booking_id}.pdf\`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, scrollY: 0, y: 0 },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };`;

const newHandleDownloadPDF = `    const handleDownloadPDF = () => {
        const element = document.getElementById('ticket-content-to-pdf');
        if (!element) return;
        const opt = {
          margin: [0.5, 0.5, 0.5, 0.5],
          pagebreak:    { mode: ['css', 'legacy'] },
          filename:     \`Ve_Dien_Tu_\${ticketBooking.booking_id}.pdf\`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, scrollY: 0, y: 0, windowWidth: 800 },
          jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };`;

code = code.replace(oldHandleDownloadPDF, newHandleDownloadPDF);

// Replace the hardcoded html2pdf__page-break class on every ticket
const oldTicketClass = `className="print-modal html2pdf__page-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid', position: 'relative',`;
const newTicketClass = `className={\`print-modal \${idx > 0 && idx % 2 === 0 ? 'html2pdf__page-break' : ''}\`} style={{ pageBreakInside: 'avoid', breakInside: 'avoid', position: 'relative',`;

code = code.replace(oldTicketClass, newTicketClass);

// Wait, I should double check if oldTicketClass exactly matches.
// Let me use regex if it fails.
if (!code.includes("className={`print-modal ${idx > 0 && idx % 2 === 0 ? 'html2pdf__page-break' : ''}`}")) {
    code = code.replace(/className="print-modal html2pdf__page-break" style=\{\{ pageBreakInside: 'avoid', breakInside: 'avoid', position: 'relative',/g, newTicketClass);
}

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed PDF download page break and format');

const fs = require('fs');

const css = `
@media print {
    body * {
        visibility: hidden;
    }
    .print-modal, .print-modal * {
        visibility: visible;
    }
    .print-modal {
        position: absolute;
        left: 0;
        top: 0;
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        transform: none !important;
    }
    .no-print {
        display: none !important;
    }
    /* Hide scrollbars during print */
    ::-webkit-scrollbar {
        display: none;
    }
}
`;

fs.appendFileSync('frontend/src/index.css', css, 'utf8');

let jsx = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');
// Add class to the modal
jsx = jsx.replace(
    `<div style={{ backgroundColor: '#ffffff', borderRadius: '28px', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', position: 'relative' }}>`,
    `<div className="print-modal" style={{ backgroundColor: '#ffffff', borderRadius: '28px', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', position: 'relative' }}>`
);

// Hide close buttons
jsx = jsx.replace(
    `<button onClick={() => setDetailBooking(null)} style={{ padding: '10px 24px', background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>`,
    `<button className="no-print" onClick={() => setDetailBooking(null)} style={{ padding: '10px 24px', background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>`
);

// Also the top-right X button
jsx = jsx.replace(
    `<button \n                                onClick={() => setDetailBooking(null)}`,
    `<button className="no-print"\n                                onClick={() => setDetailBooking(null)}`
);
jsx = jsx.replace(
    `<button \r\n                                onClick={() => setDetailBooking(null)}`,
    `<button className="no-print"\r\n                                onClick={() => setDetailBooking(null)}`
);

// And the IN VE button
jsx = jsx.replace(
    `🖨️ IN VÉ\n                                    </button>`,
    `🖨️ IN VÉ\n                                    </button>` // Actually I'll use regex for IN VE button
);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', jsx, 'utf8');
console.log('Added print CSS');
const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Replace the "Xem vé điện tử" button in detailBooking modal
const regexBtn = /\{\!detailBooking\.isService && <button onClick=\{\(\) => setTicketBooking\(detailBooking\)\}.*?>\s*🎟️ Xem vé điện tử\s*<\/button>\}/s;
const replacementBtn = `{!detailBooking.isService && detailBooking.booking_status !== 'Cancelled' && detailBooking.payment_status !== 'Unpaid' && (
    <button onClick={() => setTicketBooking(detailBooking)} style={{ padding: '10px 24px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {detailBooking.payment_status === 'Paid' && detailBooking.booking_status === 'Pending' ? '🎫 Xem phiếu tạm' : '🎟️ Xem vé điện tử'}
    </button>
)}`;

code = code.replace(regexBtn, replacementBtn);

// 2. Modify E-Ticket Pass title
const regexTitle = /<div style=\{\{ fontSize: '12px', color: '#64748b', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '4px' \}\}>E-Ticket Pass<\/div>/s;
const replacementTitle = `<div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '4px' }}>
    {ticketBooking.payment_status === 'Paid' && ticketBooking.booking_status === 'Pending' ? 'PHIẾU TẠM / PROVISIONAL' : 'E-TICKET PASS'}
</div>`;

code = code.replace(regexTitle, replacementTitle);

// 3. QR Code logic
const regexQR = /<div style=\{\{ width: '130px', height: '130px', background: '#fff', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px', boxShadow: '0 4px 6px -1px rgba\(0,0,0,0\.05\)' \}\}>\s*<img src=\{`https:\/\/api\.qrserver\.com\/v1\/create-qr-code\/\?size=150x150&data=TRAVELVN-TICKET-\$\{ticketBooking\.booking_id\}`\} alt="QR Code" style=\{\{ width: '100%', height: '100%' \}\} \/>\s*<\/div>/s;
const replacementQR = `{ticketBooking.booking_status === 'Pending' ? (
    <div style={{ width: '130px', height: '130px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '16px', borderRadius: '12px', border: '1px dashed #cbd5e1', marginBottom: '16px', color: '#64748b', fontSize: '11px', fontWeight: '700' }}>
        CHỜ XÁC NHẬN<br/>ĐỂ CẤP QR
    </div>
) : ticketBooking.booking_status === 'Completed' ? (
    <div style={{ width: '130px', height: '130px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '16px', borderRadius: '12px', border: '2px solid #ef4444', marginBottom: '16px', color: '#b91c1c', fontSize: '20px', fontWeight: '900', transform: 'rotate(-10deg)' }}>
        ĐÃ<br/>SỬ DỤNG
    </div>
) : (
    <div style={{ width: '130px', height: '130px', background: '#fff', padding: '8px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TRAVELVN-TICKET-\${ticketBooking.booking_id}\`} alt="QR Code" style={{ width: '100%', height: '100%' }} />
    </div>
)}`;

code = code.replace(regexQR, replacementQR);

// 4. Print buttons logic
const regexPrintButtons = /<button onClick=\{\(\) => window\.print\(\)\} style=\{\{ padding: '12px 32px', background: '#0284c7'[\s\S]*?Tải PDF\s*<\/button>/s;
const replacementPrintButtons = `{ticketBooking.booking_status !== 'Pending' && (
    <>
        <button onClick={() => window.print()} style={{ padding: '12px 32px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(2,132,199,0.3)' }}>
            🖨️ In vé
        </button>
        <button onClick={() => window.print()} style={{ padding: '12px 32px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(15,23,42,0.3)' }} title="Lưu lại dưới dạng PDF (chọn Save as PDF khi in)">
            📥 Tải PDF
        </button>
    </>
)}`;

code = code.replace(regexPrintButtons, replacementPrintButtons);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Applied logic updates');
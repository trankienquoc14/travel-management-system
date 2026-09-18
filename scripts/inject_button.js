const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /Đóng cửa sổ\s*<\/button>/;
const replacement = `Đóng cửa sổ
                            </button>
                            {!detailBooking.isService && <button onClick={() => setTicketBooking(detailBooking)} style={{ padding: '10px 24px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                🎟️ Xem vé điện tử
                            </button>}`;

if (code.match(regex)) {
    // Only replace the first match which is in detailBooking
    code = code.replace(regex, replacement);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Injected button');
} else {
    console.log('Regex missed');
}
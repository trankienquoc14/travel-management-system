const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /\{!detailBooking\.isService && \(\s*<button onClick=\{\(\) => setTicketBooking\(detailBooking\)\} style=\{\{ padding: '10px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' \}\}>\s*<i className="fas fa-print"><\/i> In Vé Điện Tử\s*<\/button>\s*\)\}/;

const newStr = `{!detailBooking.isService && detailBooking.payment_status === 'Paid' && (
                                <button onClick={() => setTicketBooking(detailBooking)} style={{ padding: '10px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-print"></i> In Vé Điện Tử
                                </button>
                            )}`;

if (code.match(regex)) {
    code = code.replace(regex, newStr);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Fixed detail footer button properly this time!');
} else {
    console.log('Regex failed');
}

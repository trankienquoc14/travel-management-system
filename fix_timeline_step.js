const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /let currentStep = 1;[\s\S]*?if \(bookingStatus === 'Confirmed' \|\| bookingStatus === 'Completed'\) currentStep = 2;/;

const newStr = `let currentStep = 2; // Mặc định là đã xác nhận
    let isCancelled = bookingStatus === 'Cancelled';

    if (isCancelled) {
        // Special render for cancelled
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 0 0 6px #fee2e2' }}>
                        <i className="fas fa-times"></i>
                    </div>
                    <span style={{ color: '#ef4444', fontWeight: '700', fontSize: '14px' }}>Đã hủy</span>
                </div>
            </div>
        );
    }`;

if (code.match(regex)) {
    code = code.replace(regex, newStr);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Fixed timeline default step');
} else {
    console.log('Regex failed');
}

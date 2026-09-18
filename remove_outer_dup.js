const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /\{!detailBooking\.isService && \(\s*<div style=\{\{ display: 'flex', justifyContent: 'space-between' \}\}>\s*<span style=\{\{ color: '#64748b' \}\}>Bảo hiểm du lịch:<\/span>\s*<strong style=\{\{ color: '#10b981' \}\}>Đã bao gồm \(Free\)<\/strong>\s*<\/div>\s*\)\}\s*<div style=\{\{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed #e2e8f0' \}\}>([\s\S]*?)<\/strong>\s*<\/div>\s*<\/div>\s*<\/div>/;

if (code.match(regex)) {
    code = code.replace(regex, `
                                        {/* Removed duplicate outer billing details */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px' }}>
                                            <span style={{ color: '#64748b' }}>Phương thức thanh toán:</span>
                                            <strong style={{ color: '#0f172a' }}>
                                                {String(detailBooking.payment_method || '').toLowerCase() === 'bank_transfer' ? 'Chuyển khoản' : 
                                                 String(detailBooking.payment_method || '').toLowerCase() === 'momo' ? 'Ví MoMo' : 
                                                 String(detailBooking.payment_method || '').toLowerCase() === 'cash' ? 'Tiền mặt' :
                                                 String(detailBooking.payment_method || '').toLowerCase() === 'vnpay' ? 'VNPay' :
                                                 detailBooking.payment_method || (detailBooking.payment_status === 'Paid' ? 'Đã thanh toán (N/A)' : 'Chưa thanh toán')}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
    `);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Removed duplicate outer billing details');
} else {
    console.log('Regex did not match');
}

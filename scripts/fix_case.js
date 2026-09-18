const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /\{detailBooking\.payment_method === 'bank_transfer' \? 'Chuyển khoản' : \n\s*detailBooking\.payment_method === 'momo' \? 'Ví MoMo' : \n\s*detailBooking\.payment_method === 'cash' \? 'Tiền mặt' :\n\s*detailBooking\.payment_method === 'vnpay' \? 'VNPay' :\n\s*detailBooking\.payment_method \|\| 'Chưa thanh toán'\}/g;

const replacement = `{String(detailBooking.payment_method || '').toLowerCase() === 'bank_transfer' ? 'Chuyển khoản' : 
                                                 String(detailBooking.payment_method || '').toLowerCase() === 'momo' ? 'Ví MoMo' : 
                                                 String(detailBooking.payment_method || '').toLowerCase() === 'cash' ? 'Tiền mặt' :
                                                 String(detailBooking.payment_method || '').toLowerCase() === 'vnpay' ? 'VNPay' :
                                                 detailBooking.payment_method || (detailBooking.payment_status === 'Paid' ? 'Đã thanh toán (N/A)' : 'Chưa thanh toán')}`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Fixed case sensitivity for payment method');
} else {
    console.log('Regex did not match');
}
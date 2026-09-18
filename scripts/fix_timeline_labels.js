const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regexTimeline = /const steps = \[\s*\{\s*label: 'Đã đặt'[\s\S]*?\];/;

const newSteps = `const steps = [
                                        { label: 'Đã đặt', active: true },
                                        { label: 'Đã thanh toán', active: ['Paid', 'Refunded'].includes(detailBooking.payment_status) },
                                        { label: 'Đã xác nhận', active: ['Confirmed', 'Completed'].includes(detailBooking.booking_status) },
                                        { label: 'Hoàn thành', active: detailBooking.booking_status === 'Completed' }
                                    ];`;

if (code.match(regexTimeline)) {
    code = code.replace(regexTimeline, newSteps);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Fixed Timeline labels');
} else {
    console.log('Regex did not match');
}
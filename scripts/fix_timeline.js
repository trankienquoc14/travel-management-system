const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const targetStr = `{[
                                        { label: 'Đã đặt', active: true },
                                        { label: 'Thanh toán', active: detailBooking.payment_status === 'Paid' || detailBooking.payment_status === 'Refunded' },
                                        { label: 'Xác nhận', active: ['Confirmed', 'Completed'].includes(detailBooking.booking_status) },
                                        { label: 'Hoàn thành', active: detailBooking.booking_status === 'Completed' }
                                    ]`;

const replacementStr = `{[
                                        { label: 'Đã đặt', active: true },
                                        { label: 'Xác nhận', active: ['Confirmed', 'Completed'].includes(detailBooking.booking_status) },
                                        { label: 'Sẵn sàng', active: ['Confirmed', 'Completed'].includes(detailBooking.booking_status) && ['Paid', 'Refunded'].includes(detailBooking.payment_status) },
                                        { label: 'Hoàn thành', active: detailBooking.booking_status === 'Completed' }
                                    ]`;

code = code.replace(targetStr, replacementStr);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed Timeline logic');
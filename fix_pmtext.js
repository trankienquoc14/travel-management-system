const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

code = code.replace(/const getPaymentMethod = \(\) => \{[\s\S]*?\};\s*const pmText = getPaymentMethod\(\);/, '');

const newPm = `{(() => {
                                                const m = String(detailBooking.payment_method || '').toLowerCase();
                                                if (m === 'bank_transfer') return 'Chuyển khoản';
                                                if (m === 'momo') return 'Ví MoMo';
                                                if (m === 'cash') return 'Tiền mặt';
                                                if (m === 'vnpay') return 'VNPay';
                                                return detailBooking.payment_method || (detailBooking.payment_status === 'Paid' ? 'Đã thanh toán (N/A)' : 'Chưa thanh toán');
                                            })()}`;

code = code.replace('{pmText}', newPm);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed pmText reference error');

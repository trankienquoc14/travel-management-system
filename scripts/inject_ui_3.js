const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const replacement = `<strong style={{ color: '#10b981' }}>Đã bao gồm (Free)</strong>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed #e2e8f0' }}>
                                            <span style={{ color: '#64748b' }}>Phương thức thanh toán:</span>
                                            <strong style={{ color: '#0f172a' }}>
                                                {detailBooking.payment_method === 'bank_transfer' ? 'Chuyển khoản' : 
                                                 detailBooking.payment_method === 'momo' ? 'Ví MoMo' : 
                                                 detailBooking.payment_method === 'cash' ? 'Tiền mặt' :
                                                 detailBooking.payment_method === 'vnpay' ? 'VNPay' :
                                                 detailBooking.payment_method || 'Chưa thanh toán'}
                                            </strong>
                                        </div>`;

code = code.replace(/<strong style=\{\{ color: '#10b981' \}\}>Đã bao gồm \(Free\)<\/strong>\s*<\/div>\s*\)\}/, replacement);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Done replacement 3');
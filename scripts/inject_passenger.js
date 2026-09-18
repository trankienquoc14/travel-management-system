const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const targetStr = `                                            <strong style={{ fontSize: '20px', color: '#059669', fontWeight: '800', whiteSpace: 'nowrap', textAlign: 'right' }}>{formatCurrency(detailBooking.total_amount)}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>`;

const replacement = targetStr + `
                            
                            {/* Khối Thông Tin Khách Hàng */}
                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px', marginBottom: '24px' }}>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                    👤 Thông Tin Người Đặt
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '14px' }}>
                                    <div>
                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', marginBottom: '4px' }}>HỌ VÀ TÊN</span>
                                        <strong style={{ color: '#0f172a' }}>{detailBooking.customer_name || 'N/A'}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', marginBottom: '4px' }}>SỐ ĐIỆN THOẠI</span>
                                        <strong style={{ color: '#0f172a' }}>{detailBooking.customer_phone || 'N/A'}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', marginBottom: '4px' }}>EMAIL LIÊN HỆ</span>
                                        <strong style={{ color: '#0f172a', wordBreak: 'break-word' }}>{detailBooking.customer_email || 'N/A'}</strong>
                                    </div>
                                </div>
                            </div>
`;

code = code.replace(targetStr, replacement);
fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Injected Passenger Info');
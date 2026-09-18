const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const targetStr = `{/* Timeline */}
                            {!detailBooking.isService && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative', padding: '0 20px' }}>
                                    <div style={{ position: 'absolute', top: '16px', left: '40px', right: '40px', height: '2px', background: '#e2e8f0', zIndex: 0 }}></div>
                                    
                                    {[
                                        { label: 'Đã đặt', active: true },
                                        { label: 'Thanh toán', active: detailBooking.payment_status === 'Paid' || detailBooking.payment_status === 'Refunded' },
                                        { label: 'Xác nhận', active: ['Confirmed', 'Completed'].includes(detailBooking.booking_status) },
                                        { label: 'Hoàn thành', active: detailBooking.booking_status === 'Completed' }
                                    ].map((step, idx) => (
                                        <div key={idx} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: '#fff', padding: '0 8px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: step.active ? '#059669' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '14px', border: '4px solid #fff', boxShadow: step.active ? '0 0 0 2px #d1fae5' : 'none' }}>
                                                {step.active ? '✓' : idx + 1}
                                            </div>
                                            <span style={{ fontSize: '12px', fontWeight: '700', color: step.active ? '#059669' : '#94a3b8' }}>{step.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, "");
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Successfully removed duplicate timeline');
} else {
    console.log('Target string not found');
}

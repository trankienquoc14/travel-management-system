const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regexTimeline = /\{\/\*\s*Timeline\s*\*\/\}\s*\{\!detailBooking\.isService && \(\s*<div[^>]*>[\s\S]*?<\/div>\s*\)\}/;

const newTimeline = `
                            {/* Timeline */}
                            {!detailBooking.isService && (
                                (() => {
                                    const steps = [
                                        { label: 'Đã đặt', active: true },
                                        { label: 'Xác nhận', active: ['Confirmed', 'Completed'].includes(detailBooking.booking_status) },
                                        { label: 'Sẵn sàng', active: (['Confirmed', 'Completed'].includes(detailBooking.booking_status) && ['Paid', 'Refunded'].includes(detailBooking.payment_status)) || detailBooking.booking_status === 'Completed' },
                                        { label: 'Hoàn thành', active: detailBooking.booking_status === 'Completed' }
                                    ];
                                    const activeCount = steps.filter(s => s.active).length;
                                    const progressPercent = ((activeCount - 1) / (steps.length - 1)) * 100;
                                    
                                    return (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', position: 'relative', padding: '0 20px' }}>
                                            <div style={{ position: 'absolute', top: '16px', left: '40px', right: '40px', height: '2px', background: '#e2e8f0', zIndex: 0 }}>
                                                <div style={{ width: \`\${progressPercent}%\`, height: '100%', background: '#059669', transition: 'width 0.5s ease' }}></div>
                                            </div>
                                            
                                            {steps.map((step, idx) => (
                                                <div key={idx} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: '#fff', padding: '0 8px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: step.active ? '#059669' : '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '14px', border: '4px solid #fff', boxShadow: step.active ? '0 0 0 2px #d1fae5' : 'none', transition: 'all 0.3s ease' }}>
                                                        {step.active ? '✓' : idx + 1}
                                                    </div>
                                                    <span style={{ fontSize: '12px', fontWeight: '700', color: step.active ? '#059669' : '#94a3b8' }}>{step.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()
                            )}
`;

if (code.match(regexTimeline)) {
    code = code.replace(regexTimeline, newTimeline);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Fixed Timeline completely');
} else {
    console.log('Regex did not match');
}

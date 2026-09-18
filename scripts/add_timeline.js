const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /\{\/\* Status Bar \*\/\}/;
const timelineUI = `
                            {/* Visual Timeline */}
                            <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '16px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: '50%', left: '40px', right: '40px', height: '2px', background: '#e2e8f0', zIndex: 0, transform: 'translateY(-50%)' }}></div>
                                    
                                    {(() => {
                                        const steps = [
                                            { id: 'Pending', label: 'Chờ xử lý' },
                                            { id: 'Confirmed', label: 'Đã xác nhận' },
                                            { id: 'Paid', label: 'Đã thanh toán' },
                                            { id: 'Completed', label: 'Hoàn thành' }
                                        ];
                                        
                                        // Determine current step index based on status
                                        let currentIndex = 0;
                                        const status = detailBooking.isService ? detailBooking.status : detailBooking.booking_status;
                                        const payment = detailBooking.payment_status;
                                        
                                        if (status === 'Cancelled') currentIndex = -1;
                                        else if (status === 'Completed') currentIndex = 3;
                                        else if (payment === 'Paid') currentIndex = 2;
                                        else if (status === 'Confirmed') currentIndex = 1;
                                        else currentIndex = 0;

                                        return steps.map((step, idx) => {
                                            const isCompleted = currentIndex >= idx;
                                            const isCurrent = currentIndex === idx;
                                            
                                            return (
                                                <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, gap: '8px' }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: isCompleted ? '#10b981' : '#fff', border: isCompleted ? '2px solid #10b981' : '2px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isCompleted ? '#fff' : '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}>
                                                        {isCompleted ? '✓' : idx + 1}
                                                    </div>
                                                    <span style={{ fontSize: '13px', fontWeight: isCurrent ? '700' : '500', color: isCurrent ? '#0f172a' : '#64748b' }}>
                                                        {step.label}
                                                    </span>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                            
                            {/* Status Bar */}`;

if (!code.includes('Visual Timeline')) {
    code = code.replace(regex, timelineUI);
}

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Added Timeline');
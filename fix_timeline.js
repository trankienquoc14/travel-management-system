const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// Insert renderTimeline function
const renderTimelineFunc = `
const renderTimeline = (bookingStatus, paymentStatus) => {
    let currentStep = 1;
    let isCancelled = bookingStatus === 'Cancelled';

    if (isCancelled) {
        // Special render for cancelled
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 0 0 6px #fee2e2' }}>
                        <i className="fas fa-times"></i>
                    </div>
                    <span style={{ color: '#ef4444', fontWeight: '700', fontSize: '14px' }}>Đã hủy</span>
                </div>
            </div>
        );
    }

    if (bookingStatus === 'Confirmed' || bookingStatus === 'Completed') currentStep = 2;
    if (paymentStatus === 'Paid') currentStep = 3;
    if (bookingStatus === 'Completed') currentStep = 4;

    // Steps definition
    const steps = [
        { label: 'Đã đặt' },
        { label: 'Đã xác nhận' },
        { label: 'Đã thanh toán' },
        { label: 'Hoàn thành' }
    ];

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 40px', width: '100%', boxSizing: 'border-box' }}>
            {steps.map((step, index) => {
                const stepNum = index + 1;
                const isCompleted = currentStep >= stepNum;
                const isPastCompleted = currentStep > stepNum;
                
                return (
                    <React.Fragment key={index}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 2, width: '80px' }}>
                            {isCompleted ? (
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#588b6b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', boxShadow: '0 0 0 6px #eefdf4' }}>
                                    ✓
                                </div>
                            ) : (
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#cbd5e1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700' }}>
                                    {stepNum}
                                </div>
                            )}
                            <span style={{ color: isCompleted ? '#588b6b' : '#94a3b8', fontWeight: '700', fontSize: '13px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                {step.label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div style={{ flex: 1, height: '2px', backgroundColor: isPastCompleted ? '#588b6b' : '#e2e8f0', margin: '0 8px', transform: 'translateY(-16px)' }}></div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};
`;

if (!code.includes('const renderTimeline')) {
    code = code.replace(/const renderStatusBadge =/, renderTimelineFunc + '\n    const renderStatusBadge =');
}

// Replace the old Status Bar with the Timeline
const oldStatusBarRegex = /\{\/\* Status Bar \*\/\}\s*<div style=\{\{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#f8fafc', borderRadius: '16px', marginBottom: '24px', border: '1px solid #e2e8f0' \}\}>\s*<div style=\{\{ display: 'flex', gap: '12px', alignItems: 'center' \}\}>\s*<span style=\{\{ fontWeight: '700', fontSize: '14px', color: '#475569' \}\}>TRẠNG THÁI:<\/span>[\s\S]*?<\/div>\s*<\/div>/;

const newTimeline = `{/* Status Bar Timeline */}
                            <div style={{ background: '#ffffff', borderRadius: '16px', marginBottom: '24px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                {renderTimeline(detailBooking.isService ? detailBooking.status : detailBooking.booking_status, detailBooking.payment_status)}
                            </div>`;

if (code.match(oldStatusBarRegex)) {
    code = code.replace(oldStatusBarRegex, newTimeline);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Fixed timeline');
} else {
    console.log('Regex failed');
}

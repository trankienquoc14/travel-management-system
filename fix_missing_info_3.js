const fs = require('fs');
const lines = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8').split('\n');

let foundIndex = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('SỐ HÀNH KHÁCH')) {
        foundIndex = i;
        break;
    }
}

if (foundIndex !== -1) {
    // Replace `{detailBooking.num_people} Người lớn / Trẻ em`
    lines[foundIndex + 1] = `                                                    <strong style={{ color: '#0f172a' }}>{renderPaxSummary(detailBooking)}</strong>`;
    
    // Insert the button 3 lines down (after </div>)
    const buttonHtml = `
                                                {detailBooking.departure_id && (
                                                    <div style={{ marginTop: '16px' }}>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setItineraryModalBooking(detailBooking);
                                                            }}
                                                            style={{ display: 'inline-block', width: '100%', padding: '10px 0', textAlign: 'center', background: '#f8fafc', color: '#0284c7', borderRadius: '8px', fontWeight: '700', textDecoration: 'none', fontSize: '13px', transition: 'all 0.2s', border: '1px solid #cbd5e1', cursor: 'pointer' }} 
                                                            onMouseEnter={(e) => {e.target.style.background = '#e2e8f0'; e.target.style.borderColor = '#94a3b8';}} 
                                                            onMouseLeave={(e) => {e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#cbd5e1';}}
                                                        >
                                                            <i className="fas fa-external-link-alt" style={{ marginRight: '6px' }}></i> Xem chi tiết lịch trình
                                                        </button>
                                                    </div>
                                                )}`;
    lines.splice(foundIndex + 3, 0, buttonHtml);
    
    // Insert departure location and time
    let destIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('ĐIỂM ĐẾN')) {
            destIndex = i;
            break;
        }
    }
    
    if (destIndex !== -1) {
        const locHtml = `                                                {(() => {
                                                    let departureLocation = null;
                                                    let departureTime = null;
                                                    try {
                                                        if (detailBooking.design_data) {
                                                            const d = typeof detailBooking.design_data === 'string' ? JSON.parse(detailBooking.design_data) : detailBooking.design_data;
                                                            if (d.departureCity) departureLocation = d.departureCity;
                                                            if (d.startTime) departureTime = d.startTime;
                                                        } else if (detailBooking.requirements) {
                                                            const r = typeof detailBooking.requirements === 'string' ? JSON.parse(detailBooking.requirements) : detailBooking.requirements;
                                                            if (r.departureCity) departureLocation = r.departureCity;
                                                            if (r.startTime) departureTime = r.startTime;
                                                        }
                                                    } catch(e) {}
                                                    
                                                    if (!departureLocation && !departureTime) return null;
                                                    return (
                                                        <>
                                                            {departureLocation && (
                                                                <div>
                                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>ĐỊA ĐIỂM XUẤT PHÁT</span>
                                                                    <strong style={{ color: '#0f172a' }}>{departureLocation}</strong>
                                                                </div>
                                                            )}
                                                            {departureTime && (
                                                                <div>
                                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>GIỜ KHỞI HÀNH</span>
                                                                    <strong style={{ color: '#0f172a' }}>{departureTime}</strong>
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()}`;
        lines.splice(destIndex - 1, 0, locHtml);
    }
    
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', lines.join('\n'), 'utf8');
    console.log('Fixed using array manipulation');
} else {
    console.log('Failed');
}

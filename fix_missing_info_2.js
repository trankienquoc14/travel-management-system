const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const targetStr = `                                                <div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>SỐ HÀNH KHÁCH</span>
                                                    <strong style={{ color: '#0f172a' }}>{detailBooking.num_people} Người lớn / Trẻ em</strong>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>`;

const newStr = `                                                <div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>SỐ HÀNH KHÁCH</span>
                                                    <strong style={{ color: '#0f172a' }}>{renderPaxSummary(detailBooking)}</strong>
                                                </div>
                                                
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
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, newStr);
    
    // Also inject Địa điểm xuất phát and Giờ khởi hành
    const locTimeTarget = `                                                <div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>ĐIỂM ĐẾN</span>`;
    
    const locTimeNew = `                                                {(() => {
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
                                                })()}
                                                <div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>ĐIỂM ĐẾN</span>`;
    
    code = code.replace(locTimeTarget, locTimeNew);

    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Fixed missing pax summary, button, and locations');
} else {
    console.log('Regex failed');
}

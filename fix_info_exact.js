const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// The goal is to replace the "Thông Tin Lịch Trình" block with the new layout.
// Start of block: <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
// End of block: {/* Column 2:

const startMarker = `<h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                        {detailBooking.isService ? '🛎️ Thông Tin Dịch Vụ' : '🗺️ Thông Tin Lịch Trình'}`;
const startIdx = code.indexOf(startMarker);

const endMarker = `{/* Column 2:`;
const endIdx = code.indexOf(endMarker, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const modernInfo = `<h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                        {detailBooking.isService ? '🛎️ Thông Tin Dịch Vụ' : '🗺️ Thông Tin Lịch Trình'}
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                                        {(() => {
                                            if (detailBooking.isService) {
                                                return (
                                                    <>
                                                        <div>
                                                            <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Loại dịch vụ</span>
                                                            <strong style={{ color: '#0f172a' }}>{detailBooking.service_type}</strong>
                                                        </div>
                                                        <div>
                                                            <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Ngày sử dụng</span>
                                                            <strong style={{ color: '#0284c7' }}>{formatDate(detailBooking.usage_date)}</strong>
                                                        </div>
                                                        <div>
                                                            <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Số lượng yêu cầu</span>
                                                            <strong style={{ color: '#0f172a' }}>{detailBooking.quantity} {detailBooking.unit}</strong>
                                                        </div>
                                                    </>
                                                );
                                            }

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
                                            
                                            if (!departureLocation) departureLocation = 'Hồ Chí Minh';
                                            if (!departureTime) departureTime = '06:00 AM';

                                            return (
                                                <>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>ĐỊA ĐIỂM XUẤT PHÁT</span>
                                                        <strong style={{ color: '#1e293b' }}>{departureLocation}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>GIỜ KHỞI HÀNH</span>
                                                        <strong style={{ color: '#1e293b' }}>{departureTime}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>ĐIỂM ĐẾN</span>
                                                        <strong style={{ color: '#1e293b' }}>{detailBooking.destination || 'Việt Nam'}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>NGÀY KHỞI HÀNH</span>
                                                        <strong style={{ color: '#0284c7' }}>{formatDate(detailBooking.departure_date)}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>NGÀY KẾT THÚC DỰ KIẾN</span>
                                                        <strong style={{ color: '#1e293b' }}>{formatDate(detailBooking.return_date)}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>SỐ HÀNH KHÁCH</span>
                                                        <strong style={{ color: '#1e293b' }}>{renderPaxSummary(detailBooking)}</strong>
                                                    </div>
                                                    
                                                    {detailBooking.departure_id && (
                                                        <div style={{ marginTop: '16px' }}>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setItineraryModalBooking(detailBooking);
                                                                }}
                                                                style={{ display: 'inline-block', width: '100%', padding: '10px 0', textAlign: 'center', background: '#f8fafc', color: '#0284c7', borderRadius: '8px', fontWeight: '700', border: '1px solid #cbd5e1', cursor: 'pointer' }} 
                                                            >
                                                                <i className="fas fa-external-link-alt" style={{ marginRight: '6px' }}></i> Xem chi tiết lịch trình
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                `;
    
    code = code.substring(0, startIdx) + modernInfo + code.substring(endIdx);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Fixed Info Section perfectly');
} else {
    console.log('Could not find start or end index for info section');
}

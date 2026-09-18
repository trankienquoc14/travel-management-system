const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /<h4 style=\{\{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' \}\}>\s*\{detailBooking\.isService \? '🛎️ Thông Tin Dịch Vụ' : '🗺️ Thông Tin Lịch Trình'\}\s*<\/h4>\s*<div style=\{\{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' \}\}>[\s\S]*?\{\/\* Column 2: Thanh toán \& Khách hàng \*\/\}/;

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
                                            
                                            // Fallbacks if backend doesn't have it, hardcode as requested
                                            if (!departureLocation) departureLocation = 'Hồ Chí Minh';
                                            if (!departureTime) departureTime = '06:00 AM';

                                            return (
                                                <>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Địa điểm xuất phát</span>
                                                        <strong style={{ color: '#1e293b' }}>{departureLocation}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Giờ khởi hành</span>
                                                        <strong style={{ color: '#1e293b' }}>{departureTime}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Điểm đến</span>
                                                        <strong style={{ color: '#1e293b' }}>{detailBooking.destination || 'Việt Nam'}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Ngày khởi hành</span>
                                                        <strong style={{ color: '#0284c7' }}>{formatDate(detailBooking.departure_date)}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Ngày kết thúc dự kiến</span>
                                                        <strong style={{ color: '#1e293b' }}>{formatDate(detailBooking.return_date)}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Số hành khách</span>
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

                                {/* Column 2: Thanh toán & Khách hàng */}`;

if (code.match(regex)) {
    code = code.replace(regex, modernInfo);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Fixed regex');
} else {
    console.log('Regex failed');
}

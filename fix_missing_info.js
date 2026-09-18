const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const oldInfo = /<div style=\{\{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' \}\}>\s*\{detailBooking\.isService \? \([\s\S]*?<\/button>\s*<\/div>\s*\)\}\s*<\/>\s*\)\}\s*<\/div>\s*<\/div>\s*\{\/\* Column 2: Thanh Toán \*\/\}/;

const newInfo = `<div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                                        {(() => {
                                            if (detailBooking.isService) {
                                                return (
                                                    <>
                                                        <div>
                                                            <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>LOẠI DỊCH VỤ</span>
                                                            <strong style={{ color: '#0f172a' }}>{detailBooking.service_type}</strong>
                                                        </div>
                                                        <div>
                                                            <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>NGÀY SỬ DỤNG</span>
                                                            <strong style={{ color: '#0284c7' }}>{formatDate(detailBooking.usage_date)}</strong>
                                                        </div>
                                                        <div>
                                                            <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>SỐ LƯỢNG YÊU CẦU</span>
                                                            <strong style={{ color: '#0f172a' }}>{detailBooking.quantity} {detailBooking.unit}</strong>
                                                        </div>
                                                        {detailBooking.voucher_code && (
                                                            <div>
                                                                <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>MÃ VOUCHER</span>
                                                                <strong style={{ color: '#059669', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>{detailBooking.voucher_code}</strong>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            }

                                            let departureLocation = 'Hồ Chí Minh';
                                            let departureTime = '06:00 AM';
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

                                            return (
                                                <>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>ĐỊA ĐIỂM XUẤT PHÁT</span>
                                                        <strong style={{ color: '#0f172a' }}>{departureLocation}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>GIỜ KHỞI HÀNH</span>
                                                        <strong style={{ color: '#0f172a' }}>{departureTime}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>ĐIỂM ĐẾN</span>
                                                        <strong style={{ color: '#0f172a' }}>{detailBooking.destination || 'Việt Nam'}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>NGÀY KHỞI HÀNH</span>
                                                        <strong style={{ color: '#0284c7' }}>{formatDate(detailBooking.departure_date)}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>NGÀY KẾT THÚC DỰ KIẾN</span>
                                                        <strong style={{ color: '#0f172a' }}>{formatDate(detailBooking.return_date)}</strong>
                                                    </div>
                                                    <div>
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
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Column 2: Thanh Toán */}`;

if (code.match(oldInfo)) {
    code = code.replace(oldInfo, newInfo);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Fixed missing info');
} else {
    console.log('Regex failed');
}

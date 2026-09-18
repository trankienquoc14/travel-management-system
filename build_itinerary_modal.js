const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Add itineraryModalBooking state
const stateTarget = `const [selectedBooking, setSelectedBooking] = useState(null); // Modal Yêu cầu Hủy/Đổi lịch`;
const stateNew = `const [itineraryModalBooking, setItineraryModalBooking] = useState(null); // Modal Itinerary
    const [selectedBooking, setSelectedBooking] = useState(null); // Modal Yêu cầu Hủy/Đổi lịch`;
code = code.replace(stateTarget, stateNew);

// 2. Insert Button under SỐ HÀNH KHÁCH
const buttonTarget = `<strong style={{ color: '#0f172a' }}>{renderPaxSummary(detailBooking)}</strong>
                                                </div>`;
const buttonNew = `<strong style={{ color: '#0f172a' }}>{renderPaxSummary(detailBooking)}</strong>
                                                </div>
                                                
                                                {/* View Tour Button */}
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
code = code.replace(buttonTarget, buttonNew);

// 3. Add Modal at the end of the file, before final </div>
const modalTarget = `            {/* MODAL 2: YÊU CẦU HỦY / ĐỔI LỊCH */}`;
const modalNew = `            {/* MODAL 3: XEM CHI TIẾT LỊCH TRÌNH */}
            {itineraryModalBooking && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', width: '800px', maxWidth: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                                🗺️ Lịch trình: {itineraryModalBooking.tour_name}
                            </h3>
                            <button onClick={() => setItineraryModalBooking(null)} style={{ background: 'transparent', border: 'none', fontSize: '24px', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
                        </div>
                        <div style={{ padding: '32px', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}>
                            {(() => {
                                let days = [];
                                try {
                                    if (itineraryModalBooking.design_data) {
                                        const parsed = typeof itineraryModalBooking.design_data === 'string' ? JSON.parse(itineraryModalBooking.design_data) : itineraryModalBooking.design_data;
                                        if (parsed.itineraryDays) days = parsed.itineraryDays;
                                    } else if (itineraryModalBooking.requirements) {
                                        const reqs = typeof itineraryModalBooking.requirements === 'string' ? JSON.parse(itineraryModalBooking.requirements) : itineraryModalBooking.requirements;
                                        if (reqs.itinerary) days = reqs.itinerary;
                                    }
                                } catch(e) {}
                                
                                if (!days || days.length === 0) {
                                    return <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>Không tìm thấy chi tiết lịch trình. (Bạn vui lòng xem trong file PDF hoặc liên hệ tư vấn viên).</div>;
                                }

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {days.map((day, idx) => (
                                            <div key={idx} style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                                <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0284c7', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ background: '#e0f2fe', padding: '4px 12px', borderRadius: '20px', fontSize: '14px' }}>Ngày {day.day}</span>
                                                    {day.title}
                                                </h4>
                                                
                                                <div style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                                                    {day.description}
                                                </div>

                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                                    {day.activities && day.activities.length > 0 && (
                                                        <div style={{ flex: '1 1 300px', background: '#f1f5f9', padding: '16px', borderRadius: '12px' }}>
                                                            <div style={{ fontWeight: '700', color: '#334155', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <i className="fas fa-hiking" style={{ color: '#64748b' }}></i> Hoạt động
                                                            </div>
                                                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                {day.activities.map((act, i) => (
                                                                    <li key={i}>{act}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {day.meals && day.meals.length > 0 && (
                                                        <div style={{ flex: '1 1 300px', background: '#fdf4ff', padding: '16px', borderRadius: '12px' }}>
                                                            <div style={{ fontWeight: '700', color: '#86198f', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <i className="fas fa-utensils"></i> Bữa ăn
                                                            </div>
                                                            <div style={{ color: '#475569', fontSize: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                                {day.meals.map((meal, i) => (
                                                                    <span key={i} style={{ background: '#fae8ff', padding: '4px 12px', borderRadius: '8px', color: '#a21caf', fontWeight: '600' }}>{meal}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {day.accommodation && (
                                                        <div style={{ flex: '1 1 100%', background: '#fffbeb', padding: '16px', borderRadius: '12px', border: '1px solid #fef3c7' }}>
                                                            <div style={{ fontWeight: '700', color: '#b45309', marginBottom: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <i className="fas fa-hotel"></i> Lưu trú
                                                            </div>
                                                            <div style={{ color: '#78350f', fontSize: '14px', fontWeight: '500' }}>{day.accommodation}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: YÊU CẦU HỦY / ĐỔI LỊCH */}`;
code = code.replace(modalTarget, modalNew);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Itinerary modal built successfully');

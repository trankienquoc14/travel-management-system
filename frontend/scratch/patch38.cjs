const fs = require('fs');
let c = fs.readFileSync('src/components/TourDetail.jsx', 'utf8');

const targetId = `<div style={{ marginBottom: '40px' }}>
                        <h2 style={{ marginBottom: '20px', color: '#0f172a' }}>Lịch trình khởi hành</h2>`;
                        
c = c.replace(targetId, `<div id="lich-trinh-khoi-hanh" style={{ marginBottom: '40px' }}>
                        <h2 style={{ marginBottom: '20px', color: '#0f172a' }}>Lịch trình khởi hành</h2>`);

const targetSidebar = `                <div className="detail-sidebar">
                    <div className="booking-card">
                        <div className="price-tag">
                            <span>Giá từ</span>
                            <h3>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tour.base_price)}<small>/khách</small></h3>
                        </div>

                        <div className="form-group">
                            <label>Chọn ngày khởi hành:</label>
                            <select value={selectedDeparture} onChange={(e) => setSelectedDeparture(e.target.value)}>
                                <option value="">-- Lịch khởi hành --</option>
                                {tour.departures?.map((dep) => (
                                    <option key={dep.departure_id} value={dep.departure_id}>
                                        {new Date(dep.departure_date).toLocaleDateString('vi-VN')} (Còn {dep.available_slots} chỗ)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Số lượng hành khách:</label>
                            <input type="number" min="1" max="20" value={numPeople} onChange={(e) => setNumPeople(e.target.value)} />
                        </div>

                        <div className="total-amount">
                            <span>Tổng tiền:</span>
                            <span className="text-price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}</span>
                        </div>

                        <button className="btn-confirm-booking" onClick={handleGoToBooking}>
                            Yêu cầu đặt Tour
                        </button>
                        <p className="booking-note">Bạn sẽ không bị trừ tiền cho đến khi nhân viên xác nhận lịch trình.</p>
                    </div>
                </div>`;
                
const replaceSidebar = `                <div className="detail-sidebar">
                    {!selectedDeparture ? (
                        <div className="booking-card" style={{ padding: '24px', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', background: '#fff', border: 'none', position: 'sticky', top: '100px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#475569' }}>
                                    <span>🏷️ Mã chương trình:</span>
                                    <strong style={{ color: '#0f172a', marginLeft: 'auto' }}>{tour.tour_code || \`\${tour.tour_id}-DEP\`}</strong>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#475569' }}>
                                    <span>⏱️ Thời gian:</span>
                                    <strong style={{ color: '#0f172a', marginLeft: 'auto' }}>{tour.duration_days} ngày {Math.max(0, tour.duration_days - 1)} đêm</strong>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', marginTop: '8px' }}>
                                    <span>Giá từ:</span>
                                    <strong style={{ color: '#1d4ed8', fontSize: '22px' }}>{new Intl.NumberFormat('vi-VN').format(tour.base_price)}đ</strong>
                                </div>
                                <button onClick={() => {
                                    const el = document.getElementById('lich-trinh-khoi-hanh');
                                    if(el) {
                                        window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
                                    } else {
                                        alert('Vui lòng chọn lịch trình khởi hành ở phần bên trái!');
                                    }
                                }} style={{ width: '100%', background: '#dc2626', color: '#fff', padding: '14px', borderRadius: '24px', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '8px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)' }}>
                                    Chọn ngày
                                </button>
                            </div>
                        </div>
                    ) : (
                        (() => {
                            const selDep = tour.departures?.find(d => String(d.departure_id) === String(selectedDeparture));
                            if(!selDep) return null;
                            const d = new Date(selDep.departure_date);
                            const dateStr = d.toLocaleDateString('vi-VN');
                            const dayOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
                            
                            return (
                                <div className="booking-card" style={{ padding: '24px', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', background: '#fff', border: 'none', position: 'sticky', top: '100px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Giá:</span>
                                            <strong style={{ color: '#1d4ed8', fontSize: '24px' }}>{new Intl.NumberFormat('vi-VN').format(tour.base_price)}đ</strong>
                                        </div>
                                        <button onClick={() => setSelectedDeparture('')} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {dayOfWeek}, {dateStr} ✏️
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                            <span style={{ color: '#64748b' }}>🏷️ Mã tour:</span>
                                            <strong style={{ color: '#1e40af' }}>{tour.tour_code || \`\${tour.tour_id}-DEP\`}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                            <span style={{ color: '#64748b' }}>📍 Khởi hành:</span>
                                            <strong style={{ color: '#0f172a', textAlign: 'right' }}>{parsedDesign?.days?.[0]?.start_destination_id ? getDestString(tour, parsedDesign).split(' - ')[0] : 'Đang cập nhật'}</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                            <span style={{ color: '#64748b' }}>⏱️ Thời gian:</span>
                                            <strong style={{ color: '#0f172a' }}>{tour.duration_days} ngày {Math.max(0, tour.duration_days - 1)} đêm</strong>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                            <span style={{ color: '#64748b' }}>💺 Số chỗ còn:</span>
                                            <strong style={{ color: '#0f172a' }}>Còn {selDep.available_slots} chỗ</strong>
                                        </div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '16px', marginTop: '8px' }}>
                                            <span style={{ fontSize: '14px', color: '#0f172a', fontWeight: 'bold' }}>Số lượng khách:</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <button onClick={() => setNumPeople(Math.max(1, Number(numPeople) - 1))} style={{ width: '28px', height: '28px', borderRadius: '4px', border: 'none', background: '#fff', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>-</button>
                                                <span style={{ fontSize: '15px', fontWeight: '600', width: '20px', textAlign: 'center' }}>{numPeople}</span>
                                                <button onClick={() => setNumPeople(Number(numPeople) + 1)} style={{ width: '28px', height: '28px', borderRadius: '4px', border: 'none', background: '#fff', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>+</button>
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                            <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Tạm tính:</span>
                                            <strong style={{ color: '#dc2626', fontSize: '20px' }}>{new Intl.NumberFormat('vi-VN').format(tour.base_price * numPeople)}đ</strong>
                                        </div>
                                        
                                        <button onClick={handleGoToBooking} style={{ width: '100%', background: '#dc2626', color: '#fff', padding: '14px', borderRadius: '24px', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginTop: '16px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)' }}>
                                            Đặt ngay
                                        </button>
                                    </div>
                                </div>
                            );
                        })()
                    )}
                </div>`;
                
c = c.replace(targetSidebar, replaceSidebar);
fs.writeFileSync('src/components/TourDetail.jsx', c);
console.log('Fixed Sidebar UI');

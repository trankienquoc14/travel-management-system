const fs = require('fs');
let c = fs.readFileSync('src/components/TourDetail.jsx', 'utf8');

if (!c.includes('const [selectedMonthTab, setSelectedMonthTab] = useState')) {
    c = c.replace('const [numPeople, setNumPeople] = useState(1);', 'const [numPeople, setNumPeople] = useState(1);\n    const [selectedMonthTab, setSelectedMonthTab] = useState(\'\');');
}

const insertionPoint = `                    <h2>Tổng quan chuyến đi</h2>`;

const newBlock = `
                    {/* KHỐI LỊCH TRÌNH KHỞI HÀNH (MỚI) */}
                    <div style={{ marginBottom: '40px' }}>
                        <h2 style={{ marginBottom: '20px', color: '#0f172a' }}>Lịch trình khởi hành</h2>
                        
                        {(() => {
                            // 1. Gom nhóm ngày khởi hành theo tháng
                            const grouped = {};
                            const deps = tour.departures || [];
                            deps.forEach(dep => {
                                const d = new Date(dep.departure_date);
                                const mKey = \`Tháng \${d.getMonth() + 1} \${d.getFullYear()}\`;
                                if (!grouped[mKey]) grouped[mKey] = [];
                                grouped[mKey].push(dep);
                            });
                            const monthKeys = Object.keys(grouped);
                            
                            // Nếu chưa có tab nào thì set default
                            if (monthKeys.length > 0 && !selectedMonthTab) {
                                setTimeout(() => setSelectedMonthTab(monthKeys[0]), 0);
                            }
                            
                            if (deps.length === 0) {
                                return <div style={{ color: '#64748b' }}>Đang cập nhật lịch khởi hành...</div>;
                            }

                            const activeDeps = grouped[selectedMonthTab] || [];
                            
                            // Tính toán giá
                            const adultPrice = tour.base_price || 0;
                            const ageMult = parsedDesign?.costConfig?.ageMultiplier || {};
                            
                            const getPrice = (type) => {
                                const s = ageMult[type] || { percent: 100, fixed_surcharge: 0 };
                                return (adultPrice * (s.percent / 100)) + Number(s.fixed_surcharge);
                            };
                            
                            const childPrice = getPrice('child');
                            const toddlerPrice = getPrice('toddler');
                            const infantPrice = getPrice('infant');
                            const singleSupp = parsedDesign?.costConfig?.variable?.singleSupplement || 0;
                            
                            const formatM = (v) => new Intl.NumberFormat('vi-VN').format(Math.round(v)) + 'đ';

                            return (
                                <div>
                                    {/* Tabs Tháng */}
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                                        {monthKeys.map(m => {
                                            const isActive = m === selectedMonthTab;
                                            return (
                                                <button
                                                    key={m}
                                                    onClick={() => setSelectedMonthTab(m)}
                                                    style={{
                                                        padding: '12px 24px',
                                                        borderRadius: '12px',
                                                        border: isActive ? 'none' : '1px solid #cbd5e1',
                                                        background: isActive ? '#1d4ed8' : '#fff',
                                                        color: isActive ? '#fff' : '#64748b',
                                                        fontWeight: '600',
                                                        fontSize: '15px',
                                                        cursor: 'pointer',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {m}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    
                                    {/* Danh sách ngày */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {activeDeps.map(dep => {
                                            const isSelected = selectedDeparture === dep.departure_id;
                                            const d = new Date(dep.departure_date);
                                            const dayOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
                                            const dateStr = d.toLocaleDateString('vi-VN');
                                            
                                            return (
                                                <div key={dep.departure_id} onClick={() => setSelectedDeparture(dep.departure_id)} style={{ padding: '20px', borderRadius: '16px', border: isSelected ? '2px solid #1d4ed8' : '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', boxShadow: isSelected ? '0 4px 12px rgba(29, 78, 216, 0.15)' : 'none', transition: 'all 0.2s' }}>
                                                    {/* Header Card */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                            <span style={{ background: '#f8fafc', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', color: '#1e40af', fontSize: '15px' }}>{dayOfWeek}, {dateStr}</span>
                                                            <span style={{ color: '#475569', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>🎟️ {tour.tour_code || \`\${tour.tour_id}-DEP\`}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                            <strong style={{ fontSize: '20px', color: '#0f172a' }}>{formatM(adultPrice)}</strong>
                                                            <button style={{ background: isSelected ? '#1d4ed8' : '#f1f5f9', color: isSelected ? '#fff' : '#475569', padding: '10px 24px', borderRadius: '24px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '15px' }}>
                                                                {isSelected ? 'Đang chọn' : 'Chọn'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Chi tiết mở rộng khi Selected */}
                                                    {isSelected && (
                                                        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px dashed #cbd5e1' }}>
                                                            {/* Phương tiện */}
                                                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                                                <strong style={{ fontSize: '15px', color: '#1e293b' }}>Phương tiện di chuyển</strong>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '40px', marginBottom: '32px' }}>
                                                                <div style={{ flex: 1, borderRight: '1px solid #e2e8f0', paddingRight: '40px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                                        <span style={{ color: '#64748b', fontSize: '14px' }}>Ngày đi: <strong style={{color: '#0f172a'}}>{dateStr}</strong></span>
                                                                        <span style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '14px' }}>🚌 Xe ô tô / ✈️ Máy bay</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                                                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{parsedDesign?.days?.[0]?.start_destination_id ? getDestString(tour, parsedDesign).split(' - ')[0] : 'Điểm đi'}</span>
                                                                        <div style={{ flex: 1, height: '1px', background: '#e2e8f0', margin: '0 16px', position: 'relative' }}><div style={{position: 'absolute', right: 0, top: '-3px', width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1'}}></div></div>
                                                                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{parsedDesign?.days?.[0]?.end_destination_id ? getDestString(tour, parsedDesign).split(' - ')[1] || 'Điểm đến' : 'Điểm đến'}</span>
                                                                    </div>
                                                                </div>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                                        <span style={{ color: '#64748b', fontSize: '14px' }}>Ngày về: <strong style={{color: '#0f172a'}}>+{(tour.duration_days || 1) - 1} Ngày</strong></span>
                                                                        <span style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '14px' }}>🚌 Xe ô tô / ✈️ Máy bay</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                                                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{parsedDesign?.days?.[0]?.end_destination_id ? getDestString(tour, parsedDesign).split(' - ')[1] || 'Điểm đến' : 'Điểm đến'}</span>
                                                                        <div style={{ flex: 1, height: '1px', background: '#e2e8f0', margin: '0 16px', position: 'relative' }}><div style={{position: 'absolute', right: 0, top: '-3px', width: '6px', height: '6px', borderRadius: '50%', background: '#cbd5e1'}}></div></div>
                                                                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{parsedDesign?.days?.[0]?.start_destination_id ? getDestString(tour, parsedDesign).split(' - ')[0] : 'Điểm đi'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div style={{ borderTop: '1px dashed #cbd5e1', marginBottom: '24px' }}></div>
                                                            
                                                            {/* Giá chuyến đi */}
                                                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                                                <strong style={{ fontSize: '15px', color: '#1e293b' }}>Giá chuyến đi</strong>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '40px' }}>
                                                                <div style={{ flex: 1, borderRight: '1px solid #e2e8f0', paddingRight: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <div><strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Người lớn</strong><span style={{ fontSize: '13px', color: '#64748b' }}>(Từ 12 tuổi trở lên)</span></div>
                                                                        <strong style={{ color: '#dc2626', fontSize: '16px' }}>{formatM(adultPrice)}</strong>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <div><strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Trẻ em</strong><span style={{ fontSize: '13px', color: '#64748b' }}>(Từ 5 đến 11 tuổi)</span></div>
                                                                        <strong style={{ color: '#dc2626', fontSize: '16px' }}>{formatM(childPrice)}</strong>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <div><strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Trẻ nhỏ</strong><span style={{ fontSize: '13px', color: '#64748b' }}>(Từ 2 - 4 tuổi)</span></div>
                                                                        <strong style={{ color: '#dc2626', fontSize: '16px' }}>{formatM(toddlerPrice)}</strong>
                                                                    </div>
                                                                </div>
                                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <div><strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Em bé</strong><span style={{ fontSize: '13px', color: '#64748b' }}>(Dưới 2 tuổi)</span></div>
                                                                        <strong style={{ color: '#dc2626', fontSize: '16px' }}>{formatM(infantPrice)}</strong>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <div><strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Phụ thu phòng đơn</strong></div>
                                                                        <strong style={{ color: '#dc2626', fontSize: '16px' }}>{formatM(singleSupp)}</strong>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div style={{ marginTop: '32px', background: '#fff1f2', color: '#e11d48', padding: '16px', borderRadius: '12px', textAlign: 'center', fontSize: '15px', fontWeight: '500' }}>
                                                                Cần thêm thông tin vui lòng liên hệ Tổng đài 1800-646-888 HOÀN TOÀN MIỄN PHÍ cho khách hàng
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
`;

if (c.includes(insertionPoint)) {
    c = c.replace(insertionPoint, newBlock + '\n' + insertionPoint);
} else {
    console.log("Could not find insertion point");
}

fs.writeFileSync('src/components/TourDetail.jsx', c);
console.log('Added new departure schedule UI');

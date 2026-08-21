const fs = require('fs');

let c = fs.readFileSync('src/components/TourOperationalManager.jsx', 'utf8');

// Find the start of TourOperationalManager's return statement
const compStart = c.indexOf('const TourOperationalManager =');
const returnStart = c.indexOf('    return (', compStart);
const exportStart = c.lastIndexOf('export default TourOperationalManager;');

if (compStart === -1 || returnStart === -1 || exportStart === -1) {
    console.error('Could not find markers');
    process.exit(1);
}

const newRender = `    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: '"Outfit", "Inter", sans-serif', background: '#f5f7fa', overflowY: 'auto' }}>
            <div className="page-header" style={{ marginBottom: '25px', padding: '0 24px', paddingTop: '24px' }}>
                <h2 style={{ fontSize: '28px', color: '#111827', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>🚀 Quản Lý Điều Hành</h2>
                <p style={{ color: '#4b5563', fontSize: '15px', margin: 0, fontWeight: '500' }}>Phân bổ lịch chạy, thiết lập thời gian và phân công Hướng dẫn viên.</p>
            </div>

            <div style={{ flex: 1, padding: '0 24px 40px 24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#e2e8f0', padding: '6px', borderRadius: '14px', width: 'fit-content' }}>
                    <button 
                        onClick={() => { setActiveTourTab('fixed'); setSelectedTour(null); }}
                        style={{ padding: '10px 24px', background: activeTourTab === 'fixed' ? '#fff' : 'transparent', color: activeTourTab === 'fixed' ? '#0194f3' : '#475569', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: activeTourTab === 'fixed' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                    >
                        Tour Cố Định
                    </button>
                    <button 
                        onClick={() => { setActiveTourTab('custom'); setSelectedTour(null); }}
                        style={{ padding: '10px 24px', background: activeTourTab === 'custom' ? '#fff' : 'transparent', color: activeTourTab === 'custom' ? '#0194f3' : '#475569', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: activeTourTab === 'custom' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
                    >
                        Thiết Kế Riêng
                    </button>
                </div>

                {/* Accordion List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {tours.filter(t => activeTourTab === 'custom' ? t.is_custom === 1 : (t.is_custom === 0 || !t.is_custom)).map(t => {
                        const isExpanded = selectedTour?.tour_id === t.tour_id;
                        
                        return (
                        <div key={t.tour_id} style={{ background: '#fff', borderRadius: '20px', border: isExpanded ? '2px solid #0194f3' : '1px solid #e2e8f0', overflow: 'hidden', boxShadow: isExpanded ? '0 12px 30px rgba(1, 148, 243, 0.15)' : '0 4px 15px rgba(0,0,0,0.03)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                            {/* Header */}
                            <div 
                                onClick={() => isExpanded ? setSelectedTour(null) : handleSelectTour(t)}
                                style={{ padding: '24px 30px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isExpanded ? '#f8fafc' : '#fff', borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none' }}
                            >
                                <div>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800', color: isExpanded ? '#0369a1' : '#111827' }}>{t.tour_name}</h3>
                                    <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500', display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <span>🕒 {t.duration_days} Ngày</span>
                                        <span>📍 {t.destination}</span>
                                        <span style={{ color: '#0ea5e9' }}>💵 Tỷ suất LN: {t.markup_percent}%</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <span style={{ 
                                        fontSize: '13px', 
                                        padding: '6px 14px', 
                                        borderRadius: '20px', 
                                        fontWeight: '700',
                                        background: t.status === 'Active' ? '#ecfdf5' : '#fffbeb',
                                        color: t.status === 'Active' ? '#059669' : '#d97706'
                                    }}>
                                        {t.status === 'Active' ? 'Đang mở bán' : 'Chờ mở bán'}
                                    </span>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isExpanded ? '#e0f2fe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isExpanded ? '#0ea5e9' : '#94a3b8'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Body (Expanded Content) */}
                            {isExpanded && (
                                <div style={{ padding: '30px', background: '#fff' }}>
                                    
                                    {/* Toolbar */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '6px', borderRadius: '12px' }}>
                                            <button onClick={() => setSelectedMonth('all')} style={{ padding: '8px 16px', background: selectedMonth === 'all' ? '#fff' : 'transparent', color: selectedMonth === 'all' ? '#0f172a' : '#64748b', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: selectedMonth === 'all' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>Tất cả</button>
                                            {[...Array(6)].map((_, i) => {
                                                const d = new Date(); d.setMonth(d.getMonth() + i);
                                                const val = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}\`;
                                                const label = \`Tháng \${d.getMonth() + 1}\`;
                                                return (
                                                    <button key={val} onClick={() => setSelectedMonth(val)} style={{ padding: '8px 16px', background: selectedMonth === val ? '#fff' : 'transparent', color: selectedMonth === val ? '#0f172a' : '#64748b', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: selectedMonth === val ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>{label}</button>
                                                )
                                            })}
                                        </div>
                                        {activeTourTab !== 'custom' && (
                                            <button onClick={handleAddDeparture} disabled={loading} style={{ padding: '10px 20px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                Thêm Đợt Mới
                                            </button>
                                        )}
                                    </div>

                                    {/* Departures List */}
                                    {departures.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
                                            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📅</div>
                                            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#374151' }}>Chưa có lịch chạy nào cho thời gian này</h4>
                                            <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>Vui lòng thêm đợt mới hoặc chọn tháng khác.</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {departures.map((dep, idx) => {
                                                if (selectedMonth !== 'all' && dep.departure_date && !dep.departure_date.startsWith(selectedMonth)) return null;
                                                
                                                const parsedDesign = selectedTour?.design_data ? (typeof selectedTour.design_data === 'string' ? JSON.parse(selectedTour.design_data) : selectedTour.design_data) : null;
                                                const minPax = parsedDesign?.costConfig?.minimumPax || 15;
                                                
                                                const status = dep.status || 'Open';
                                                const statusBg = status === 'Open' ? '#dcfce7' : (status === 'Closed' ? '#f3f4f6' : '#111827');
                                                const statusColor = status === 'Open' ? '#166534' : (status === 'Closed' ? '#4b5563' : '#f9fafb');

                                                return (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '16px 20px', gap: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', transition: 'transform 0.2s' }}>
                                                    
                                                    {/* Khu vực 1: THỜI GIAN */}
                                                    <div style={{ flex: '0 0 180px' }}>
                                                        <input 
                                                            type="date" 
                                                            min={todayStr}
                                                            value={dep.departure_date} 
                                                            onChange={e => handleDepartureDateChange(idx, e.target.value)} 
                                                            disabled={activeTourTab === 'custom'}
                                                            style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', width: '100%', fontFamily: 'inherit', color: activeTourTab === 'custom' ? '#9ca3af' : '#111827', fontSize: '15px', fontWeight: '600', outline: 'none', cursor: activeTourTab === 'custom' ? 'not-allowed' : 'pointer', marginBottom: '6px' }} 
                                                        />
                                                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500', paddingLeft: '4px' }}>
                                                            Ngày về: <span style={{ color: dep.return_date ? '#374151' : '#9ca3af', fontWeight: '600' }}>{dep.return_date ? formatDateStr(dep.return_date) : '...'}</span>
                                                        </div>
                                                    </div>

                                                    {/* Khu vực 2: TIẾN ĐỘ & HÒA VỐN */}
                                                    <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ fontSize: '14px', color: '#374151', fontWeight: '600' }}>
                                                                Khách: <span style={{ color: '#0ea5e9' }}>0</span> / {dep.max_slots} 
                                                                <span style={{ color: '#9ca3af', fontSize: '13px', fontWeight: '500', marginLeft: '6px' }}>(Hòa vốn: {minPax})</span>
                                                            </div>
                                                            <input 
                                                                type="number" 
                                                                min="1" 
                                                                value={dep.max_slots} 
                                                                onChange={e => { const up = [...departures]; up[idx].max_slots = Number(e.target.value); setDepartures(up); }} 
                                                                disabled={activeTourTab === 'custom'} 
                                                                style={{ width: '60px', padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', textAlign: 'center', background: '#f9fafb', outline: 'none' }} 
                                                                title="Sửa max slots"
                                                            />
                                                        </div>
                                                        <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                                                            <div style={{ width: '0%', height: '100%', background: '#0ea5e9', borderRadius: '4px' }}></div>
                                                        </div>
                                                    </div>

                                                    {/* Khu vực 3: ĐIỀU HÀNH & ACTION */}
                                                    <div style={{ flex: '0 0 350px', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-end' }}>
                                                        <select 
                                                            value={dep.guide_id || ''} 
                                                            onChange={e => { const up = [...departures]; up[idx].guide_id = e.target.value ? Number(e.target.value) : null; setDepartures(up); }} 
                                                            style={{ flex: '1', padding: '10px 12px', border: dep.guide_id ? '1px solid #bae6fd' : '1px solid #e5e7eb', background: dep.guide_id ? '#e0f2fe' : '#fff', borderRadius: '10px', color: dep.guide_id ? '#0369a1' : '#4b5563', fontSize: '14px', fontWeight: '600', outline: 'none', cursor: 'pointer' }}
                                                        >
                                                            <option value="">Chưa phân công HDV</option>
                                                            {guides.map(g => (
                                                                <option key={g.user_id} value={g.user_id}>{g.full_name}</option>
                                                            ))}
                                                        </select>
                                                        <select 
                                                            value={status} 
                                                            onChange={e => { const up = [...departures]; up[idx].status = e.target.value; setDepartures(up); }} 
                                                            style={{ flex: '0 0 110px', padding: '10px 12px', border: 'none', background: statusBg, borderRadius: '10px', color: statusColor, fontSize: '14px', fontWeight: '700', outline: 'none', cursor: 'pointer', textAlign: 'center', appearance: 'none' }}
                                                        >
                                                            <option value="Open">Mở Bán</option>
                                                            <option value="Closed">Khóa</option>
                                                            <option value="Completed">Hoàn Tất</option>
                                                        </select>
                                                        {activeTourTab !== 'custom' && (
                                                            <button 
                                                                onClick={() => setDepartures(departures.filter((_, i) => i !== idx))} 
                                                                style={{ flex: '0 0 40px', height: '40px', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                                                                onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                                                                onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
                                                                title="Xóa Đợt Chạy"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Action Buttons at the Bottom */}
                                    {departures.length > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                                            <button onClick={handleSaveDepartures} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: '#111827', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(17, 24, 39, 0.2)' }}>
                                                💾 Lưu Lịch Trình
                                            </button>
                                            {selectedTour.status === 'Approved' && (
                                                <button onClick={handleActivateTour} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: '#0194f3', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(1, 148, 243, 0.3)' }}>
                                                    🚀 Mở Bán Tour
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    
                                    <div style={{ marginTop: '40px' }}>
                                        <GuideTimelineCalendar 
                                            guides={guides}
                                            guideSchedules={guideSchedules}
                                            selectedMonth={selectedMonth}
                                        />
                                    </div>

                                </div>
                            )}
                        </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};
`;

c = c.substring(0, returnStart) + newRender + '\n' + c.substring(exportStart);
fs.writeFileSync('src/components/TourOperationalManager.jsx', c);
console.log('Successfully applied accordion patch!');

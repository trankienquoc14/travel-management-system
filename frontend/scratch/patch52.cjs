const fs = require('fs');
let c = fs.readFileSync('src/components/TourOperationalManager.jsx', 'utf8');

const str = 'minmax(380px, 1fr)';
const idx = c.indexOf(str);
const start = c.lastIndexOf('<div', idx);
const end = c.indexOf('                                {/* Action Buttons at the Bottom */}', start);

if (start > -1 && end > -1) {
    const toReplace = c.substring(start, end);
    const newBlock = `<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {departures.map((dep, idx) => {
                                            if (selectedMonth !== 'all' && dep.departure_date && !dep.departure_date.startsWith(selectedMonth)) return null;
                                            
                                            const parsedDesign = selectedTour?.design_data ? (typeof selectedTour.design_data === 'string' ? JSON.parse(selectedTour.design_data) : selectedTour.design_data) : null;
                                            const minPax = parsedDesign?.costConfig?.minimumPax || 15;
                                            
                                            const status = dep.status || 'Open';
                                            const statusBg = status === 'Open' ? '#dcfce7' : (status === 'Closed' ? '#f3f4f6' : '#111827');
                                            const statusColor = status === 'Open' ? '#166534' : (status === 'Closed' ? '#4b5563' : '#f9fafb');

                                            return (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', padding: '16px 20px', gap: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', transition: 'transform 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.04)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}>
                                                
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
`;
    c = c.replace(toReplace, newBlock);
    fs.writeFileSync('src/components/TourOperationalManager.jsx', c);
    console.log('Successfully replaced grid with horizontal list!');
} else {
    console.log('Error finding replace indices.');
}

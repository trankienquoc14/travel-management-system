const fs = require('fs');
let c = fs.readFileSync('src/components/TourDetail.jsx', 'utf8');

const targetBlockStart = c.indexOf('{/* Phương tiện */}');
const targetBlockEnd = c.indexOf('{/* Giá chuyến đi */}');

if (targetBlockStart === -1 || targetBlockEnd === -1) {
    console.error('Could not find target block');
    process.exit(1);
}

const replacement = `{/* Phương tiện */}
                                                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                                                <strong style={{ fontSize: '15px', color: '#1e293b' }}>Phương tiện di chuyển</strong>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '40px', marginBottom: '32px' }}>
                                                                <div style={{ flex: 1, borderRight: '1px solid #e2e8f0', paddingRight: '40px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                                        <span style={{ color: '#64748b', fontSize: '14px' }}>Ngày đi: <strong style={{color: '#0f172a'}}>{dateStr}</strong></span>
                                                                        <span style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '14px' }}>{parsedDesign?.costConfig?.selectedTransport?.service_name || '🚌 Ô tô / ✈️ Máy bay'}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                                            <strong style={{ fontSize: '18px', color: '#1e293b' }}>{parsedDesign?.costConfig?.transportTimes?.startD || '05:30'}</strong>
                                                                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{tour.start_location || 'Điểm đi'}</span>
                                                                        </div>
                                                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
                                                                            <div style={{ flex: 1, height: '1px', background: '#cbd5e1', position: 'relative' }}>
                                                                                <div style={{position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #0f172a', background: '#fff'}}></div>
                                                                                <div style={{position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#0f172a'}}></div>
                                                                            </div>
                                                                        </div>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                                            <strong style={{ fontSize: '18px', color: '#1e293b' }}>{parsedDesign?.costConfig?.transportTimes?.endD || '12:00'}</strong>
                                                                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{tour.destination || 'Điểm đến'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                                        <span style={{ color: '#64748b', fontSize: '14px' }}>Ngày về: <strong style={{color: '#0f172a'}}>+{(tour.duration_days || 1) - 1} Ngày</strong></span>
                                                                        <span style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '14px' }}>{parsedDesign?.costConfig?.selectedTransport?.service_name || '🚌 Ô tô / ✈️ Máy bay'}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                                            <strong style={{ fontSize: '18px', color: '#1e293b' }}>{parsedDesign?.costConfig?.transportTimes?.startR || '12:00'}</strong>
                                                                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{tour.destination || 'Điểm đến'}</span>
                                                                        </div>
                                                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
                                                                            <div style={{ flex: 1, height: '1px', background: '#cbd5e1', position: 'relative' }}>
                                                                                <div style={{position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #0f172a', background: '#fff'}}></div>
                                                                                <div style={{position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#0f172a'}}></div>
                                                                            </div>
                                                                        </div>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                                            <strong style={{ fontSize: '18px', color: '#1e293b' }}>{parsedDesign?.costConfig?.transportTimes?.endR || '17:30'}</strong>
                                                                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#64748b', marginTop: '4px' }}>{tour.start_location || 'Điểm đi'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div style={{ borderTop: '1px dashed #cbd5e1', marginBottom: '24px' }}></div>
                                                            
                                                            `;

c = c.substring(0, targetBlockStart) + replacement + c.substring(targetBlockEnd);
fs.writeFileSync('src/components/TourDetail.jsx', c);
console.log('Fixed TourDetail transport section');

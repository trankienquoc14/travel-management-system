const fs = require('fs');
let c = fs.readFileSync('src/components/TourOperationalManager.jsx', 'utf8');

const targetBlock = `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                                                        </div>`;

const newBlock = `<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ fontSize: '14px', color: '#374151', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                Khách: <span style={{ color: '#0ea5e9' }}>0</span> / 
                                                                <input 
                                                                    type="number" 
                                                                    min="1" 
                                                                    value={dep.max_slots || ''} 
                                                                    onChange={e => { const up = [...departures]; up[idx].max_slots = e.target.value ? Number(e.target.value) : ''; setDepartures(up); }} 
                                                                    onBlur={e => { if(!e.target.value) { const up = [...departures]; up[idx].max_slots = 1; setDepartures(up); } }}
                                                                    disabled={activeTourTab === 'custom'} 
                                                                    style={{ width: '64px', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', fontWeight: '700', color: '#0f172a', textAlign: 'center', background: activeTourTab === 'custom' ? '#f1f5f9' : '#fff', outline: 'none', transition: 'border-color 0.2s' }} 
                                                                    title="Sửa max slots"
                                                                    onFocus={e => e.target.style.borderColor = '#0ea5e9'}
                                                                />
                                                                <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>(Hòa vốn: {minPax})</span>
                                                            </div>
                                                        </div>`;

c = c.replace(targetBlock, newBlock);

fs.writeFileSync('src/components/TourOperationalManager.jsx', c);
console.log('Fixed Khu vuc 2 layout');

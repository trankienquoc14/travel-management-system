const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const target = `<div style={{ position: 'absolute', bottom: '-12px', right: '-12px', width: '24px', height: '24px', borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderLeft: 'none', transform: 'rotate(45deg)', zIndex: 1 }}></div>`;

const replacement = target + `
                                    
                                    {/* Tour Info Block */}
                                    <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px dashed #e2e8f0' }}>
                                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>Hành trình / Journey</span>
                                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{detailBooking.tour_name}</div>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Khởi hành lúc / Departure:</span>
                                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0284c7', marginTop: '2px' }}>
                                                    {getDepartureTime(detailBooking)} | {formatDate(detailBooking.departure_date)}
                                                </div>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Xuất phát tại / From:</span>
                                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
                                                    {getDepartureLocation(detailBooking)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Injected tour info');
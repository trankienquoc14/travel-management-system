const fs = require('fs');
let c = fs.readFileSync('src/components/ManagerTourApproval.jsx', 'utf8');

const regex = /<div style=\{\{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '8px' \}\}>\s*<div><p style=\{\{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' \}\}>Tuyến đường<\/p><p style=\{\{ margin: 0, fontWeight: '600' \}\}>\{selectedFixedTour\.destination\}<\/p><\/div>\s*<div><p style=\{\{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' \}\}>Thời gian<\/p><p style=\{\{ margin: 0, fontWeight: '600' \}\}>\{selectedFixedTour\.duration_days\} Ngày<\/p><\/div>\s*<\/div>/;

const newModalTop = `<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>📝 Mô tả tổng quan</p>
                                    <p style={{ margin: 0, fontWeight: '500', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{selectedFixedTour.description || <span style={{color: '#94a3b8', fontStyle: 'italic'}}>Chưa có mô tả</span>}</p>
                                </div>
                                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px' }}>
                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>📍 Tuyến đường</p>
                                    <p style={{ margin: 0, fontWeight: '600', color: '#0f172a' }}>{selectedFixedTour.destination}</p>
                                </div>
                                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px' }}>
                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>⏱️ Thời gian</p>
                                    <p style={{ margin: 0, fontWeight: '600', color: '#0f172a' }}>{selectedFixedTour.duration_days} Ngày {Math.max(0, selectedFixedTour.duration_days - 1)} Đêm</p>
                                </div>
                            </div>`;

c = c.replace(regex, newModalTop);
fs.writeFileSync('src/components/ManagerTourApproval.jsx', c);

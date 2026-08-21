const fs = require('fs');
let c = fs.readFileSync('src/components/StaffFixedTourDesigner.jsx', 'utf8');

c = c.replace(
    /const totalVariable = \(Number\(costConfig\.variable\.accommPerNight\) \/ 2 \* totalNights\)/,
    'const totalVariable = (autoAccommodationCost / 2)'
);

const oldUI = `<div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Giá phòng/Đêm (Hệ thống chia 2) <span style={{color: '#d97706', fontWeight: 'bold'}}>= {(Number(costConfig.variable.accommPerNight) / 2 * totalNights).toLocaleString('vi-VN')} đ ({totalNights} đêm)</span></label>
                                <input type="number" value={costConfig.variable.accommPerNight} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, accommPerNight: e.target.value}})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                            </div>`;

const newUI = `<div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Tổng chi phí khách sạn / Khách (Tự động chia 2)</label>
                                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{(autoAccommodationCost / 2).toLocaleString('vi-VN')} đ</div>
                            </div>`;

c = c.replace(oldUI, newUI);

fs.writeFileSync('src/components/StaffFixedTourDesigner.jsx', c);

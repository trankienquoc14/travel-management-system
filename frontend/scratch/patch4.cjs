const fs = require('fs');
let c = fs.readFileSync('src/components/StaffFixedTourDesigner.jsx', 'utf8');

const oldUI = `<div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Vé Xe / Máy bay / Khách</label>
                                <input type="number" value={costConfig.variable.transportTicket || 0} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, transportTicket: e.target.value}})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                            </div>`;

const newUI = `<div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Vé Xe / Máy bay / Khách</label>
                                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{Number(costConfig.variable.transportTicket || 0).toLocaleString('vi-VN')} đ</div>
                            </div>`;

c = c.replace(oldUI, newUI);
fs.writeFileSync('src/components/StaffFixedTourDesigner.jsx', c);

const fs = require('fs');
let c = fs.readFileSync('src/components/StaffFixedTourDesigner.jsx', 'utf8');

c = c.replace(
    /const finalTicketsCost = Number\(costConfig\.variable\.tickets\) > 0 \? Number\(costConfig\.variable\.tickets\) : autoTicketsCost;/,
    'const finalTicketsCost = autoTicketsCost;'
);
c = c.replace(
    /\/\/ Tổng Variable lấy tự động ticketsCost từ Activity \+ Nhập tay Ticket nếu có/,
    ''
);

c = c.replace(
    /<label style=\{\{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' \}\}>Giá phòng\/Đêm \(Hệ thống tự chia 2\)<\/label>/g,
    `<label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Giá phòng/Đêm (Hệ thống chia 2) <span style={{color: '#d97706', fontWeight: 'bold'}}>= {(Number(costConfig.variable.accommPerNight) / 2 * totalNights).toLocaleString('vi-VN')} đ ({totalNights} đêm)</span></label>`
);

const oldTicketUI = `<div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Vé tham quan (Tự động: {autoTicketsCost}đ)</label>
                                <input type="number" value={costConfig.variable.tickets} placeholder="Nhập đè nếu muốn" onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, tickets: e.target.value}})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                            </div>`;

const newTicketUI = `<div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Tổng chi phí các điểm tham quan</label>
                                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{Number(autoTicketsCost).toLocaleString('vi-VN')} đ</div>
                            </div>`;
                            
c = c.replace(oldTicketUI, newTicketUI);

fs.writeFileSync('src/components/StaffFixedTourDesigner.jsx', c);

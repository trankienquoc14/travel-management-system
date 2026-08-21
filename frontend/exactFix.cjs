const fs = require('fs');
const path = require('path');

const target1 = path.join(__dirname, 'src', 'components', 'StaffPendingTours.jsx');
const target2 = path.join(__dirname, 'src', 'components', 'ManagerTourApproval.jsx');

let newRenderLogic = `                                                {/* KHÁCH SẠN VÀ XE */}
                                                {parsedDesign.costConfig && (
                                                    <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                                                        <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                            <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '8px' }}>🏨 Dịch vụ Lưu trú</strong>
                                                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                                                                {parsedDesign.costConfig.fixed?.accommodation ? 'Đã chọn cấu hình lưu trú' : 'Chưa chọn khách sạn'}
                                                            </span>
                                                        </div>
                                                        <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                            <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '8px' }}>✈️ Phương tiện Di chuyển</strong>
                                                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                                                                {parsedDesign.costConfig.selectedTransport ? 'Đã chọn phương tiện di chuyển' : 'Chưa chọn phương tiện'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* TIMELINE LỊCH TRÌNH */}
                                                {parsedDesign.days && parsedDesign.days.map((day) => (
                                                    <div key={day.dayIndex} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                        <div style={{ background: '#ecfdf5', padding: '12px 16px', borderBottom: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: '700', color: '#047857', fontSize: '15px' }}>NGÀY {day.dayIndex} {day.route_title ? ': ' + day.route_title : ''}</span>
                                                        </div>
                                                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'row', gap: '16px' }}>
                                                            {parsedDesign.dayImages && parsedDesign.dayImages[day.dayIndex] && (
                                                                <div style={{ flexShrink: 0 }}>
                                                                    <img src={parsedDesign.dayImages[day.dayIndex].startsWith('/') ? 'http://localhost:5002' + parsedDesign.dayImages[day.dayIndex] : parsedDesign.dayImages[day.dayIndex]} alt="Day" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                                                </div>
                                                            )}
                                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                {day.activities && day.activities.map((act, idx) => (
                                                                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                                                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', width: '80px' }}>{act.type}</span>
                                                                        <strong style={{ fontSize: '14px', color: '#334155' }}>{act.name}</strong>
                                                                    </div>
                                                                ))}
                                                                {(!day.activities || day.activities.length === 0) && <span style={{ color: '#94a3b8', fontSize: '13px' }}>Chưa có hoạt động nào</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}`;

let oldLogic1 = `                                                {/* KHÁCH SẠN VÀ XE */}
                                                {parsedDesign.fixedServices && (
                                                    <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                                                        <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                            <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '8px' }}>🏨 Dịch vụ Lưu trú</strong>
                                                            {parsedDesign.fixedServices.accommodation?.length > 0 ?
                                                                parsedDesign.fixedServices.accommodation.map(a => <div key={a.id} style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{a.name}</div>)
                                                                : <span style={{ fontSize: '13px', color: '#94a3b8' }}>Chưa chọn khách sạn</span>
                                                            }
                                                        </div>
                                                        <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                            <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '8px' }}>✈️ Phương tiện Di chuyển</strong>
                                                            {parsedDesign.fixedServices.transport?.length > 0 ?
                                                                parsedDesign.fixedServices.transport.map(t => <div key={t.id} style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{t.name}</div>)
                                                                : <span style={{ fontSize: '13px', color: '#94a3b8' }}>Chưa chọn phương tiện</span>
                                                            }
                                                        </div>
                                                    </div>
                                                )}

                                                {/* TIMELINE CÁC BUỔI */}
                                                {parsedDesign.itineraryDays.map((day) => (
                                                    <div key={day.dayIndex} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                        <div style={{ background: '#ecfdf5', padding: '12px 16px', borderBottom: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: '700', color: '#047857', fontSize: '15px' }}>NGÀY {day.dayIndex}</span>
                                                            <span style={{ fontSize: '13px', color: '#059669', fontWeight: '600', backgroundColor: '#d1fae5', padding: '4px 10px', borderRadius: '20px' }}>🗓️ {day.dateString || \`Ngày \${day.dayIndex}\`}</span>
                                                        </div>
                                                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                            {['morning', 'noon', 'evening'].map(slot => {
                                                                if (!day.slots[slot] || day.slots[slot].length === 0) return null;
                                                                const slotConfig = {
                                                                    morning: { icon: '🌅', name: 'BUỔI SÁNG', color: '#d97706', border: '#fde68a' },
                                                                    noon: { icon: '☀️', name: 'BUỔI TRƯA', color: '#ea580c', border: '#fdba74' },
                                                                    evening: { icon: '🌙', name: 'BUỔI TỐI', color: '#4f46e5', border: '#a5b4fc' }
                                                                }[slot];
                                                                return (
                                                                    <div key={slot} style={{ display: 'flex', gap: '12px' }}>
                                                                        <div style={{ width: '105px', flexShrink: 0, color: slotConfig.color, fontSize: '13px', fontWeight: '700', marginTop: '8px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                                                            <span style={{ fontSize: '16px' }}>{slotConfig.icon}</span> <span>{slotConfig.name}</span>
                                                                        </div>
                                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: \`3px solid \${slotConfig.border}\`, paddingLeft: '16px' }}>
                                                                            {day.slots[slot].map((item, idx) => (
                                                                                <div key={idx} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', color: '#334155', border: '1px solid #f1f5f9' }}>
                                                                                    <strong>{item.name}</strong>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}`;

let oldLogic2 = `                                                {/* DỊCH VỤ CỐ ĐỊNH (KHÁCH SẠN & XE) CHO TOUR CỐ ĐỊNH */}
                                                {parsedDesign.fixedServices && (
                                                    <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                                                        <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                            <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '8px' }}>🏨 Dịch vụ Lưu trú</strong>
                                                            {parsedDesign.fixedServices.accommodation?.length > 0 ?
                                                                parsedDesign.fixedServices.accommodation.map(a => <div key={a.id} style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{a.name}</div>)
                                                                : <span style={{ fontSize: '13px', color: '#94a3b8' }}>Chưa chọn khách sạn</span>
                                                            }
                                                        </div>
                                                        <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                            <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '8px' }}>✈️ Phương tiện Di chuyển</strong>
                                                            {parsedDesign.fixedServices.transport?.length > 0 ?
                                                                parsedDesign.fixedServices.transport.map(t => <div key={t.id} style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{t.name}</div>)
                                                                : <span style={{ fontSize: '13px', color: '#94a3b8' }}>Chưa chọn phương tiện</span>
                                                            }
                                                        </div>
                                                    </div>
                                                )}

                                                {/* TIMELINE CÁC BUỔI */}
                                                {parsedDesign.itineraryDays.map((day) => (
                                                    <div key={day.dayIndex} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                        <div style={{ background: '#ecfdf5', padding: '12px 16px', borderBottom: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: '700', color: '#047857', fontSize: '15px' }}>NGÀY {day.dayIndex}</span>
                                                            <span style={{ fontSize: '13px', color: '#059669', fontWeight: '600', backgroundColor: '#d1fae5', padding: '4px 10px', borderRadius: '20px' }}>🗓️ {day.dateString || \`Ngày \${day.dayIndex}\`}</span>
                                                        </div>
                                                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                            {['morning', 'noon', 'evening'].map(slot => {
                                                                if (!day.slots[slot] || day.slots[slot].length === 0) return null;
                                                                const slotConfig = {
                                                                    morning: { icon: '🌅', name: 'BUỔI SÁNG', color: '#d97706', border: '#fde68a' },
                                                                    noon: { icon: '☀️', name: 'BUỔI TRƯA', color: '#ea580c', border: '#fdba74' },
                                                                    evening: { icon: '🌙', name: 'BUỔI TỐI', color: '#4f46e5', border: '#a5b4fc' }
                                                                }[slot];
                                                                return (
                                                                    <div key={slot} style={{ display: 'flex', gap: '12px' }}>
                                                                        <div style={{ width: '105px', flexShrink: 0, color: slotConfig.color, fontSize: '13px', fontWeight: '700', marginTop: '8px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                                                            <span style={{ fontSize: '16px' }}>{slotConfig.icon}</span> <span>{slotConfig.name}</span>
                                                                        </div>
                                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: \`3px solid \${slotConfig.border}\`, paddingLeft: '16px' }}>
                                                                            {day.slots[slot].map((item, idx) => (
                                                                                <div key={idx} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', color: '#334155', border: '1px solid #f1f5f9' }}>
                                                                                    <strong>{item.name}</strong>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}`;

const toWin = s => s.replace(/\n/g, '\r\n');
newRenderLogic = toWin(newRenderLogic);
oldLogic1 = toWin(oldLogic1);
oldLogic2 = toWin(oldLogic2);

let c1 = fs.readFileSync(target1, 'utf8');
if (c1.includes(oldLogic1)) {
    c1 = c1.replace(oldLogic1, newRenderLogic);
    fs.writeFileSync(target1, c1, 'utf8');
    console.log('Successfully updated StaffPendingTours');
} else {
    console.log('StaffPendingTours match failed');
}

let c2 = fs.readFileSync(target2, 'utf8');
if (c2.includes(oldLogic2)) {
    c2 = c2.replace(oldLogic2, newRenderLogic);
    fs.writeFileSync(target2, c2, 'utf8');
    console.log('Successfully updated ManagerTourApproval');
} else {
    console.log('ManagerTourApproval match failed');
}

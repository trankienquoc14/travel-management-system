const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, 'src', 'components', 'TourManagement.jsx');

let content = fs.readFileSync(target, 'utf8');

const regex = /if \(itineraryDays\) \{\s*return \([\s\S]*?\}\s*\}\s*catch \(e\)/;

const newLogic = `if (itineraryDays) {
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                        {/* Thông tin Dịch vụ cố định */}
                                                        {fixedServices && (
                                                            <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                                                                <div style={{ flex: 1, background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                                                    <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🏨 Dịch vụ Lưu trú</strong>
                                                                    {fixedServices.accommodation?.length > 0 ?
                                                                        fixedServices.accommodation.map(a => <div key={a.id} style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#0ea5e9' }}>•</span> {a.name}</div>)
                                                                        : <span style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật thông tin khách sạn</span>
                                                                    }
                                                                </div>
                                                                <div style={{ flex: 1, background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                                                    <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✈️ Phương tiện Di chuyển</strong>
                                                                    {fixedServices.transport?.length > 0 ?
                                                                        fixedServices.transport.map(t => <div key={t.id} style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#0ea5e9' }}>•</span> {t.name}</div>)
                                                                        : <span style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật phương tiện</span>
                                                                    }
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Chi tiết từng ngày */}
                                                        {itineraryDays.map((day) => (
                                                            <div key={day.dayIndex} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                                        <div style={{ background: '#eff6ff', padding: '12px 20px', borderBottom: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: '800', color: '#1d4ed8', fontSize: '15px' }}>NGÀY {day.dayIndex}</span>
                                                            {day.dateString && <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '600' }}>🗓️ {day.dateString}</span>}
                                                        </div>
                                                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                            {['morning', 'noon', 'evening'].map(slot => {
                                                                if (!day.slots[slot] || day.slots[slot].length === 0) return null;
                                                                const slotConfig = {
                                                                    morning: { icon: '🌅', name: 'BUỔI SÁNG', color: '#d97706', border: '#fde68a' },
                                                                    noon: { icon: '☀️', name: 'BUỔI TRƯA', color: '#ea580c', border: '#fdba74' },
                                                                    evening: { icon: '🌙', name: 'BUỔI TỐI', color: '#4f46e5', border: '#a5b4fc' }
                                                                }[slot];
                                                                return (
                                                                    <div key={slot} style={{ display: 'flex', gap: '16px' }}>
                                                                        <div style={{ width: '110px', flexShrink: 0, color: slotConfig.color, fontSize: '13px', fontWeight: '800', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                            <span style={{ fontSize: '18px' }}>{slotConfig.icon}</span> <span>{slotConfig.name}</span>
                                                                        </div>
                                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: \`3px solid \${slotConfig.border}\`, paddingLeft: '20px' }}>
                                                                            {day.slots[slot].map((item, idx) => (
                                                                                <div key={idx} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', color: '#334155', border: '1px solid #f1f5f9', fontWeight: '500' }}>
                                                                                    {item.name}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                                </div>
                                                );
                                            } else if (parsedItinerary.days) {
                                                const { costConfig, days, dayImages } = parsedItinerary;
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                        {/* Thông tin Dịch vụ cố định */}
                                                        {costConfig && (
                                                            <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                                                                <div style={{ flex: 1, background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                                                    <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🏨 Dịch vụ Lưu trú</strong>
                                                                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        {costConfig.fixed?.accommodation ? 'Đã chọn cấu hình lưu trú' : 'Chưa chọn khách sạn'}
                                                                    </span>
                                                                </div>
                                                                <div style={{ flex: 1, background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                                                    <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✈️ Phương tiện Di chuyển</strong>
                                                                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        {costConfig.selectedTransport ? 'Đã chọn phương tiện di chuyển' : 'Chưa chọn phương tiện'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Chi tiết từng ngày */}
                                                        {days.map((day) => (
                                                            <div key={day.dayIndex} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                                                <div style={{ background: '#eff6ff', padding: '12px 20px', borderBottom: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <span style={{ fontWeight: '800', color: '#1d4ed8', fontSize: '15px' }}>NGÀY {day.dayIndex} {day.route_title ? \`: \${day.route_title}\` : ''}</span>
                                                                </div>
                                                                <div style={{ padding: '20px', display: 'flex', flexDirection: 'row', gap: '20px' }}>
                                                                    {dayImages && dayImages[day.dayIndex] && (
                                                                        <div style={{ flexShrink: 0 }}>
                                                                            <img src={dayImages[day.dayIndex].startsWith('/') ? 'http://localhost:5002' + dayImages[day.dayIndex] : dayImages[day.dayIndex]} alt="Day" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                                                        </div>
                                                                    )}
                                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                                        {day.activities && day.activities.map((act, idx) => (
                                                                            <div key={idx} style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                                                                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold', width: '100px' }}>{act.type}</span>
                                                                                <strong style={{ display: 'block', color: '#0f172a', fontSize: '15px' }}>{act.name}</strong>
                                                                            </div>
                                                                        ))}
                                                                        {(!day.activities || day.activities.length === 0) && <span style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>Chưa có hoạt động nào</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                        } catch (e)`;

content = content.replace(regex, newLogic);
fs.writeFileSync(target, content, 'utf8');
console.log('Fixed TourManagement.jsx');

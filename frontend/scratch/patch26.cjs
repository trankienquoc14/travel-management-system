const fs = require('fs');
let c = fs.readFileSync('src/components/TourDetail.jsx', 'utf8');

// The original problematic section starts with: 
// {/* Lịch trình từng ngày theo timeline */}
// and ends with 
// ) : (
// /* FALLBACK CHO CÁC TOUR CŨ

const startMarker = '{/* Lịch trình từng ngày theo timeline */}';
const endMarker = ') : (\n                        /* FALLBACK CHO CÁC TOUR CŨ NHẬP BẰNG TAY';

const startIdx = c.indexOf(startMarker);
const endIdx = c.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `{/* Lịch trình từng ngày theo timeline */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Xử lý cho định dạng cũ (itineraryDays) */}
                                {parsedDesign.itineraryDays && parsedDesign.itineraryDays.map((day) => (
                                    <div key={day.dayIndex} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 10px -2px rgba(0,0,0,0.05)' }}>
                                        <div style={{ background: '#ecfdf5', padding: '15px 20px', borderBottom: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: '800', color: '#047857', fontSize: '16px' }}>NGÀY {day.dayIndex} {day.title ? \`- \${day.title}\` : ''}</span>
                                            <span style={{ fontSize: '14px', color: '#059669', fontWeight: '700', backgroundColor: '#d1fae5', padding: '6px 12px', borderRadius: '20px' }}>🗓️ {day.dateString || \`Ngày \${day.dayIndex}\`}</span>
                                        </div>
                                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {['morning', 'noon', 'evening'].map(slot => {
                                                if (!day.slots || !day.slots[slot] || day.slots[slot].length === 0) return null;
                                                const slotConfig = {
                                                    morning: { icon: '🌅', name: 'BUỔI SÁNG', color: '#d97706', border: '#fde68a' },
                                                    noon: { icon: '☀️', name: 'BUỔI TRƯA', color: '#ea580c', border: '#fdba74' },
                                                    evening: { icon: '🌙', name: 'BUỔI TỐI', color: '#4f46e5', border: '#a5b4fc' }
                                                }[slot];
                                                return (
                                                    <div key={slot} style={{ display: 'flex', gap: '15px' }}>
                                                        <div style={{ width: '120px', flexShrink: 0, color: slotConfig.color, fontSize: '14px', fontWeight: '800', marginTop: '5px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                            <span style={{ fontSize: '18px' }}>{slotConfig.icon}</span> <span>{slotConfig.name}</span>
                                                        </div>
                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: \`3px solid \${slotConfig.border}\`, paddingLeft: '20px' }}>
                                                            {day.slots[slot].map((item, idx) => (
                                                                <div key={idx} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', fontSize: '15px', color: '#334155', border: '1px solid #f1f5f9' }}>
                                                                    <strong style={{ display: 'block', marginBottom: '4px', color: '#0f172a' }}>{item.name}</strong>
                                                                    <span style={{ fontSize: '13px', color: '#64748b' }}>{item.type}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {/* Xử lý cho định dạng mới (days) */}
                                {parsedDesign.days && parsedDesign.days.map((day) => (
                                    <div key={day.dayIndex} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 10px -2px rgba(0,0,0,0.05)' }}>
                                        <div style={{ background: '#ecfdf5', padding: '15px 20px', borderBottom: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: '800', color: '#047857', fontSize: '16px' }}>NGÀY {day.dayIndex} {day.route_title ? \`- \${day.route_title}\` : ''}</span>
                                            <span style={{ fontSize: '14px', color: '#059669', fontWeight: '700', backgroundColor: '#d1fae5', padding: '6px 12px', borderRadius: '20px' }}>🗓️ Ngày {day.dayIndex}</span>
                                        </div>
                                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {day.activities && day.activities.length > 0 ? (
                                                <div style={{ display: 'flex', gap: '15px' }}>
                                                    <div style={{ width: '120px', flexShrink: 0, color: '#2563eb', fontSize: '14px', fontWeight: '800', marginTop: '5px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                        <span style={{ fontSize: '18px' }}>🕒</span> <span>HOẠT ĐỘNG</span>
                                                    </div>
                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: \`3px solid #bfdbfe\`, paddingLeft: '20px' }}>
                                                        {day.activities.map((item, idx) => (
                                                            <div key={idx} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', fontSize: '15px', color: '#334155', border: '1px solid #f1f5f9' }}>
                                                                <strong style={{ display: 'block', marginBottom: '4px', color: '#0f172a' }}>{item.name}</strong>
                                                                <span style={{ fontSize: '13px', color: '#64748b' }}>{item.type}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ padding: '10px', color: '#64748b', fontStyle: 'italic' }}>Không có hoạt động nào được lên lịch.</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    `;

    const newContent = c.substring(0, startIdx) + replacement + c.substring(endIdx);
    fs.writeFileSync('src/components/TourDetail.jsx', newContent);
    console.log("Successfully replaced itinerary section.");
} else {
    console.error("Could not find markers.");
}

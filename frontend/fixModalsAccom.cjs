const fs = require('fs');
const path = require('path');

const extractAccommodationsStr = `
                                                {/* KHÁCH SẠN VÀ XE */}
                                                {(() => {
                                                    let hotelNames = [];
                                                    if (parsedDesign.costConfig?.fixed?.accommodation && Array.isArray(parsedDesign.costConfig.fixed.accommodation)) {
                                                        hotelNames = parsedDesign.costConfig.fixed.accommodation.map(a => a.name);
                                                    } else if (parsedDesign.days) {
                                                        parsedDesign.days.forEach(d => {
                                                            if (d.accommodation && d.accommodation.name) {
                                                                if (!hotelNames.includes(d.accommodation.name)) hotelNames.push(d.accommodation.name);
                                                            }
                                                        });
                                                    }

                                                    let transportName = parsedDesign.costConfig?.selectedTransport?.name || '';

                                                    return (
                                                        <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                                                            <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '8px' }}>🏨 Dịch vụ Lưu trú</strong>
                                                                {hotelNames.length > 0 ? (
                                                                    hotelNames.map((name, i) => <div key={i} style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{name}</div>)
                                                                ) : (
                                                                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>Chưa chọn khách sạn</span>
                                                                )}
                                                            </div>
                                                            <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '8px' }}>✈️ Phương tiện Di chuyển</strong>
                                                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                                                                    {transportName ? transportName : 'Chưa chọn phương tiện'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* TIMELINE LỊCH TRÌNH */}
                                                {parsedDesign.days && parsedDesign.days.map((day) => (
                                                    <div key={day.dayIndex} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                        <div style={{ background: '#ecfdf5', padding: '12px 16px', borderBottom: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: '700', color: '#047857', fontSize: '15px' }}>NGÀY {day.dayIndex} {day.route_title ? ': ' + day.route_title : ''}</span>
                                                        </div>
                                                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'row', gap: '16px' }}>
                                                            {parsedDesign.dayImages && parsedDesign.dayImages[day.dayIndex] && (
                                                                <div style={{ flexShrink: 0 }}>
                                                                    <img src={parsedDesign.dayImages[day.dayIndex].startsWith('/') ? 'http://localhost:5002' + parsedDesign.dayImages[day.dayIndex] : parsedDesign.dayImages[day.dayIndex]} alt="Day" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                                                </div>
                                                            )}
                                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                {day.activities && day.activities.map((act, idx) => (
                                                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', width: '80px' }}>{act.type}</span>
                                                                            <strong style={{ fontSize: '14px', color: '#334155' }}>{act.name}</strong>
                                                                        </div>
                                                                        {(act.price || act.note) && (
                                                                            <div style={{ display: 'flex', gap: '15px', marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
                                                                                {act.price ? <span>💰 Giá vốn ước tính: {new Intl.NumberFormat('vi-VN').format(act.price)} đ</span> : null}
                                                                                {act.note ? <span>📝 {act.note}</span> : null}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                {(!day.activities || day.activities.length === 0) && <span style={{ color: '#94a3b8', fontSize: '13px' }}>Chưa có hoạt động nào</span>}
                                                                
                                                                {/* Hiển thị luôn khách sạn ở trong lịch trình để rõ ràng hơn */}
                                                                {day.accommodation && day.accommodation.name && (
                                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#eff6ff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bfdbfe', marginTop: '4px' }}>
                                                                        <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 'bold', width: '80px' }}>Lưu trú</span>
                                                                        <strong style={{ fontSize: '14px', color: '#1e3a8a' }}>{day.accommodation.name}</strong>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
`;

const extractAccommodationsStrTourDetail = `                            {/* KHÁCH SẠN VÀ XE */}
                            {(() => {
                                let hotelNames = [];
                                if (parsedDesign.costConfig?.fixed?.accommodation && Array.isArray(parsedDesign.costConfig.fixed.accommodation)) {
                                    hotelNames = parsedDesign.costConfig.fixed.accommodation.map(a => a.name);
                                } else if (parsedDesign.days) {
                                    parsedDesign.days.forEach(d => {
                                        if (d.accommodation && d.accommodation.name) {
                                            if (!hotelNames.includes(d.accommodation.name)) hotelNames.push(d.accommodation.name);
                                        }
                                    });
                                }

                                let transportName = parsedDesign.costConfig?.selectedTransport?.name || '';

                                return (
                                    <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                                        <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            <strong style={{ fontSize: '14px', color: '#64748b', display: 'block', marginBottom: '10px' }}>🏨 Dịch vụ Lưu trú</strong>
                                            {hotelNames.length > 0 ? (
                                                hotelNames.map((name, i) => <div key={i} style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{name}</div>)
                                            ) : (
                                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>Chưa chọn khách sạn</span>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            <strong style={{ fontSize: '14px', color: '#64748b', display: 'block', marginBottom: '10px' }}>✈️ Phương tiện Di chuyển</strong>
                                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                                                {transportName ? transportName : 'Chưa chọn phương tiện'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Lịch trình từng ngày theo timeline */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {parsedDesign.days && parsedDesign.days.map((day) => (
                                    <div key={day.dayIndex} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 10px -2px rgba(0,0,0,0.05)' }}>
                                        <div style={{ background: '#ecfdf5', padding: '15px 20px', borderBottom: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: '800', color: '#047857', fontSize: '16px' }}>NGÀY {day.dayIndex} {day.route_title ? \`- \${day.route_title}\` : ''}</span>
                                        </div>
                                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'row', gap: '20px' }}>
                                            {parsedDesign.dayImages && parsedDesign.dayImages[day.dayIndex] && (
                                                <div style={{ flexShrink: 0 }}>
                                                    <img src={parsedDesign.dayImages[day.dayIndex].startsWith('/') ? 'http://localhost:5002' + parsedDesign.dayImages[day.dayIndex] : parsedDesign.dayImages[day.dayIndex]} alt="Day" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                                                </div>
                                            )}
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {day.activities && day.activities.map((act, idx) => (
                                                    <div key={idx} style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                                                        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'bold', width: '100px' }}>{act.type}</span>
                                                        <div style={{ flex: 1 }}>
                                                            <strong style={{ display: 'block', color: '#0f172a', fontSize: '15px' }}>{act.name}</strong>
                                                            {(act.price || act.note) && (
                                                                <div style={{ display: 'flex', gap: '15px', marginTop: '4px', fontSize: '13px', color: '#64748b' }}>
                                                                    {act.price ? <span>💰 Dự kiến: {new Intl.NumberFormat('vi-VN').format(act.price)} đ</span> : null}
                                                                    {act.note ? <span>📝 {act.note}</span> : null}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!day.activities || day.activities.length === 0) && <span style={{ color: '#94a3b8', fontSize: '14px' }}>Chưa có hoạt động nào</span>}
                                                
                                                {/* Hiển thị luôn khách sạn ở trong lịch trình để rõ ràng hơn */}
                                                {day.accommodation && day.accommodation.name && (
                                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#eff6ff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                                                        <span style={{ fontSize: '14px', color: '#3b82f6', fontWeight: 'bold', width: '100px' }}>Lưu trú</span>
                                                        <div style={{ flex: 1 }}>
                                                            <strong style={{ display: 'block', color: '#1e3a8a', fontSize: '15px' }}>{day.accommodation.name}</strong>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>`;

const extractAccommodationsStrTourManagement = `                                            } else if (parsedItinerary.days) {
                                                const { costConfig, days, dayImages } = parsedItinerary;
                                                let hotelNames = [];
                                                if (costConfig?.fixed?.accommodation && Array.isArray(costConfig.fixed.accommodation)) {
                                                    hotelNames = costConfig.fixed.accommodation.map(a => a.name);
                                                } else if (days) {
                                                    days.forEach(d => {
                                                        if (d.accommodation && d.accommodation.name) {
                                                            if (!hotelNames.includes(d.accommodation.name)) hotelNames.push(d.accommodation.name);
                                                        }
                                                    });
                                                }
                                                let transportName = costConfig?.selectedTransport?.name || '';
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                        {/* Thông tin Dịch vụ cố định */}
                                                        {costConfig && (
                                                            <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                                                                <div style={{ flex: 1, background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                                                    <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🏨 Dịch vụ Lưu trú</strong>
                                                                    {hotelNames.length > 0 ? (
                                                                        hotelNames.map((name, i) => <div key={i} style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ color: '#0ea5e9' }}>•</span> {name}</div>)
                                                                    ) : (
                                                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>Chưa chọn khách sạn</span>
                                                                    )}
                                                                </div>
                                                                <div style={{ flex: 1, background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                                                    <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>✈️ Phương tiện Di chuyển</strong>
                                                                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        {transportName ? transportName : 'Chưa chọn phương tiện'}
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
                                                                                <div style={{ flex: 1 }}>
                                                                                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '15px' }}>{act.name}</strong>
                                                                                    {(act.price || act.note) && (
                                                                                        <div style={{ display: 'flex', gap: '15px', marginTop: '4px', fontSize: '13px', color: '#64748b' }}>
                                                                                            {act.price ? <span>💰 Giá vốn ước tính: {new Intl.NumberFormat('vi-VN').format(act.price)} đ</span> : null}
                                                                                            {act.note ? <span>📝 {act.note}</span> : null}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        {(!day.activities || day.activities.length === 0) && <span style={{ color: '#94a3b8', fontSize: '14px', fontStyle: 'italic' }}>Chưa có hoạt động nào</span>}
                                                                        
                                                                        {day.accommodation && day.accommodation.name && (
                                                                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', background: '#eff6ff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                                                                                <span style={{ fontSize: '14px', color: '#3b82f6', fontWeight: 'bold', width: '100px' }}>Lưu trú</span>
                                                                                <div style={{ flex: 1 }}>
                                                                                    <strong style={{ display: 'block', color: '#1e3a8a', fontSize: '15px' }}>{day.accommodation.name}</strong>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }
`;

function doReplace(file, oldRe, newStr) {
    const fPath = path.join(__dirname, 'src', 'components', file);
    let content = fs.readFileSync(fPath, 'utf8');
    content = content.replace(oldRe, newStr);
    fs.writeFileSync(fPath, content, 'utf8');
    console.log('Fixed', file);
}

// 1. StaffPendingTours
doReplace('StaffPendingTours.jsx', /\{\/\* KHÁCH SẠN VÀ XE \*\/\}[\s\S]*?(?=<\/div>\s*\);\s*\} catch \(e\))/m, extractAccommodationsStr + '\n                                            ');

// 2. ManagerTourApproval
doReplace('ManagerTourApproval.jsx', /\{\/\* KHÁCH SẠN VÀ XE \*\/\}[\s\S]*?(?=<\/div>\s*\);\s*\} catch \(e\))/m, extractAccommodationsStr + '\n                                            ');

// 3. TourDetail
doReplace('TourDetail.jsx', /\{\/\* KHÁCH SẠN VÀ XE \*\/\}[\s\S]*?(?=<\/div>\s*\}\)\s*:\s*<div)/m, extractAccommodationsStrTourDetail + '\n                            ');

// 4. TourManagement
doReplace('TourManagement.jsx', /\} else if \(parsedItinerary\.days\) \{[\s\S]*?(?=\}\s*catch \(e\))/m, extractAccommodationsStrTourManagement + '                                        ');


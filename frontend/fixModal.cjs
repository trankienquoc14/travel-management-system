const fs = require('fs');
const path = require('path');

const newRenderLogic = `                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                {/* KHÁCH SẠN VÀ XE */}
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
                                                ))}
                                            </div>
                                        );
                                    } catch (e) { console.error(e); return <span>Lỗi hiển thị lịch trình.</span>; }`;

const filesToUpdate = ['StaffPendingTours.jsx', 'ManagerTourApproval.jsx'];

filesToUpdate.forEach(filename => {
    const filePath = path.join(__dirname, 'src', 'components', filename);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find the return block inside try-catch block of rendering design_data
    const regex = /return \(\s*<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>[\s\S]*?<\/div>\s*\);\s*\} catch \(e\) \{ console\.error\(e\); return <span>Lỗi hiển thị lịch trình.<\/span>; \}/;
    
    if (content.match(regex)) {
        content = content.replace(regex, newRenderLogic);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated ' + filename);
    } else {
        console.log('Regex failed for ' + filename);
    }
});

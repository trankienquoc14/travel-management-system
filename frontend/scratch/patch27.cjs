const fs = require('fs');
let c = fs.readFileSync('src/components/TourDetail.jsx', 'utf8');

const startMarker = '{/* Dịch vụ cố định */}';
const endMarker = '{/* Lịch trình từng ngày theo timeline */}';

const startIdx = c.indexOf(startMarker);
const endIdx = c.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `{/* Dịch vụ cố định */}
                            {parsedDesign.fixedServices && (
                                <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                                    <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <strong style={{ fontSize: '14px', color: '#64748b', display: 'block', marginBottom: '10px' }}>🏨 Dịch vụ Lưu trú</strong>
                                        {parsedDesign.fixedServices.accommodation?.length > 0 ?
                                            parsedDesign.fixedServices.accommodation.map(a => <div key={a.id} style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{a.name}</div>)
                                            : <span style={{ fontSize: '14px', color: '#94a3b8' }}>Tiêu chuẩn linh hoạt</span>
                                        }
                                    </div>
                                    <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <strong style={{ fontSize: '14px', color: '#64748b', display: 'block', marginBottom: '10px' }}>✈️ Phương tiện Di chuyển</strong>
                                        {parsedDesign.fixedServices.transport?.length > 0 ?
                                            parsedDesign.fixedServices.transport.map(t => <div key={t.id} style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{t.name}</div>)
                                            : <span style={{ fontSize: '14px', color: '#94a3b8' }}>Dịch vụ tiêu chuẩn cao</span>
                                        }
                                    </div>
                                </div>
                            )}

                            {parsedDesign.costConfig && (
                                <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                                    <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <strong style={{ fontSize: '14px', color: '#64748b', display: 'block', marginBottom: '10px' }}>🏨 Dịch vụ Lưu trú</strong>
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                                            {parsedDesign.costConfig.fixed?.accommodation ? 'Đã chọn cấu hình lưu trú' : 'Tiêu chuẩn linh hoạt'}
                                        </span>
                                    </div>
                                    <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <strong style={{ fontSize: '14px', color: '#64748b', display: 'block', marginBottom: '10px' }}>✈️ Phương tiện Di chuyển</strong>
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                                            {parsedDesign.costConfig.selectedTransport ? (parsedDesign.costConfig.selectedTransport.service_name || parsedDesign.costConfig.selectedTransport.name || 'Đã chọn phương tiện di chuyển') : 'Dịch vụ tiêu chuẩn cao'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            `;

    const newContent = c.substring(0, startIdx) + replacement + c.substring(endIdx);
    fs.writeFileSync('src/components/TourDetail.jsx', newContent);
    console.log("Successfully replaced fixed services section.");
} else {
    console.error("Could not find markers.");
}

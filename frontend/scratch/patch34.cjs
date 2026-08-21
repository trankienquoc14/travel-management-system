const fs = require('fs');
let c = fs.readFileSync('src/components/ManagerTourApproval.jsx', 'utf8');

const targetStr = `                                                        <strong style={{ fontSize: '16px', color: '#15803d' }}>GIÁ BÁN CÔNG BỐ:</strong>
                                                        <strong style={{ fontSize: '20px', color: '#15803d', background: '#dcfce7', padding: '4px 8px', borderRadius: '6px' }}>{formatMoney(computed.sellingPrice)} đ</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>`;

const newBlock = `
                                        {/* Block Chính sách giá trẻ em */}
                                        {costConfig.ageMultiplier && (
                                            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', marginTop: '20px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                                    <h4 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>👶 Chính sách giá Trẻ em & Phụ thu</h4>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                                    {[
                                                        { key: 'child', label: 'Trẻ em (5 - 11 tuổi)' },
                                                        { key: 'toddler', label: 'Trẻ nhỏ (2 - 4 tuổi)' },
                                                        { key: 'infant', label: 'Em bé (< 2 tuổi)' }
                                                    ].map(group => {
                                                        const setting = costConfig.ageMultiplier[group.key] || { percent: 100, fixed_surcharge: 0 };
                                                        const p = computed.sellingPrice || 0;
                                                        const cal = (p * (setting.percent / 100)) + Number(setting.fixed_surcharge);
                                                        return (
                                                            <div key={group.key} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                                                                <strong style={{ display: 'block', fontSize: '14px', color: '#334155', marginBottom: '12px' }}>{group.label}</strong>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
                                                                    <span>Tỷ lệ so với vé người lớn:</span>
                                                                    <strong>{setting.percent}%</strong>
                                                                </div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#475569' }}>
                                                                    <span>Phụ thu cố định (Vé bay...):</span>
                                                                    <strong>{formatMoney(setting.fixed_surcharge)} đ</strong>
                                                                </div>
                                                                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '500' }}>Giá bán ra:</span>
                                                                    <strong style={{ fontSize: '16px', color: '#0ea5e9' }}>{formatMoney(cal)} đ</strong>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
`;

c = c.replace(targetStr, targetStr + newBlock);
fs.writeFileSync('src/components/ManagerTourApproval.jsx', c);
console.log('Added child pricing block to manager approval modal');

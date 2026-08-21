const fs = require('fs');
let c = fs.readFileSync('src/components/StaffFixedTourDesigner.jsx', 'utf8');

const anchor = `                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Biên độ lợi nhuận (%)</label>
                                <input type="number" value={costConfig.margin} onChange={e => setCostConfig({...costConfig, margin: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Phụ thu phòng đơn / Khách</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" value={Number(costConfig.variable.singleSupplement || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, singleSupplement: e.target.value.replace(/\\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                </div>
                            </div>
                        </div>
                    </div>`;

const newBlock = `                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Biên độ lợi nhuận (%)</label>
                                <input type="number" value={costConfig.margin} onChange={e => setCostConfig({...costConfig, margin: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Phụ thu phòng đơn / Khách</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" value={Number(costConfig.variable.singleSupplement || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, singleSupplement: e.target.value.replace(/\\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', gridColumn: '1 / -1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', color: '#0ea5e9' }}>Chính sách giá trẻ em</h3>
                            <select 
                                value={costConfig.ageMultiplier.preset || 'custom'}
                                onChange={e => {
                                    const preset = e.target.value;
                                    let newMulti = { ...costConfig.ageMultiplier, preset };
                                    if (preset === 'road') {
                                        newMulti = { preset, child: { percent: 50, fixed_surcharge: 0 }, toddler: { percent: 0, fixed_surcharge: 0 }, infant: { percent: 0, fixed_surcharge: 0 } };
                                    } else if (preset === 'air') {
                                        newMulti = { preset, child: { percent: 85, fixed_surcharge: 0 }, toddler: { percent: 50, fixed_surcharge: 0 }, infant: { percent: 0, fixed_surcharge: 500000 } };
                                    }
                                    setCostConfig({ ...costConfig, ageMultiplier: newMulti });
                                }}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                            >
                                <option value="custom">Tuỳ chỉnh (Custom)</option>
                                <option value="road">Mẫu 1 (Đường bộ): 50% - 0% - 0%</option>
                                <option value="air">Mẫu 2 (Hàng không): 85% - 50% - (0% + Phụ thu)</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                            {[
                                { key: 'child', label: 'Trẻ em (5 - 11 tuổi)' },
                                { key: 'toddler', label: 'Trẻ nhỏ (2 - 4 tuổi)' },
                                { key: 'infant', label: 'Em bé (< 2 tuổi)' }
                            ].map(group => {
                                const currentSetting = costConfig.ageMultiplier[group.key] || { percent: 0, fixed_surcharge: 0 };
                                const isCustom = costConfig.ageMultiplier.preset === 'custom';
                                const calPrice = (sellingPrice * (currentSetting.percent || 0) / 100) + Number(currentSetting.fixed_surcharge || 0);

                                return (
                                    <div key={group.key} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <strong style={{ display: 'block', marginBottom: '10px', color: '#1e293b', fontSize: '14px' }}>{group.label}</strong>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Tỷ lệ % giá người lớn</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <input 
                                                        type="number" 
                                                        value={currentSetting.percent}
                                                        disabled={!isCustom}
                                                        onChange={e => {
                                                            setCostConfig({
                                                                ...costConfig,
                                                                ageMultiplier: {
                                                                    ...costConfig.ageMultiplier,
                                                                    [group.key]: { ...currentSetting, percent: Number(e.target.value) }
                                                                }
                                                            })
                                                        }}
                                                        style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: isCustom ? '#fff' : '#f1f5f9' }}
                                                    />
                                                    <span style={{ color: '#64748b', fontSize: '13px' }}>%</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Phụ thu cố định</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input 
                                                        type="text" 
                                                        value={Number(currentSetting.fixed_surcharge || 0).toLocaleString('vi-VN')}
                                                        disabled={!isCustom}
                                                        onChange={e => {
                                                            setCostConfig({
                                                                ...costConfig,
                                                                ageMultiplier: {
                                                                    ...costConfig.ageMultiplier,
                                                                    [group.key]: { ...currentSetting, fixed_surcharge: Number(e.target.value.replace(/\\D/g, '')) }
                                                                }
                                                            })
                                                        }}
                                                        style={{ width: '100%', padding: '6px', paddingRight: '20px', borderRadius: '4px', border: '1px solid #cbd5e1', background: isCustom ? '#fff' : '#f1f5f9' }}
                                                    />
                                                    <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '12px' }}>đ</span>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: '5px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '12px', color: '#64748b' }}>Giá bán:</span>
                                                <strong style={{ fontSize: '14px', color: '#0ea5e9' }}>{formatMoneyLocal(calPrice)} đ</strong>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>`;

if (c.includes(anchor)) {
    c = c.replace(anchor, newBlock);
    fs.writeFileSync('src/components/StaffFixedTourDesigner.jsx', c);
    console.log("Success patch");
} else {
    console.log("Anchor not found. Try ignoring CRLF/LF");
    const normalizedAnchor = anchor.replace(/\\r\\n/g, '\\n').replace(/\\s+/g, '');
    const normalizedC = c.replace(/\\r\\n/g, '\\n').replace(/\\s+/g, '');
    if (normalizedC.includes(normalizedAnchor)) {
        console.log("Found ignoring spaces, but cannot replace easily.");
    }
}

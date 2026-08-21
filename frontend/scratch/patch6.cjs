const fs = require('fs');
let c = fs.readFileSync('src/components/ManagerTourApproval.jsx', 'utf8');

c = c.replace(
    /const \{ days, costConfig, computed, dayImages \} = parsedDesign;/,
    'const { days, costConfig, computed, dayImages, categories, highlights } = parsedDesign;'
);

const oldReturn = `                                    return (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', alignItems: 'start', marginBottom: '24px' }}>
                                            {/* CỘT TRÁI: LỊCH TRÌNH CHI TIẾT */}`;

const newReturn = `                                    return (
                                        <>
                                            {/* Thêm phần Phân loại & Điểm nhấn */}
                                            {(categories?.length > 0 || highlights) && (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <div>
                                                        <p style={{ margin: '0 0 8px 0', color: '#047857', fontSize: '14px', fontWeight: 'bold' }}>🏷️ Phân loại / Chủ đề</p>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                            {categories && categories.length > 0 ? categories.map(c => <span key={c} style={{ background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '16px', fontSize: '13px', fontWeight: '600', border: '1px solid #a7f3d0' }}>{c}</span>) : <span style={{fontSize: '13px', color: '#64748b'}}>Chưa phân loại</span>}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p style={{ margin: '0 0 8px 0', color: '#ea580c', fontSize: '14px', fontWeight: 'bold' }}>✨ Điểm nhấn Tour</p>
                                                        <p style={{ margin: 0, fontSize: '13px', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{highlights || <span style={{color: '#64748b'}}>Không có điểm nhấn nổi bật</span>}</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', alignItems: 'start', marginBottom: '24px' }}>
                                                {/* CỘT TRÁI: LỊCH TRÌNH CHI TIẾT */}`;

c = c.replace(oldReturn, newReturn);

const endDiv = `                                            </div>
                                        </div>
                                    );
                                } catch (error) {`;

const newEndDiv = `                                            </div>
                                        </div>
                                        </>
                                    );
                                } catch (error) {`;

c = c.replace(endDiv, newEndDiv);

fs.writeFileSync('src/components/ManagerTourApproval.jsx', c);

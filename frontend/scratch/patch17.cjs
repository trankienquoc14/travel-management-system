const fs = require('fs');
let c = fs.readFileSync('src/components/TourDetail.jsx', 'utf8');

c = c.replace(
    /<h2>Tổng quan chuyến đi<\/h2>\s*<p className="tour-desc".*?>\s*\{tour\.description.*\}\s*<\/p>/,
    `{(parsedDesign?.categories?.length > 0 || parsedDesign?.highlights) && (
                        <div style={{ marginBottom: '24px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            {parsedDesign.categories?.length > 0 && (
                                <div style={{ marginBottom: parsedDesign.highlights ? '16px' : '0' }}>
                                    <strong style={{ fontSize: '15px', color: '#047857', display: 'block', marginBottom: '10px' }}>🏷️ Phân loại Tour:</strong>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {parsedDesign.categories.map(c => <span key={c} style={{ background: '#ecfdf5', color: '#059669', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', border: '1px solid #a7f3d0' }}>{c}</span>)}
                                    </div>
                                </div>
                            )}
                            {parsedDesign.highlights && (
                                <div style={{ borderTop: parsedDesign.categories?.length > 0 ? '1px dashed #cbd5e1' : 'none', paddingTop: parsedDesign.categories?.length > 0 ? '16px' : '0' }}>
                                    <strong style={{ fontSize: '15px', color: '#ea580c', display: 'block', marginBottom: '8px' }}>✨ Điểm nhấn hành trình:</strong>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{parsedDesign.highlights}</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <h2>Tổng quan chuyến đi</h2>
                    <p className="tour-desc" style={{ whiteSpace: 'pre-line', lineHeight: '1.8', color: '#475569' }}>
                        {tour.description || "Hãy cùng chúng tôi khám phá những trải nghiệm tuyệt vời nhất trong chuyến đi này!"}
                    </p>`
);

fs.writeFileSync('src/components/TourDetail.jsx', c);

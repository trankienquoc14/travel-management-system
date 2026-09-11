const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/HomePage.jsx', 'utf8');

const theButtonStr = `<button
                            onClick={() => navigate('/tours')}
                            style={{
                                background: '#ffffff', color: '#1d4ed8', border: '1.5px solid #e2e8f0', padding: '5px 5px 5px 18px', borderRadius: '30px',
                                fontSize: '13.5px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                transition: 'all 0.2s ease', whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#93c5fd'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(29, 78, 216, 0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                        >
                            Xem thêm
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#1d4ed8', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ChevronRight size={16} strokeWidth={3} />
                            </div>
                        </button>`;

// Fix Điểm Đến
const diemDenStart = code.indexOf("<h2 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>");
if (diemDenStart !== -1) {
    // Find the enclosing div
    const enclosingDivStart = code.lastIndexOf("<div style={{", diemDenStart);
    const enclosingDivEnd = code.indexOf("</div>", diemDenStart) + 6;
    // Actually the parent is `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>`
    // And it ends after `Xem tất cả chuyến đi ➡️</div></div>`
    
    // We will just replace it cleanly
    const parentStart = code.lastIndexOf("<div style={{ display: 'flex', justifyContent: 'space-between'", diemDenStart);
    const parentEnd = code.indexOf("</div>\n                </div>", parentStart) + 30; // Find the double closing div
    
    const newDiemDen = `
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
                    <div>
                        <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            📍 Điểm Đến Thịnh Hành & Nổi Bật
                            <span style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '12px', fontWeight: '800' }}>HOT 2026</span>
                        </h2>
                        <p style={{ fontSize: '14.5px', color: '#475569', margin: 0 }}>
                            Khám phá các điểm đến được săn đón và đánh giá cao nhất bởi cộng đồng du khách VietTravel
                        </p>
                    </div>
                    ${theButtonStr}
                </div>`;
                
    code = code.substring(0, parentStart) + newDiemDen.trim() + code.substring(parentEnd);
}

// Fix Ưu Đãi
const uuDaiStart = code.indexOf("<h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444', margin: 0 }}>\n                            💯 Ưu Đãi Đặc Biệt");
if (uuDaiStart !== -1) {
    const parentStart = code.lastIndexOf("<div style={{ display: 'flex', justifyContent: 'space-between'", uuDaiStart);
    // Be careful, it might just be the Title and p, then closed.
    const pEnd = code.indexOf("</p>", uuDaiStart) + 4;
    const parentEnd = code.indexOf("</div>\n                </div>", pEnd) + 30;
    
    const newUuDai = `
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px', width: '100%' }}>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444', margin: 0 }}>
                            💯 Ưu Đãi Đặc Biệt
                        </h2>
                        <p style={{ fontSize: '14.5px', color: '#64748b', marginTop: '4px', margin: 0 }}>
                            Các chuyến đi đang được giảm giá tốt nhất
                        </p>
                    </div>
                    ${theButtonStr}
                </div>`;
                
    code = code.substring(0, parentStart) + newUuDai.trim() + code.substring(parentEnd);
}

fs.writeFileSync('frontend/src/components/HomePage.jsx', code, 'utf8');
console.log('Fixed absolutely everything');

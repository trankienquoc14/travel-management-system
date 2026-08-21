const fs = require('fs');
let c = fs.readFileSync('src/components/ManagerTourApproval.jsx', 'utf8');

// 1. Add destinations state
c = c.replace(
    /const \[loading, setLoading\] = useState\(true\);/,
    "const [loading, setLoading] = useState(true);\n    const [destinations, setDestinations] = useState([]);"
);

// 2. Fetch destinations
c = c.replace(
    /const \[resCustom, resFixed\] = await Promise\.all\(\[/,
    "const [resCustom, resFixed, resDest] = await Promise.all(["
);
c = c.replace(
    /axios\.get\('http:\/\/localhost:5000\/api\/staff\/tours', \{ headers: \{ Authorization: \`Bearer \$\{token\}\` \} \}\)/,
    "axios.get('http://localhost:5000/api/staff/tours', { headers: { Authorization: `Bearer ${token}` } }),\n                axios.get('http://localhost:5000/api/destinations', { headers: { Authorization: `Bearer ${token}` } })"
);
c = c.replace(
    /if \(resFixed\.data\.success\) \{\n                setAllFixedTours\(resFixed\.data\.data\);\n            \}/,
    "if (resFixed.data.success) {\n                setAllFixedTours(resFixed.data.data);\n            }\n            if (resDest && resDest.data.success) {\n                setDestinations(resDest.data.data);\n            }"
);

// Helper function to extract destination string
const helper = `    const getDestString = (tour) => {
        try {
            const dd = typeof tour.design_data === 'string' ? JSON.parse(tour.design_data) : tour.design_data;
            if (!dd || !dd.days) return tour.destination;
            const ids = [...new Set(dd.days.map(d => d.end_destination_id).filter(Boolean))];
            const names = ids.map(id => {
                const dest = destinations.find(x => String(x.destination_id) === String(id));
                return dest ? dest.name : '';
            }).filter(Boolean);
            return names.length > 0 ? names.join(' - ') : tour.destination;
        } catch(e) {
            return tour.destination;
        }
    };

    // Dữ liệu hiển thị sau khi lọc`;
c = c.replace(/    \/\/ Dữ liệu hiển thị sau khi lọc/, helper);

// 3. Fix List View to use Điểm đến
c = c.replace(
    /<div>📍 Tuyến đường: <strong>\{tour\.destination\}<\/strong><\/div>/g,
    `<div>📍 Điểm đến: <strong>{getDestString(tour)}</strong></div>`
);

// 4. Move Mô tả tổng quan below Categories in Modal View
// Remove from top
const oldModalTop = `<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>📝 Mô tả tổng quan</p>
                                    <p style={{ margin: 0, fontWeight: '500', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{selectedFixedTour.description || <span style={{color: '#94a3b8', fontStyle: 'italic'}}>Chưa có mô tả</span>}</p>
                                </div>
                                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px' }}>
                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>📍 Tuyến đường</p>
                                    <p style={{ margin: 0, fontWeight: '600', color: '#0f172a' }}>{selectedFixedTour.destination}</p>
                                </div>
                                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px' }}>
                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>⏱️ Thời gian</p>
                                    <p style={{ margin: 0, fontWeight: '600', color: '#0f172a' }}>{selectedFixedTour.duration_days} Ngày {Math.max(0, selectedFixedTour.duration_days - 1)} Đêm</p>
                                </div>
                            </div>`;

const newModalTop = `<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div>
                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>📍 Điểm đến</p>
                                    <p style={{ margin: 0, fontWeight: '600', color: '#0f172a' }}>{getDestString(selectedFixedTour)}</p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>⏱️ Thời gian</p>
                                    <p style={{ margin: 0, fontWeight: '600', color: '#0f172a' }}>{selectedFixedTour.duration_days} Ngày {Math.max(0, selectedFixedTour.duration_days - 1)} Đêm</p>
                                </div>
                            </div>`;

c = c.replace(oldModalTop, newModalTop);

// Insert Description below Categories/Highlights
const oldCatBlock = `                                            {(categories?.length > 0 || highlights) && (
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
                                            )}`;

const newCatBlock = `                                            {(categories?.length > 0 || highlights) && (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
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
                                            
                                            <div style={{ marginBottom: '24px', background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                <p style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '14px', fontWeight: 'bold' }}>📝 Mô tả tổng quan</p>
                                                <p style={{ margin: 0, fontWeight: '500', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{selectedFixedTour.description || <span style={{color: '#94a3b8', fontStyle: 'italic'}}>Chưa có mô tả</span>}</p>
                                            </div>`;

c = c.replace(oldCatBlock, newCatBlock);

fs.writeFileSync('src/components/ManagerTourApproval.jsx', c);

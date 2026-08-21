const fs = require('fs');
let content = fs.readFileSync('src/components/TourDetail.jsx', 'utf8');

// Normalize newlines to \n
content = content.replace(/\r\n/g, '\n');

// 1. State
content = content.replace(
    /const \[tour, setTour\] = useState\(null\);/,
    "const [tour, setTour] = useState(null);\n    const [destinations, setDestinations] = useState([]);"
);

// 2. fetchTourDetail & getDestString
const oldFetch = `    const fetchTourDetail = async () => {
        try {
            const response = await axios.get(\`http://localhost:5000/api/tours/\${id}\`);
            if (response.data.success) {
                // Bảo vệ dữ liệu trả về từ backend
                let data = response.data.data;
                while (Array.isArray(data)) data = data[0];
                setTour(data);
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi khi tải thông tin tour!');
        }
    };`;

const newFetch = `    const fetchTourDetail = async () => {
        try {
            const [tourRes, destRes] = await Promise.all([
                axios.get(\`http://localhost:5000/api/tours/\${id}\`),
                axios.get(\`http://localhost:5000/api/destinations\`)
            ]);
            
            if (destRes.data.success) {
                setDestinations(destRes.data.data);
            }

            if (tourRes.data.success) {
                let data = tourRes.data.data;
                while (Array.isArray(data)) data = data[0];
                setTour(data);
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi khi tải thông tin tour!');
        }
    };

    const getDestString = (tourObj, design) => {
        try {
            if (!design || !design.days) return tourObj.destination;
            const startOriginId = design.days[0]?.start_destination_id;
            const rawIds = [...new Set(design.days.map(d => d.end_destination_id).filter(Boolean))];
            const ids = rawIds.filter(id => String(id) !== String(startOriginId));
            const names = ids.map(idx => {
                const dest = destinations.find(x => String(x.destination_id) === String(idx));
                return dest ? dest.destination_name : '';
            }).filter(Boolean);
            return names.length > 0 ? names.join(' - ') : tourObj.destination;
        } catch(e) {
            return tourObj.destination;
        }
    };`;

content = content.replace(oldFetch, newFetch);

// 3. Hero banner replacements
content = content.replace(
    /<span className="badge-location">📍 \{tour\.destination\}<\/span>/,
    `<span className="badge-location">📍 {getDestString(tour, parsedDesign)}</span>`
);
content = content.replace(
    /<p>\{tour\.duration_days\} Ngày \| Trải nghiệm đẳng cấp<\/p>/,
    `<p>{tour.duration_days} Ngày {Math.max(0, tour.duration_days - 1)} Đêm | Trải nghiệm đẳng cấp</p>`
);

// 4. Transport name replacement
content = content.replace(
    /\{parsedDesign\.costConfig\.selectedTransport \? 'Đã chọn phương tiện di chuyển' : 'Chưa chọn phương tiện'\}/,
    `{parsedDesign.costConfig.selectedTransport ? (parsedDesign.costConfig.selectedTransport.service_name || parsedDesign.costConfig.selectedTransport.name || 'Đã chọn phương tiện di chuyển') : 'Chưa chọn phương tiện'}`
);

// 5. Categories and Highlights
const overviewRegex = /<h2>Tổng quan chuyến đi<\/h2>\n\s*<p className="tour-desc" style=\{\{ whiteSpace: 'pre-line', lineHeight: '1\.8', color: '#475569' \}\}>\n\s*\{tour\.description \|\| "Hãy cùng chúng tôi khám phá những trải nghiệm tuyệt vời nhất trong chuyến đi này!"\}\n\s*<\/p>/;

const newOverview = `{(parsedDesign?.categories?.length > 0 || parsedDesign?.highlights) && (
                        <div style={{ marginBottom: '24px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            {Array.isArray(parsedDesign.categories) && parsedDesign.categories.length > 0 && (
                                <div style={{ marginBottom: parsedDesign.highlights ? '16px' : '0' }}>
                                    <strong style={{ fontSize: '15px', color: '#047857', display: 'block', marginBottom: '10px' }}>🏷️ Phân loại Tour:</strong>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {parsedDesign.categories.map(c => <span key={c} style={{ background: '#ecfdf5', color: '#059669', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', border: '1px solid #a7f3d0' }}>{c}</span>)}
                                    </div>
                                </div>
                            )}
                            {parsedDesign.highlights && (
                                <div style={{ borderTop: (Array.isArray(parsedDesign.categories) && parsedDesign.categories.length > 0) ? '1px dashed #cbd5e1' : 'none', paddingTop: (Array.isArray(parsedDesign.categories) && parsedDesign.categories.length > 0) ? '16px' : '0' }}>
                                    <strong style={{ fontSize: '15px', color: '#ea580c', display: 'block', marginBottom: '8px' }}>✨ Điểm nhấn hành trình:</strong>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{parsedDesign.highlights}</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <h2>Tổng quan chuyến đi</h2>
                    <p className="tour-desc" style={{ whiteSpace: 'pre-line', lineHeight: '1.8', color: '#475569' }}>
                        {tour.description || "Hãy cùng chúng tôi khám phá những trải nghiệm tuyệt vời nhất trong chuyến đi này!"}
                    </p>`;

content = content.replace(overviewRegex, newOverview);

fs.writeFileSync('src/components/TourDetail.jsx', content);

const fs = require('fs');

let c = fs.readFileSync('C:/Users/ASUS/.gemini/antigravity/brain/2fa6572d-6fa5-4f11-9fcf-46de7aa3e2b3/scratch/StaffFixedTourDesigner_old.txt', 'utf8');

// 1. Inject state
c = c.replace(
    'const [markupPercent, setMarkupPercent] = useState(20);',
    'const [markupPercent, setMarkupPercent] = useState(20);\n    const [dayImages, setDayImages] = useState({});'
);

// 2. Inject clear state on init
c = c.replace(
    'setFixedServices({ accommodation: [], transport: [] });',
    'setFixedServices({ accommodation: [], transport: [] });\n        setDayImages({});'
);

// 3. Parse existing images on edit
c = c.replace(
    'setItineraryDays(mappedDays);',
    'setItineraryDays(mappedDays);\n                    const images = {};\n                    tourData.itinerary.forEach(day => {\n                        if (day.image_url) images[day.day_number] = day.image_url;\n                    });\n                    setDayImages(images);'
);

// 4. Clear dayImages when no itinerary
c = c.replace(
    'setItineraryDays([]);',
    'setItineraryDays([]);\n                    setDayImages({});'
);

// 5. Append dayImages in handleSaveDesign
c = c.replace(
    /data\.append\('itinerary', JSON\.stringify\(itineraryDays\)\);/,
    `data.append('itinerary', JSON.stringify(itineraryDays));\n\n            Object.keys(dayImages).forEach(dayIndex => {\n                if (dayImages[dayIndex] instanceof File) {\n                    data.append(\`dayImage_\${dayIndex}\`, dayImages[dayIndex]);\n                } else if (dayImages[dayIndex]) {\n                    data.append(\`dayImageUrl_\${dayIndex}\`, dayImages[dayIndex]);\n                }\n            });`
);

// 6. Inject UI for Day Images
const uiCode = `
                                        <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontSize: '14px', fontWeight: '600' }}>Hình ảnh Ngày {day.dayIndex}</label>
                                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                <div style={{ width: '120px', height: '80px', border: '2px dashed #cbd5e1', borderRadius: '8px', background: '#fff', position: 'relative', overflow: 'hidden' }}>
                                                    {dayImages[day.dayIndex] ? (
                                                        <>
                                                            <img src={dayImages[day.dayIndex] instanceof File ? URL.createObjectURL(dayImages[day.dayIndex]) : getImageUrl(dayImages[day.dayIndex])} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <button onClick={() => { const newImgs = {...dayImages}; delete newImgs[day.dayIndex]; setDayImages(newImgs); }} style={{ position: 'absolute', top: 2, right: 2, background: 'red', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '10px', width: '20px', height: '20px' }}>x</button>
                                                        </>
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px' }}>
                                                            <span>📷 Chọn ảnh</span>
                                                            <input type="file" accept="image/*" onChange={(e) => { if(e.target.files[0]) setDayImages({...dayImages, [day.dayIndex]: e.target.files[0] }) }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                                                        </div>
                                                    )}
                                                </div>
                                                <p style={{ fontSize: '12px', color: '#64748b', flex: 1 }}>Hình ảnh đại diện cho các hoạt động trong ngày này. (Khuyên dùng: Tỉ lệ 16:9)</p>
                                            </div>
                                        </div>
`;

c = c.replace(
    /<h4 style={{ margin: '0 0 20px 0', color: '#2563eb', fontSize: '18px', borderBottom: '2px solid #eff6ff', paddingBottom: '10px' }}>\{day\.dateString\}<\/h4>/,
    `<h4 style={{ margin: '0 0 20px 0', color: '#2563eb', fontSize: '18px', borderBottom: '2px solid #eff6ff', paddingBottom: '10px' }}>{day.dateString}</h4>\n${uiCode}`
);

fs.writeFileSync('src/components/StaffFixedTourDesigner.jsx', c, 'utf8');
console.log('Restored monolith with dayImages!');

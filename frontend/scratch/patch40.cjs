const fs = require('fs');
let c = fs.readFileSync('src/components/TourDetail.jsx', 'utf8');

const dayItemComponent = `
const DayItem = ({ day, isOldFormat, index, getDestString, tour, parsedDesign, destinations, bgImage }) => {
    const [isExpanded, setIsExpanded] = React.useState(index === 0);
    
    // Bữa ăn
    let meals = [];
    if (isOldFormat) {
        meals = ['Ăn sáng', 'trưa', 'chiều'];
    } else {
        if (day.meals?.breakfast) meals.push('Ăn sáng');
        if (day.meals?.lunch) meals.push('trưa');
        if (day.meals?.dinner) meals.push('chiều');
        if (meals.length === 0) meals = ['Ăn tự túc'];
    }
    const mealStr = \`🍴 \${meals.join(', ')}\`;
    
    // Tiêu đề tuyến
    let title = '';
    if (isOldFormat) {
        title = day.title || '';
    } else {
        title = day.route_title || '';
        if (!title) {
            const getD = (id) => destinations.find(x => String(x.destination_id) === String(id))?.destination_name;
            title = [getD(day.start_destination_id), getD(day.end_destination_id)].filter(Boolean).join(' - ');
        }
    }
    
    // Hoạt động
    let activities = [];
    if (isOldFormat) {
        ['morning', 'noon', 'evening'].forEach(slot => {
            if(day.slots && day.slots[slot]) {
                day.slots[slot].forEach(item => {
                   activities.push(item);
                });
            }
        });
    } else {
        activities = day.activities || [];
    }

    const img = parsedDesign?.dayImages?.[day.dayIndex] || bgImage;

    return (
        <div style={{ position: 'relative', marginBottom: isExpanded ? '40px' : '20px' }}>
            {/* The dot marker */}
            <div style={{ position: 'absolute', left: '-36px', top: isExpanded ? '60px' : '36px', width: '18px', height: '18px', borderRadius: '50%', background: '#0f172a', border: '4px solid #fff', zIndex: 2, transform: 'translateY(-50%)', transition: 'all 0.3s', boxShadow: '0 0 0 1px #cbd5e1' }}></div>
            
            {isExpanded ? (
                <div style={{ transition: 'all 0.3s' }}>
                    {/* Header Card (Blue) */}
                    <div onClick={() => setIsExpanded(false)} style={{ display: 'flex', background: '#eff6ff', borderRadius: '20px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', minHeight: '160px' }}>
                        <div style={{ flex: 1, padding: '32px' }}>
                            <h3 style={{ color: '#3b82f6', fontSize: '24px', marginBottom: '12px', fontWeight: 'bold' }}>Ngày {day.dayIndex}</h3>
                            <strong style={{ fontSize: '18px', color: '#0f172a', display: 'block', marginBottom: '12px', lineHeight: '1.5' }}>{title || \`Khám phá ngày \${day.dayIndex}\`}</strong>
                            <span style={{ color: '#64748b', fontSize: '15px' }}>{mealStr}</span>
                        </div>
                        <div style={{ width: '45%', backgroundImage: \`url(\${img})\`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                    </div>
                    
                    {/* Content Card (White) */}
                    <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', marginTop: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                        <strong style={{ fontSize: '17px', color: '#0f172a', marginBottom: '20px', display: 'block' }}>Hoạt động chính trong ngày:</strong>
                        <ul style={{ paddingLeft: '24px', color: '#1e293b', fontSize: '15.5px', lineHeight: '2' }}>
                            {activities.map((act, idx) => (
                                <li key={idx} style={{ marginBottom: '12px' }}>
                                    <strong style={{color: '#0f172a'}}>{act.name}</strong> {act.type ? \`- \${act.type}\` : ''}
                                </li>
                            ))}
                            {activities.length === 0 && <li>Tự do tham quan và nghỉ ngơi theo lịch trình.</li>}
                        </ul>
                    </div>
                </div>
            ) : (
                <div onClick={() => setIsExpanded(true)} style={{ background: '#fff', borderRadius: '20px', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s' }}
                     onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)'}
                     onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)'}>
                    <div>
                        <strong style={{ fontSize: '17px', color: '#0f172a', display: 'block', marginBottom: '8px' }}>Ngày {day.dayIndex}: {title || \`Khám phá ngày \${day.dayIndex}\`}</strong>
                        <span style={{ color: '#64748b', fontSize: '15px' }}>{mealStr}</span>
                    </div>
                    <span style={{ fontSize: '24px', color: '#94a3b8' }}>›</span>
                </div>
            )}
        </div>
    );
};

const TourDetail = () => {`;

if (!c.includes('const DayItem')) {
    c = c.replace('const TourDetail = () => {', dayItemComponent);
}

const startStr = '{/* Lịch trình từng ngày theo timeline */}';
const endStr = '/* FALLBACK CHO CÁC TOUR CŨ NHẬP BẰNG TAY (VD: Tour Phú Quốc) */';

const startIndex = c.indexOf(startStr);
const endIndex = c.indexOf(endStr);

if (startIndex > -1 && endIndex > -1) {
    // Find the nearest closing div of the `modern-itinerary` before `endStr`
    // Actually, `endStr` is inside the `:` branch of `parsedDesign ? ( ... ) : ( ... )`
    const strToReplace = c.substring(startIndex, c.lastIndexOf('</div>\n                        </div>\n                    ) : (', endIndex));
    
    const replacement = `{/* Lịch trình từng ngày theo timeline */}
                            <div style={{ paddingLeft: '24px', marginLeft: '12px', borderLeft: '2px solid #cbd5e1', marginTop: '30px' }}>
                                {parsedDesign.itineraryDays ? 
                                    parsedDesign.itineraryDays.map((day, idx) => (
                                        <DayItem key={day.dayIndex} day={day} isOldFormat={true} index={idx} getDestString={getDestString} tour={tour} parsedDesign={parsedDesign} destinations={destinations} bgImage={bgImage} />
                                    ))
                                : parsedDesign.days ? 
                                    parsedDesign.days.map((day, idx) => (
                                        <DayItem key={day.dayIndex} day={day} isOldFormat={false} index={idx} getDestString={getDestString} tour={tour} parsedDesign={parsedDesign} destinations={destinations} bgImage={bgImage} />
                                    ))
                                : null}
                            </div>
`;
    
    c = c.replace(strToReplace, replacement);
    fs.writeFileSync('src/components/TourDetail.jsx', c);
    console.log('Replaced itinerary loop!');
} else {
    console.log('Could not find bounds');
}

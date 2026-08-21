const fs = require('fs');
let c = fs.readFileSync('src/components/TourBuilder/DayCard.jsx', 'utf8');

const sIdx = c.indexOf('<div style={{ display: \\'flex\\', gap: \\'20px\\', fontSize: \\'13px\\', color: \\'#475569\\' }}>'.replace(/\\'/g, "'"));
const eIdx = c.indexOf('</div>', c.indexOf('Bao gồm Ăn Tối')) + 6;

if (sIdx > -1 && eIdx > -1) {
    const toReplace = c.substring(sIdx, eIdx);
    
    // We remove the old block
    c = c.replace(toReplace, '');
    
    const newBlock = `
            {/* Meals Section */}
            <div style={{ padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                <h4 style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#0f172a' }}>🍽️ Các bữa ăn tiêu chuẩn của Tour trong ngày</h4>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>Tích chọn nếu công ty du lịch đài thọ bữa ăn này (bao gồm cả ăn tại KS hoặc nhà hàng ngoài).</p>
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#475569' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input type="checkbox" 
                            checked={day.meals?.breakfast || false} 
                            onChange={e => updateDay('meals', {...(day.meals || {}), breakfast: e.target.checked})} 
                        />
                        Bao gồm Ăn Sáng
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input type="checkbox" 
                            checked={day.meals?.lunch || false} 
                            onChange={e => updateDay('meals', {...(day.meals || {}), lunch: e.target.checked})} 
                        />
                        Bao gồm Ăn Trưa
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input type="checkbox" 
                            checked={day.meals?.dinner || false} 
                            onChange={e => updateDay('meals', {...(day.meals || {}), dinner: e.target.checked})} 
                        />
                        Bao gồm Ăn Tối
                    </label>
                </div>
            </div>`;
            
    c = c.replace('{/* Activities Area */}', newBlock + '\\n\\n            {/* Activities Area */}');
    fs.writeFileSync('src/components/TourBuilder/DayCard.jsx', c);
    console.log('Fixed exactly!');
} else {
    console.log('Not found');
}

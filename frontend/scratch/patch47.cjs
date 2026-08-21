const fs = require('fs');
let c = fs.readFileSync('src/components/TourBuilder/DayCard.jsx', 'utf8');

const sIdx = c.indexOf('{/* Meals Section */}');
const eIdx = c.indexOf('{/* Activities Area */}');

if (sIdx > -1 && eIdx > -1) {
    const toReplace = c.substring(sIdx, eIdx);
    c = c.replace(toReplace, '');
    
    const checkboxes = `
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
                </div>`;
                
    // Find the end of the select tag in the Accommodation section
    const accSelectEnd = c.indexOf('</select>', c.indexOf('Nơi lưu trú tại')) + 9;
    c = c.substring(0, accSelectEnd) + '\n' + checkboxes + c.substring(accSelectEnd);
    fs.writeFileSync('src/components/TourBuilder/DayCard.jsx', c);
    console.log('Reverted to Accommodation checkboxes');
}

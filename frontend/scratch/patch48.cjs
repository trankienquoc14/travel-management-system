const fs = require('fs');
let c = fs.readFileSync('src/components/TourBuilder/DayCard.jsx', 'utf8');

// 1. Remove the checkboxes from the Accommodation section
const checkboxBlock = `
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

c = c.replace(checkboxBlock, '');

// 2. Add the Meals section before {/* Activities Area */}
const newBlock = `
            {/* Meals Section */}
            <div style={{ padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                <h4 style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#0f172a' }}>🍽️ Các bữa ăn tiêu chuẩn của Tour trong ngày</h4>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>Tích chọn để hiển thị các bữa ăn công ty đài thọ lên lịch trình cho khách xem.</p>
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

c = c.replace('{/* Activities Area */}', newBlock + '\n\n            {/* Activities Area */}');

fs.writeFileSync('src/components/TourBuilder/DayCard.jsx', c);
console.log('DayCard fixed');

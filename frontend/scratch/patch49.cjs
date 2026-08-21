const fs = require('fs');
let c = fs.readFileSync('src/components/TourBuilder/DayCard.jsx', 'utf8');

const sIdx = c.indexOf('{/* Meals Section */}');
const eIdx = c.indexOf('{/* Activities Area */}');

if (sIdx > -1 && eIdx > -1) {
    const toReplace = c.substring(sIdx, eIdx);
    
    // Normalization helper for legacy true/false values
    const newBlock = `
            {/* Meals Section */}
            <div style={{ padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                <h4 style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#0f172a' }}>🍽️ Các bữa ăn tiêu chuẩn của Tour trong ngày</h4>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                    Chọn loại dịch vụ ăn uống. <strong>Tại Khách sạn</strong> sẽ không bị tính thêm vào phí bữa ăn bên bảng Biến phí.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', fontSize: '13px', color: '#475569' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Bữa Sáng</label>
                        <select 
                            value={day.meals?.breakfast === true ? 'external' : (day.meals?.breakfast || '')} 
                            onChange={e => updateDay('meals', {...(day.meals || {}), breakfast: e.target.value})}
                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        >
                            <option value="">Tự túc (Không bao gồm)</option>
                            <option value="hotel">Tại Khách sạn (Gộp trong giá phòng)</option>
                            <option value="external">Nhà hàng ngoài (Tính phí riêng)</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Bữa Trưa</label>
                        <select 
                            value={day.meals?.lunch === true ? 'external' : (day.meals?.lunch || '')} 
                            onChange={e => updateDay('meals', {...(day.meals || {}), lunch: e.target.value})}
                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        >
                            <option value="">Tự túc (Không bao gồm)</option>
                            <option value="hotel">Tại Khách sạn (Gộp trong giá phòng)</option>
                            <option value="external">Nhà hàng ngoài (Tính phí riêng)</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Bữa Tối</label>
                        <select 
                            value={day.meals?.dinner === true ? 'external' : (day.meals?.dinner || '')} 
                            onChange={e => updateDay('meals', {...(day.meals || {}), dinner: e.target.value})}
                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        >
                            <option value="">Tự túc (Không bao gồm)</option>
                            <option value="hotel">Tại Khách sạn (Gộp trong giá phòng)</option>
                            <option value="external">Nhà hàng ngoài (Tính phí riêng)</option>
                        </select>
                    </div>
                </div>
            </div>
\n            `;

    c = c.replace(toReplace, newBlock);
    fs.writeFileSync('src/components/TourBuilder/DayCard.jsx', c);
    console.log('DayCard UI updated with dropdowns');
} else {
    console.log('Failed to find Meals Section in DayCard');
}

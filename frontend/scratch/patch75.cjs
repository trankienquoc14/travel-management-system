const fs = require('fs');
let c = fs.readFileSync('src/components/BookingForm.jsx', 'utf8');

const updatePassengerLogic = `
    const updatePassenger = (type, idx, field, value) => {
        const key = \`\${type}_\${idx}\`;
        setPassengerDetails(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value
            }
        }));
    };
    
    // Calculate single rooms from passengerDetails
    let singleRoomsCount = 0;
    if (pax.adults > 0) {
        for (let i = 0; i < pax.adults; i++) {
            if (passengerDetails[\`adults_\${i}\`]?.singleRoom) {
                singleRoomsCount++;
            }
        }
    }
`;

c = c.replace(/const totalPax = pax\.adults \+ pax\.children \+ pax\.toddlers \+ pax\.infants;/, updatePassengerLogic + '\n    const totalPax = pax.adults + pax.children + pax.toddlers + pax.infants;');

c = c.replace(/const totalAmount = \(pax\.adults \* adultPrice\) \+ \(pax\.children \* childPrice\) \+ \(pax\.toddlers \* toddlerPrice\) \+ \(pax\.infants \* infantPrice\);/, 'const totalAmount = (pax.adults * adultPrice) + (pax.children * childPrice) + (pax.toddlers * toddlerPrice) + (pax.infants * infantPrice) + (singleRoomsCount * singleSupp);');

c = c.replace(/<span>\{formatCurrency\(singleSupp\)\} \/ phòng<\/span>/, '<span>{singleRoomsCount} x {formatCurrency(singleSupp)}</span>');

const modalSearchRegex = /\{Array\.from\(\{ length: pax\[type\] \}\)\.map\(\(\_, idx\) => \([\s\S]*?(?=\}\)\}\s*<\/div>\s*\);\s*\}\)\}\s*<\/div>\s*\{\/\* Modal Footer \*\/)/;

const newModalMapping = `{Array.from({ length: pax[type] }).map((_, idx) => {
                                            const pKey = \`\${type}_\${idx}\`;
                                            const pData = passengerDetails[pKey] || {};
                                            const daysList = Array.from({length: 31}, (_, i) => i + 1);
                                            const monthsList = Array.from({length: 12}, (_, i) => i + 1);
                                            const currentYear = new Date().getFullYear();
                                            const yearsList = Array.from({length: 100}, (_, i) => currentYear - i);

                                            return (
                                            <div key={idx} style={{ display: 'flex', gap: '16px', marginBottom: '24px', paddingBottom: idx !== pax[type]-1 ? '24px' : '0', borderBottom: idx !== pax[type]-1 ? '1px dashed #e2e8f0' : 'none' }}>
                                                <strong style={{ fontSize: '16px', color: '#0f172a', paddingTop: '8px' }}>#{idx + 1}</strong>
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Họ tên <span style={{color: '#dc2626'}}>*</span></label>
                                                        <input type="text" value={pData.name || ''} onChange={e => updatePassenger(type, idx, 'name', e.target.value)} placeholder="VD: Nguyễn Văn A" style={{ width: '100%', padding: '12px 16px', borderRadius: '24px', border: 'none', background: '#f8fafc', fontSize: '15px', outline: 'none' }} />
                                                    </div>
                                                    
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Ngày sinh <span style={{color: '#dc2626'}}>*</span></label>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                                                <select value={pData.dobDay || ''} onChange={e => updatePassenger(type, idx, 'dobDay', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '24px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', outline: 'none', appearance: 'none' }}>
                                                                    <option value="">Ngày</option>
                                                                    {daysList.map(d => <option key={d} value={d}>{d}</option>)}
                                                                </select>
                                                                <select value={pData.dobMonth || ''} onChange={e => updatePassenger(type, idx, 'dobMonth', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '24px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', outline: 'none', appearance: 'none' }}>
                                                                    <option value="">Tháng</option>
                                                                    {monthsList.map(m => <option key={m} value={m}>{m}</option>)}
                                                                </select>
                                                                <select value={pData.dobYear || ''} onChange={e => updatePassenger(type, idx, 'dobYear', e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '24px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', outline: 'none', appearance: 'none' }}>
                                                                    <option value="">Năm</option>
                                                                    {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Giới tính <span style={{color: '#dc2626'}}>*</span></label>
                                                            <select value={pData.gender || 'Nam'} onChange={e => updatePassenger(type, idx, 'gender', e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '24px', border: 'none', background: '#f8fafc', fontSize: '15px', outline: 'none', appearance: 'none' }}>
                                                                <option value="Nam">Nam</option>
                                                                <option value="Nữ">Nữ</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {type === 'adults' && (
                                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Số điện thoại</label>
                                                                <input type="tel" value={pData.phone || ''} onChange={e => updatePassenger(type, idx, 'phone', e.target.value)} placeholder="Ví dụ: 0901234567" style={{ width: '100%', padding: '12px 16px', borderRadius: '24px', border: 'none', background: '#f8fafc', fontSize: '15px', outline: 'none' }} />
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '8px' }}>
                                                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Phòng đơn</label>
                                                                <div onClick={() => updatePassenger(type, idx, 'singleRoom', !pData.singleRoom)} style={{ width: '44px', height: '24px', background: pData.singleRoom ? '#3b82f6' : '#cbd5e1', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                                                                    <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: pData.singleRoom ? '22px' : '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', transition: 'left 0.2s' }}></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            );
                                        })}`;

c = c.replace(modalSearchRegex, newModalMapping);

fs.writeFileSync('src/components/BookingForm.jsx', c);
console.log('Fixed passengerDetails logic');

const fs = require('fs');
let c = fs.readFileSync('src/components/TourDetail.jsx', 'utf8');

// 1. Fix Sidebar Khởi hành
c = c.replace(
    `<strong style={{ color: '#0f172a', textAlign: 'right' }}>{parsedDesign?.days?.[0]?.start_destination_id ? getDestString(tour, parsedDesign).split(' - ')[0] : 'Đang cập nhật'}</strong>`,
    `<strong style={{ color: '#0f172a', textAlign: 'right' }}>{destinations.find(x => String(x.destination_id) === String(parsedDesign?.days?.[0]?.start_destination_id))?.destination_name || 'Đang cập nhật'}</strong>`
);

// 2. Fix Return Date and Locations in Departures Map
const blockToReplace = `{/* Phương tiện */}
                                                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                                                <strong style={{ fontSize: '15px', color: '#1e293b' }}>Phương tiện di chuyển</strong>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '40px', marginBottom: '32px' }}>
                                                                <div style={{ flex: 1, borderRight: '1px solid #e2e8f0', paddingRight: '40px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                                        <span style={{ color: '#64748b', fontSize: '14px' }}>Ngày đi: <strong style={{color: '#0f172a'}}>{dateStr}</strong></span>
                                                                        <span style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '14px' }}>
                                                                            {parsedDesign?.costConfig?.selectedTransport?.service_type === 'Vé máy bay' 
                                                                                ? \`✈️ \${parsedDesign?.costConfig?.selectedTransport?.provider_name || 'Máy bay'}\`
                                                                                : '🚌 Xe khách'}
                                                                        </span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                                            <strong style={{ fontSize: '18px', color: '#1e293b' }}>{parsedDesign?.costConfig?.transportTimes?.startD || '05:30'}</strong>
                                                                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                                                                                {destinations.find(x => String(x.destination_id) === String(parsedDesign?.days?.[0]?.start_destination_id))?.destination_name || 'Điểm đi'}
                                                                            </span>
                                                                        </div>
                                                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
                                                                            <div style={{ flex: 1, height: '1px', background: '#cbd5e1', position: 'relative' }}>
                                                                                <div style={{position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #0f172a', background: '#fff'}}></div>
                                                                                <div style={{position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#0f172a'}}></div>
                                                                            </div>
                                                                        </div>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                                            <strong style={{ fontSize: '18px', color: '#1e293b' }}>{parsedDesign?.costConfig?.transportTimes?.endD || '12:00'}</strong>
                                                                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                                                                                {destinations.find(x => String(x.destination_id) === String(tour.destination))?.destination_name || 'Điểm đến'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                                        <span style={{ color: '#64748b', fontSize: '14px' }}>Ngày về: <strong style={{color: '#0f172a'}}>+{(tour.duration_days || 1) - 1} Ngày</strong></span>
                                                                        <span style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '14px' }}>
                                                                            {parsedDesign?.costConfig?.selectedTransport?.service_type === 'Vé máy bay' 
                                                                                ? \`✈️ \${parsedDesign?.costConfig?.selectedTransport?.provider_name || 'Máy bay'}\`
                                                                                : '🚌 Xe khách'}
                                                                        </span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                                            <strong style={{ fontSize: '18px', color: '#1e293b' }}>{parsedDesign?.costConfig?.transportTimes?.startR || '12:00'}</strong>
                                                                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                                                                                {destinations.find(x => String(x.destination_id) === String(tour.destination))?.destination_name || 'Điểm đến'}
                                                                            </span>
                                                                        </div>
                                                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
                                                                            <div style={{ flex: 1, height: '1px', background: '#cbd5e1', position: 'relative' }}>
                                                                                <div style={{position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #0f172a', background: '#fff'}}></div>
                                                                                <div style={{position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#0f172a'}}></div>
                                                                            </div>
                                                                        </div>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                                            <strong style={{ fontSize: '18px', color: '#1e293b' }}>{parsedDesign?.costConfig?.transportTimes?.endR || '17:30'}</strong>
                                                                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                                                                                {destinations.find(x => String(x.destination_id) === String(parsedDesign?.days?.[0]?.start_destination_id))?.destination_name || 'Điểm đi'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>`;

const newBlock = `{/* Phương tiện */}
                                                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                                                <strong style={{ fontSize: '15px', color: '#1e293b' }}>Phương tiện di chuyển</strong>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '40px', marginBottom: '32px' }}>
                                                                <div style={{ flex: 1, borderRight: '1px solid #e2e8f0', paddingRight: '40px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                                        <span style={{ color: '#64748b', fontSize: '14px' }}>Ngày đi: <strong style={{color: '#0f172a'}}>{dateStr}</strong></span>
                                                                        <span style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '14px' }}>
                                                                            {parsedDesign?.costConfig?.selectedTransport?.service_type === 'Vé máy bay' 
                                                                                ? \`✈️ \${parsedDesign?.costConfig?.selectedTransport?.provider_name || 'Máy bay'}\`
                                                                                : '🚌 Xe khách'}
                                                                        </span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                                            <strong style={{ fontSize: '18px', color: '#1e293b' }}>{parsedDesign?.costConfig?.transportTimes?.startD || '05:30'}</strong>
                                                                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                                                                                {destinations.find(x => String(x.destination_id) === String(parsedDesign?.days?.[0]?.start_destination_id))?.destination_name || 'Điểm đi'}
                                                                            </span>
                                                                        </div>
                                                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
                                                                            <div style={{ flex: 1, height: '1px', background: '#cbd5e1', position: 'relative' }}>
                                                                                <div style={{position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #0f172a', background: '#fff'}}></div>
                                                                                <div style={{position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#0f172a'}}></div>
                                                                            </div>
                                                                        </div>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                                            <strong style={{ fontSize: '18px', color: '#1e293b' }}>{parsedDesign?.costConfig?.transportTimes?.endD || '12:00'}</strong>
                                                                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                                                                                {destinations.find(x => String(x.destination_id) === String(parsedDesign?.days?.[0]?.end_destination_id))?.destination_name || 'Điểm đến'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                                        <span style={{ color: '#64748b', fontSize: '14px' }}>Ngày về: <strong style={{color: '#0f172a'}}>{new Date(dep.return_date || new Date(dateObj.getTime() + (tour.duration_days - 1) * 86400000)).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong></span>
                                                                        <span style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '14px' }}>
                                                                            {parsedDesign?.costConfig?.selectedTransport?.service_type === 'Vé máy bay' 
                                                                                ? \`✈️ \${parsedDesign?.costConfig?.selectedTransport?.provider_name || 'Máy bay'}\`
                                                                                : '🚌 Xe khách'}
                                                                        </span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                                            <strong style={{ fontSize: '18px', color: '#1e293b' }}>{parsedDesign?.costConfig?.transportTimes?.startR || '12:00'}</strong>
                                                                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                                                                                {destinations.find(x => String(x.destination_id) === String(parsedDesign?.days?.[parsedDesign.days.length - 1]?.start_destination_id))?.destination_name || 'Điểm đi'}
                                                                            </span>
                                                                        </div>
                                                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
                                                                            <div style={{ flex: 1, height: '1px', background: '#cbd5e1', position: 'relative' }}>
                                                                                <div style={{position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #0f172a', background: '#fff'}}></div>
                                                                                <div style={{position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#0f172a'}}></div>
                                                                            </div>
                                                                        </div>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                                            <strong style={{ fontSize: '18px', color: '#1e293b' }}>{parsedDesign?.costConfig?.transportTimes?.endR || '17:30'}</strong>
                                                                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                                                                                {destinations.find(x => String(x.destination_id) === String(parsedDesign?.days?.[parsedDesign.days.length - 1]?.end_destination_id))?.destination_name || 'Điểm đến'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>`;

c = c.replace(blockToReplace, newBlock);
fs.writeFileSync('src/components/TourDetail.jsx', c);
console.log('Fixed completely!');

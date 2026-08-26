
import React from 'react';
import DayCard from './DayCard';

const TimelineBuilder = ({ days, setDays, destinations, allServices, dayImages, setDayImages, dayImagePreviews, setDayImagePreviews, costConfig, setCostConfig, requestData, tourName, setTourName, tourDescription, setTourDescription }) => {
    const addDay = () => {
        const lastDay = days[days.length - 1];
        setDays([...days, { 
            dayIndex: days.length + 1, 
            start_destination_id: lastDay ? lastDay.end_destination_id : '', 
            end_destination_id: '', 
            route_title: '', 
            activities: [],
            isTitleEdited: false
        }]);
    };

    return (
        <div style={{ flex: '2', background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>Thông tin chung</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px', fontWeight: 'bold' }}>Tên Tour đề xuất <span style={{color: 'red'}}>*</span></label>
                        <input 
                            type="text" 
                            placeholder="VD: Khám phá Đà Lạt mộng mơ 3N2Đ..." 
                            value={tourName} 
                            onChange={e => setTourName(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px', fontWeight: 'bold' }}>Mô tả ngắn gọn / Điểm nhấn</label>
                        <textarea 
                            placeholder="Nhập mô tả ngắn về lịch trình hoặc điểm nhấn nổi bật để thu hút khách hàng..."
                            value={tourDescription}
                            onChange={e => setTourDescription(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', minHeight: '80px', fontSize: '14px', resize: 'vertical' }}
                        />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '18px' }}>Chi tiết Lịch trình</h3>
                <button onClick={addDay} style={{ padding: '6px 12px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Thêm Ngày</button>
            </div>
            

            
            {costConfig?.selectedTransport && (
                <div style={{ marginBottom: '25px', padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px', fontSize: '16px' }}>Phương tiện di chuyển chính: {costConfig.selectedTransport.name}</div>
                    
                    <div style={{ display: 'flex', gap: '20px' }}>
                        {/* Lượt đi */}
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ color: '#64748b', fontWeight: 'bold', fontSize: '14px' }}>Chuyến đi (Ngày đầu)</span>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <input type="time" value={costConfig.transportTimes?.startD || '05:30'} onChange={e => setCostConfig({...costConfig, transportTimes: {...(costConfig.transportTimes || {}), startD: e.target.value}})} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '90px' }} />
                                <div style={{ flex: 1, borderBottom: '1px dashed #cbd5e1', margin: '0 10px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                                    <div style={{ position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                                </div>
                                <input type="time" value={costConfig.transportTimes?.endD || '12:00'} onChange={e => setCostConfig({...costConfig, transportTimes: {...(costConfig.transportTimes || {}), endD: e.target.value}})} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '90px' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' }}>
                                <span>{(() => { const p = destinations.find(d => String(d.destination_id) === String(days[0]?.start_destination_id)); return p ? p.destination_name : '...'; })()}</span>
                                <span>{(() => { const p = destinations.find(d => String(d.destination_id) === String(days[0]?.end_destination_id)); return p ? p.destination_name : '...'; })()}</span>
                            </div>
                        </div>

                        <div style={{ width: '1px', background: '#cbd5e1' }}></div>

                        {/* Lượt về */}
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ color: '#64748b', fontWeight: 'bold', fontSize: '14px' }}>Chuyến về (Ngày {days.length})</span>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <input type="time" value={costConfig.transportTimes?.startR || '12:00'} onChange={e => setCostConfig({...costConfig, transportTimes: {...(costConfig.transportTimes || {}), startR: e.target.value}})} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '90px' }} />
                                <div style={{ flex: 1, borderBottom: '1px dashed #cbd5e1', margin: '0 10px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                                    <div style={{ position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                                </div>
                                <input type="time" value={costConfig.transportTimes?.endR || '05:30'} onChange={e => setCostConfig({...costConfig, transportTimes: {...(costConfig.transportTimes || {}), endR: e.target.value}})} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '90px' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' }}>
                                <span>{(() => { const p = destinations.find(d => String(d.destination_id) === String(days[days.length - 1]?.start_destination_id)); return p ? p.destination_name : '...'; })()}</span>
                                <span>{(() => { const p = destinations.find(d => String(d.destination_id) === String(days[days.length - 1]?.end_destination_id)); return p ? p.destination_name : '...'; })()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {days.map((day, dIndex) => (
                    <DayCard requestData={requestData} 
                        key={dIndex}
                        day={day}
                        dIndex={dIndex}
                        days={days}
                        setDays={setDays}
                        destinations={destinations}
                        allServices={allServices}
                        dayImages={dayImages}
                        setDayImages={setDayImages}
                        dayImagePreviews={dayImagePreviews}
                        setDayImagePreviews={setDayImagePreviews}
                    />
                ))}
            </div>
        </div>
    );
};

export default TimelineBuilder;

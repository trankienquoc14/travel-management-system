
import React from 'react';
import DayCard from './DayCard';
import { formatVehicleDisplayName } from '../../utils/vehicleDisplayHelper';

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
            {setTourName && (
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
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '18px' }}>Chi tiết Lịch trình</h3>
                <button onClick={addDay} style={{ padding: '6px 12px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Thêm Ngày</button>
            </div>
            

            
            {costConfig?.selectedTransport && (() => {
                const getDestName = (id, dayObj, isEnd = false) => {
                    if (id !== undefined && id !== null && id !== '') {
                        const dest = destinations.find(x => String(x.destination_id) === String(id));
                        if (dest) return dest.destination_name;
                        if (typeof id === 'string' && isNaN(Number(id))) return id;
                    }
                    if (dayObj) {
                        const targetVal = isEnd 
                            ? (dayObj.end_destination_id || dayObj.end_destination || dayObj.end_location)
                            : (dayObj.start_destination_id || dayObj.start_destination || dayObj.start_location);
                        if (targetVal !== undefined && targetVal !== null && targetVal !== '') {
                            const dest = destinations.find(x => String(x.destination_id) === String(targetVal));
                            if (dest) return dest.destination_name;
                            if (typeof targetVal === 'string' && isNaN(Number(targetVal))) return targetVal;
                        }
                        if (dayObj.route_title && typeof dayObj.route_title === 'string') {
                            const cleanTitle = dayObj.route_title.replace(/^NGÀY\s*\d+\s*[-:]?\s*/i, '').trim();
                            if (cleanTitle.includes('-')) {
                                const parts = cleanTitle.split('-').map(s => s.trim());
                                if (!isEnd && parts[0]) return parts[0];
                                if (isEnd && parts[parts.length - 1]) return parts[parts.length - 1];
                            }
                        }
                    }
                    return isEnd ? 'Điểm đến' : 'Điểm xuất phát';
                };

                const transportName = formatVehicleDisplayName(costConfig.selectedTransport) || 'Phương tiện di chuyển';

                const firstDay = days[0];
                const lastDay = days[days.length - 1];
                const startDay1 = getDestName(firstDay?.start_destination_id, firstDay, false);
                const endDay1 = getDestName(firstDay?.end_destination_id, firstDay, true);
                let startLastDay = getDestName(lastDay?.start_destination_id, lastDay, false);
                let endLastDay = getDestName(lastDay?.end_destination_id, lastDay, true);

                const defaultStartD = (startDay1 && startDay1 !== 'Điểm xuất phát') ? startDay1 : '';
                const defaultEndD = (endDay1 && endDay1 !== 'Điểm đến') ? endDay1 : '';
                
                // Điểm khởi hành lượt về: ưu tiên điểm xuất phát ngày cuối (nếu khác điểm xuất phát ban đầu), hoặc điểm đến ngày đầu
                let defaultStartR = (startLastDay && startLastDay !== 'Điểm xuất phát' && startLastDay !== startDay1) 
                    ? startLastDay 
                    : (defaultEndD || '');
                // Điểm kết thúc lượt về: ưu tiên điểm đến ngày cuối, hoặc điểm xuất phát ban đầu
                let defaultEndR = (endLastDay && endLastDay !== 'Điểm đến') 
                    ? endLastDay 
                    : (defaultStartD || '');

                const hasCustomLocs = !!(
                    costConfig.transportLocations?.startD || 
                    costConfig.transportLocations?.endD || 
                    costConfig.transportLocations?.startR || 
                    costConfig.transportLocations?.endR
                );

                const handleLocationChange = (field, val) => {
                    setCostConfig({
                        ...costConfig,
                        transportLocations: {
                            ...(costConfig.transportLocations || {}),
                            [field]: val
                        }
                    });
                };

                const resetLocationsToDefault = () => {
                    setCostConfig({
                        ...costConfig,
                        transportLocations: {
                            startD: defaultStartD,
                            endD: defaultEndD,
                            startR: defaultStartR,
                            endR: defaultEndR
                        }
                    });
                };

                return (
                <div style={{ marginBottom: '25px', padding: '20px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '15px' }}>
                            🚗 Phương tiện di chuyển chính: <span style={{ color: '#2563eb' }}>{transportName}</span>
                        </div>
                        {hasCustomLocs && (
                            <button
                                type="button"
                                onClick={resetLocationsToDefault}
                                style={{
                                    fontSize: '12px',
                                    color: '#64748b',
                                    background: '#fff',
                                    border: '1px solid #cbd5e1',
                                    padding: '3px 8px',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                                title="Khôi phục lại địa điểm tự động theo lịch trình các ngày"
                            >
                                ↺ Khôi phục địa điểm mặc định
                            </button>
                        )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '24px' }}>
                        {/* Lượt đi */}
                        <div style={{ flex: 1, background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{ color: '#1e293b', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span>
                                    Chuyến đi (Ngày đầu)
                                </span>
                                <span style={{ fontSize: '11px', color: '#64748b', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>Lượt đi</span>
                            </div>
                            
                            {/* Giờ xuất phát & Giờ đến */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Giờ khởi hành</span>
                                    <input 
                                        type="time" 
                                        value={costConfig.transportTimes?.startD || '05:30'} 
                                        onChange={e => setCostConfig({...costConfig, transportTimes: {...(costConfig.transportTimes || {}), startD: e.target.value}})} 
                                        style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '92px', fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }} 
                                    />
                                </div>
                                <div style={{ flex: 1, borderBottom: '1px dashed #cbd5e1', margin: '14px 10px 0 10px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div>
                                    <div style={{ position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Giờ đến nơi</span>
                                    <input 
                                        type="time" 
                                        value={costConfig.transportTimes?.endD || '12:00'} 
                                        onChange={e => setCostConfig({...costConfig, transportTimes: {...(costConfig.transportTimes || {}), endD: e.target.value}})} 
                                        style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '92px', fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }} 
                                    />
                                </div>
                            </div>

                            {/* Ô nhập Địa điểm chuyến đi */}
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>📍 Điểm xuất phát</span>
                                    <input
                                        type="text"
                                        placeholder={defaultStartD || 'Nhập điểm đón...'}
                                        value={costConfig.transportLocations?.startD ?? defaultStartD}
                                        onChange={e => handleLocationChange('startD', e.target.value)}
                                        title="Chỉnh sửa điểm xuất phát lượt đi"
                                        style={{
                                            padding: '6px 8px',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '12px',
                                            color: '#1e293b',
                                            fontWeight: '600',
                                            background: '#f8fafc',
                                            outline: 'none',
                                            width: '100%',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div style={{ color: '#94a3b8', fontSize: '12px', paddingTop: '16px' }}>➔</div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>🏁 Điểm đến</span>
                                    <input
                                        type="text"
                                        placeholder={defaultEndD || 'Nhập điểm đến...'}
                                        value={costConfig.transportLocations?.endD ?? defaultEndD}
                                        onChange={e => handleLocationChange('endD', e.target.value)}
                                        title="Chỉnh sửa điểm đến lượt đi"
                                        style={{
                                            padding: '6px 8px',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '12px',
                                            color: '#1e293b',
                                            fontWeight: '600',
                                            background: '#f8fafc',
                                            outline: 'none',
                                            textAlign: 'right',
                                            width: '100%',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Lượt về */}
                        <div style={{ flex: 1, background: '#fff', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{ color: '#1e293b', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                                    Chuyến về (Ngày {days.length})
                                </span>
                                <span style={{ fontSize: '11px', color: '#15803d', background: '#f0fdf4', padding: '2px 6px', borderRadius: '4px' }}>Lượt về</span>
                            </div>
                            
                            {/* Giờ xuất phát & Giờ về đến */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Giờ khởi hành</span>
                                    <input 
                                        type="time" 
                                        value={costConfig.transportTimes?.startR || '12:00'} 
                                        onChange={e => setCostConfig({...costConfig, transportTimes: {...(costConfig.transportTimes || {}), startR: e.target.value}})} 
                                        style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '92px', fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }} 
                                    />
                                </div>
                                <div style={{ flex: 1, borderBottom: '1px dashed #cbd5e1', margin: '14px 10px 0 10px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                                    <div style={{ position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Giờ về đến</span>
                                    <input 
                                        type="time" 
                                        value={costConfig.transportTimes?.endR || '17:30'} 
                                        onChange={e => setCostConfig({...costConfig, transportTimes: {...(costConfig.transportTimes || {}), endR: e.target.value}})} 
                                        style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '92px', fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }} 
                                    />
                                </div>
                            </div>

                            {/* Ô nhập Địa điểm chuyến về */}
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>📍 Điểm xuất phát về</span>
                                    <input
                                        type="text"
                                        placeholder={defaultStartR || 'Nhập điểm đón về...'}
                                        value={costConfig.transportLocations?.startR ?? defaultStartR}
                                        onChange={e => handleLocationChange('startR', e.target.value)}
                                        title="Chỉnh sửa điểm xuất phát lượt về"
                                        style={{
                                            padding: '6px 8px',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '12px',
                                            color: '#1e293b',
                                            fontWeight: '600',
                                            background: '#f8fafc',
                                            outline: 'none',
                                            width: '100%',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                                <div style={{ color: '#94a3b8', fontSize: '12px', paddingTop: '16px' }}>➔</div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>🏁 Điểm trả khách</span>
                                    <input
                                        type="text"
                                        placeholder={defaultEndR || 'Nhập điểm trả về...'}
                                        value={costConfig.transportLocations?.endR ?? defaultEndR}
                                        onChange={e => handleLocationChange('endR', e.target.value)}
                                        title="Chỉnh sửa điểm trả khách lượt về"
                                        style={{
                                            padding: '6px 8px',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '12px',
                                            color: '#1e293b',
                                            fontWeight: '600',
                                            background: '#f8fafc',
                                            outline: 'none',
                                            textAlign: 'right',
                                            width: '100%',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                );
            })()}
            
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

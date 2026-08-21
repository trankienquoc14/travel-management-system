
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ActivityItem from './ActivityItem';

const DayCard = ({ day, dIndex, days, setDays, destinations, allServices, dayImages, setDayImages, dayImagePreviews, setDayImagePreviews }) => {
    const [places, setPlaces] = useState([]);

    const [draggedActIndex, setDraggedActIndex] = useState(null);
    const [dragOverActIndex, setDragOverActIndex] = useState(null);

    const handleActDragStart = (e, aIndex) => {
        setDraggedActIndex(aIndex);
        e.dataTransfer.effectAllowed = 'move';
        // Hide the ghost image a bit
        setTimeout(() => { if (e.target) e.target.style.opacity = '0.5' }, 0);
    };

    const handleActDragEnter = (e, aIndex) => {
        e.preventDefault();
        setDragOverActIndex(aIndex);
    };

    const handleActDragEnd = (e) => {
        if (e.target) e.target.style.opacity = '1';
        setDraggedActIndex(null);
        setDragOverActIndex(null);
    };

    const handleActDrop = (e, dropIndex) => {
        e.preventDefault();
        if (draggedActIndex === null || draggedActIndex === dropIndex) {
            setDragOverActIndex(null);
            return;
        }

        const newDays = [...days];
        const acts = [...newDays[dIndex].activities];
        
        const draggedItem = acts[draggedActIndex];
        acts.splice(draggedActIndex, 1);
        acts.splice(dropIndex, 0, draggedItem);
        
        newDays[dIndex].activities = acts;
        setDays(newDays);
        setDraggedActIndex(null);
        setDragOverActIndex(null);
    };


    useEffect(() => {
        // Auto Route Title Logic
        let title = '';
        if (day.start_destination_id && day.end_destination_id) {
            const startDest = destinations.find(d => String(d.destination_id) === String(day.start_destination_id));
            const endDest = destinations.find(d => String(d.destination_id) === String(day.end_destination_id));
            
            if (startDest && endDest) {
                if (startDest.destination_id !== endDest.destination_id) {
                    title = `${startDest.destination_name} - ${endDest.destination_name}`;
                } else {
                    title = `${startDest.destination_name} - ${endDest.slogan || 'Tuyệt tác thiên nhiên'}`;
                }
            }
        }
        
        // Cập nhật title nếu chưa bị user sửa tay
        if (title && !day.isTitleEdited && title !== day.route_title) {
            const newDays = [...days];
            newDays[dIndex].route_title = title;
            setDays(newDays);
        }
    }, [day.start_destination_id, day.end_destination_id, destinations]);

    useEffect(() => {
        // Fetch places từ cả start_destination và end_destination
        const fetchBothPlaces = async () => {
            let combinedPlaces = [];
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            try {
                if (day.end_destination_id) {
                    const resEnd = await axios.get(`http://localhost:5000/api/builder/places?destination_id=${day.end_destination_id}`, { headers });
                    if (resEnd.data.success) combinedPlaces = [...combinedPlaces, ...resEnd.data.data];
                }
                
                if (day.start_destination_id && day.start_destination_id !== day.end_destination_id) {
                    const resStart = await axios.get(`http://localhost:5000/api/builder/places?destination_id=${day.start_destination_id}`, { headers });
                    if (resStart.data.success) combinedPlaces = [...combinedPlaces, ...resStart.data.data];
                }
                
                // Loại bỏ trùng lặp nếu có
                const uniquePlaces = Array.from(new Map(combinedPlaces.map(item => [item.place_id, item])).values());
                setPlaces(uniquePlaces);
            } catch (error) {
                console.error('Lỗi fetch places', error);
            }
        };

        if (day.end_destination_id || day.start_destination_id) {
            fetchBothPlaces();
        } else {
            setPlaces([]);
        }
    }, [day.end_destination_id, day.start_destination_id]);

    const updateDay = (field, value) => {
        const newDays = [...days];
        
        newDays[dIndex][field] = value;
        
        // CASCADING: Tự động gán điểm kết thúc của ngày này làm điểm bắt đầu của ngày sau
        if (field === 'end_destination_id' && dIndex + 1 < newDays.length) {
            newDays[dIndex + 1].start_destination_id = value;
        }
        
        setDays(newDays);
    };

    const addActivity = (activity) => {
        const newDays = [...days];
        if (!newDays[dIndex].activities) newDays[dIndex].activities = [];
        newDays[dIndex].activities.push(activity);
        setDays(newDays);
    };

    const removeActivity = (aIndex) => {
        const newDays = [...days];
        newDays[dIndex].activities.splice(aIndex, 1);
        setDays(newDays);
    };
    
    const removeDay = () => {
        const newDays = days.filter((_, i) => i !== dIndex).map((d, i) => ({ ...d, dayIndex: i + 1 }));
        setDays(newDays);
    };

    return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', background: '#f8fafc', marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span style={{ fontWeight: 'bold', color: '#2563eb', fontSize: '16px' }}>Ngày {day.dayIndex}</span>
                <button onClick={removeDay} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}>Xóa ngày</button>
            </div>
            
            <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontSize: '14px', fontWeight: '600' }}>Hình ảnh Ngày {day.dayIndex}</label>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ width: '120px', height: '80px', border: '2px dashed #cbd5e1', borderRadius: '8px', background: '#fff', position: 'relative', overflow: 'hidden' }}>
                        {(dayImages && dayImages[day.dayIndex]) ? (
                            <>
                                <img src={dayImages[day.dayIndex] instanceof File ? URL.createObjectURL(dayImages[day.dayIndex]) : dayImages[day.dayIndex]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button onClick={() => { const newImgs = {...dayImages}; delete newImgs[day.dayIndex]; setDayImages(newImgs); }} style={{ position: 'absolute', top: 2, right: 2, background: 'red', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '10px', width: '20px', height: '20px' }}>x</button>
                            </>
                        ) : (dayImagePreviews && dayImagePreviews[day.dayIndex]) ? (
                             <>
                                <img src={'http://localhost:5000' + dayImagePreviews[day.dayIndex]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button onClick={() => { const newPrv = {...dayImagePreviews}; delete newPrv[day.dayIndex]; setDayImagePreviews(newPrv); }} style={{ position: 'absolute', top: 2, right: 2, background: 'red', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '10px', width: '20px', height: '20px' }}>x</button>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '10px' }}>
                <div>
                    <label style={{ fontSize: '13px', color: '#64748b' }}>Điểm xuất phát {dIndex > 0 ? '(Nối tiếp)' : ''}</label>
                    <select 
                        value={day.start_destination_id || ''} 
                        onChange={e => updateDay('start_destination_id', e.target.value)}
                        disabled={dIndex > 0}
                        style={{ 
                            width: '100%', 
                            padding: '8px', 
                            borderRadius: '4px', 
                            border: '1px solid #cbd5e1',
                            background: dIndex > 0 ? '#f1f5f9' : '#fff',
                            cursor: dIndex > 0 ? 'not-allowed' : 'pointer',
                            color: dIndex > 0 ? '#64748b' : '#000'
                        }}
                    >
                        <option value="">-- Chọn điểm xuất phát --</option>
                        {destinations.map(d => (
                            <option key={d.destination_id} value={d.destination_id}>{d.destination_name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: '13px', color: '#64748b' }}>Điểm đến</label>
                    <select 
                        value={day.end_destination_id || ''} 
                        onChange={e => updateDay('end_destination_id', e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    >
                        <option value="">-- Chọn điểm đến --</option>
                        {destinations.map(d => (
                            <option key={d.destination_id} value={d.destination_id}>{d.destination_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '13px', color: '#64748b' }}>Tiêu đề Lộ trình</label>
                <input 
                    value={day.route_title || ''} 
                    onChange={e => {
                        const newDays = [...days];
                        newDays[dIndex].route_title = e.target.value;
                        newDays[dIndex].isTitleEdited = true; // Đánh dấu user đã sửa tay
                        setDays(newDays);
                    }} 
                    placeholder="VD: Hà Nội - Sapa"
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 'bold' }} 
                />
            </div>

            
            
            
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

            {/* Activities Area */}
            {/* Accommodation Section */}
            <div style={{ padding: '15px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
                <h4 style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#0f172a' }}>🏨 Nơi lưu trú tại {(() => {
    const endD = destinations.find(d => String(d.destination_id) === String(day.end_destination_id));
    return endD ? endD.destination_name : 'Điểm đến';
})()}</h4>
                <select 
                    value={day.accommodation?.service_id || ''} 
                    onChange={e => {
                        const val = e.target.value;
                        if (!val) {
                            updateDay('accommodation', null);
                            return;
                        }
                        const service = (allServices || []).find(s => String(s.service_id) === String(val));
                        if (service) {
                            updateDay('accommodation', {
                                service_id: service.service_id,
                                name: `${service.service_name} (hoặc tương đương)`,
                                price: service.base_cost || 0
                            });
                        }
                    }}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', marginBottom: '10px' }}
                >
                    <option value="">-- Không chọn / Tự túc --</option>
                    {(allServices || []).filter(s => 
                        (s.service_type === 'Khách sạn' || s.service_type === 'Accommodation') && 
                        String(s.destination_id) === String(day.end_destination_id)
                    ).map(h => (
                        <option key={h.service_id} value={h.service_id}>{h.service_name} (Từ {Number(h.base_cost).toLocaleString('vi-VN')}đ)</option>
                    ))}
                </select>



            </div>



            <div style={{ paddingLeft: '15px', borderLeft: '2px solid #cbd5e1' }}>
                <h4 style={{ fontSize: '14px', margin: '0 0 10px 0', color: '#475569' }}>Lịch trình chi tiết</h4>
                
                {day.activities && day.activities.map((act, aIndex) => (
                    <div 
                        key={aIndex} 
                        draggable
                        onDragStart={(e) => handleActDragStart(e, aIndex)}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnter={(e) => handleActDragEnter(e, aIndex)}
                        onDragEnd={handleActDragEnd}
                        onDrop={(e) => handleActDrop(e, aIndex)}
                        style={{ 
                            display: 'flex', gap: '10px', alignItems: 'center', background: '#fff', padding: '10px', 
                            borderRadius: '6px', border: dragOverActIndex === aIndex ? '2px dashed #3b82f6' : '1px solid #e2e8f0', 
                            marginBottom: '8px', cursor: 'grab', opacity: draggedActIndex === aIndex ? 0.5 : 1
                        }}>
                        <div style={{ cursor: 'grab', color: '#94a3b8', padding: '0 5px', fontSize: '18px' }}>⋮⋮</div>
                        <select 
                            value={act.type || 'Tham quan'} 
                            onChange={e => {
                                const newDays = [...days];
                                newDays[dIndex].activities[aIndex].type = e.target.value;
                                setDays(newDays);
                            }} 
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        >
                            <option value="Tham quan">Tham quan</option>
                            <option value="Ăn sáng">Ăn sáng</option>
                            <option value="Ăn trưa">Ăn trưa</option>
                            <option value="Ăn tối">Ăn tối</option>
                            <option value="Di chuyển">Di chuyển</option>
                            <option value="Nghỉ ngơi">Nghỉ ngơi</option>
                        </select>
                        <input 
                            value={act.name || ''} 
                            onChange={e => {
                                const newDays = [...days];
                                newDays[dIndex].activities[aIndex].name = e.target.value;
                                setDays(newDays);
                            }} 
                            style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} 
                        />
                        <button onClick={() => removeActivity(aIndex)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Xóa</button>
                    </div>
                ))}

<ActivityItem 
                    places={places} 
                    activities={days.flatMap(d => d.activities || [])}
                    disabled={!day.end_destination_id && !day.start_destination_id}
                    onAdd={(act) => addActivity(act)}
                    startPlaces={places.filter(p => String(p.destination_id) === String(day.start_destination_id))}
                    endPlaces={places.filter(p => String(p.destination_id) === String(day.end_destination_id))}
                    startDestName={destinations.find(d => String(d.destination_id) === String(day.start_destination_id))?.destination_name}
                    endDestName={destinations.find(d => String(d.destination_id) === String(day.end_destination_id))?.destination_name}
                />

                {/* Quick Add Snippets */}
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(() => {
                        let quickSnippets = ['Đến khách sạn nhận phòng', 'Tự do tắm biển / Nghỉ ngơi', 'Mua sắm đặc sản & Trả khách', 'Dùng bữa tối tại nhà hàng'];
                        
                        if (day.start_destination_id && day.end_destination_id) {
                            const startDestName = destinations.find(d => String(d.destination_id) === String(day.start_destination_id))?.destination_name;
                            const endDestName = destinations.find(d => String(d.destination_id) === String(day.end_destination_id))?.destination_name;
                            
                            if (startDestName && endDestName) {
                                // Kiểm tra xem điểm đến có trùng với điểm xuất phát của ngày đầu tiên không (Hành trình quay về)
                                const isReturningToOrigin = days[0] && String(day.end_destination_id) === String(days[0].start_destination_id);
                                
                                if (startDestName !== endDestName) {
                                    if (isReturningToOrigin && day.dayIndex > 1) {
                                        quickSnippets.unshift(`Khởi hành về ${endDestName}`);
                                    } else {
                                        quickSnippets.unshift(`Di chuyển từ ${startDestName} đến ${endDestName}`);
                                    }
                                } else {
                                    quickSnippets.unshift(`Khởi hành tham quan tại ${startDestName}`);
                                }
                            }
                        } else {
                            if (day.dayIndex === 1) {
                                quickSnippets.unshift('Di chuyển từ điểm xuất phát đến điểm du lịch');
                            }
                        }
                        
                        return quickSnippets;
                    })().map(snippet => (
                        <button 
                            key={snippet}
                            onClick={() => addActivity({ type: 'Nghỉ ngơi', name: snippet, price: 0 })}
                            style={{ padding: '4px 8px', fontSize: '12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            + {snippet}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DayCard;

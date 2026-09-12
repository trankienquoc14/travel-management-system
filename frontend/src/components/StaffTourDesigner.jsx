import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TimelineBuilder from './TourBuilder/TimelineBuilder';

const formatMoneyLocal = (amount) => {
    if (isNaN(amount) || amount === null || amount === undefined) return '0';
    return Number(amount).toLocaleString('vi-VN');
};

const FormattedMoneyInput = ({ value, onChange, style }) => {
    const inputRef = React.useRef(null);
    const [cursor, setCursor] = React.useState(null);
    const displayValue = (value !== null && value !== '') ? Number(value).toLocaleString('vi-VN') : '';

    React.useLayoutEffect(() => {
        if (inputRef.current && cursor !== null) {
            inputRef.current.setSelectionRange(cursor, cursor);
        }
    }, [displayValue, cursor]);

    const handleChange = (e) => {
        const input = e.target;
        const currentCursor = input.selectionStart;
        const rawBeforeCursor = input.value.substring(0, currentCursor).replace(/\D/g, '');
        
        const raw = input.value.replace(/\D/g, '');
        const newVal = raw ? Number(raw) : '';
        const newFormatted = newVal ? Number(newVal).toLocaleString('vi-VN') : '';
        
        let newCursor = 0;
        let digitsPassed = 0;
        for (let i = 0; i < newFormatted.length; i++) {
            if (digitsPassed === rawBeforeCursor.length) break;
            if (newFormatted[i] >= '0' && newFormatted[i] <= '9') digitsPassed++;
            newCursor++;
        }
        
        setCursor(newCursor);
        onChange(newVal);
    };

    return (
        <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleChange}
            style={style}
        />
    );
};

const StaffTourDesigner = ({ requestData, onBack }) => {
    const [loading, setLoading] = useState(false);
    const [manualSellingPrice, setManualSellingPrice] = useState(null);

    // Multi-destination Routing State
    const [dayImages, setDayImages] = useState({});
    const [dayImagePreviews, setDayImagePreviews] = useState({});
    const [days, setDays] = useState([]);
    const [tourName, setTourName] = useState('');
    const [tourDescription, setTourDescription] = useState('');

    // Costing State (simplified for Custom Tours)
    const [costConfig, setCostConfig] = useState({
        minimumPax: requestData?.people_count || 1,
        margin: requestData?.markup_percent || 20,
        fixed: { transport: 0, guidePerDay: 500000, otherFixed: 0 },
        variable: { accommPerNight: 0, breakfast: 200000, lunch: 200000, dinner: 200000, tickets: 0, insurance: 0 },
        selectedTransport: null,
        transportTimes: { startD: '05:30', endD: '12:00', startR: '12:00', endR: '17:30' },
        ageMultiplier: {
            preset: 'custom',
            child: { percent: 0, fixed_surcharge: 0 },
            toddler: { percent: 0, fixed_surcharge: 0 },
            infant: { percent: 0, fixed_surcharge: 0 }
        }
    });

    const [staffNote, setStaffNote] = useState('');

    // Resources
    const [destinations, setDestinations] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [transportServices, setTransportServices] = useState([]);

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const token = localStorage.getItem("token");
                const [resDest, resServ] = await Promise.all([
                    axios.get("http://localhost:5000/api/destinations", { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get("http://localhost:5000/api/services", { headers: { Authorization: `Bearer ${token}` } })
                ]);
                
                if (resDest.data.success) setDestinations(resDest.data.data);
                if (resServ.data.success) {
                    setAllServices(resServ.data.data);
                    setTransportServices(resServ.data.data.filter(s => s.service_type === 'Vé máy bay' || s.service_type === 'Xe vận chuyển' || s.service_type === 'Phương tiện'));
                }
            } catch (error) { console.error('Lỗi tải dữ liệu', error); }
        };
        fetchResources();
    }, []);

    useEffect(() => {
        if (!requestData) return;
        
        if (requestData.proposed_itinerary) {
            try {
                const parsed = typeof requestData.proposed_itinerary === 'string' 
                    ? JSON.parse(requestData.proposed_itinerary) 
                    : requestData.proposed_itinerary;
                
                if (parsed.days) {
                    setDays(parsed.days);
                    if (parsed.costConfig) {
                        setCostConfig(prev => ({...prev, ...parsed.costConfig}));
                    }
                    if (parsed.dayImages) {
                        setDayImagePreviews(parsed.dayImages);
                    }
                    if (parsed.staffNote && parsed.staffNote !== requestData.staff_note) {
                        setStaffNote(parsed.staffNote);
                    }
                    if (parsed.tourName) setTourName(parsed.tourName);
                    if (parsed.tourDescription) setTourDescription(parsed.tourDescription);
                    return; // if loaded, stop here
                }
            } catch (e) {
                console.error("Lỗi parse proposed_itinerary", e);
            }
        }

        let prefs = {};
        if (typeof requestData.preferences === 'string') {
            try { prefs = JSON.parse(requestData.preferences); } catch(e){}
        } else if (typeof requestData.preferences === 'object') {
            prefs = requestData.preferences || {};
        }

        // Initialize new days based on departure and return dates
        const d1 = new Date(requestData.departure_date);
        const d2 = new Date(requestData.return_date);
        const totalDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);

        const initialDays = [];
        for (let i = 1; i <= totalDays; i++) {
            let accommodation = null;
            if (prefs.hotelName && (i < totalDays || totalDays === 1)) {
                accommodation = {
                    service_id: 'custom',
                    name: prefs.hotelName,
                    price: prefs.hotelPrice ? Math.round(Number(prefs.hotelPrice)/Math.max(1, totalDays-1)) : 0,
                    autoMatchPending: true
                };
            }

            initialDays.push({
                dayIndex: i,
                start_destination_id: '',
                end_destination_id: '',
                route_title: '',
                activities: [],
                accommodation: accommodation,
                meals: { breakfast: true, lunch: true, dinner: true }
            });
        }
        setDays(initialDays);
        
        let transportTicketsCost = 0;
        let initialTransport = null;

        if (prefs.transportName) {
            initialTransport = {
                service_id: 'custom',
                service_name: prefs.transportName,
                base_cost: prefs.transportPrice || 0,
                unit: 'vé',
                autoMatchPending: true
            };
            transportTicketsCost = Number(prefs.transportPrice || 0);
        } else if (prefs.transportPrice) {
            transportTicketsCost = Number(prefs.transportPrice);
        }

        setCostConfig(prev => ({
            ...prev,
            margin: requestData.markup_percent || 20,
            selectedTransport: initialTransport,
            variable: { ...prev.variable, tickets: transportTicketsCost }
        }));

    }, [requestData]);



    useEffect(() => {
        if (transportServices.length > 0 && costConfig.selectedTransport?.autoMatchPending) {
            const searchName = costConfig.selectedTransport.service_name.toLowerCase().replace('hệ thống - ', '').trim();
            const match = transportServices.find(t => 
                t.service_name.toLowerCase().includes(searchName) || 
                searchName.includes(t.service_name.toLowerCase())
            );

            if (match) {
                const isTicket = match.unit && (match.unit.toLowerCase().includes('vé') || match.unit.toLowerCase().includes('người'));
                
                setCostConfig(prev => ({
                    ...prev,
                    selectedTransport: match, // Found match in DB
                    fixed: {
                        ...prev.fixed,
                        transport: isTicket ? 0 : Number(match.base_cost || 0) * days.length
                    },
                    variable: {
                        ...prev.variable,
                        tickets: isTicket ? Number(match.base_cost || 0) : 0
                    }
                }));
            } else {
                // If not found, just remove the flag so it doesn't loop
                setCostConfig(prev => ({
                    ...prev,
                    selectedTransport: { ...prev.selectedTransport, autoMatchPending: false }
                }));
            }
        }
    }, [transportServices, costConfig.selectedTransport, days.length]);

    useEffect(() => {
        if (allServices.length === 0 || days.length === 0) return;
        let hasChanges = false;
        
        const newDays = days.map(d => {
            if (d.accommodation && d.accommodation.autoMatchPending) {
                hasChanges = true;
                const searchName = d.accommodation.name.toLowerCase().replace('hệ thống - ', '').trim();
                
                const match = allServices.find(s => 
                    (s.service_type === 'Khách sạn' || s.service_type === 'Accommodation') &&
                    (s.service_name.toLowerCase().includes(searchName) || searchName.includes(s.service_name.toLowerCase()))
                );
                
                if (match) {
                    return {
                        ...d,
                        accommodation: {
                            service_id: match.service_id,
                            name: `${match.service_name} (hoặc tương đương)`,
                            price: match.base_cost || 0
                        }
                    };
                } else {
                    return {
                        ...d,
                        accommodation: { ...d.accommodation, autoMatchPending: false }
                    };
                }
            }
            return d;
        });

        if (hasChanges) {
            setDays(newDays);
        }
    }, [days, allServices]);

    const totalDays = days.length;
    
    // Auto compute tickets and accommodations
    let autoTicketsCost = 0;
    let autoAccommodationCost = 0;
    let includedBreakfast = 0;
    let includedLunch = 0;
    let includedDinner = 0;

    days.forEach(day => {
        if (day.meals?.breakfast === true || day.meals?.breakfast === 'external') includedBreakfast++;
        if (day.meals?.lunch === true || day.meals?.lunch === 'external') includedLunch++;
        if (day.meals?.dinner === true || day.meals?.dinner === 'external') includedDinner++;
        
        if (day.accommodation && day.accommodation.price) {
            autoAccommodationCost += Number(day.accommodation.price);
        }

        if (day.activities) {
            day.activities.forEach(act => {
                if (act.type === 'Tham quan') autoTicketsCost += Number(act.price || 0);
            });
        }
    });

    const defaultBreakfast = includedBreakfast;
    const defaultLunch = includedLunch;
    const defaultDinner = includedDinner;

    const handleTransportChange = (e) => {
        const sId = e.target.value;
        if (!sId) {
            setCostConfig(prev => ({ 
                ...prev, 
                selectedTransport: null,
                fixed: { ...prev.fixed, transport: 0 },
                variable: { ...prev.variable, tickets: 0 },
                transportTimes: { startD: '05:30', endD: '12:00', startR: '12:00', endR: '17:30' }
            }));
            return;
        }

        setCostConfig(prev => {
            let selected = null;
            if (sId === 'custom' && prev.selectedTransport?.service_id === 'custom') {
                selected = prev.selectedTransport;
            } else {
                selected = transportServices.find(t => String(t.service_id) === String(sId));
            }
            
            if (!selected) return prev;

            const isTicket = selected.unit && (selected.unit.toLowerCase().includes('vé') || selected.unit.toLowerCase().includes('người'));
            
            return {
                ...prev,
                selectedTransport: selected,
                fixed: { 
                    ...prev.fixed, 
                    transport: isTicket ? 0 : Number(selected.base_cost || 0) * days.length 
                },
                variable: { 
                    ...prev.variable, 
                    tickets: isTicket ? Number(selected.base_cost || 0) : 0 
                }
            };
        });
    };

    const pax = costConfig.minimumPax || requestData?.people_count || 1;
    const totalFixed = Number(costConfig.fixed.transport) + (Number(costConfig.fixed.guidePerDay) * totalDays) + Number(costConfig.fixed.otherFixed);
    const fixedPerPax = pax > 0 ? totalFixed / pax : 0;
    
    const countBreakfast = costConfig.variable.countBreakfast !== undefined ? Number(costConfig.variable.countBreakfast) : includedBreakfast;
    const countLunch = costConfig.variable.countLunch !== undefined ? Number(costConfig.variable.countLunch) : includedLunch;
    const countDinner = costConfig.variable.countDinner !== undefined ? Number(costConfig.variable.countDinner) : includedDinner;

    const totalVariable = (autoAccommodationCost / 2) 
        + Number(costConfig.variable.tickets || autoTicketsCost)
        + (Number(costConfig.variable.breakfast) * countBreakfast)
        + (Number(costConfig.variable.lunch) * countLunch)
        + (Number(costConfig.variable.dinner) * countDinner)
        + Number(costConfig.variable.insurance);
        
    const netCost = fixedPerPax + totalVariable;
    const calculatedSellingPrice = netCost * (1 + Number(costConfig.margin) / 100);
    const sellingPrice = manualSellingPrice !== null && manualSellingPrice !== '' ? manualSellingPrice : (manualSellingPrice === '' ? '' : calculatedSellingPrice);

    const handleSubmitToManager = async () => {
        const designPayload = JSON.stringify({
            tourName,
            tourDescription,
            days,
            costConfig,
            staffNote
        });

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('base_cost', netCost);
            formData.append('quote_price', sellingPrice);
            formData.append('itinerary', designPayload);
            formData.append('note', staffNote);
            formData.append('existing_day_images', JSON.stringify(dayImagePreviews || {}));

            if (dayImages) {
                Object.keys(dayImages).forEach(dayIdx => {
                    if (dayImages[dayIdx] instanceof File) {
                        formData.append(`dayImage_${dayIdx}`, dayImages[dayIdx]);
                    }
                });
            }

            await axios.post(`http://localhost:5000/api/custom-tours/requests/${requestData.request_id}/submit-manager`, formData, { 
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                } 
            });

            alert('🎉 Đã chốt bản thiết kế & Gửi Quản lý phê duyệt thành công!');
            onBack();
        } catch (error) {
            console.error("Lỗi API:", error);
            alert('Lỗi khi gửi phê duyệt!');
        }
    };

    if (!requestData) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
            <div style={{ padding: '15px 25px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={onBack} style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: '600' }}>⬅ Quay lại Inbox</button>
                    <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>Phòng Thiết Kế: {requestData.customer_name} - {requestData.destination}</h2>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '25px' }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <TimelineBuilder 
                    days={days} 
                    setDays={setDays} 
                    destinations={destinations} 
                    allServices={allServices} 
                    dayImages={dayImages}
                    setDayImages={setDayImages}
                    dayImagePreviews={dayImagePreviews}
                    setDayImagePreviews={setDayImagePreviews}
                    requestData={requestData}
                    costConfig={costConfig}
                    setCostConfig={setCostConfig}
                    tourName={tourName}
                    setTourName={setTourName}
                    tourDescription={tourDescription}
                    setTourDescription={setTourDescription}
                />

                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Yêu cầu của khách hàng */}
                    {(() => {
                        let prefs = {};
                        if (typeof requestData.preferences === 'string') {
                            try { prefs = JSON.parse(requestData.preferences); } catch(e){}
                        } else if (typeof requestData.preferences === 'object') {
                            prefs = requestData.preferences || {};
                        }
                        return (
                            <div style={{ background: '#f0f9ff', padding: '20px', borderRadius: '12px', border: '1px solid #bae6fd', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>📋</span> Chi tiết yêu cầu
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#334155' }}>
                                    <div>
                                        <strong style={{ color: '#0f172a' }}>Điểm đến:</strong> <span style={{ fontWeight: '600', color: '#0369a1' }}>{requestData.destination}</span>
                                    </div>
                                    <div>
                                        <strong style={{ color: '#0f172a' }}>Thời gian:</strong> {Math.round((new Date(requestData.return_date) - new Date(requestData.departure_date)) / (1000 * 60 * 60 * 24)) + 1} Ngày {Math.max(0, Math.round((new Date(requestData.return_date) - new Date(requestData.departure_date)) / (1000 * 60 * 60 * 24)))} Đêm 
                                        <span style={{ color: '#64748b', fontSize: '13px', marginLeft: '6px' }}>({new Date(requestData.departure_date).toLocaleDateString('vi-VN')} - {new Date(requestData.return_date).toLocaleDateString('vi-VN')})</span>
                                    </div>
                                    <div>
                                        <strong style={{ color: '#0f172a' }}>Đón khách:</strong> {prefs.pickup_location || 'Tự túc'} {prefs.departure_time ? `(Lúc ${prefs.departure_time})` : ''}
                                    </div>
                                    <div>
                                        <strong style={{ color: '#0f172a' }}>Thành viên:</strong> {requestData.people_count} người (
                                        {[
                                            (prefs.participantBreakdown?.adults || requestData.people_count) + ' Lớn',
                                            prefs.participantBreakdown?.children ? prefs.participantBreakdown.children + ' Trẻ em' : null,
                                            prefs.participantBreakdown?.toddlers ? prefs.participantBreakdown.toddlers + ' Trẻ nhỏ' : null,
                                            prefs.participantBreakdown?.infants ? prefs.participantBreakdown.infants + ' Em bé' : null
                                        ].filter(Boolean).join(', ')}
                                        )
                                    </div>
                                    <div>
                                        <strong style={{ color: '#0f172a' }}>Ngân sách khách:</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>{formatMoneyLocal(requestData.budget)} đ/người</span>
                                    </div>
                                    <div>
                                        <strong style={{ color: '#0f172a' }}>Phương tiện:</strong> {prefs.transportName || 'Không rõ'}
                                    </div>
                                    <div>
                                        <strong style={{ color: '#0f172a' }}>Lưu trú:</strong> {prefs.hotelName || 'Không rõ'}
                                    </div>
                                    {prefs.note && (
                                        <div style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px dashed #7dd3fc', color: '#0c4a6e', marginTop: '5px' }}>
                                            <strong>Ghi chú:</strong> {prefs.note}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#d97706' }}>Định phí</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Chọn phương tiện di chuyển chính</label>
                                <select 
                                    value={costConfig.selectedTransport?.service_id || ''} 
                                    onChange={handleTransportChange}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                >
                                    <option value="">-- Tự túc / Không chọn --</option>
                                    {costConfig.selectedTransport?.service_id === 'custom' && (
                                        <option value="custom">{costConfig.selectedTransport.service_name} (Tự động từ yêu cầu: {Number(costConfig.selectedTransport.base_cost).toLocaleString('vi-VN')}đ)</option>
                                    )}
                                    {transportServices.map(t => (
                                        <option key={t.service_id} value={t.service_id}>{t.service_name} (Từ {Number(t.base_cost).toLocaleString('vi-VN')}đ)</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Điểm hòa vốn</label>
                                <input type="number" value={costConfig.minimumPax} onChange={e => setCostConfig({...costConfig, minimumPax: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Chi phí Xe / Phương tiện</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" value={Number(costConfig.fixed.transport || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, fixed: {...costConfig.fixed, transport: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Đơn giá HDV / Ngày</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" value={Number(costConfig.fixed.guidePerDay || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, fixed: {...costConfig.fixed, guidePerDay: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Chi phí cố định khác</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" value={Number(costConfig.fixed.otherFixed || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, fixed: {...costConfig.fixed, otherFixed: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #cbd5e1', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Tổng Định Phí:</span>
                            <span style={{ color: '#d97706' }}>{Number(totalFixed).toLocaleString('vi-VN')}đ</span>
                        </div>
                    </div>

                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#2563eb' }}>Biến phí</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Vé Xe / Máy bay / Khách</label>
                                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{Number(costConfig.variable.tickets || 0).toLocaleString('vi-VN')} đ</div>
                            </div>
                            <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Chi phí khách sạn (2 khách / phòng)</label>
                                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{(autoAccommodationCost / 2).toLocaleString('vi-VN')} đ</div>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Bữa sáng (Số lượng / Đơn giá)</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <input type="number" placeholder={`Tự động: ${defaultBreakfast}`} value={costConfig.variable.countBreakfast !== undefined ? costConfig.variable.countBreakfast : ''} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, countBreakfast: e.target.value}})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} title="Số bữa sáng" />
                                            <div style={{ position: 'relative' }}>
                                                <input type="text" value={Number(costConfig.variable.breakfast || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, breakfast: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} title="Đơn giá" />
                                                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Bữa trưa (Số lượng / Đơn giá)</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <input type="number" placeholder={`Tự động: ${defaultLunch}`} value={costConfig.variable.countLunch !== undefined ? costConfig.variable.countLunch : ''} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, countLunch: e.target.value}})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} title="Số bữa trưa" />
                                            <div style={{ position: 'relative' }}>
                                                <input type="text" value={Number(costConfig.variable.lunch || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, lunch: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} title="Đơn giá" />
                                                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Bữa tối (Số lượng / Đơn giá)</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <input type="number" placeholder={`Tự động: ${defaultDinner}`} value={costConfig.variable.countDinner !== undefined ? costConfig.variable.countDinner : ''} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, countDinner: e.target.value}})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} title="Số bữa tối" />
                                            <div style={{ position: 'relative' }}>
                                                <input type="text" value={Number(costConfig.variable.dinner || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, dinner: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} title="Đơn giá" />
                                                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Tổng chi phí các điểm tham quan</label>
                                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>{Number(autoTicketsCost).toLocaleString('vi-VN')} đ</div>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Bảo hiểm & Khác</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" value={Number(costConfig.variable.insurance || 0).toLocaleString('vi-VN')} onChange={e => setCostConfig({...costConfig, variable: {...costConfig.variable, insurance: e.target.value.replace(/\D/g, '')}})} style={{ width: '100%', padding: '8px', paddingRight: '25px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>đ</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #cbd5e1', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Tổng Biến Phí / Khách:</span>
                            <span style={{ color: '#2563eb' }}>{Number(totalVariable).toLocaleString('vi-VN')}đ</span>
                        </div>
                    </div>

                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Lời nhắn cho khách hàng</h3>
                        <textarea
                            value={staffNote}
                            onChange={(e) => setStaffNote(e.target.value)}
                            placeholder="Ví dụ: Dạ em gửi anh chị bản lịch trình thiết kế chi tiết, anh chị xem qua nhé..."
                            style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }}
                        />
                    </div>
                </div>
            </div>

            {/* THIẾT LẬP LỢI NHUẬN (MARKUP) */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📈</span> Thiết Lập Lợi Nhuận
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ flex: 1, background: '#ecfdf5', padding: '10px 15px', borderRadius: '8px', border: '1px dashed #34d399' }}>
                        <div style={{ fontSize: '12px', color: '#047857', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Giá Vốn / Khách</div>
                        <div style={{ fontSize: '20px', color: '#065f46', fontWeight: 'bold' }}>{formatMoneyLocal(netCost)} đ</div>
                    </div>
                    <div style={{ fontSize: '24px', color: '#cbd5e1' }}>+</div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: '600' }}>Biên độ lợi nhuận Markup (%)</label>
                        <input 
                            type="number" 
                            min="0"
                            value={costConfig.margin} 
                            onChange={e => {
                                setCostConfig({ ...costConfig, margin: e.target.value });
                                setManualSellingPrice(null);
                            }} 
                            style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', fontWeight: 'bold', outline: 'none' }} 
                        />
                    </div>
                    <div style={{ fontSize: '24px', color: '#cbd5e1' }}>=</div>
                    <div style={{ flex: 1, background: '#fffbeb', padding: '10px 15px', borderRadius: '8px', border: '1px dashed #fcd34d' }}>
                        <label style={{ display: 'block', fontSize: '12px', color: '#d97706', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Giá Bán Dự Kiến (Người lớn)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FormattedMoneyInput 
                                value={sellingPrice} 
                                onChange={(val) => {
                                    if (val === '' || val === null || val === undefined) {
                                        setManualSellingPrice('');
                                        setCostConfig({ ...costConfig, margin: '' });
                                        return;
                                    }
                                    const numericVal = Number(val);
                                    setManualSellingPrice(numericVal);
                                    if (netCost > 0) {
                                        const newMarkup = (((numericVal / netCost) - 1) * 100).toFixed(1);
                                        setCostConfig({ ...costConfig, margin: newMarkup });
                                    }
                                }}
                                style={{ width: '100%', minWidth: '120px', background: 'transparent', border: 'none', borderBottom: '1px solid #d97706', color: '#b45309', fontSize: '20px', fontWeight: 'bold', outline: 'none', padding: '0 4px' }}
                            />
                            <span style={{ fontSize: '20px', color: '#b45309', fontWeight: 'bold' }}>đ</span>
                        </div>
                    </div>
                </div>
            </div>

                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', color: '#0ea5e9' }}>Chính sách giá trẻ em</h3>
                            <select 
                                value={costConfig.ageMultiplier?.preset || 'custom'}
                                onChange={e => {
                                    const preset = e.target.value;
                                    let newMulti = { ...(costConfig.ageMultiplier || {}), preset };
                                    if (preset === 'road') {
                                        newMulti = { preset, child: { percent: 50, fixed_surcharge: 0 }, toddler: { percent: 0, fixed_surcharge: 0 }, infant: { percent: 0, fixed_surcharge: 0 } };
                                    } else if (preset === 'air') {
                                        newMulti = { preset, child: { percent: 85, fixed_surcharge: 0 }, toddler: { percent: 50, fixed_surcharge: 0 }, infant: { percent: 0, fixed_surcharge: 500000 } };
                                    }
                                    setCostConfig({ ...costConfig, ageMultiplier: newMulti });
                                }}
                                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                            >
                                <option value="custom">Tuỳ chỉnh (Custom)</option>
                                <option value="road">Mẫu 1 (Đường bộ): 50% - 0% - 0%</option>
                                <option value="air">Mẫu 2 (Hàng không): 85% - 50% - (0% + Phụ thu)</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                            {[
                                { key: 'child', label: 'Trẻ em (5 - 11 tuổi)' },
                                { key: 'toddler', label: 'Trẻ nhỏ (2 - 4 tuổi)' },
                                { key: 'infant', label: 'Em bé (< 2 tuổi)' }
                            ].map(group => {
                                const currentSetting = costConfig.ageMultiplier?.[group.key] || { percent: 0, fixed_surcharge: 0 };
                                const isCustom = costConfig.ageMultiplier?.preset === 'custom';
                                const calPrice = (sellingPrice * (currentSetting.percent || 0) / 100) + Number(currentSetting.fixed_surcharge || 0);

                                return (
                                    <div key={group.key} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <strong style={{ display: 'block', marginBottom: '10px', color: '#1e293b', fontSize: '14px' }}>{group.label}</strong>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Tỷ lệ % giá người lớn</label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <input 
                                                        type="number" 
                                                        value={Number(currentSetting.percent).toString()}
                                                        disabled={!isCustom}
                                                        onChange={e => {
                                                            let val = e.target.value;
                                                            if (val === '') val = 0;
                                                            else val = parseInt(val, 10);
                                                            if (isNaN(val)) val = 0;
                                                            
                                                            setCostConfig({
                                                                ...costConfig,
                                                                ageMultiplier: {
                                                                    ...(costConfig.ageMultiplier || {}),
                                                                    [group.key]: { ...currentSetting, percent: val }
                                                                }
                                                            })
                                                        }}
                                                        style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', background: isCustom ? '#fff' : '#f1f5f9' }}
                                                    />
                                                    <span style={{ color: '#64748b', fontSize: '13px' }}>%</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Phụ thu cố định</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input 
                                                        type="text" 
                                                        value={Number(currentSetting.fixed_surcharge || 0).toLocaleString('vi-VN')}
                                                        disabled={!isCustom}
                                                        onChange={e => {
                                                            setCostConfig({
                                                                ...costConfig,
                                                                ageMultiplier: {
                                                                    ...(costConfig.ageMultiplier || {}),
                                                                    [group.key]: { ...currentSetting, fixed_surcharge: Number(e.target.value.replace(/\D/g, '')) }
                                                                }
                                                            })
                                                        }}
                                                        style={{ width: '100%', padding: '6px', paddingRight: '20px', borderRadius: '4px', border: '1px solid #cbd5e1', background: isCustom ? '#fff' : '#f1f5f9' }}
                                                    />
                                                    <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '12px' }}>đ</span>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: '5px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '12px', color: '#64748b' }}>Giá bán:</span>
                                                <strong style={{ fontSize: '14px', color: '#0ea5e9' }}>{formatMoneyLocal(calPrice)} đ</strong>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>


                    {/* TỔNG KẾT CHI PHÍ ĐOÀN */}
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginTop: '20px' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>💰</span> Tổng Kết Chi Phí Toàn Đoàn
                        </h3>
                        {(() => {
                            let prefs = {};
                            try { prefs = typeof requestData.preferences === 'string' ? JSON.parse(requestData.preferences) : requestData.preferences || {}; } catch(e){}
                            
                            const pA = prefs.participantBreakdown?.adults || requestData.people_count;
                            const pC = prefs.participantBreakdown?.children || 0;
                            const pT = prefs.participantBreakdown?.toddlers || 0;
                            const pI = prefs.participantBreakdown?.infants || 0;

                            const sC = costConfig.ageMultiplier?.child || { percent: 0, fixed_surcharge: 0 };
                            const sT = costConfig.ageMultiplier?.toddler || { percent: 0, fixed_surcharge: 0 };
                            const sI = costConfig.ageMultiplier?.infant || { percent: 0, fixed_surcharge: 0 };

                            const prA = sellingPrice;
                            const prC = (sellingPrice * (sC.percent || 0) / 100) + Number(sC.fixed_surcharge || 0);
                            const prT = (sellingPrice * (sT.percent || 0) / 100) + Number(sT.fixed_surcharge || 0);
                            const prI = (sellingPrice * (sI.percent || 0) / 100) + Number(sI.fixed_surcharge || 0);

                            const totalA = pA * prA;
                            const totalC = pC * prC;
                            const totalT = pT * prT;
                            const totalI = pI * prI;
                            const grandTotal = totalA + totalC + totalT + totalI;

                            return (
                                <div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '15px' }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '14px' }}>
                                                <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>Loại khách</th>
                                                <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>Số lượng</th>
                                                <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1', textAlign: 'right' }}>Đơn giá</th>
                                                <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1', textAlign: 'right' }}>Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pA > 0 && <tr>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Người lớn</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{pA}</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{formatMoneyLocal(prA)} đ</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>{formatMoneyLocal(totalA)} đ</td>
                                            </tr>}
                                            {pC > 0 && <tr>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Trẻ em (5-11t)</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{pC}</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{formatMoneyLocal(prC)} đ</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>{formatMoneyLocal(totalC)} đ</td>
                                            </tr>}
                                            {pT > 0 && <tr>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Trẻ nhỏ (2-4t)</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{pT}</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{formatMoneyLocal(prT)} đ</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>{formatMoneyLocal(totalT)} đ</td>
                                            </tr>}
                                            {pI > 0 && <tr>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Em bé (&lt;2t)</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{pI}</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>{formatMoneyLocal(prI)} đ</td>
                                                <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold' }}>{formatMoneyLocal(totalI)} đ</td>
                                            </tr>}
                                        </tbody>
                                    </table>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', background: '#ecfdf5', padding: '15px 20px', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <span style={{ fontSize: '16px', color: '#065f46', fontWeight: 'bold', textTransform: 'uppercase' }}>TỔNG DOANH THU ĐOÀN</span>
                                            <strong style={{ fontSize: '24px', color: '#047857' }}>{formatMoneyLocal(grandTotal)} đ</strong>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>

            <div style={{ background: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '15px 30px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', zIndex: 10 }}>
                {(!requestData || !['Manager_Approved', 'Sent_To_Customer', 'Customer_Accepted', 'Completed', 'Canceled'].includes(requestData.status)) && (
                    <button 
                        onClick={handleSubmitToManager}
                        style={{ padding: '14px 30px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }}
                    >
                        ✅ Chốt Thiết Kế & Gửi Quản Lý
                    </button>
                )}
            </div>
        </div>
    );
};

export default StaffTourDesigner;
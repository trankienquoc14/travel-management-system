import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StaffTourDesigner = ({ requestData, onBack }) => {
    const [itineraryDays, setItineraryDays] = useState([]);
    const [resources, setResources] = useState([]);

    // Kho dịch vụ mở rộng tại điểm đến
    const [destinationExtra, setDestinationExtra] = useState({
        transport: [],
        accommodation: [],
        sightseeing: []
    });

    const [draggedItem, setDraggedItem] = useState(null);

    const [logistics, setLogistics] = useState({
        pickup: { time: '', location: '', flightInfo: '', note: '' },
        dropoff: { time: '', location: '', flightInfo: '', note: '' }
    });

    const [fixedServices, setFixedServices] = useState({
        accommodation: [],
        transport: []
    });

    const [quoteData, setQuoteData] = useState({
        markup: requestData?.markup_percent || 20,
        staffNote: requestData?.staff_note || ''
    });

    useEffect(() => {
        if (!requestData) return;

        const fetchDestinationServices = async (excludeNames = []) => {
            try {
                const token = localStorage.getItem('token');
                // Gọi API lấy dịch vụ thực tế trong CSDL theo điểm đến
                const res = await axios.get(`http://localhost:5000/api/custom-tours/services/${encodeURIComponent(requestData.destination)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data && res.data.success) {
                    const realData = res.data.data;
                    setDestinationExtra({
                        transport: (realData.transport || []).filter(item => !excludeNames.includes(item.name)),
                        accommodation: (realData.accommodation || []).filter(item => !excludeNames.includes(item.name)),
                        sightseeing: (realData.sightseeing || []).filter(item => !excludeNames.includes(item.name))
                    });
                }
            } catch (error) {
                console.error("Lỗi khi tải kho dịch vụ từ CSDL:", error);
            }
        };

        // 1. KIỂM TRA XEM TOUR ĐÃ CÓ BẢN THIẾT KẾ LƯU TRONG DB CHƯA?
        // ✅ SỬA: Chỉ cần có proposed_itinerary là load lại, không phụ thuộc tên status sai
        if (requestData.proposed_itinerary) {
            try {
                const parsedData = typeof requestData.proposed_itinerary === 'string'
                    ? JSON.parse(requestData.proposed_itinerary)
                    : requestData.proposed_itinerary;

                const savedState = parsedData.dragDropState;

                if (savedState) {
                    setLogistics(savedState.logistics);
                    setFixedServices(savedState.fixedServices);
                    setItineraryDays(savedState.itineraryDays);
                    setResources(savedState.resources);
                    setQuoteData({
                        markup: requestData.markup_percent || 20,
                        staffNote: requestData.staff_note || ''
                    });

                    const usedNames = [];
                    savedState.fixedServices.accommodation?.forEach(i => usedNames.push(i.name));
                    savedState.fixedServices.transport?.forEach(i => usedNames.push(i.name));
                    savedState.itineraryDays?.forEach(d => {
                        d.slots?.morning?.forEach(i => usedNames.push(i.name));
                        d.slots?.noon?.forEach(i => usedNames.push(i.name));
                        d.slots?.evening?.forEach(i => usedNames.push(i.name));
                    });

                    fetchDestinationServices(usedNames);
                    return; // 👈 Load xong thì DỪNG LẠI, không chạy xuống Auto Schedule bên dưới nữa!
                }
            } catch (error) {
                console.error("Lỗi khi phục hồi bản thiết kế:", error);
            }
        }

        // 2. NẾU LÀ TOUR MỚI TINH -> CHẠY AUTO SCHEDULE
        const prefs = requestData.preferences || requestData.requirements || {};
        const allResources = [];

        if (prefs.hotelName && prefs.hotelName !== 'Không chọn') {
            allResources.push({ id: 'hotel', type: '🏨 Lưu trú', name: prefs.hotelName, price: Number(prefs.hotelPrice) || 0 });
        }
        if (prefs.transportName && prefs.transportName !== 'Không chọn') {
            allResources.push({ id: 'transport', type: '✈️ Di chuyển', name: prefs.transportName, price: Number(prefs.transportPrice) || 0 });
        }
        if (prefs.selectedPlaces && prefs.selectedPlaces.length > 0) {
            prefs.selectedPlaces.forEach((place, idx) => {
                allResources.push({ id: `place_${idx}`, type: '🎟️ Tham quan', name: place.name, price: Number(place.price) || 0 });
            });
        }

        // =========================================================================
        // ✅ THÊM HOẠT ĐỘNG THÔNG MINH THEO ĐỊA HÌNH ĐIỂM ĐẾN
        // =========================================================================
        const dest = (requestData.destination || '').toLowerCase();

        // Danh sách các vùng biển
        const beachDestinations = ['nha trang', 'phú quốc', 'vũng tàu', 'đà nẵng', 'phan thiết', 'quy nhơn', 'hạ long'];
        const isBeach = beachDestinations.some(b => dest.includes(b));

        // Nếu là biển thì tạo thẻ tắm biển, nếu núi/khác thì tạo thẻ nghỉ ngơi, uống cafe ngắm cảnh
        const freeTimeActivityName = isBeach
            ? 'Tự do tắm biển / Nghỉ dưỡng resort'
            : 'Tự do dạo phố ngắm cảnh / Nghỉ ngơi thư giãn';

        allResources.push({ id: 'act_1', type: '🕒 Hoạt động', name: 'Đón khách & Khởi hành về khách sạn', price: 0 });
        allResources.push({ id: 'act_2', type: '🕒 Hoạt động', name: freeTimeActivityName, price: 0 });
        allResources.push({ id: 'act_3', type: '🕒 Hoạt động', name: 'Mua sắm đặc sản địa phương & Tiễn khách', price: 0 });

        fetchDestinationServices(allResources.map(r => r.name));

        const d1 = new Date(requestData.departure_date);
        const d2 = new Date(requestData.return_date);
        const totalDays = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);

        const autoScheduledIds = new Set();
        const initialFixed = { accommodation: [], transport: [] };

        const hotelItem = allResources.find(r => r.id === 'hotel');
        if (hotelItem) { initialFixed.accommodation.push(hotelItem); autoScheduledIds.add(hotelItem.id); }

        const transportItem = allResources.find(r => r.id === 'transport');
        if (transportItem) { initialFixed.transport.push(transportItem); autoScheduledIds.add(transportItem.id); }
        setFixedServices(initialFixed);

        const daysArray = [];
        let remainingResources = [...allResources];

        for (let i = 1; i <= totalDays; i++) {
            const currentDate = new Date(d1);
            currentDate.setDate(d1.getDate() + (i - 1));
            const daySlots = { morning: [], noon: [], evening: [] };

            if (i === 1) {
                const welcomeAct = remainingResources.find(r => r.id === 'act_1');
                if (welcomeAct) { daySlots.morning.push(welcomeAct); autoScheduledIds.add(welcomeAct.id); }
            }

            if (i === totalDays) {
                const byeAct = remainingResources.find(r => r.id === 'act_3');
                if (byeAct) { daySlots.evening.push(byeAct); autoScheduledIds.add(byeAct.id); }
            }

            const availablePlaces = remainingResources.filter(r => r.id.startsWith('place_') && !autoScheduledIds.has(r.id));
            if (availablePlaces.length > 0) {
                if (daySlots.morning.length < 2) {
                    const place = availablePlaces.shift();
                    daySlots.morning.push(place); autoScheduledIds.add(place.id);
                }
                if (availablePlaces.length > 0 && daySlots.evening.length < 2) {
                    const place = availablePlaces.shift();
                    daySlots.evening.push(place); autoScheduledIds.add(place.id);
                }
            }

            if (daySlots.noon.length === 0) {
                const freeAct = remainingResources.find(r => r.id === 'act_2');
                if (freeAct) { daySlots.noon.push({ ...freeAct, id: `${freeAct.id}_day_${i}` }); }
            }

            daysArray.push({ dayIndex: i, dateString: currentDate.toLocaleDateString('vi-VN'), slots: daySlots });
        }

        setItineraryDays(daysArray);
        const leftoverResources = allResources.filter(r => r.id.startsWith('act_') || !autoScheduledIds.has(r.id));
        setResources(leftoverResources);

    }, [requestData]);

    const handleLogisticsChange = (type, field, value) => {
        setLogistics(prev => ({ ...prev, [type]: { ...prev[type], [field]: value } }));
    };

    // =========================================================================
    // HỆ THỐNG KÉO THẢ TỐI ƯU (CHO PHÉP HOÁN ĐỔI THỨ TỰ TRONG CÙNG KHUNG)
    // =========================================================================
    const handleDragStart = (e, item, source) => {
        setDraggedItem({ item, source });
        e.dataTransfer.effectAllowed = "copyMove";
        e.target.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1';
        setDraggedItem(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = draggedItem?.source === 'extra' ? "copy" : "move";
    };

    // 1. THẢ VÀO KHUNG TRỐNG (Nối vào cuối danh sách)
    const handleDropContainer = (e, targetDayIndex, targetSlot) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedItem) return;
        const { item, source } = draggedItem;

        // Nếu thả trên khoảng trống của cùng 1 khung thì thôi (không đổi gì)
        if (source.dayIndex === targetDayIndex && source.slot === targetSlot) return;

        executeDrop(item, source, targetDayIndex, targetSlot, null);
    };

    // 2. THẢ TRỰC TIẾP LÊN MỘT THẺ KHÁC (Để hoán đổi thứ tự / chèn vào giữa)
    const handleDropOnCard = (e, targetItem, targetDayIndex, targetSlot) => {
        e.preventDefault();
        e.stopPropagation(); // Ngăn sự kiện thả rơi xuống khung container
        if (!draggedItem) return;
        const { item, source } = draggedItem;

        if (item.id === targetItem.id) return;

        executeDrop(item, source, targetDayIndex, targetSlot, targetItem.id);
    };

    // HÀM XỬ LÝ CHUYỂN DỊCH VÀ SẮP XẾP VỊ TRÍ ĐỒNG BỘ 1 LẦN
    const executeDrop = (item, source, targetDayIndex, targetSlot, targetItemId = null) => {
        const isFromExtra = source === 'extra';
        const itemToInsert = isFromExtra
            ? { ...item, id: `${item.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}` }
            : item;

        // Clone toàn bộ State ra bộ nhớ tạm để không xung đột React
        let nextResources = [...resources];
        let nextFixed = {
            accommodation: [...fixedServices.accommodation],
            transport: [...fixedServices.transport]
        };
        let nextDays = itineraryDays.map(day => ({
            ...day,
            slots: {
                morning: [...day.slots.morning],
                noon: [...day.slots.noon],
                evening: [...day.slots.evening]
            }
        }));

        // BƯỚC A: XÓA ITEM Ở VỊ TRÍ CŨ (Nếu không phải lấy từ kho Extra)
        if (!isFromExtra) {
            if (source === 'resources') {
                nextResources = nextResources.filter(r => r.id !== item.id);
            } else if (source.dayIndex === 'fixed') {
                nextFixed[source.slot] = nextFixed[source.slot].filter(i => i.id !== item.id);
            } else {
                nextDays = nextDays.map(day => {
                    if (day.dayIndex === source.dayIndex) {
                        day.slots[source.slot] = day.slots[source.slot].filter(i => i.id !== item.id);
                    }
                    return day;
                });
            }
        }

        // BƯỚC B: CHÈN ITEM VÀO VỊ TRÍ MỚI CHÍNH XÁC THEO THỨ TỰ
        const insertIntoList = (list) => {
            const cleanList = list.filter(i => i.id !== itemToInsert.id);
            if (!targetItemId) {
                return [...cleanList, itemToInsert]; // Nối vào cuối
            }
            const targetIndex = cleanList.findIndex(i => i.id === targetItemId);
            if (targetIndex === -1) return [...cleanList, itemToInsert];

            cleanList.splice(targetIndex, 0, itemToInsert); // Chèn vào trước thẻ mục tiêu
            return cleanList;
        };

        if (targetDayIndex === 'fixed') {
            nextFixed[targetSlot] = insertIntoList(nextFixed[targetSlot]);
        } else {
            nextDays = nextDays.map(day => {
                if (day.dayIndex === targetDayIndex) {
                    day.slots[targetSlot] = insertIntoList(day.slots[targetSlot]);
                }
                return day;
            });
        }

        // Cập nhật toàn bộ State
        setResources(nextResources);
        setFixedServices(nextFixed);
        setItineraryDays(nextDays);
        setDraggedItem(null);
    };

    // 3. THẢ TRẢ LẠI VÀO KHO RESOURCES BÊN TRÁI
    const handleDropBackToResources = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedItem) return;
        const { item, source } = draggedItem;

        if (source === 'resources' || source === 'extra') return;

        let nextResources = [...resources];
        let nextFixed = {
            accommodation: [...fixedServices.accommodation],
            transport: [...fixedServices.transport]
        };
        let nextDays = itineraryDays.map(day => ({
            ...day,
            slots: {
                morning: [...day.slots.morning],
                noon: [...day.slots.noon],
                evening: [...day.slots.evening]
            }
        }));

        if (source.dayIndex === 'fixed') {
            nextFixed[source.slot] = nextFixed[source.slot].filter(i => i.id !== item.id);
        } else {
            nextDays = nextDays.map(day => {
                if (day.dayIndex === source.dayIndex) {
                    day.slots[source.slot] = day.slots[source.slot].filter(i => i.id !== item.id);
                }
                return day;
            });
        }

        if (!item.id.includes('_day_') && !item.id.includes('ext_') && !nextResources.some(r => r.id === item.id)) {
            nextResources.push(item);
        }

        setResources(nextResources);
        setFixedServices(nextFixed);
        setItineraryDays(nextDays);
        setDraggedItem(null);
    };

    const handleRemoveFromSlot = (dayIndex, slot, item) => {
        if (!item.id.includes('_day_') && !item.id.includes('ext_') && !resources.some(r => r.id === item.id)) {
            setResources(prev => [...prev, item]);
        }
        setItineraryDays(prevDays => prevDays.map(day => {
            if (day.dayIndex === dayIndex) {
                return { ...day, slots: { ...day.slots, [slot]: day.slots[slot].filter(i => i.id !== item.id) } };
            }
            return day;
        }));
    };

    const handleRemoveFromFixed = (slot, item) => {
        if (!item.id.includes('ext_') && !resources.some(r => r.id === item.id)) {
            setResources(prev => [...prev, item]);
        }
        setFixedServices(prev => ({ ...prev, [slot]: prev[slot].filter(i => i.id !== item.id) }));
    };

    // TÍNH TOÁN & LƯU DB
    const calculateTotalCost = () => {
        let total = 0;
        fixedServices.accommodation.forEach(item => total += (item.price || 0));
        fixedServices.transport.forEach(item => total += (item.price || 0));
        itineraryDays.forEach(day => {
            ['morning', 'noon', 'evening'].forEach(slotKey => {
                day.slots[slotKey].forEach(item => total += (item.price || 0));
            });
        });
        return total;
    };

    const totalCost = calculateTotalCost();
    const suggestedPrice = Math.round(totalCost * (1 + Number(quoteData.markup) / 100));
    const formatMoney = (amount) => Number(amount).toLocaleString('vi-VN');

    const handleSubmitToManager = async () => {
        let finalTextItinerary = `CHƯƠNG TRÌNH DU LỊCH ${requestData.destination.toUpperCase()}\n`;
        finalTextItinerary += `==========================\n\n`;

        itineraryDays.forEach(day => {
            finalTextItinerary += `NGÀY ${day.dayIndex} (${day.dateString}):\n`;
            if (day.slots.morning.length > 0) finalTextItinerary += ` - Sáng: ${day.slots.morning.map(i => i.name).join(' ➔ ')}\n`;
            if (day.slots.noon.length > 0) finalTextItinerary += ` - Trưa: ${day.slots.noon.map(i => i.name).join(' ➔ ')}\n`;
            if (day.slots.evening.length > 0) finalTextItinerary += ` - Chiều/Tối: ${day.slots.evening.map(i => i.name).join(' ➔ ')}\n`;
            finalTextItinerary += '\n';
        });

        const designPayload = JSON.stringify({
            textVersion: finalTextItinerary,
            dragDropState: {
                logistics,
                fixedServices,
                itineraryDays,
                resources
            }
        });

        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/custom-tours/requests/${requestData.request_id}/quote`, {
                base_cost: totalCost,
                quoted_price: suggestedPrice,
                markup_percent: quoteData.markup,
                proposed_itinerary: designPayload,
                staff_note: quoteData.staffNote,
                approval_status: 'Pending_Approval'
            }, { headers: { Authorization: `Bearer ${token}` } });

            alert('🎉 Đã chốt bản thiết kế & Gửi Quản lý phê duyệt thành công!');
            onBack();
        } catch (error) {
            console.error("Lỗi API:", error);
            alert('Lỗi khi gửi phê duyệt!');
        }
    };

    const renderExtraCard = (item) => (
        <div key={item.id} draggable="true" onDragStart={(e) => handleDragStart(e, item, 'extra')} onDragEnd={handleDragEnd} style={{ padding: '10px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'copy', display: 'flex', flexDirection: 'column', marginBottom: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700' }}>{item.type}</span>
                {item.price > 0 && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold' }}>+{formatMoney(item.price)}đ</span>}
            </div>
            <strong style={{ fontSize: '13px', color: '#1e293b', marginTop: '4px' }}>{item.name}</strong>
        </div>
    );

    // HÀM RENDER THẺ CÓ GẮN SỰ KIỆN DROP (CHÌA KHÓA ĐỂ ĐỔI VỊ TRÍ TRONG CÙNG KHUNG)
    const renderServiceCard = (item, dayIndex, slotKey, removeHandler) => (
        <div
            key={item.id}
            draggable="true"
            onDragStart={(e) => handleDragStart(e, item, { dayIndex, slot: slotKey })}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnCard(e, item, dayIndex, slotKey)}
            style={{ padding: '8px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', marginBottom: '6px', cursor: 'grab', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
            <div style={{ flex: 1, marginRight: '10px', pointerEvents: 'none' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>{item.type}</span>
                <span style={{ fontWeight: '600' }}>{item.name}</span>
            </div>
            <span onClick={(e) => { e.stopPropagation(); removeHandler(item); }} style={{ color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', padding: '5px', fontSize: '16px' }}>×</span>
        </div>
    );

    if (!requestData) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc' }}>
            <div style={{ padding: '15px 25px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={onBack} style={{ padding: '8px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: '600' }}>⬅ Quay lại Inbox</button>
                    <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>Phòng Thiết Kế: {requestData.customer_name} - {requestData.destination}</h2>
                </div>
                <div style={{ fontSize: '15px', color: '#64748b' }}>
                    Ngày đi: <strong>{new Date(requestData.departure_date).toLocaleDateString('vi-VN')}</strong> | Ngân sách khách: <strong style={{ color: '#10b981' }}>{formatMoney(requestData.budget)} đ</strong>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* CỘT 1: KHO TÀI NGUYÊN */}
                <div onDragOver={handleDragOver} onDrop={handleDropBackToResources} style={{ width: '320px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', padding: '20px', overflowY: 'auto' }}>
                    {requestData?.preferences?.note && (
                        <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '4px', fontSize: '13px', color: '#92400e' }}>
                            <strong>📌 Khách ghi chú:</strong><br />
                            {requestData.preferences.note}
                        </div>
                    )}

                    <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#334155' }}>🎒 Lựa Chọn Của Khách</h3>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '15px' }}>Kéo các thẻ bên dưới thả vào lịch trình.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '25px' }}>
                        {resources.map(item => (
                            <div key={item.id} draggable="true" onDragStart={(e) => handleDragStart(e, item, 'resources')} onDragEnd={handleDragEnd} style={{ padding: '12px', background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: '8px', cursor: 'grab', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', color: '#0369a1', fontWeight: '700' }}>{item.type}</span>
                                    {item.price > 0 && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold' }}>+{formatMoney(item.price)}đ</span>}
                                </div>
                                <strong style={{ fontSize: '14px', color: '#0c4a6e', marginTop: '4px' }}>{item.name}</strong>
                            </div>
                        ))}
                        {resources.length === 0 && <p style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>Đã kéo hết vào lịch trình.</p>}
                    </div>

                    <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: '20px' }}>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#10b981' }}>🌍 Kho Tổng {requestData.destination}</h3>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '15px' }}>Các dịch vụ khác sẵn có tại đây.</p>

                        <strong style={{ fontSize: '13px', color: '#475569', display: 'block', marginBottom: '8px' }}>✈️ Di chuyển</strong>
                        {destinationExtra.transport.map(renderExtraCard)}

                        <strong style={{ fontSize: '13px', color: '#475569', display: 'block', margin: '15px 0 8px 0' }}>🏨 Lưu trú</strong>
                        {destinationExtra.accommodation.map(renderExtraCard)}

                        <strong style={{ fontSize: '13px', color: '#475569', display: 'block', margin: '15px 0 8px 0' }}>🎟️ Tham quan & Vui chơi</strong>
                        {destinationExtra.sightseeing.map(renderExtraCard)}
                    </div>
                </div>

                {/* CỘT 2: KHUNG LỊCH TRÌNH */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: '20px' }}>
                    <div style={{ width: '100%', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>✈️ Thông Tin Vận Hành Đầu - Cuối</h3>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                <strong style={{ color: '#0ea5e9', fontSize: '14px', display: 'block', marginBottom: '10px' }}>📍 Đón Khách (Ngày 1)</strong>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <input type="time" value={logistics.pickup.time} onChange={(e) => handleLogisticsChange('pickup', 'time', e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }} placeholder="Giờ đón" />
                                    <input type="text" value={logistics.pickup.location} onChange={(e) => handleLogisticsChange('pickup', 'location', e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }} placeholder="Địa điểm (VD: Sân bay TSN)" />
                                    <input type="text" value={logistics.pickup.flightInfo} onChange={(e) => handleLogisticsChange('pickup', 'flightInfo', e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }} placeholder="Ký hiệu chuyến bay" />
                                    <input type="text" value={logistics.pickup.note} onChange={(e) => handleLogisticsChange('pickup', 'note', e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }} placeholder="Ghi chú thêm" />
                                </div>
                            </div>
                            <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                <strong style={{ color: '#f59e0b', fontSize: '14px', display: 'block', marginBottom: '10px' }}>📍 Trả Khách (Ngày cuối)</strong>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <input type="time" value={logistics.dropoff.time} onChange={(e) => handleLogisticsChange('dropoff', 'time', e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }} placeholder="Giờ trả" />
                                    <input type="text" value={logistics.dropoff.location} onChange={(e) => handleLogisticsChange('dropoff', 'location', e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }} placeholder="Địa điểm trả" />
                                    <input type="text" value={logistics.dropoff.flightInfo} onChange={(e) => handleLogisticsChange('dropoff', 'flightInfo', e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }} placeholder="Ký hiệu chuyến bay" />
                                    <input type="text" value={logistics.dropoff.note} onChange={(e) => handleLogisticsChange('dropoff', 'note', e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }} placeholder="Ghi chú thêm" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ width: '100%', display: 'flex', gap: '20px' }}>
                        <div onDragOver={handleDragOver} onDrop={(e) => handleDropContainer(e, 'fixed', 'accommodation')} style={{ flex: 1, background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>🏨 Điểm Lưu Trú</h3>
                            <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '10px', minHeight: '60px' }}>
                                {fixedServices.accommodation.map(item => renderServiceCard(item, 'fixed', 'accommodation', (i) => handleRemoveFromFixed('accommodation', i)))}
                            </div>
                        </div>
                        <div onDragOver={handleDragOver} onDrop={(e) => handleDropContainer(e, 'fixed', 'transport')} style={{ flex: 1, background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>✈️ Dịch Vụ Di Chuyển</h3>
                            <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '10px', minHeight: '60px' }}>
                                {fixedServices.transport.map(item => renderServiceCard(item, 'fixed', 'transport', (i) => handleRemoveFromFixed('transport', i)))}
                            </div>
                        </div>
                    </div>

                    {itineraryDays.map((day) => (
                        <div key={day.dayIndex} style={{ width: '100%', maxWidth: '400px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{ background: '#3b82f6', color: '#fff', padding: '12px 15px', fontWeight: '700', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Ngày {day.dayIndex}</span><span style={{ fontSize: '13px', fontWeight: 'normal' }}>{day.dateString}</span>
                            </div>
                            <div style={{ padding: '10px' }}>
                                <div onDragOver={handleDragOver} onDrop={(e) => handleDropContainer(e, day.dayIndex, 'morning')} style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '10px', minHeight: '80px', marginBottom: '10px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>🌅 BUỔI SÁNG</div>
                                    {day.slots.morning.map(item => renderServiceCard(item, day.dayIndex, 'morning', (i) => handleRemoveFromSlot(day.dayIndex, 'morning', i)))}
                                </div>
                                <div onDragOver={handleDragOver} onDrop={(e) => handleDropContainer(e, day.dayIndex, 'noon')} style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '10px', minHeight: '80px', marginBottom: '10px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>☀️ BUỔI TRƯA</div>
                                    {day.slots.noon.map(item => renderServiceCard(item, day.dayIndex, 'noon', (i) => handleRemoveFromSlot(day.dayIndex, 'noon', i)))}
                                </div>
                                <div onDragOver={handleDragOver} onDrop={(e) => handleDropContainer(e, day.dayIndex, 'evening')} style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '8px', padding: '10px', minHeight: '80px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>🌙 CHIỀU / TỐI</div>
                                    {day.slots.evening.map(item => renderServiceCard(item, day.dayIndex, 'evening', (i) => handleRemoveFromSlot(day.dayIndex, 'evening', i)))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CỘT 3: CHỐT BÁO GIÁ */}
                <div style={{ width: '320px', background: '#fff', borderLeft: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#334155' }}>💰 Chốt Báo Giá</h3>

                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ color: '#64748b', fontSize: '13px' }}>Tổng Cost (đang dùng):</span>
                            <strong style={{ color: '#dc2626' }}>{formatMoney(totalCost)} đ</strong>
                        </div>
                        <div style={{ marginBottom: '10px' }}>
                            <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Markup Lợi nhuận (%)</label>
                            <input type="number" min="0" value={quoteData.markup} onChange={e => setQuoteData({ ...quoteData, markup: e.target.value })} style={{ width: '100%', padding: '8px', marginTop: '5px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                            <span style={{ color: '#334155', fontWeight: '600' }}>Giá Bán Cuối Cùng:</span>
                            <strong style={{ color: '#2563eb', fontSize: '18px' }}>{formatMoney(suggestedPrice)} đ</strong>
                        </div>
                    </div>

                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Ghi chú đính kèm (Gửi Quản lý)</label>
                        <textarea
                            rows="5"
                            value={quoteData.staffNote}
                            onChange={e => setQuoteData({ ...quoteData, staffNote: e.target.value })}
                            placeholder="VD: Lịch trình đã được tối ưu đường đi, khách đã đồng ý đổi sang khách sạn 5 sao..."
                            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'none', fontFamily: 'inherit', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                    </div>

                    {['Pending_Approval', 'Approved', 'Quote_Sent', 'Customer_Accepted'].includes(requestData?.approval_status) ? (
                        <div
                            style={{
                                marginTop: '20px',
                                padding: '15px',
                                borderRadius: '8px',
                                textAlign: 'center',
                                fontWeight: '600',
                                fontSize: '14px',
                                background:
                                    requestData.approval_status === 'Approved'
                                        ? '#f0fdf4'
                                        : '#eff6ff',
                                color:
                                    requestData.approval_status === 'Approved'
                                        ? '#15803d'
                                        : '#2563eb',
                                border:
                                    requestData.approval_status === 'Approved'
                                        ? '1px solid #bbf7d0'
                                        : '1px solid #bfdbfe'
                            }}
                        >
                            {requestData.approval_status === 'Pending_Approval' &&
                                '⏳ Bản thiết kế đang chờ Quản lý phê duyệt.'}

                            {requestData.approval_status === 'Approved' &&
                                '✅ Bản thiết kế đã được Quản lý phê duyệt.'}

                            {requestData.approval_status === 'Quote_Sent' &&
                                '📤 Báo giá đã được gửi cho khách hàng.'}

                            {requestData.approval_status === 'Customer_Accepted' &&
                                '🎉 Khách hàng đã xác nhận đặt tour.'}
                        </div>
                    ) : (
                        <button
                            onClick={handleSubmitToManager}
                            style={{
                                padding: '15px',
                                background: '#10b981',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '700',
                                fontSize: '16px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
                                marginTop: '20px'
                            }}
                        >
                            Gửi Phê Duyệt
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffTourDesigner;
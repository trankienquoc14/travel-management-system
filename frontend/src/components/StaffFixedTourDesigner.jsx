import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StaffFixedTourDesigner = () => {
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [destinations, setDestinations] = useState([]);

    // --- FORM DỮ LIỆU CƠ BẢN ---
    const [formData, setFormData] = useState({
        tour_id: null, tour_name: '', destination: 'Đà Lạt', duration_days: 3, description: '', image: null
    });

    // --- DRAG & DROP STATES ---
    const [itineraryDays, setItineraryDays] = useState([]);
    const [baseResources, setBaseResources] = useState([]); // Hoạt động chung
    const [destinationExtra, setDestinationExtra] = useState({ transport: [], accommodation: [], sightseeing: [] });
    const [draggedItem, setDraggedItem] = useState(null);
    const [fixedServices, setFixedServices] = useState({ accommodation: [], transport: [] });
    const [markupPercent, setMarkupPercent] = useState(20);

    // 1. Tải danh sách Tour
    useEffect(() => { fetchTours(); }, []);

    const fetchTours = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/tours', { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) setTours(res.data.data || []);
        } catch (error) { console.error(error); }
    };
    useEffect(() => {
        const fetchDestinations = async () => {
            const token = localStorage.getItem("token");

            const res = await axios.get(
                "http://localhost:5000/api/destinations",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (res.data.success) {
                setDestinations(res.data.data);
            }
        };

        fetchDestinations();
    }, []);

    // 2. Tải kho dịch vụ dựa trên Điểm đến
    useEffect(() => {
        if (!formData.destination) return;
        const fetchServices = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`http://localhost:5000/api/staff/destination-resources?destination=${encodeURIComponent(formData.destination)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data && res.data.success) {
                    setDestinationExtra({
                        transport: res.data.data.transport || [],
                        accommodation: res.data.data.accommodation || [],
                        sightseeing: res.data.data.sightseeing || []
                    });
                }
            } catch (error) { console.error("Lỗi khi tải kho tài nguyên:", error); }
        };
        fetchServices();

        // Tạo thẻ Hoạt động chung theo điểm đến
        const dest = formData.destination.toLowerCase();
        const isBeach = ['nha trang', 'phú quốc', 'vũng tàu', 'đà nẵng'].some(b => dest.includes(b));
        setBaseResources([
            { id: 'act_1', type: '🕒 Hoạt động', name: 'Đón khách & Khởi hành', price: 0 },
            { id: 'act_2', type: '🕒 Hoạt động', name: isBeach ? 'Tự do tắm biển / Nghỉ dưỡng' : 'Tự do dạo phố ngắm cảnh', price: 0 },
            { id: 'act_3', type: '🕒 Hoạt động', name: 'Mua sắm đặc sản & Trả khách', price: 0 }
        ]);
    }, [formData.destination]);

    // 3. Tự động sinh Khung ngày khi tạo Tour mới
    useEffect(() => {
        if (formData.tour_id || baseResources.length === 0) return;

        const daysArray = [];
        for (let i = 1; i <= Number(formData.duration_days); i++) {
            const daySlots = { morning: [], noon: [], evening: [] };
            if (i === 1) daySlots.morning.push({ ...baseResources[0], id: `ext_act_1_${Date.now()}`, original_id: 'act_1' });
            if (i === Number(formData.duration_days)) daySlots.evening.push({ ...baseResources[2], id: `ext_act_3_${Date.now()}`, original_id: 'act_3' });
            daySlots.noon.push({ ...baseResources[1], id: `ext_act_2_${i}_${Date.now()}`, original_id: 'act_2' });
            daysArray.push({ dayIndex: i, dateString: `Ngày ${i}`, slots: daySlots });
        }
        setItineraryDays(daysArray);
        setFixedServices({ accommodation: [], transport: [] });
    }, [formData.duration_days, formData.tour_id, baseResources]);

    const handleEditTour = async (tour) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // 🚀 SỬA ĐƯỜNG DẪN Ở ĐÂY: Dùng API của Staff để lấy được cả tour đang bị từ chối/chờ duyệt
            const res = await axios.get(`http://localhost:5000/api/staff/tours/${tour.tour_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                // 🚀 CHỐT CHẶN: Đề phòng backend trả về mảng (Array)
                let d = res.data.data;
                while (Array.isArray(d)) d = d[0];

                if (d) {
                    setFormData({
                        tour_id: d.tour_id, tour_name: d.tour_name, destination: d.destination,
                        duration_days: d.duration_days, description: d.description || '', image: null
                    });
                    setMarkupPercent(d.markup_percent || 20);

                    if (d.design_data) {
                        const savedState = typeof d.design_data === 'string' ? JSON.parse(d.design_data) : d.design_data;
                        setFixedServices(savedState.fixedServices || { accommodation: [], transport: [] });
                        setItineraryDays(savedState.itineraryDays || []);
                    } else {
                        // Reset sạch nếu chưa có dữ liệu kéo thả
                        setFixedServices({ accommodation: [], transport: [] });
                        setItineraryDays([]);
                    }

                    // 🚀 LỆNH NÀY SẼ LẬP TỨC BẬT GIAO DIỆN KÉO THẢ LÊN
                    setIsEditing(true);
                }
            }
        } catch (e) {
            console.error("Lỗi lấy chi tiết tour:", e);
            alert("Lỗi tải thông tin tour! Vui lòng ấn F12 xem chi tiết.");
        }
        finally { setLoading(false); }
    };

    // =========================================================================
    // HỆ THỐNG KÉO THẢ TỐI ƯU (TỰ ĐỘNG ẨN THẺ ĐÃ DÙNG)
    // =========================================================================
    // Lấy danh sách ID gốc của các thẻ đã được dùng trong lịch trình
    const getUsedIds = () => {
        const used = new Set();
        const addId = (item) => used.add(item.original_id || item.id);

        fixedServices.accommodation.forEach(addId);
        fixedServices.transport.forEach(addId);
        itineraryDays.forEach(d => {
            d.slots.morning.forEach(addId);
            d.slots.noon.forEach(addId);
            d.slots.evening.forEach(addId);
        });
        return used;
    };
    const usedIds = getUsedIds();

    const handleDragStart = (e, item, source) => { setDraggedItem({ item, source }); e.dataTransfer.effectAllowed = "copyMove"; e.target.style.opacity = '0.5'; };
    const handleDragEnd = (e) => { e.target.style.opacity = '1'; setDraggedItem(null); };
    const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };

    const executeDrop = (item, source, targetDayIndex, targetSlot, targetItemId = null) => {
        const isFromSidebar = source === 'extra' || source === 'baseResources';
        const itemToInsert = isFromSidebar ? { ...item, id: `ext_${item.id}_${Date.now()}`, original_id: item.id } : item;

        let nextFix = { accommodation: [...fixedServices.accommodation], transport: [...fixedServices.transport] };
        let nextDays = itineraryDays.map(day => ({ ...day, slots: { morning: [...day.slots.morning], noon: [...day.slots.noon], evening: [...day.slots.evening] } }));

        if (!isFromSidebar) {
            if (source.dayIndex === 'fixed') nextFix[source.slot] = nextFix[source.slot].filter(i => i.id !== item.id);
            else nextDays = nextDays.map(d => { if (d.dayIndex === source.dayIndex) d.slots[source.slot] = d.slots[source.slot].filter(i => i.id !== item.id); return d; });
        }

        const insertIntoList = (list) => {
            const clean = list.filter(i => i.id !== itemToInsert.id);
            if (!targetItemId) return [...clean, itemToInsert];
            const tIdx = clean.findIndex(i => i.id === targetItemId);
            if (tIdx === -1) return [...clean, itemToInsert];
            clean.splice(tIdx, 0, itemToInsert); return clean;
        };

        if (targetDayIndex === 'fixed') nextFix[targetSlot] = insertIntoList(nextFix[targetSlot]);
        else nextDays = nextDays.map(d => { if (d.dayIndex === targetDayIndex) d.slots[targetSlot] = insertIntoList(d.slots[targetSlot]); return d; });

        setFixedServices(nextFix); setItineraryDays(nextDays); setDraggedItem(null);
    };

    const handleDropContainer = (e, targetDayIndex, targetSlot) => {
        e.preventDefault(); e.stopPropagation();
        if (!draggedItem) return;
        if (draggedItem.source.dayIndex === targetDayIndex && draggedItem.source.slot === targetSlot) return;
        executeDrop(draggedItem.item, draggedItem.source, targetDayIndex, targetSlot, null);
    };

    const handleDropOnCard = (e, targetItem, targetDayIndex, targetSlot) => {
        e.preventDefault(); e.stopPropagation();
        if (!draggedItem || draggedItem.item.id === targetItem.id) return;
        executeDrop(draggedItem.item, draggedItem.source, targetDayIndex, targetSlot, targetItem.id);
    };

    const handleRemove = (sourceDay, slot, item) => {
        if (sourceDay === 'fixed') setFixedServices(p => ({ ...p, [slot]: p[slot].filter(i => i.id !== item.id) }));
        else setItineraryDays(p => p.map(d => d.dayIndex === sourceDay ? { ...d, slots: { ...d.slots, [slot]: d.slots[slot].filter(i => i.id !== item.id) } } : d));
    };

    // =========================================================================
    // TÍNH TOÁN VÀ GỬI LÊN SERVER
    // =========================================================================
    const totalCost =
        fixedServices.accommodation.reduce((s, i) => s + (Number(i.price) || 0), 0) +
        fixedServices.transport.reduce((s, i) => s + (Number(i.price) || 0), 0) +
        itineraryDays.reduce((s, day) => s + ['morning', 'noon', 'evening'].reduce((s2, slot) => s2 + day.slots[slot].reduce((s3, i) => s3 + (Number(i.price) || 0), 0), 0), 0);

    const suggestedPrice = Math.round(totalCost * (1 + Number(markupPercent) / 100));
    const formatMoney = val => Number(val || 0).toLocaleString('vi-VN');

    const handleSaveDesign = async () => {
        if (!formData.tour_name) return alert("Vui lòng điền Tên Tour!");
        setLoading(true);
        try {
            const submitData = new FormData();

            // Lặp qua form data
            Object.keys(formData).forEach(k => {
                if (formData[k] !== null) submitData.append(k, formData[k]);
            });

            submitData.append('base_cost', totalCost);
            submitData.append('markup_percent', markupPercent);
            submitData.append('base_price', suggestedPrice);
            submitData.append('status', 'Pending');

            // SỬA LỖI Ở ĐÂY: Xóa logistics và resources đi
            const designState = { fixedServices, itineraryDays };
            submitData.append('design_data', JSON.stringify(designState));

            // Chuyển đổi sang chuẩn CSDL SQL
            const formattedDays = itineraryDays.map(day => {
                const places = []; let order = 1;

                const getOriginalId = (item) => {
                    if (item.original_id && item.original_id.includes('place_')) {
                        return Number(item.original_id.split('_')[1]);
                    }
                    return null;
                };

                day.slots.morning.forEach(p => places.push({ place_id: getOriginalId(p), place_name: p.name, visit_order: order++, visit_time: '08:00' }));
                day.slots.noon.forEach(p => places.push({ place_id: getOriginalId(p), place_name: p.name, visit_order: order++, visit_time: '14:00' }));
                day.slots.evening.forEach(p => places.push({ place_id: getOriginalId(p), place_name: p.name, visit_order: order++, visit_time: '19:00' }));
                return { day_number: day.dayIndex, title: `Ngày ${day.dayIndex}: Khám phá ${formData.destination}`, places };
            });
            submitData.append('itineraryDays', JSON.stringify(formattedDays));
            submitData.append('departures', JSON.stringify([]));

            // URL trong sáng, rõ ràng: "Tôi là staff, tôi muốn lưu tour"
            await axios.post(`http://localhost:5000/api/staff/tours/save`, submitData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('🎉 Lưu thành công! Trạng thái: Chờ Quản lý duyệt.');
            fetchTours();
            setIsEditing(false);
        } catch (e) {
            console.error("Chi tiết lỗi:", e); // Lần sau có lỗi nhìn vào F12 sẽ biết ngay
            alert("Lỗi lưu thiết kế! Vui lòng bật F12 (Console) để xem.");
        } finally {
            setLoading(false);
        }
    };
    // =========================================================================
    // HÀM RENDER UI CỰC ĐẸP
    // =========================================================================
    const renderExtraCard = (item, source) => (
        <div key={item.id} draggable="true" onDragStart={e => handleDragStart(e, item, source)} onDragEnd={handleDragEnd}
            style={{ padding: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'grab', marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '700', padding: '2px 8px', background: '#eff6ff', borderRadius: '12px' }}>{item.type}</span>
                {item.price > 0 && <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 'bold' }}>+{formatMoney(item.price)}đ</span>}
            </div>
            <strong style={{ fontSize: '13px', color: '#1e293b', display: 'block', marginTop: '8px', lineHeight: '1.4' }}>{item.name}</strong>
        </div>
    );

    const renderCard = (item, dayIndex, slotKey) => (
        <div key={item.id} draggable="true" onDragStart={e => handleDragStart(e, item, { dayIndex, slot: slotKey })} onDragEnd={handleDragEnd} onDragOver={handleDragOver} onDrop={e => handleDropOnCard(e, item, dayIndex, slotKey)}
            style={{ padding: '10px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', marginBottom: '8px', cursor: 'grab', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ pointerEvents: 'none', flex: 1, paddingRight: '10px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '2px' }}>{item.type}</span>
                <span style={{ fontWeight: '600', color: '#0f172a' }}>{item.name}</span>
            </div>
            <button onClick={e => { e.stopPropagation(); handleRemove(dayIndex, slotKey, item); }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f1f5f9' }}>
            {!isEditing ? (
                <div style={{ padding: '25px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div>
                            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '22px' }}>🗺️ Thiết kế Tour Cố Định</h2>
                            <p style={{ color: '#64748b', fontSize: '14px', marginTop: '5px', marginBottom: 0 }}>Quản lý và thiết kế các sản phẩm tour trọn gói.</p>
                        </div>
                        <button onClick={() => { setFormData({ ...formData, tour_id: null, tour_name: '' }); setIsEditing(true); }} style={{ padding: '12px 24px', background: '#FF5E1F', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(255, 94, 31, 0.3)' }}>✨ Tạo Khung Tour Mới</button>
                    </div>
                    <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <table className="data-table">
                            <thead><tr><th>Tên Tour</th><th>Điểm Đến</th><th>Thời gian</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                            <tbody>
                                {tours.map(t => (
                                    <tr key={t.tour_id}>
                                        <td><strong style={{ color: '#1e293b' }}>{t.tour_name}</strong></td>
                                        <td><span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px', fontSize: '13px' }}>{t.destination}</span></td>
                                        <td>{t.duration_days} Ngày</td>
                                        <td><span className={`status-badge ${t.status?.toLowerCase()}`}>{t.status === 'Pending' ? '⏳ Chờ Duyệt' : t.status === 'Active' ? '✅ Mở Bán' : '❌ Từ Chối'}</span></td>
                                        <td><button onClick={() => handleEditTour(t)} style={{ background: '#3b82f6', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>✏️ Mở Thiết kế</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* KHUNG HEADER CỐ ĐỊNH */}
                    <div style={{ padding: '15px 30px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', zIndex: 10 }}>
                        <button onClick={() => setIsEditing(false)} style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: '600', color: '#475569' }}>⬅ Quay lại</button>
                        <input type="text" value={formData.tour_name} onChange={e => setFormData({ ...formData, tour_name: e.target.value })} placeholder="Nhập Tên Tour (VD: Nha Trang Vẫy Gọi)..." style={{ flex: 1, padding: '12px 15px', fontSize: '16px', fontWeight: 'bold', border: '2px solid #e2e8f0', borderRadius: '10px', color: '#0f172a', outline: 'none' }} />
                        <select
                            value={formData.destination}
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    destination: e.target.value
                                })
                            }
                        >
                            {destinations.map(dest => (
                                <option
                                    key={dest.destination_id}
                                    value={dest.destination_name}
                                >
                                    {dest.destination_name}
                                </option>
                            ))}
                        </select>
                        <input type="number" min="1" max="30" value={formData.duration_days} onChange={e => setFormData({ ...formData, duration_days: e.target.value })} style={{ width: '80px', padding: '12px', borderRadius: '10px', border: '2px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold', outline: 'none' }} title="Số ngày" />
                    </div>

                    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                        {/* CỘT 1: KHO TÀI NGUYÊN */}
                        <div style={{ width: '340px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', padding: '25px 20px', overflowY: 'auto' }}>
                            <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#0f172a', fontWeight: '800' }}>🌍 Kho Tài Nguyên {formData.destination}</h3>
                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '25px' }}>Kéo các thẻ bên dưới thả vào lịch trình.</p>

                            {/* Lọc: Chỉ hiển thị những thẻ KHÔNG có trong usedIds (Ngoại trừ thẻ Hoạt động chung) */}
                            <strong style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '10px' }}>🕒 Hoạt động chung</strong>
                            {baseResources.map(item => renderExtraCard(item, 'baseResources'))}

                            <strong style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', margin: '20px 0 10px 0' }}>✈️ Di chuyển</strong>
                            {destinationExtra.transport.filter(item => !usedIds.has(item.id)).map(item => renderExtraCard(item, 'extra'))}

                            <strong style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', margin: '20px 0 10px 0' }}>🏨 Lưu trú</strong>
                            {destinationExtra.accommodation.filter(item => !usedIds.has(item.id)).map(item => renderExtraCard(item, 'extra'))}

                            <strong style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', margin: '20px 0 10px 0' }}>🎟️ Tham quan & Vui chơi</strong>
                            {destinationExtra.sightseeing.filter(item => !usedIds.has(item.id)).map(item => renderExtraCard(item, 'extra'))}
                        </div>

                        {/* CỘT 2: KHUNG LỊCH TRÌNH */}
                        <div style={{ flex: 1, padding: '25px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', gap: '25px', background: '#f1f5f9' }}>
                            <div style={{ width: '100%', display: 'flex', gap: '25px' }}>
                                <div onDragOver={handleDragOver} onDrop={e => handleDropContainer(e, 'fixed', 'accommodation')} style={{ flex: 1, background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                    <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#1e293b' }}>🏨 Điểm lưu trú</h3>
                                    <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '12px', minHeight: '80px' }}>
                                        {fixedServices.accommodation.length === 0 && <span style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>Kéo thả khách sạn vào đây</span>}
                                        {fixedServices.accommodation.map(item => renderCard(item, 'fixed', 'accommodation'))}
                                    </div>
                                </div>
                                <div onDragOver={handleDragOver} onDrop={e => handleDropContainer(e, 'fixed', 'transport')} style={{ flex: 1, background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                    <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#1e293b' }}>✈️ Phương tiện di chuyển</h3>
                                    <div style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '12px', minHeight: '80px' }}>
                                        {fixedServices.transport.length === 0 && <span style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>Kéo thả xe/vé máy bay vào đây</span>}
                                        {fixedServices.transport.map(item => renderCard(item, 'fixed', 'transport'))}
                                    </div>
                                </div>
                            </div>

                            {itineraryDays.map(day => (
                                <div key={day.dayIndex} style={{ width: '100%', maxWidth: '380px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                    <div style={{ background: '#0f172a', color: '#fff', padding: '15px 20px', fontWeight: '700', fontSize: '15px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Ngày {day.dayIndex}</span> <span style={{ color: '#94a3b8', fontWeight: '500', fontSize: '13px' }}>Hành trình</span>
                                    </div>
                                    <div style={{ padding: '15px' }}>
                                        {['morning', 'noon', 'evening'].map(slot => (
                                            <div key={slot} onDragOver={handleDragOver} onDrop={e => handleDropContainer(e, day.dayIndex, slot)} style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '12px', minHeight: '80px', marginBottom: '12px' }}>
                                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', marginBottom: '10px', letterSpacing: '0.5px' }}>{slot === 'morning' ? '🌅 BUỔI SÁNG' : slot === 'noon' ? '☀️ BUỔI TRƯA' : '🌙 CHIỀU TỐI'}</div>
                                                {day.slots[slot].map(item => renderCard(item, day.dayIndex, slot))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CỘT 3: TÍNH GIÁ & MÔ TẢ (PHẢI) */}
                        {/* CỘT 3: TÍNH GIÁ & MÔ TẢ (PHẢI) */}
                        <div style={{ width: '340px', background: '#ffffff', borderLeft: '1px solid #e2e8f0', padding: '25px', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 15px rgba(0,0,0,0.02)', overflowY: 'auto' }}>
                            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a', fontWeight: '800' }}>💰 Cấu Hình Giá Bán</h3>

                            <div style={{ background: '#ecfdf5', padding: '20px', borderRadius: '16px', border: '2px solid #34d399', marginBottom: '25px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                                    <span style={{ color: '#047857', fontSize: '14px', fontWeight: '600' }}>Cost Dịch Vụ:</span>
                                    <strong style={{ color: '#ef4444', fontSize: '16px' }}>{formatMoney(totalCost)} đ</strong>
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ fontSize: '13px', color: '#047857', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                                        Markup Lợi nhuận (%)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={markupPercent}
                                        onChange={e => setMarkupPercent(e.target.value)}
                                        style={{ width: '100%', padding: '10px 15px', borderRadius: '10px', border: '2px solid #34d399', fontSize: '15px', fontWeight: 'bold', outline: 'none', color: '#065f46' }}
                                    />
                                </div>
                                <div style={{ borderTop: '2px dashed #10b981', paddingTop: '15px', textAlign: 'center' }}>
                                    <span style={{ color: '#065f46', fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '5px' }}>GIÁ CÔNG BỐ DỰ KIẾN</span>
                                    <strong style={{ color: '#ea580c', fontSize: '26px' }}>{formatMoney(suggestedPrice)} đ</strong>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '14px', color: '#1e293b', fontWeight: '700', marginBottom: '8px', display: 'block' }}>Bài Mô Tả Điểm Nhấn (PR)</label>
                                <textarea rows="8" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="VD: Khám phá thành phố ngàn hoa với các điểm đến cực hot..." style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #e2e8f0', resize: 'none', outline: 'none', fontSize: '14px', color: '#334155' }} />
                            </div>

                            <div style={{ marginTop: '20px' }}>
                                <label style={{ fontSize: '14px', color: '#1e293b', fontWeight: '700', marginBottom: '8px', display: 'block' }}>Ảnh Bìa Đại Diện</label>
                                <input type="file" onChange={e => setFormData({ ...formData, image: e.target.files[0] })} style={{ width: '100%', border: '2px dashed #cbd5e1', padding: '15px', borderRadius: '12px', background: '#f8fafc', color: '#64748b' }} />
                            </div>

                            {/* NÚT LƯU ĐƯỢC CHUYỂN XUỐNG ĐÂY */}
                            <div style={{ marginTop: 'auto', paddingTop: '30px' }}>
                                <button
                                    onClick={handleSaveDesign}
                                    disabled={loading}
                                    style={{ width: '100%', padding: '16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(16,185,129,0.3)', fontSize: '16px' }}
                                >
                                    {loading ? '⏳ Đang xử lý...' : '💾 Gửi Phê Duyệt'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffFixedTourDesigner;
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StaffFixedTourDesigner = () => {
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [destinations, setDestinations] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [expandedDest, setExpandedDest] = useState({});

    // --- FORM DỮ LIỆU CƠ BẢN ---
    const [formData, setFormData] = useState({
        tour_id: null, tour_name: '', destination: 'Đà Lạt', duration_days: 3, description: '', image: null
    });

    // --- DRAG & DROP STATES ---
    const [itineraryDays, setItineraryDays] = useState([]);
    const [baseResources, setBaseResources] = useState([]); 
    const [destinationExtra, setDestinationExtra] = useState({ transport: [], accommodation: [], sightseeing: [] });
    const [draggedItem, setDraggedItem] = useState(null);
    const [fixedServices, setFixedServices] = useState({ accommodation: [], transport: [] });
    const [markupPercent, setMarkupPercent] = useState(20);

    // 1. Tải danh sách Tour
    useEffect(() => { fetchTours(); }, []);

    const fetchTours = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/tours/staff/tours', { headers: { Authorization: `Bearer ${token}` } });
            if (res.data.success) setTours(res.data.data || []);
        } catch (error) { console.error(error); }
    };
    
    useEffect(() => {
        const fetchDestinations = async () => {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/destinations", { headers: { Authorization: `Bearer ${token}` } });
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
                const res = await axios.get(`http://localhost:5000/api/tours/staff/destination-resources?destination=${encodeURIComponent(formData.destination)}`, {
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

        const dest = formData.destination.toLowerCase();
        const isBeach = ['nha trang', 'phú quốc', 'vũng tàu', 'đà nẵng'].some(b => dest.includes(b));
        setBaseResources([
            { id: 'act_1', type: '🕒 Hoạt động', name: 'Đón khách & Khởi hành', price: 0 },
            { id: 'act_2', type: '🕒 Hoạt động', name: isBeach ? 'Tự do tắm biển / Nghỉ dưỡng' : 'Tự do dạo phố ngắm cảnh', price: 0 },
            { id: 'act_3', type: '🕒 Hoạt động', name: 'Mua sắm đặc sản & Trả khách', price: 0 }
        ]);
    }, [formData.destination]);

    // 3. Tự động sinh Khung ngày
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
            const res = await axios.get(`http://localhost:5000/api/tours/staff/tours/${tour.tour_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                const tourData = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data;
                
                if (!tourData) {
                    alert("Không tìm thấy dữ liệu chi tiết của tour!");
                    setLoading(false);
                    return;
                }

                setFormData({
                    tour_id: tourData.tour_id,
                    tour_name: tourData.tour_name || '',
                    destination: tourData.destination || 'Đà Lạt',
                    duration_days: tourData.duration_days || 3,
                    description: tourData.description || '',
                    image: tourData.image_url || null
                });

                if (tourData.itinerary && Array.isArray(tourData.itinerary)) {
                    const mappedDays = tourData.itinerary.map(day => ({
                        dayIndex: day.day_number,
                        dateString: `Ngày ${day.day_number}`,
                        slots: {
                            morning: Array.isArray(day.morning) ? day.morning.map(item => ({...item, id: `ext_${Date.now()}_${Math.random()}`})) : [],
                            noon: Array.isArray(day.noon) ? day.noon.map(item => ({...item, id: `ext_${Date.now()}_${Math.random()}`})) : [],
                            evening: Array.isArray(day.evening) ? day.evening.map(item => ({...item, id: `ext_${Date.now()}_${Math.random()}`})) : []
                        }
                    }));
                    setItineraryDays(mappedDays);
                } else {
                    setItineraryDays([]);
                }

                if (tourData.fixed_services) {
                    setFixedServices({
                        accommodation: Array.isArray(tourData.fixed_services.accommodation) ? tourData.fixed_services.accommodation.map(item => ({...item, id: `ext_${Date.now()}_${Math.random()}`})) : [],
                        transport: Array.isArray(tourData.fixed_services.transport) ? tourData.fixed_services.transport.map(item => ({...item, id: `ext_${Date.now()}_${Math.random()}`})) : []
                    });
                } else {
                    setFixedServices({ accommodation: [], transport: [] });
                }

                setIsEditing(true);
            } else {
                alert("Lỗi khi tải chi tiết tour: " + (res.data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error("Lỗi khi tải chi tiết tour:", error);
            if (error.response && error.response.status === 404) {
                alert("Tour này không còn tồn tại trên hệ thống (404).");
            } else {
                alert("Không thể tải chi tiết tour. Hãy thử lại!");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDesign = async () => {
        if (!formData.tour_name || !formData.destination) {
            alert('Vui lòng nhập đầy đủ Tên Tour và Điểm đến!');
            return;
        }

        if (formData.duration_days > 1 && (fixedServices.accommodation.length === 0 || fixedServices.transport.length === 0)) {
            const confirmSave = window.confirm("Tour dài ngày nhưng bạn chưa xếp đủ dịch vụ Lưu trú/Di chuyển. Bạn có chắc muốn lưu?");
            if (!confirmSave) return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            
            data.append('is_custom', 0);
            data.append('tour_name', formData.tour_name);
            data.append('destination', formData.destination);
            data.append('duration_days', formData.duration_days);
            data.append('description', formData.description);
            data.append('total_cost', totalCost);
            data.append('markup_percent', markupPercent);
            data.append('suggested_price', suggestedPrice);

            data.append('fixed_services', JSON.stringify(fixedServices));
            data.append('itinerary', JSON.stringify(itineraryDays));

            if (formData.image instanceof File) {
                data.append('image', formData.image);
            } else if (formData.image) {
                data.append('image_url', formData.image);
            }

            const url = formData.tour_id 
                ? `http://localhost:5000/api/tours/staff/tours/${formData.tour_id}`
                : 'http://localhost:5000/api/tours/staff/tours';
            const method = formData.tour_id ? 'put' : 'post';

            const res = await axios[method](url, data, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.success) {
                alert(formData.tour_id ? 'Cập nhật thành công!' : 'Tạo Tour thành công! Chờ Admin duyệt.');
                setIsEditing(false);
                fetchTours();
            } else {
                alert(res.data.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error("Lỗi khi lưu Tour:", error);
            alert('Lỗi kết nối máy chủ!');
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (e, item, sourceDay = null, sourceSlot = null) => {
        const itemCopy = { 
            original_id: item.id || item.original_id, 
            type: item.type, 
            name: item.name, 
            price: item.price,
            time: item.time || '',
            sourceDay,
            sourceSlot,
            currentId: item.id
        };
        e.dataTransfer.setData("application/json", JSON.stringify(itemCopy));
        setDraggedItem(itemCopy);
    };

    const handleDragOver = (e) => e.preventDefault();

    const handleDropContainer = (e, targetDayOrFixed, targetSlot) => {
        e.preventDefault();
        try {
            const itemDataStr = e.dataTransfer.getData("application/json");
            if (!itemDataStr) return;
            const parsedItem = JSON.parse(itemDataStr);
            const newItem = { ...parsedItem, id: `ext_${Date.now()}_${Math.random()}` };

            // Check if moving from another slot
            if (parsedItem.sourceDay !== undefined && parsedItem.sourceDay !== null && parsedItem.sourceSlot !== undefined && parsedItem.sourceSlot !== null && parsedItem.currentId) {
                // If dropping into the exact same slot, do nothing
                if (parsedItem.sourceDay === targetDayOrFixed && parsedItem.sourceSlot === targetSlot) {
                    return;
                }
                // Remove from original location
                handleRemove(parsedItem.sourceDay, parsedItem.sourceSlot, { id: parsedItem.currentId });
            }

            if (targetDayOrFixed === 'fixed') {
                if (targetSlot === 'accommodation' && newItem.type.includes('Lưu trú')) {
                    setFixedServices(prev => ({ ...prev, accommodation: [...prev.accommodation, newItem] }));
                } else if (targetSlot === 'transport' && newItem.type.includes('Di chuyển')) {
                    setFixedServices(prev => ({ ...prev, transport: [...prev.transport, newItem] }));
                } else {
                    alert(`Không thể thả ${newItem.type} vào ô này!`);
                }
            } else {
                setItineraryDays(prev => prev.map(day => {
                    if (day.dayIndex === targetDayOrFixed) {
                        return {
                            ...day,
                            slots: {
                                ...day.slots,
                                [targetSlot]: [...day.slots[targetSlot], newItem]
                            }
                        };
                    }
                    return day;
                }));
            }
            setDraggedItem(null);
        } catch (err) {
            console.error("Drop error", err);
        }
    };

    const handleRemove = (dayIndexOrFixed, slot, itemToRemove) => {
        if (dayIndexOrFixed === 'fixed') {
            setFixedServices(prev => ({
                ...prev,
                [slot]: prev[slot].filter(item => item.id !== itemToRemove.id)
            }));
        } else {
            setItineraryDays(prev => prev.map(day => {
                if (day.dayIndex === dayIndexOrFixed) {
                    return {
                        ...day,
                        slots: {
                            ...day.slots,
                            [slot]: day.slots[slot].filter(item => item.id !== itemToRemove.id)
                        }
                    };
                }
                return day;
            }));
        }
    };

    const formatMoney = (amount) => {
        if (isNaN(amount) || amount === null || amount === undefined) return '0';
        return Number(amount).toLocaleString('vi-VN');
    };

    const calculateCost = () => {
        let total = 0;
        fixedServices.accommodation.forEach(item => total += (Number(item.price) || 0));
        fixedServices.transport.forEach(item => total += (Number(item.price) || 0));
        
        itineraryDays.forEach(day => {
            ['morning', 'noon', 'evening'].forEach(slot => {
                day.slots[slot].forEach(item => total += (Number(item.price) || 0));
            });
        });
        return total;
    };

    const totalCost = calculateCost();
    const suggestedPrice = totalCost + (totalCost * (markupPercent / 100));

    const usedIds = new Set();
    fixedServices.accommodation.forEach(i => usedIds.add(i.original_id));
    fixedServices.transport.forEach(i => usedIds.add(i.original_id));
    itineraryDays.forEach(day => {
        ['morning', 'noon', 'evening'].forEach(slot => {
            day.slots[slot].forEach(i => usedIds.add(i.original_id));
        });
    });

    const renderCard = (item, dayIndex, slotKey) => (
        <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item, dayIndex, slotKey)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px 15px', borderRadius: '10px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: '4px solid #3b82f6', cursor: 'grab' }}>
            <div>
                <strong style={{ display: 'block', color: '#1e293b', fontSize: '13px' }}>{item.name}</strong>
                <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '12px' }}>{formatMoney(item.price)} đ</span>
            </div>
            <button onClick={e => { e.stopPropagation(); handleRemove(dayIndex, slotKey, item); }} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
        </div>
    );

    const renderExtraCard = (item, type) => (
        <div key={item.id} draggable onDragStart={(e) => handleDragStart(e, item)} style={{ background: '#fff', padding: '12px 15px', borderRadius: '10px', marginBottom: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', cursor: 'grab', border: '1px solid #e2e8f0' }}>
            <strong style={{ display: 'block', color: '#1e293b', fontSize: '13px', marginBottom: '4px' }}>{item.name}</strong>
            <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '12px' }}>+ {formatMoney(item.price)} đ</span>
        </div>
    );

    // Filter Logic for List View
    const filteredTours = tours.filter(tour => {
        const matchStatus = statusFilter === 'All' || tour.status === statusFilter;
        const term = searchTerm.toLowerCase();
        const matchSearch = tour.tour_name?.toLowerCase().includes(term) || 
                            tour.destination?.toLowerCase().includes(term);
        return matchStatus && matchSearch;
    });

    const groupedTours = React.useMemo(() => {
        const groups = {};
        filteredTours.forEach(tour => {
            const dest = tour.destination || 'Chưa xác định';
            if (!groups[dest]) groups[dest] = [];
            groups[dest].push(tour);
        });
        return groups;
    }, [filteredTours]);

    const toggleDestination = (dest) => {
        setExpandedDest(prev => ({ ...prev, [dest]: !prev[dest] }));
    };

    const getImageUrl = (url) => {
        if (!url) return 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
        if (url.startsWith('http')) return url;
        return `http://localhost:5000${url}`;
    };

    const getStatusStyle = (status) => {
        switch(status) {
            case 'Active': return { bg: '#ecfdf5', text: '#059669', label: 'Đang mở bán' };
            case 'Approved': return { bg: '#eff6ff', text: '#2563eb', label: 'Đã duyệt' };
            case 'Pending': return { bg: '#fffbeb', text: '#d97706', label: 'Chờ duyệt' };
            case 'Rejected': return { bg: '#fef2f2', text: '#dc2626', label: 'Từ chối' };
            default: return { bg: '#f3f4f6', text: '#4b5563', label: status };
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: !isEditing ? '#f5f7fa' : '#f1f5f9', fontFamily: !isEditing ? '"Outfit", "Inter", sans-serif' : 'inherit' }}>
            {!isEditing ? (
                <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
                        <div>
                            <h2 style={{ fontSize: '32px', color: '#111827', fontWeight: '800', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>🗺️ Thiết kế Tour Cố Định</h2>
                            <p style={{ color: '#4b5563', fontSize: '15px', margin: 0, fontWeight: '500' }}>Quản lý và thiết kế các sản phẩm tour trọn gói.</p>
                        </div>
                        <button onClick={() => { setFormData({ ...formData, tour_id: null, tour_name: '' }); setIsEditing(true); }} style={{ padding: '12px 24px', background: '#FF5E1F', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(255, 94, 31, 0.3)' }}>✨ Tạo Khung Tour Mới</button>
                    </div>

                    {/* Filter and Search Bar */}
                    <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '16px', border: '1px solid #e5e7eb', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input 
                                type="text" 
                                placeholder="Tìm kiếm theo Tên Tour, Điểm đến..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '12px 14px 12px 42px', border: '1px solid #d1d5db', borderRadius: '12px', fontSize: '15px', outline: 'none', fontFamily: 'inherit', color: '#111827', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '8px', background: '#f3f4f6', padding: '6px', borderRadius: '12px' }}>
                            {['All', 'Active', 'Approved', 'Pending', 'Rejected'].map(status => {
                                const label = status === 'All' ? 'Tất cả' : getStatusStyle(status).label;
                                const isActive = statusFilter === status;
                                return (
                                    <button 
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        style={{ 
                                            padding: '8px 16px', background: isActive ? '#fff' : 'transparent', color: isActive ? '#111827' : '#6b7280', 
                                            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', 
                                            transition: 'all 0.2s', boxShadow: isActive ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                                        }}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Accordion Grouped List View */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>Đang tải dữ liệu tour...</div>
                    ) : filteredTours.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '24px', border: '1px dashed #d1d5db' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🔍</div>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#374151' }}>Không tìm thấy Tour nào</h4>
                            <p style={{ color: '#6b7280', fontSize: '15px' }}>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {Object.entries(groupedTours).map(([dest, destTours]) => {
                                const isExpanded = expandedDest[dest] === true; // Mặc định đóng
                                return (
                                    <div key={dest} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                        <div 
                                            onClick={() => toggleDestination(dest)}
                                            style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: isExpanded ? '#f8fafc' : '#fff', borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none', transition: 'background 0.2s' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ background: '#e0f2fe', color: '#0284c7', padding: '10px', borderRadius: '12px' }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                                </div>
                                                <div>
                                                    <h3 style={{ margin: 0, fontSize: '18px', color: '#111827', fontWeight: '800' }}>{dest}</h3>
                                                    <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', marginTop: '4px' }}>{destTours.length} Tour du lịch</div>
                                                </div>
                                            </div>
                                            <div style={{ color: '#9ca3af', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px', background: '#f9fafb' }}>
                                                {destTours.map(tour => {
                                                    const statusStyle = getStatusStyle(tour.status);
                                                    return (
                                                        <div key={tour.tour_id} style={{ display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.02)'; }}>
                                                            <div style={{ width: '100%', height: '180px', overflow: 'hidden', position: 'relative' }}>
                                                                <img src={getImageUrl(tour.image_url)} alt="tour" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.9)', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', color: '#111827', backdropFilter: 'blur(4px)' }}>
                                                                    #{tour.tour_id}
                                                                </div>
                                                                <div style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', background: statusStyle.bg, color: statusStyle.text, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                    {statusStyle.label}
                                                                </div>
                                                            </div>
                                                            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                                <h4 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#111827', fontWeight: '800', lineHeight: '1.4' }}>{tour.tour_name}</h4>
                                                                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                                        {tour.duration_days} Ngày
                                                                    </div>
                                                                </div>
                                                                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <button onClick={() => handleEditTour(tour)} style={{ padding: '10px 20px', background: '#e0f2fe', color: '#0284c7', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s', width: '100%' }} onMouseEnter={e => e.currentTarget.style.background = '#bae6fd'} onMouseLeave={e => e.currentTarget.style.background = '#e0f2fe'}>
                                                                        ✏️ Thiết Kế Lại
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* KHUNG HEADER CỐ ĐỊNH */}
                    <div style={{ padding: '15px 30px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', zIndex: 10 }}>
                        <button onClick={() => setIsEditing(false)} style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: '700', color: '#475569', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>⬅ Quay lại</button>
                        <input type="text" value={formData.tour_name} onChange={e => setFormData({ ...formData, tour_name: e.target.value })} placeholder="Nhập Tên Tour (VD: Nha Trang Vẫy Gọi)..." style={{ flex: 1, padding: '12px 20px', fontSize: '16px', fontWeight: 'bold', border: '2px solid #e2e8f0', borderRadius: '12px', color: '#0f172a', outline: 'none', background: '#f8fafc' }} />
                        <select
                            value={formData.destination}
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    destination: e.target.value
                                })
                            }
                            style={{ padding: '12px 20px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '15px', fontWeight: 'bold', outline: 'none', color: '#0f172a', background: '#f8fafc', cursor: 'pointer', appearance: 'none', minWidth: '180px' }}
                        >
                            {destinations.map(dest => (
                                <option
                                    key={dest.destination_id}
                                    value={dest.destination_name}
                                >
                                    📍 {dest.destination_name}
                                </option>
                            ))}
                        </select>
                        <input type="number" min="1" max="30" value={formData.duration_days} onChange={e => setFormData({ ...formData, duration_days: e.target.value })} style={{ width: '90px', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', textAlign: 'center', fontWeight: 'bold', outline: 'none', fontSize: '15px', background: '#f8fafc' }} title="Số ngày" />
                    </div>

                    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                        {/* CỘT 1: KHO TÀI NGUYÊN */}
                        <div style={{ width: '340px', minWidth: '340px', flexShrink: 0, background: '#f8fafc', borderRight: '1px solid #e2e8f0', padding: '25px 20px', overflowY: 'auto' }}>
                            <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '24px' }}>📦</span> Kho Tài Nguyên
                                </h3>

                                <div style={{ marginBottom: '25px' }}>
                                    <h4 style={{ color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>Lưu trú</h4>
                                    {destinationExtra.accommodation.filter(i => !usedIds.has(i.original_id)).map(item => renderExtraCard(item, 'accommodation'))}
                                </div>

                                <div style={{ marginBottom: '25px' }}>
                                    <h4 style={{ color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>Phương tiện</h4>
                                    {destinationExtra.transport.filter(i => !usedIds.has(i.original_id)).map(item => renderExtraCard(item, 'transport'))}
                                </div>

                                <div style={{ marginBottom: '25px' }}>
                                    <h4 style={{ color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>Hoạt động chung</h4>
                                    {baseResources.map(item => renderExtraCard(item, 'activity'))}
                                </div>

                                <div>
                                    <h4 style={{ color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>Tham quan ({formData.destination})</h4>
                                    {destinationExtra.sightseeing.filter(i => !usedIds.has(i.original_id)).map(item => renderExtraCard(item, 'sightseeing'))}
                                </div>
                            </div>
                        </div>

                        {/* CỘT 2: KHUNG THIẾT KẾ (Lịch trình + Dịch vụ cố định) */}
                        <div style={{ flex: 1, padding: '30px', overflowY: 'auto', background: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Thông tin mô tả và hình ảnh */}
                            <div style={{ background: '#fff', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#0f172a', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>📝 Thông tin Mô tả & Hình ảnh</h3>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontSize: '14px', fontWeight: '600' }}>Mô tả Tour</label>
                                        <textarea 
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Nhập mô tả hấp dẫn cho tour du lịch này..."
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0', minHeight: '120px', resize: 'vertical', fontSize: '14px', outline: 'none', color: '#0f172a', background: '#f8fafc', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div style={{ width: '300px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontSize: '14px', fontWeight: '600' }}>Hình ảnh Đại diện</label>
                                        <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '15px', textAlign: 'center', background: '#f8fafc', height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', boxSizing: 'border-box' }}>
                                            {formData.image ? (
                                                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                    <img src={formData.image instanceof File ? URL.createObjectURL(formData.image) : getImageUrl(formData.image)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                                    <button onClick={() => setFormData({ ...formData, image: null })} style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span style={{ fontSize: '24px', marginBottom: '8px' }}>📸</span>
                                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Nhấn để chọn ảnh</span>
                                                    <input type="file" accept="image/*" onChange={e => { if(e.target.files[0]) setFormData({ ...formData, image: e.target.files[0] }) }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dịch vụ cố định (ĐƯA LÊN ĐẦU) */}
                            <div style={{ background: '#fff', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#0f172a', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px' }}>🏨 Dịch vụ Cố định Toàn Tour</h3>
                                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                    {['accommodation', 'transport'].map(slotKey => {
                                        const title = slotKey === 'accommodation' ? 'Khách sạn / Lưu trú' : 'Phương tiện di chuyển';
                                        return (
                                            <div key={slotKey}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDropContainer(e, 'fixed', slotKey)}
                                                style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '12px', minHeight: '120px', border: '2px dashed #cbd5e1' }}
                                            >
                                                <strong style={{ display: 'block', marginBottom: '12px', color: '#475569', fontSize: '14px' }}>{title}</strong>
                                                {fixedServices[slotKey].map(item => renderCard(item, 'fixed', slotKey))}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                <h3 style={{ margin: 0, fontSize: '22px', color: '#0f172a', fontWeight: '800' }}>🗓️ Lịch Trình Chi Tiết</h3>
                            </div>
                            
                            {/* Danh sách các ngày */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {itineraryDays.map((day) => (
                                    <div key={day.dayIndex} style={{ background: '#fff', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                                        <h4 style={{ margin: '0 0 20px 0', color: '#2563eb', fontSize: '18px', borderBottom: '2px solid #eff6ff', paddingBottom: '10px' }}>{day.dateString}</h4>
                                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                            {['morning', 'noon', 'evening'].map(slotKey => {
                                                const title = slotKey === 'morning' ? 'Sáng' : slotKey === 'noon' ? 'Trưa/Chiều' : 'Tối';
                                                return (
                                                    <div key={slotKey} 
                                                        onDragOver={handleDragOver} 
                                                        onDrop={(e) => handleDropContainer(e, day.dayIndex, slotKey)}
                                                        style={{ flex: '1 1 300px', minWidth: '300px', background: '#f8fafc', padding: '15px', borderRadius: '12px', minHeight: '120px', border: '2px dashed #cbd5e1', transition: 'all 0.2s' }}
                                                    >
                                                        <strong style={{ display: 'block', marginBottom: '12px', color: '#475569', fontSize: '14px' }}>{title}</strong>
                                                        {day.slots[slotKey].map(item => renderCard(item, day.dayIndex, slotKey))}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* FIXED FOOTER CỐ ĐỊNH DƯỚI CÙNG */}
                    <div style={{ padding: '20px 30px', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 -4px 10px rgba(0,0,0,0.03)', flexShrink: 0, zIndex: 10 }}>
                        <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tổng Giá Gốc</span>
                                <strong style={{ fontSize: '24px', color: '#0f172a', fontWeight: '800' }}>{formatMoney(totalCost)} đ</strong>
                            </div>
                            <div style={{ height: '40px', width: '2px', background: '#e2e8f0' }}></div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phí Dịch Vụ (%)</span>
                                <input type="number" min="0" value={markupPercent} onChange={e => setMarkupPercent(Number(e.target.value))} style={{ width: '70px', padding: '4px 8px', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '18px', fontWeight: 'bold', outline: 'none' }} />
                            </div>
                            <div style={{ height: '40px', width: '2px', background: '#e2e8f0' }}></div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ color: '#059669', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Giá Đề Xuất Bán</span>
                                <strong style={{ fontSize: '28px', color: '#10b981', fontWeight: '900' }}>{formatMoney(suggestedPrice)} đ</strong>
                            </div>
                        </div>
                        <button
                            onClick={handleSaveDesign}
                            disabled={loading}
                            style={{ marginLeft: 'auto', padding: '14px 35px', background: '#FF5E1F', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255, 94, 31, 0.25)', fontSize: '16px', letterSpacing: '0.5px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                        >
                            {loading ? '⏳ Đang xử lý...' : '💾 Gửi Phê Duyệt'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffFixedTourDesigner;
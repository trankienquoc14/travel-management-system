import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const ServiceRequestCreate = ({ setActiveTab }) => {
    const [departures, setDepartures] = useState([]);
    const [serviceGroups, setServiceGroups] = useState([]);
    const [filterRequestStatus, setFilterRequestStatus] = useState('CHUA_TAO');
    const [partners, setPartners] = useState([]);
    const [destinations, setDestinations] = useState([]);
    const [allServices, setAllServices] = useState([]);
    
    // Selection state
    const [selectedDepId, setSelectedDepId] = useState('');
    const [itineraryRows, setItineraryRows] = useState([]);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMonth, setFilterMonth] = useState('UPCOMING');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    // Services state
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            try {
                const depRes = await axios.get('http://localhost:5000/api/tours/operations/departures', { headers });
                if (depRes.data.success) setDepartures(depRes.data.data);
                
                const partRes = await axios.get('http://localhost:5000/api/partners', { headers });
                const groupRes = await axios.get('http://localhost:5000/api/service-requests/groups', { headers }).catch(e => ({ data: { success: true, data: [] } }));
                if (groupRes?.data?.success) setServiceGroups(groupRes.data.data);
                if (partRes.data.success) setPartners(partRes.data.data);

                const destRes = await axios.get('http://localhost:5000/api/destinations', { headers });
                if (destRes.data.success) setDestinations(destRes.data.data);

                const srvRes = await axios.get('http://localhost:5000/api/services', { headers });
                if (srvRes.data.success) setAllServices(srvRes.data.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    // Filter logic
    const filteredDepartures = useMemo(() => {
        let result = departures;
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(d => 
                (d.tour_name && d.tour_name.toLowerCase().includes(lowerSearch)) ||
                (d.tour_id && d.tour_id.toString().toLowerCase().includes(lowerSearch)) ||
                (d.departure_date && d.departure_date.includes(lowerSearch))
            );
        }
        
        if (filterMonth === 'UPCOMING') {
            const today = new Date();
            today.setHours(0,0,0,0);
            const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            result = result.filter(d => new Date(d.departure_date) >= currentMonthStart);
        } else if (filterMonth !== 'ALL') {
            result = result.filter(d => {
                const m = new Date(d.departure_date).getMonth() + 1;
                return m.toString() === filterMonth;
            });
        }
        
        if (filterStatus !== 'ALL') {
            result = result.filter(d => d.status === filterStatus);
        }
        
        // Lọc theo Trạng thái Yêu cầu
        if (filterRequestStatus !== 'ALL') {
            result = result.filter(d => {
                const hasInitial = serviceGroups.some(g => g.departure_id === d.departure_id && g.request_type === 'INITIAL');
                if (filterRequestStatus === 'CHUA_TAO') return !hasInitial;
                if (filterRequestStatus === 'DA_TAO') return hasInitial;
                return true;
            });
        }

        result.sort((a, b) => new Date(a.departure_date) - new Date(b.departure_date));
        return result;
    }, [departures, searchTerm, filterMonth, filterStatus, filterRequestStatus, serviceGroups]);

    const totalPages = Math.ceil(filteredDepartures.length / ITEMS_PER_PAGE);
    const currentDepartures = filteredDepartures.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleSelectDeparture = (depId) => {
        setSelectedDepId(depId);
        setIsModalOpen(false);
    };

    const selectedDep = useMemo(() => {
        return departures.find(d => d.departure_id === selectedDepId) || departures.find(d => d.departure_id === parseInt(selectedDepId));
    }, [departures, selectedDepId]);

    // Parse Itinerary when departure changes
    useEffect(() => {
        if (!selectedDep) {
            setItineraryRows([]);
            setServices([]);
            return;
        }
        
        let parsed = {};
        try {
            parsed = typeof selectedDep.design_data === 'string' ? JSON.parse(selectedDep.design_data) : (selectedDep.design_data || {});
        } catch(e) {}
        
        const days = parsed.days || parsed.itinerary || [];
        const pax = selectedDep.current_pax || 0;
        const rooms = parseInt(selectedDep.total_required_rooms) || Math.ceil(pax / 2) || 0;
        
        if (days.length === 0) {
            setItineraryRows([]);
            setServices([]);
            return;
        }

        const rows = [];
        const hotelsMap = [];
        const restaurants = [];
        const tourDestIds = new Set();
        days.forEach(day => {
            if (day.destination_id) tourDestIds.add(parseInt(day.destination_id));
            if (day.end_destination_id) tourDestIds.add(parseInt(day.end_destination_id));
        });

        days.forEach((day, index) => {
            const dDate = new Date(selectedDep.departure_date);
            dDate.setDate(dDate.getDate() + (day.dayIndex ? day.dayIndex - 1 : index));
            const dateStr = dDate.toISOString().split('T')[0];
            const displayDate = dDate.toLocaleDateString('vi-VN');

            // Hotel
            let hotelName = '';
            let hotelServiceId = null;
            if (day.accommodation && day.accommodation.name) {
                hotelName = day.accommodation.name;
                hotelServiceId = day.accommodation.service_id;
            } else if (day.hotel_name || day.hotel) {
                hotelName = day.hotel_name || day.hotel;
            }

            if (hotelName) {
                const lastHotel = hotelsMap[hotelsMap.length - 1];
                if (lastHotel && lastHotel.name === hotelName) {
                    const coDate = new Date(dDate.getTime() + 86400000);
                    lastHotel.checkOut = coDate.toISOString().split('T')[0];
                    lastHotel.nights += 1;
                } else {
                    const coDate = new Date(dDate.getTime() + 86400000);
                    hotelsMap.push({
                        name: hotelName,
                        checkIn: dateStr,
                        checkOut: coDate.toISOString().split('T')[0],
                        nights: 1,
                        rooms: rooms,
                        service_id: hotelServiceId,
                        destination_id: day.end_destination_id || day.destination_id
                    });
                }
            }

            // Meals
            const b = day.meals?.breakfast;
            const l = day.meals?.lunch;
            const d = day.meals?.dinner;
            
                        const hasB = (b && b !== '');
            const hasL = (l && l !== '');
            const hasD = (d && d !== '');
            
            const reqB = hasB && b !== 'hotel';
            const reqL = hasL && l !== 'hotel';
            const reqD = hasD && d !== 'hotel';

            const prevDay = index > 0 ? days[index - 1] : null;
            const prevDestId = prevDay ? (prevDay.end_destination_id || prevDay.destination_id) : null;
            
            const currDestId = day.destination_id;
            const currEndDestId = day.end_destination_id || day.destination_id;
            
            const startDestId = (prevDestId && prevDestId != currDestId) ? prevDestId : currDestId;
            const endDestId = currEndDestId;
            
            const startDestName = startDestId ? (destinations.find(d => d.destination_id == startDestId)?.destination_name || '') : '';
            const endDestName = endDestId ? (destinations.find(d => d.destination_id == endDestId)?.destination_name || '') : '';
            
            const possibleDests = Array.from(new Set([startDestId, endDestId].filter(Boolean)));

            if (reqB) restaurants.push({ date: dateStr, displayDate, mealType: 'Sáng', quantity: pax, destination_id: startDestId, destName: startDestName, possible_dests: possibleDests });
            if (reqL) restaurants.push({ date: dateStr, displayDate, mealType: 'Trưa', quantity: pax, destination_id: startDestId, destName: startDestName, possible_dests: possibleDests });
            if (reqD) restaurants.push({ date: dateStr, displayDate, mealType: 'Tối', quantity: pax, destination_id: endDestId, destName: endDestName, possible_dests: possibleDests });

            rows.push({
                date: displayDate,
                hotel: hotelName || 'Không lưu trú',
                pax: pax,
                rooms: hotelName ? rooms : '—',
                breakfast: hasB ? pax : '—',
                lunch: hasL ? pax : '—',
                dinner: hasD ? pax : '—'
            });
        });

        setItineraryRows(rows);

        // Auto-generate services
        const autoServ = [];
        hotelsMap.forEach(h => {
            let matchedPartnerId = '';
            if (h.service_id && allServices.length > 0) {
                const srv = allServices.find(s => s.service_id == h.service_id);
                if (srv && srv.partner_id) matchedPartnerId = srv.partner_id;
            }
            if (!matchedPartnerId && h.name) {
                const matched = partners.find(p => p.partner_name === h.name);
                if (matched) matchedPartnerId = matched.partner_id;
            }
            // Auto-select the first available partner if still no match, because user requested to select one
            if (!matchedPartnerId && partners.length > 0) {
                // Find first hotel in this destination
                const availableHotels = partners.filter(p => {
                    const isHotel = p.partner_type === 'Hotel' || p.partner_type === 'Accommodation' || p.partner_type === 'Khách sạn' || p.partner_type === 'Khách Sạn';
                    if (!isHotel) return false;
                    const dest = destinations.find(d => d.destination_id == p.destination_id);
                    const pDestName = dest ? dest.destination_name : (p.destination_name || '');
                    
                    if (!pDestName) return true;
                    
                    const tourName = selectedDep.tour_name || '';
                    const tourDest = selectedDep.destination || '';
                    const pdNameStr = pDestName.trim().toLowerCase();
                    
                    const matchDest = tourDest.toLowerCase().includes(pdNameStr);
                    const matchName = tourName.toLowerCase().includes(pdNameStr);
                    
                    return matchDest || matchName || (!tourDest && !tourName);
                });
                if (availableHotels.length > 0) {
                    matchedPartnerId = availableHotels[0].partner_id;
                }
            }
            
                        let finalServiceId = h.service_id;
            if (matchedPartnerId && !finalServiceId) {
                const firstRoom = allServices.find(s => s.partner_id == matchedPartnerId && (s.service_type === 'Khách sạn' || s.service_type === 'Hotel' || s.service_type === 'Accommodation'));
                if (firstRoom) finalServiceId = firstRoom.service_id;
            }

            autoServ.push({
                id: Math.random().toString(36).substr(2, 9),
                type: 'HOTEL',
                partner_id: matchedPartnerId,
                service_id: finalServiceId,
                quantity: h.rooms,
                hotelName: h.name,
                destination_id: h.destination_id,
                details: { checkIn: h.checkIn, checkOut: h.checkOut, nights: h.nights, service_id: finalServiceId }
            });
        });
        restaurants.forEach(r => {
            // Find default restaurant in this destination
            let matchedPartnerId = '';
            let matchedServiceId = '';
            const availableRests = partners.filter(p => {
                const isRest = p.partner_type === 'Restaurant' || p.partner_type === 'Nhà hàng';
                if (!isRest) return false;
                if (r.destination_id) return p.destination_id == r.destination_id;
                return true;
            });
            if (availableRests.length > 0) {
                matchedPartnerId = availableRests[0].partner_id;
                const firstMeal = allServices.find(s => s.partner_id == matchedPartnerId && (s.service_type === 'Restaurant' || s.service_type === 'Nhà hàng'));
                if (firstMeal) matchedServiceId = firstMeal.service_id;
            }

            autoServ.push({
                id: Math.random().toString(36).substr(2, 9),
                type: 'RESTAURANT',
                partner_id: matchedPartnerId,
                service_id: matchedServiceId,
                quantity: r.quantity,
                destination_id: r.destination_id,
                displayDate: r.displayDate,
                details: { date: r.date, mealType: r.mealType, service_id: matchedServiceId, destName: r.destName, possible_dests: r.possible_dests }
            });
        });
        setServices(autoServ);
    }, [selectedDep, partners, destinations, allServices]);

    // Service handlers
    const addService = (type) => {
        setServices([...services, { 
            id: Math.random().toString(36).substr(2, 9), 
            type, partner_id: '', quantity: 1, details: {} 
        }]);
    };
    const handleServiceChange = (index, field, value) => {
        const newServices = [...services];
        newServices[index][field] = value;
        setServices(newServices);
    };
    const handleDetailChange = (index, field, value) => {
        const newServices = [...services];
        newServices[index].details[field] = value;
        setServices(newServices);
    };

    const submitRequest = async () => {
        if (!selectedDepId) return alert('Vui lòng chọn đợt khởi hành');
        if (services.length === 0) return alert('Vui lòng thêm ít nhất 1 dịch vụ');
        
        // Validate all services have a partner selected
        const unselected = services.find(s => !s.partner_id || s.partner_id === '');
        if (unselected) {
            return alert('Vui lòng chọn nhà cung cấp cho tất cả các dịch vụ hoặc xóa các mục không cần thiết.');
        }
        
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                departure_id: selectedDepId,
                passenger_count: selectedDep?.current_pax || 0,
                services: Object.values(services.reduce((acc, s) => {
                    const key = s.partner_id + '_' + s.type;
                    if (!acc[key]) {
                        acc[key] = {
                            partner_id: s.partner_id,
                            service_type: s.type,
                            quantity: parseInt(s.quantity) || 0,
                            details: { isGrouped: true, items: [] }
                        };
                    } else {
                        acc[key].quantity = Math.max(acc[key].quantity, parseInt(s.quantity) || 0);
                    }
                    acc[key].details.items.push(s.details);
                    return acc;
                }, {}))
            };
            
            const res = await axios.post('http://localhost:5000/api/service-requests/groups', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                alert('Tạo yêu cầu thành công!');
                setServices([]);
                setSelectedDepId('');
                setItineraryRows([]);
            }
        } catch (err) {
            console.error(err);
            alert('Lỗi tạo yêu cầu: ' + (err.response?.data?.error || err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const renderBadge = (status, type) => {
        if (type === 'booking') {
            if (status === 'Open') return <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500' }}>🟢 Đang mở bán</span>;
            if (status === 'Closed') return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500' }}>🔴 Đã đóng booking</span>;
            if (status === 'Completed') return <span style={{ background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500' }}>⚪ Đã hoàn thành</span>;
            return <span>{status}</span>;
        } else {
            if (status === 'Confirmed') return <span style={{ background: '#e0f2fe', color: '#075985', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500' }}>🔵 Đã xác nhận vận hành</span>;
            if (status === 'Reviewing') return <span style={{ background: '#ffedd5', color: '#c2410c', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500' }}>🟠 Đang xem xét</span>;
            if (status === 'Pending') return <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500' }}>⚪ Chưa xem xét</span>;
            if (status === 'Cancelled') return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500' }}>🔴 Đã đóng/hủy</span>;
            return <span>{status}</span>;
        }
    };

    const hotelServices = services.filter(s => s.type === 'HOTEL');
    const restaurantServices = services.filter(s => s.type === 'RESTAURANT');

    const restaurantGroups = restaurantServices.reduce((acc, s) => {
        const dateKey = s.details.date || 'Khác';
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(s);
        return acc;
    }, {});
    
    const sortedDates = Object.keys(restaurantGroups).sort((a, b) => {
        if (a === 'Khác') return 1;
        if (b === 'Khác') return -1;
        return new Date(a) - new Date(b);
    });

    return (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#1e293b' }}>➕ Tạo Yêu cầu Cung cấp Dịch vụ</h2>
            
            {!selectedDepId ? (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '80px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', marginBottom: '20px', textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '80px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '36px' }}>📅</span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '12px' }}>Chưa chọn lịch khởi hành</h3>
                    <p style={{ color: '#475569', fontSize: '14px', maxWidth: '400px', margin: '0 auto 24px auto', lineHeight: '1.5' }}>
                        Chọn một lịch khởi hành để bắt đầu tạo yêu cầu cung cấp dịch vụ cho tour.
                    </p>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        style={{ padding: '12px 24px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s', marginBottom: '24px' }}
                        onMouseOver={e => e.currentTarget.style.background = '#0369a1'}
                        onMouseOut={e => e.currentTarget.style.background = '#0284c7'}
                    >
                        🔍 Chọn lịch khởi hành
                    </button>
                    <div style={{ color: '#64748b', fontSize: '13px', fontStyle: 'italic', maxWidth: '500px', margin: '0 auto' }}>
                        💡 Sau khi chọn lịch khởi hành, hệ thống sẽ tự động lấy thông tin dịch vụ từ lịch trình để tạo yêu cầu gửi đến đối tác.
                    </div>
                </div>
            ) : (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>1. Thông tin Tour</h3>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#0f172a' }}>🏔️ {selectedDep?.tour_name}</h4>
                                <div style={{ fontSize: '13px', color: '#475569', marginBottom: '4px' }}>📅 Khởi hành: {new Date(selectedDep?.departure_date).toLocaleDateString('vi-VN')}</div>
                                <div style={{ fontSize: '13px', color: '#475569', marginBottom: '8px' }}>👥 Khách: {selectedDep?.current_pax}/{selectedDep?.max_slots}</div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {renderBadge(selectedDep?.status, 'booking')}
                                    {renderBadge(selectedDep?.ui_op_status, 'op')}
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(true)} style={{ padding: '6px 12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#475569', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#f8fafc'} onMouseOut={e=>e.currentTarget.style.background='#fff'}>
                                Thay đổi lịch
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Chọn Lịch Khởi Hành */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '12px', width: '900px', maxWidth: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Chọn lịch khởi hành</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
                        </div>
                        
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '12px' }}>
                            <input 
                                type="text" 
                                placeholder="🔍 Tìm tên tour, mã tour, ngày khởi hành..." 
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                style={{ flex: 2, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                            />
                            <select 
                                value={filterMonth} 
                                onChange={e => { setFilterMonth(e.target.value); setCurrentPage(1); }}
                                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                            >
                                <option value="UPCOMING">Tháng này & sắp đến</option>
                                <option value="ALL">Tháng: Tất cả</option>
                                {[...Array(12).keys()].map(i => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}
                            </select>
                            <select 
                                value={filterStatus} 
                                onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                            >
                                <option value="ALL">Trạng thái bán: Tất cả</option>
                                <option value="Open">Đang mở bán</option>
                                <option value="Closed">Đã đóng booking</option>
                            </select>
                            <select 
                                value={filterRequestStatus} 
                                onChange={e => { setFilterRequestStatus(e.target.value); setCurrentPage(1); }}
                                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                            >
                                <option value="CHUA_TAO">Trạng thái YC: Chưa tạo</option>
                                <option value="DA_TAO">Trạng thái YC: Đã tạo</option>
                                <option value="ALL">Trạng thái YC: Tất cả</option>
                            </select>
                        </div>

                        <div style={{ padding: '0', overflowY: 'auto', flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                                        <th style={{ padding: '12px 20px', fontWeight: '600', whiteSpace: 'nowrap' }}>Tour</th>
                                        <th style={{ padding: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>Khởi hành</th>
                                        <th style={{ padding: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>Khách</th>
                                        <th style={{ padding: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>Trạng thái yêu cầu</th>
                                        <th style={{ padding: '12px', fontWeight: '600', textAlign: 'center', whiteSpace: 'nowrap' }}>Chọn</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentDepartures.length > 0 ? currentDepartures.map(d => {
                                        const hasInitial = serviceGroups.some(g => g.departure_id === d.departure_id && g.request_type === 'INITIAL');
                                        return (
                                        <tr key={d.departure_id} style={{ borderBottom: '1px solid #f1f5f9', background: hasInitial ? '#f8fafc' : '#fff' }}>
                                            <td style={{ padding: '12px 20px' }}>
                                                <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{d.tour_name}</div>
                                                <div style={{ fontSize: '11px', display: 'flex', gap: '4px' }}>
                                                    {renderBadge(d.status, 'booking')}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{new Date(d.departure_date).toLocaleDateString('vi-VN')}</td>
                                            <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>{d.current_pax}/{d.max_slots}</td>
                                            <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                                                {hasInitial ? (
                                                    <span style={{ display: 'inline-block', background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>🟠 Đã tạo yêu cầu</span>
                                                ) : (
                                                    <span style={{ display: 'inline-block', background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>🟢 Chưa tạo yêu cầu</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                {hasInitial ? (
                                                    <button onClick={() => {
                                                        const initialGroup = serviceGroups.find(g => g.departure_id === d.departure_id && g.request_type === 'INITIAL');
                                                        if (initialGroup && setActiveTab) {
                                                            localStorage.setItem('openServiceRequestId', initialGroup.id);
                                                            setActiveTab('service_requests');
                                                        } else {
                                                            alert('Không tìm thấy ID yêu cầu');
                                                        }
                                                    }} style={{ color: '#0369a1', fontWeight: '600', fontSize: '13px', padding: '6px 12px', background: '#e0f2fe', border: 'none', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Xem yêu cầu</button>
                                                ) : (
                                                    <button 
                                                        onClick={() => handleSelectDeparture(d.departure_id)}
                                                        style={{ padding: '6px 12px', background: '#0194f3', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                                    >
                                                        Chọn
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )}) : (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                                                Không tìm thấy lịch khởi hành phù hợp.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {totalPages > 1 && (
                            <div style={{ padding: '12px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '4px 12px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>←</button>
                                {[...Array(totalPages).keys()].map(i => (
                                    <button 
                                        key={i+1} 
                                        onClick={() => setCurrentPage(i+1)}
                                        style={{ padding: '4px 12px', border: currentPage === i+1 ? '1px solid #0194f3' : '1px solid #cbd5e1', background: currentPage === i+1 ? '#0194f3' : '#fff', color: currentPage === i+1 ? '#fff' : '#0f172a', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        {i+1}
                                    </button>
                                ))}
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '4px 12px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>→</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

                        {/* Modal Xem Lịch Trình */}
            {isItineraryModalOpen && selectedDep && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '12px', width: '800px', maxWidth: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Chi tiết lịch trình: {selectedDep.tour_name}</h3>
                            <button onClick={() => setIsItineraryModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
                        </div>
                        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            {(() => {
                                let days = [];
                                try {
                                    const parsed = typeof selectedDep.design_data === 'string' ? JSON.parse(selectedDep.design_data) : (selectedDep.design_data || {});
                                    days = parsed.days || parsed.itinerary || [];
                                } catch (e) {}

                                if (!days || days.length === 0) return <div>Chưa có lịch trình chi tiết.</div>;

                                return days.map((day, i) => (
                                    <div key={i} style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px dashed #e2e8f0' }}>
                                        {(() => {
                                            const dDate = new Date(selectedDep.departure_date);
                                            dDate.setDate(dDate.getDate() + i);
                                            const dateStr = dDate.toLocaleDateString('vi-VN');
                                            const title = day.title || day.route_title || day.name;
                                            return (
                                                <h4 style={{ fontSize: '15px', color: '#0369a1', marginBottom: '12px' }}>
                                                    Ngày {day.dayIndex || i + 1} ({dateStr}){title ? ': ' + title : ''}
                                                </h4>
                                            );
                                        })()}
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                            {day.destination_id && (
                                                <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', color: '#475569' }}>
                                                    📍 {destinations.find(d => d.destination_id == day.destination_id)?.destination_name || 'Khác'}
                                                    {day.end_destination_id && day.end_destination_id != day.destination_id && (
                                                        <> ➡️ {destinations.find(d => d.destination_id == day.end_destination_id)?.destination_name || 'Khác'}</>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
                                            {day.activities && day.activities.length > 0 ? (
                                                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                                    {day.activities.map((act, idx) => (
                                                        <li key={idx} style={{ marginBottom: '8px' }}>
                                                            {act.time && <span style={{ fontWeight: '600', marginRight: '8px' }}>{act.time}</span>}
                                                            <span>
                                                                {act.title || act.name || act.description || (typeof act === 'string' ? act : JSON.stringify(act))}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div dangerouslySetInnerHTML={{ __html: day.description || day.content || 'Không có mô tả chi tiết.' }} />
                                            )}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Thông tin dịch vụ */}
            {selectedDepId && (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>2. Thông tin dịch vụ</h3>
                        <button onClick={() => setIsItineraryModalOpen(true)} style={{ padding: '6px 12px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                            Xem lại lịch trình
                        </button>
                    </div>
                    {itineraryRows.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', width: '120px' }}>Ngày</th>
                                        <th style={{ padding: '12px', fontWeight: '600' }}>Khách sạn</th>
                                        <th style={{ padding: '12px', fontWeight: '600', textAlign: 'center', width: '90px' }}>Số khách</th>
                                        <th style={{ padding: '12px', fontWeight: '600', textAlign: 'center', width: '80px' }}>Phòng</th>
                                        <th style={{ padding: '12px', fontWeight: '600', textAlign: 'center', width: '90px' }}>Bữa sáng</th>
                                        <th style={{ padding: '12px', fontWeight: '600', textAlign: 'center', width: '90px' }}>Bữa trưa</th>
                                        <th style={{ padding: '12px', fontWeight: '600', textAlign: 'center', width: '90px' }}>Bữa tối</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itineraryRows.map((row, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px 16px', color: '#475569' }}>{row.date}</td>
                                            <td style={{ padding: '12px', fontWeight: row.hotel !== 'Không lưu trú' ? '600' : '400', color: row.hotel !== 'Không lưu trú' ? '#0f172a' : '#94a3b8' }}>
                                                {row.hotel}
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#475569' }}>{row.pax}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#475569' }}>{row.rooms}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#475569' }}>{row.breakfast}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#475569' }}>{row.lunch}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#475569' }}>{row.dinner}</td>
                                        </tr>
                                    ))}

                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ padding: '16px', background: '#f8fafc', color: '#64748b', borderRadius: '8px', textAlign: 'center', fontStyle: 'italic' }}>
                            Chưa có lịch trình chi tiết cho lịch khởi hành này.
                        </div>
                    )}
                </div>
            )}

            {/* 3. Nhu cầu Khách sạn */}
            {selectedDepId && (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>3. Nhu cầu Khách sạn</h3>
                        <button onClick={() => addService('HOTEL')} style={{ padding: '6px 12px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>
                            + Thêm tùy chỉnh
                        </button>
                    </div>
                    
                    {hotelServices.map((s) => {
                        const originalIndex = services.findIndex(serv => serv.id === s.id);
                        return (
                        <div key={s.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '12px', background: '#f8fafc' }}>
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                                
                                <div style={{ flex: 1, display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                            Khách sạn {s.hotelName ? `(${s.hotelName})` : ''}
                                        </label>
                                        <select 
                                            value={s.partner_id || ''} 
                                            onChange={e => {
                                                const pId = e.target.value;
                                                handleServiceChange(originalIndex, 'partner_id', pId);
                                                handleServiceChange(originalIndex, 'service_id', '');
                                                handleDetailChange(originalIndex, 'service_id', '');
                                                
                                                // Auto select first room if available
                                                if (pId) {
                                                    const firstRoom = allServices.find(srv => srv.partner_id == pId && (srv.service_type === 'Hotel' || srv.service_type === 'Khách sạn' || srv.service_type === 'Accommodation'));
                                                    if (firstRoom) {
                                                        handleServiceChange(originalIndex, 'service_id', firstRoom.service_id);
                                                        handleDetailChange(originalIndex, 'service_id', firstRoom.service_id);
                                                    }
                                                }
                                            }} 
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        >
                                            <option value="">-- Chọn khách sạn --</option>
                                            {Array.from(new Set(
                                                allServices.filter(srv => {
                                                    if (srv.service_type !== 'Hotel' && srv.service_type !== 'Khách sạn' && srv.service_type !== 'Accommodation') return false;
                                                    if (!srv.partner_id) return false;
                                                    const p = partners.find(pt => pt.partner_id === srv.partner_id);
                                                    if (!p) return false;
                                                    if (s.destination_id) return p.destination_id == s.destination_id;
                                                    const dest = destinations.find(d => d.destination_id == p.destination_id);
                                                    const pDestName = dest ? dest.destination_name : (p.destination_name || '');
                                                    if (!pDestName) return true;
                                                    const tourName = selectedDep.tour_name || '';
                                                    const tourDest = selectedDep.destination || '';
                                                    const pdNameStr = pDestName.trim().toLowerCase();
                                                    return tourDest.toLowerCase().includes(pdNameStr) || tourName.toLowerCase().includes(pdNameStr) || (!tourDest && !tourName);
                                                }).map(srv => srv.partner_id)
                                            )).map(partnerId => {
                                                const p = partners.find(pt => pt.partner_id === partnerId);
                                                return p ? (
                                                    <option key={p.partner_id} value={p.partner_id}>
                                                        {p.partner_name}
                                                    </option>
                                                ) : null;
                                            })}
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                            Hạng phòng
                                        </label>
                                        <select 
                                            value={s.service_id || ''} 
                                            onChange={e => {
                                                const sId = e.target.value;
                                                handleServiceChange(originalIndex, 'service_id', sId);
                                                handleDetailChange(originalIndex, 'service_id', sId);
                                            }} 
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                            disabled={!s.partner_id}
                                        >
                                            <option value="">-- Chọn hạng phòng --</option>
                                            {allServices.filter(srv => srv.partner_id == s.partner_id && (srv.service_type === 'Hotel' || srv.service_type === 'Khách sạn' || srv.service_type === 'Accommodation')).map(srv => (
                                                <option key={srv.service_id} value={srv.service_id}>
                                                    {srv.service_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div style={{ width: '120px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Số lượng phòng</label>
                                    <input type="number" value={s.quantity} onChange={e => handleServiceChange(originalIndex, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Check-in</label>
                                    <input type="date" value={s.details.checkIn || ''} onChange={e => handleDetailChange(originalIndex, 'checkIn', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Check-out</label>
                                    <input type="date" value={s.details.checkOut || ''} onChange={e => handleDetailChange(originalIndex, 'checkOut', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                                </div>
                            </div>
                            <button onClick={() => {
                                const newServices = [...services];
                                newServices.splice(originalIndex, 1);
                                setServices(newServices);
                            }} style={{ marginTop: '12px', padding: '6px 12px', background: '#fff', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Xóa</button>
                        </div>
                    )})}
                    {hotelServices.length === 0 && <div style={{ fontSize: '13px', color: '#94a3b8' }}>Không có nhu cầu khách sạn.</div>}
                </div>
            )}

            {/* 4. Nhu cầu Nhà hàng */}
            {selectedDepId && (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>4. Nhu cầu Nhà hàng</h3>
                        <button onClick={() => {
                            const pDate = window.prompt("Nhập ngày ăn (YYYY-MM-DD):", sortedDates.length > 0 && sortedDates[0] !== 'Khác' ? sortedDates[0] : new Date().toISOString().split('T')[0]);
                            if (!pDate) return;
                            const pMeal = window.prompt("Nhập bữa ăn (Sáng / Trưa / Tối):", "Trưa");
                            if (!pMeal) return;
                            setServices([...services, {
                                id: Math.random().toString(36).substr(2, 9),
                                type: 'RESTAURANT',
                                partner_id: '',
                                quantity: 1,
                                details: { date: pDate, mealType: pMeal }
                            }]);
                        }} style={{ padding: '6px 12px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>
                            + Thêm tùy chỉnh
                        </button>
                    </div>
                    
                    {sortedDates.length > 0 ? sortedDates.map(dateKey => {
                        const dayServices = restaurantGroups[dateKey];
                        const displayDate = dateKey === 'Khác' ? 'Dịch vụ thêm / Chưa chọn ngày' : new Date(dateKey).toLocaleDateString('vi-VN');
                        
                        // Group by mealType
                        const mealGroups = { 'Sáng': [], 'Trưa': [], 'Tối': [], 'Khác': [] };
                        dayServices.forEach(s => {
                            const m = s.details.mealType || 'Khác';
                            if (mealGroups[m]) {
                                mealGroups[m].push(s);
                            } else {
                                mealGroups['Khác'].push(s);
                            }
                        });

                        const mealOrder = ['Sáng', 'Trưa', 'Tối', 'Khác'];

                        return (
                            <div key={dateKey} style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginBottom: '16px' }}>
                                    📅 Ngày {displayDate}
                                </h4>
                                
                                {mealOrder.map(mealType => {
                                    const meals = mealGroups[mealType];
                                    if (!meals || meals.length === 0) return null;

                                    let icon = '🍽️';
                                    if (mealType === 'Sáng') icon = '🌅';
                                    if (mealType === 'Trưa') icon = '☀️';
                                    if (mealType === 'Tối') icon = '🌙';

                                    return (
                                        <div key={mealType} style={{ marginBottom: '20px', marginLeft: '12px' }}>
                                            <h5 style={{ fontSize: '14px', fontWeight: '700', color: '#b45309', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
                                                {icon} Bữa {mealType.toLowerCase()}
                                            </h5>
                                            
                                            {meals.map((s) => {
                                                const originalIndex = services.findIndex(serv => serv.id === s.id);
                                                return (
                                                <div key={s.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '12px', background: '#f8fafc' }}>
                                                    <div style={{ display: 'flex', gap: '16px' }}>
                                                        
                                                        <div style={{ flex: 1, display: 'flex', gap: '16px' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                                                    Nhà hàng
                                                                </label>
                                                                <select 
                                                                    value={s.partner_id || ''} 
                                                                    onChange={e => {
                                                                        const pId = e.target.value;
                                                                        handleServiceChange(originalIndex, 'partner_id', pId);
                                                                        handleServiceChange(originalIndex, 'service_id', '');
                                                                        handleDetailChange(originalIndex, 'service_id', '');
                                                                        if (pId) {
                                                                            const firstMeal = allServices.find(srv => srv.partner_id == pId && (srv.service_type === 'Restaurant' || srv.service_type === 'Nhà hàng'));
                                                                            if (firstMeal) {
                                                                                handleServiceChange(originalIndex, 'service_id', firstMeal.service_id);
                                                                                handleDetailChange(originalIndex, 'service_id', firstMeal.service_id);
                                                                            }
                                                                        }
                                                                    }} 
                                                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                                                >
                                                                    <option value="">-- Chọn nhà hàng --</option>
                                                                    {(() => {
                                                                        const tourDestIds = new Set();
                                                                        try {
                                                                            const p = typeof selectedDep?.design_data === 'string' ? JSON.parse(selectedDep.design_data) : (selectedDep?.design_data || {});
                                                                            (p.days || p.itinerary || []).forEach(d => {
                                                                                if (d.destination_id) tourDestIds.add(parseInt(d.destination_id));
                                                                                if (d.end_destination_id) tourDestIds.add(parseInt(d.end_destination_id));
                                                                            });
                                                                        } catch(e) {}

                                                                        const validPartnerIds = Array.from(new Set(
                                                                            allServices.filter(srv => {
                                                                                if (srv.service_type !== 'Restaurant' && srv.service_type !== 'Nhà hàng') return false;
                                                                                return !!srv.partner_id;
                                                                            }).map(srv => srv.partner_id)
                                                                        ));
                                                                        
                                                                        // Group partners by destination
                                                                        const grouped = {};
                                                                        validPartnerIds.forEach(pId => {
                                                                            const p = partners.find(pt => pt.partner_id === pId);
                                                                            if (p) {
                                                                                if (s.details.possible_dests) {
                                                                                    const pDests = s.details.possible_dests.map(d => parseInt(d)).filter(d => !isNaN(d));
                                                                                    if (pDests.length > 0 && !pDests.includes(parseInt(p.destination_id))) return;
                                                                                } else {
                                                                                    if (tourDestIds.size > 0 && !tourDestIds.has(parseInt(p.destination_id))) return;
                                                                                }
                                                                                const dest = destinations.find(d => d.destination_id == p.destination_id);
                                                                                const destName = dest ? dest.destination_name : 'Khác';
                                                                                if (!grouped[destName]) grouped[destName] = [];
                                                                                grouped[destName].push(p);
                                                                            }
                                                                        });
                                                                        
                                                                        // Sort keys so that the current destination is at the top, then alphabetical
                                                                        const sDest = destinations.find(d => d.destination_id == s.destination_id);
                                                                        const sDestName = sDest ? sDest.destination_name : (s.details.destName || '');
                                                                        
                                                                        const sortedKeys = Object.keys(grouped).sort((a, b) => {
                                                                            if (a === sDestName) return -1;
                                                                            if (b === sDestName) return 1;
                                                                            return a.localeCompare(b);
                                                                        });

                                                                        return sortedKeys.map(groupName => (
                                                                            <optgroup key={groupName} label={groupName}>
                                                                                {grouped[groupName].map(p => (
                                                                                    <option key={p.partner_id} value={p.partner_id}>
                                                                                        {p.partner_name}
                                                                                    </option>
                                                                                ))}
                                                                            </optgroup>
                                                                        ));
                                                                    })()}
                                                                </select>
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                                                    Suất ăn / Dịch vụ
                                                                </label>
                                                                <select 
                                                                    value={s.service_id || ''} 
                                                                    onChange={e => {
                                                                        const sId = e.target.value;
                                                                        handleServiceChange(originalIndex, 'service_id', sId);
                                                                        handleDetailChange(originalIndex, 'service_id', sId);
                                                                    }} 
                                                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                                                    disabled={!s.partner_id}
                                                                >
                                                                    <option value="">-- Chọn dịch vụ --</option>
                                                                    {allServices.filter(srv => srv.partner_id == s.partner_id && (srv.service_type === 'Restaurant' || srv.service_type === 'Nhà hàng')).map(srv => (
                                                                        <option key={srv.service_id} value={srv.service_id}>
                                                                            {srv.service_name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        
                                                        <div style={{ width: '100px' }}>
                                                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Số suất ăn</label>
                                                            <input type="number" value={s.quantity} onChange={e => handleServiceChange(originalIndex, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                                            <button onClick={() => {
                                                                const newServices = [...services];
                                                                newServices.splice(originalIndex, 1);
                                                                setServices(newServices);
                                                            }} style={{ padding: '8px 12px', background: '#fff', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Xóa</button>
                                                        </div>

                                                    </div>
                                                </div>
                                                )
                                            })}
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    }) : (
                        <div style={{ fontSize: '13px', color: '#94a3b8' }}>Không có nhu cầu nhà hàng.</div>
                    )}
                </div>
            )}

            <button onClick={submitRequest} disabled={loading || !selectedDepId} style={{ width: '100%', padding: '14px', background: !selectedDepId ? '#94a3b8' : '#0194f3', color: '#fff', border: 'none', borderRadius: '8px', cursor: !selectedDepId ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '16px' }}>
                {loading ? 'Đang gửi...' : 'GỬI YÊU CẦU'}
            </button>
        </div>
    );
};

export default ServiceRequestCreate;

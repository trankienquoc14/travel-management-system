import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const ServiceRequestCreate = () => {
    const [departures, setDepartures] = useState([]);
    const [partners, setPartners] = useState([]);
    
    // Selection state
    const [selectedDepId, setSelectedDepId] = useState('');
    const [itineraryRows, setItineraryRows] = useState([]);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
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
                if (partRes.data.success) setPartners(partRes.data.data);
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
        result.sort((a, b) => new Date(a.departure_date) - new Date(b.departure_date));
        return result;
    }, [departures, searchTerm, filterMonth, filterStatus]);

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
        const rooms = Math.ceil(pax / 2) || 0;
        
        if (days.length === 0) {
            setItineraryRows([]);
            setServices([]);
            return;
        }

        const rows = [];
        const hotelsMap = [];
        const restaurants = [];

        days.forEach((day, index) => {
            const dDate = new Date(selectedDep.departure_date);
            dDate.setDate(dDate.getDate() + (day.dayIndex ? day.dayIndex - 1 : index));
            const dateStr = dDate.toISOString().split('T')[0];
            const displayDate = dDate.toLocaleDateString('vi-VN');

            // Hotel
            let hotelName = '';
            if (day.accommodation && day.accommodation.name) {
                hotelName = day.accommodation.name;
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
                        rooms: rooms
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

            if (hasB) restaurants.push({ date: dateStr, displayDate, mealType: 'Sáng', quantity: pax });
            if (hasL) restaurants.push({ date: dateStr, displayDate, mealType: 'Trưa', quantity: pax });
            if (hasD) restaurants.push({ date: dateStr, displayDate, mealType: 'Tối', quantity: pax });

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
            autoServ.push({
                id: Math.random().toString(36).substr(2, 9),
                type: 'HOTEL',
                partner_id: '',
                quantity: h.rooms,
                hotelName: h.name,
                details: { checkIn: h.checkIn, checkOut: h.checkOut, nights: h.nights }
            });
        });
        restaurants.forEach(r => {
            autoServ.push({
                id: Math.random().toString(36).substr(2, 9),
                type: 'RESTAURANT',
                partner_id: '',
                quantity: r.quantity,
                displayDate: r.displayDate,
                details: { date: r.date, mealType: r.mealType }
            });
        });
        setServices(autoServ);
    }, [selectedDep]);

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
        
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                departure_id: selectedDepId,
                passenger_count: selectedDep?.current_pax || 0,
                services: services.map(s => ({
                    partner_id: s.partner_id,
                    service_type: s.type,
                    quantity: s.quantity,
                    details: s.details
                }))
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
            alert('Lỗi tạo yêu cầu');
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
            
            {/* 1. Thông tin Tour */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>1. Thông tin Tour</h3>
                
                {!selectedDepId ? (
                    <div 
                        onClick={() => setIsModalOpen(true)}
                        style={{ padding: '16px', border: '1px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', background: '#f8fafc' }}
                    >
                        <div style={{ fontSize: '16px', color: '#64748b', marginBottom: '8px' }}>🔍 Chọn lịch khởi hành</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>Tìm theo tên tour, mã tour, ngày khởi hành...</div>
                    </div>
                ) : (
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
                            <button onClick={() => setIsModalOpen(true)} style={{ padding: '6px 12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                                Thay đổi lịch
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Chọn Lịch Khởi Hành */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '12px', width: '800px', maxWidth: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
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
                        </div>

                        <div style={{ padding: '0', overflowY: 'auto', flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                                        <th style={{ padding: '12px 20px', fontWeight: '600' }}>Tour</th>
                                        <th style={{ padding: '12px', fontWeight: '600' }}>Khởi hành</th>
                                        <th style={{ padding: '12px', fontWeight: '600' }}>Khách</th>
                                        <th style={{ padding: '12px', fontWeight: '600', textAlign: 'center' }}>Chọn</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentDepartures.length > 0 ? currentDepartures.map(d => (
                                        <tr key={d.departure_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px 20px' }}>
                                                <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{d.tour_name}</div>
                                                <div style={{ fontSize: '11px', display: 'flex', gap: '4px' }}>
                                                    {renderBadge(d.status, 'booking')}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px' }}>{new Date(d.departure_date).toLocaleDateString('vi-VN')}</td>
                                            <td style={{ padding: '12px' }}>{d.current_pax}/{d.max_slots}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => handleSelectDeparture(d.departure_id)}
                                                    style={{ padding: '6px 12px', background: '#0194f3', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                                >
                                                    Chọn
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
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

            {/* 2. Thông tin lịch trình */}
            {selectedDepId && (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>2. Thông tin lịch trình</h3>
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
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                        Khách sạn {s.hotelName ? `(${s.hotelName})` : ''}
                                    </label>
                                    <select value={s.partner_id} onChange={e => handleServiceChange(originalIndex, 'partner_id', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                        <option value="">-- Chọn nhà cung cấp / đối tác --</option>
                                        {partners.filter(p => p.partner_type === 'Accommodation' || p.partner_type === 'Khách sạn').map(p => (
                                            <option key={p.partner_id} value={p.partner_id}>{p.partner_name}</option>
                                        ))}
                                    </select>
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
                        <button onClick={() => addService('RESTAURANT')} style={{ padding: '6px 12px', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>
                            + Thêm tùy chỉnh
                        </button>
                    </div>
                    
                    {sortedDates.length > 0 ? sortedDates.map(dateKey => {
                        const dayServices = restaurantGroups[dateKey];
                        const displayDate = dateKey === 'Khác' ? 'Dịch vụ thêm / Chưa chọn ngày' : new Date(dateKey).toLocaleDateString('vi-VN');
                        
                        return (
                            <div key={dateKey} style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#334155', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px' }}>
                                    📅 Ngày {displayDate}
                                </h4>
                                
                                {dayServices.map((s) => {
                                    const originalIndex = services.findIndex(serv => serv.id === s.id);
                                    return (
                                    <div key={s.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '12px', background: '#f8fafc', marginLeft: '12px' }}>
                                        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                                                    Nhà hàng {s.displayDate ? `(Nhu cầu ${s.details.mealType} ${s.displayDate})` : ''}
                                                </label>
                                                <select value={s.partner_id} onChange={e => handleServiceChange(originalIndex, 'partner_id', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                                    <option value="">-- Chọn nhà cung cấp / đối tác --</option>
                                                    {partners.filter(p => p.partner_type === 'Restaurant' || p.partner_type === 'Nhà hàng').map(p => (
                                                        <option key={p.partner_id} value={p.partner_id}>{p.partner_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ width: '120px' }}>
                                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Số suất ăn</label>
                                                <input type="number" value={s.quantity} onChange={e => handleServiceChange(originalIndex, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Ngày ăn</label>
                                                <input type="date" value={s.details.date || ''} onChange={e => handleDetailChange(originalIndex, 'date', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Bữa ăn</label>
                                                <select value={s.details.mealType || ''} onChange={e => handleDetailChange(originalIndex, 'mealType', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                                    <option value="Sáng">Sáng</option>
                                                    <option value="Trưa">Trưa</option>
                                                    <option value="Tối">Tối</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button onClick={() => {
                                            const newServices = [...services];
                                            newServices.splice(originalIndex, 1);
                                            setServices(newServices);
                                        }} style={{ marginTop: '12px', padding: '6px 12px', background: '#fff', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Xóa</button>
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

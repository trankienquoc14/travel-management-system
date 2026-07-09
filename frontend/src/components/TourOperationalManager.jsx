import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../index.css';

const TourOperationalManager = () => {
    const [tours, setTours] = useState([]);
    const [selectedTour, setSelectedTour] = useState(null);
    const [allPlaces, setAllPlaces] = useState([]);
    const [allServices, setAllServices] = useState({ hotels: [], transports: [] });
    const [loading, setLoading] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState('itinerary'); // 'itinerary', 'pricing', 'departures'

    // State cấu hình dịch vụ & định giá
    const [fixedServices, setFixedServices] = useState({ hotel: null, transport: null });
    const [itineraryDays, setItineraryDays] = useState([]);
    const [departures, setDepartures] = useState([]);
    const [markupPercent, setMarkupPercent] = useState(20); // Mặc định lời 20%

    const navigate = useNavigate();

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // 1. Lấy danh sách Tour
            const resTours = await axios.get('http://localhost:5000/api/tours', { headers });
            if (resTours.data.success) setTours(resTours.data.data || []);

            // 2. Lấy kho Địa điểm & Dịch vụ cố định
            const resServices = await axios.get('http://localhost:5000/api/custom-tours/services/', { headers });
            if (resServices.data.success) {
                setAllPlaces(resServices.data.data?.sightseeing || []);
                setAllServices({
                    hotels: resServices.data.data?.accommodation || [],
                    transports: resServices.data.data?.transport || []
                });
            }
        } catch (error) { console.error(error); }
    };

    const handleSelectTour = async (tour) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/tours/admin/${tour.tour_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                const d = res.data.data;
                setSelectedTour(d);
                setMarkupPercent(d.markup_percent || 20);

                // Khởi tạo các ngày theo duration_days
                if (d.itineraryDays && d.itineraryDays.length > 0) {
                    setItineraryDays(d.itineraryDays);
                } else {
                    const days = [];
                    for (let i = 1; i <= (d.duration_days || 3); i++) {
                        days.push({ day_number: i, title: `Ngày ${i}: Khám phá ${d.destination}`, description: '', places: [] });
                    }
                    setItineraryDays(days);
                }
                setDepartures(d.departures || []);
            }
        } catch (e) { alert("Lỗi tải thông tin tour!"); }
        finally { setLoading(false); }
    };

    // Thêm / Xóa địa điểm tham quan vào từng ngày
    const addPlaceToDay = (dayIdx, place) => {
        const rawId = place.id.toString().replace('place_', '');
        const updated = [...itineraryDays];
        updated[dayIdx].places.push({
            place_id: Number(rawId),
            place_name: place.name,
            estimated_price: place.price || 0,
            visit_time: '08:30',
            visit_order: updated[dayIdx].places.length + 1
        });
        setItineraryDays(updated);
    };

    const removePlaceFromDay = (dayIdx, placeIdx) => {
        const updated = [...itineraryDays];
        updated[dayIdx].places.splice(placeIdx, 1);
        setItineraryDays(updated);
    };

    // =========================================================================
    // 🚀 CÔNG THỨC TÍNH TOÁN CHI PHÍ GỐC & GIÁ BÁN THEO % LỢI NHUẬN
    // =========================================================================
    const calculateBaseCost = () => {
        let total = 0;
        // 1. Cộng tiền Khách sạn & Xe cố định (Chia đều cho trung bình 1 khách hoặc tính theo suất)
        if (fixedServices.hotel) total += Number(fixedServices.hotel.price || 0);
        if (fixedServices.transport) total += Number(fixedServices.transport.price || 0);

        // 2. Cộng tiền vé tham quan của tất cả các ngày
        itineraryDays.forEach(day => {
            day.places?.forEach(pl => {
                total += Number(pl.estimated_price || 0);
            });
        });
        return total;
    };

    const baseCost = calculateBaseCost();
    const sellingPrice = Math.round(baseCost * (1 + Number(markupPercent) / 100));
    const formatMoney = (val) => Number(val || 0).toLocaleString('vi-VN') + ' đ';

    // LƯU CẤU HÌNH VẬN HÀNH & ĐỊNH GIÁ SANG BACKEND
    const handleSaveOperations = async () => {
        if (!selectedTour) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`http://localhost:5000/api/tours/admin/save`, {
                tour_id: selectedTour.tour_id,
                tour_name: selectedTour.tour_name,
                destination: selectedTour.destination,
                duration_days: selectedTour.duration_days,
                description: selectedTour.description,
                status: selectedTour.status,
                existing_image_url: selectedTour.image_url,
                base_cost: baseCost,
                markup_percent: markupPercent,
                base_price: sellingPrice, // Gán sellingPrice tính được vào giá bán chính thức
                itineraryDays: JSON.stringify(itineraryDays),
                departures: JSON.stringify(departures)
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (res.data.success) {
                alert(`🎉 Đã chốt cấu hình lịch trình & Định giá bán (${formatMoney(sellingPrice)}) cho Tour: ${selectedTour.tour_name}`);
            }
        } catch (e) { alert("Lỗi khi lưu lịch trình!"); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header chuẩn đồng bộ với Dashboard */}
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <h2>⚙️ Quản Trị Lịch Trình & Định Giá Tour</h2>
                <p>Thiết lập lịch trình chi tiết, phân bổ dịch vụ và định giá bán cho các Tour.</p>
            </div>

            {/* Xóa background và padding thừa để ăn khớp với giao diện Dashboard */}
            <div style={{ flex: 1, display: 'flex', gap: '25px', width: '100%' }}> {/* Cột trái: Chọn Tour */}
                <div style={{ flex: '0 0 320px', background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#0f172a' }}>📌 Chọn Khung Tour ({tours.length})</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {tours.map(t => (
                            <div key={t.tour_id} onClick={() => handleSelectTour(t)} style={{ padding: '14px', borderRadius: '12px', cursor: 'pointer', border: '2px solid', background: selectedTour?.tour_id === t.tour_id ? '#eff6ff' : '#f8fafc', borderColor: selectedTour?.tour_id === t.tour_id ? '#3b82f6' : '#e2e8f0' }}>
                                <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>{t.tour_name}</strong>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>📍 {t.destination} | 🕒 {t.duration_days} Ngày</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cột phải: Vận hành & Tính giá */}
                <div style={{ flex: 1, background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                    {!selectedTour ? (
                        <div style={{ textAlign: 'center', margin: 'auto', color: '#94a3b8' }}><h3>⬅ Chọn 1 Tour bên trái để thiết lập lịch trình & tính giá</h3></div>
                    ) : (
                        <div>
                            {/* THANH ĐỊNH GIÁ ĐỘNG BÊN TRÊN (GIỐNG STAFF TOUR DESIGNER) */}
                            <div style={{ background: '#f0fdf4', border: '2px solid #34d399', padding: '20px', borderRadius: '14px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <span style={{ fontSize: '13px', color: '#047857', fontWeight: 'bold', display: 'block' }}>TỔNG CHI PHÍ GỐC (DỊCH VỤ + VÉ THAM QUAN)</span>
                                    <strong style={{ fontSize: '24px', color: '#065f46' }}>{formatMoney(baseCost)}</strong>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div>
                                        <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#047857', display: 'block' }}>% Lợi Nhuận ({markupPercent}%):</label>
                                        <input type="range" min="5" max="50" step="5" value={markupPercent} onChange={e => setMarkupPercent(e.target.value)} style={{ cursor: 'pointer' }} />
                                    </div>
                                    <div style={{ textAlign: 'right', background: '#fff', padding: '10px 20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', display: 'block' }}>GIÁ BÁN TRỌN GÓI / KHÁCH</span>
                                        <strong style={{ fontSize: '26px', color: '#ea580c' }}>{formatMoney(sellingPrice)}</strong>
                                    </div>
                                </div>

                                <button onClick={handleSaveOperations} disabled={loading} style={{ padding: '14px 25px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>💾 CHỐT LỊCH TRÌNH & GIÁ</button>
                            </div>

                            {/* TABS CHỌN CÔNG VIỆC */}
                            <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' }}>
                                <button onClick={() => setActiveSubTab('itinerary')} style={{ padding: '10px 20px', background: activeSubTab === 'itinerary' ? '#0f172a' : 'transparent', color: activeSubTab === 'itinerary' ? '#fff' : '#64748b', border: 'none', borderRadius: '8px 8px 0 0', fontWeight: 'bold', cursor: 'pointer' }}>1. 🗺️ Ghép Điểm Tham Quan Từng Ngày</button>
                                <button onClick={() => setActiveSubTab('services')} style={{ padding: '10px 20px', background: activeSubTab === 'services' ? '#0f172a' : 'transparent', color: activeSubTab === 'services' ? '#fff' : '#64748b', border: 'none', borderRadius: '8px 8px 0 0', fontWeight: 'bold', cursor: 'pointer' }}>2. 🏨 Chọn Dịch Vụ Cố Định (Khách Sạn/Xe)</button>
                                <button onClick={() => setActiveSubTab('departures')} style={{ padding: '10px 20px', background: activeSubTab === 'departures' ? '#0f172a' : 'transparent', color: activeSubTab === 'departures' ? '#fff' : '#64748b', border: 'none', borderRadius: '8px 8px 0 0', fontWeight: 'bold', cursor: 'pointer' }}>3. 📅 Mở Lịch Khởi Hành</button>
                            </div>

                            {/* TAB 1: SẮP XẾP ĐỊA ĐIỂM TỪNG NGÀY */}
                            {activeSubTab === 'itinerary' && (
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ flex: '0 0 300px', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #cbd5e1', maxHeight: '500px', overflowY: 'auto' }}>
                                        <h4 style={{ margin: '0 0 10px 0' }}>📍 Kho Điểm Đến ({selectedTour.destination})</h4>
                                        {allPlaces.map(pl => (
                                            <div key={pl.id} style={{ background: '#fff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                                                <strong style={{ fontSize: '13px', display: 'block' }}>{pl.name}</strong>
                                                <span style={{ fontSize: '12px', color: '#059669', fontWeight: 'bold' }}>Giá vé: {formatMoney(pl.price)}</span>
                                                <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                                                    {itineraryDays.map((_, idx) => (
                                                        <button key={idx} onClick={() => addPlaceToDay(idx, pl)} style={{ padding: '3px 8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>+N{idx + 1}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto' }}>
                                        {itineraryDays.map((day, dIdx) => (
                                            <div key={day.day_number} style={{ background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                                    <span style={{ padding: '8px 12px', background: '#0f172a', color: '#fff', fontWeight: 'bold', borderRadius: '6px' }}>Ngày {day.day_number}</span>
                                                    <input type="text" value={day.title} onChange={e => { const up = [...itineraryDays]; up[dIdx].title = e.target.value; setItineraryDays(up); }} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 'bold' }} />
                                                </div>
                                                {day.places.map((pl, pIdx) => (
                                                    <div key={pIdx} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', marginTop: '6px' }}>
                                                        <input type="time" value={pl.visit_time || '08:30'} onChange={e => { const up = [...itineraryDays]; up[dIdx].places[pIdx].visit_time = e.target.value; setItineraryDays(up); }} style={{ padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                                                        <span style={{ flex: 1, fontWeight: '600', fontSize: '13px' }}>{pl.place_name} ({formatMoney(pl.estimated_price)})</span>
                                                        <button onClick={() => removePlaceFromDay(dIdx, pIdx)} style={{ color: '#ef4444', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>×</button>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: CHỌN DỊCH VỤ CỐ ĐỊNH */}
                            {activeSubTab === 'services' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                                        <h4>🏨 Chọn Khách Sạn / Lưu Trú</h4>
                                        {allServices.hotels.map(h => (
                                            <label key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#fff', border: fixedServices.hotel?.id === h.id ? '2px solid #10b981' : '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                                                <input type="radio" name="hotel" checked={fixedServices.hotel?.id === h.id} onChange={() => setFixedServices({ ...fixedServices, hotel: h })} />
                                                <span><strong>{h.name}</strong> ({formatMoney(h.price)})</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                                        <h4>🚌 Chọn Phương Tiện Di Chuyển</h4>
                                        {allServices.transports.map(tr => (
                                            <label key={tr.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#fff', border: fixedServices.transport?.id === tr.id ? '2px solid #10b981' : '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                                                <input type="radio" name="transport" checked={fixedServices.transport?.id === tr.id} onChange={() => setFixedServices({ ...fixedServices, transport: tr })} />
                                                <span><strong>{tr.name}</strong> ({formatMoney(tr.price)})</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: LỊCH KHỞI HÀNH */}
                            {activeSubTab === 'departures' && (
                                <div>
                                    <button onClick={() => setDepartures([...departures, { departure_date: '', return_date: '', max_slots: 30 }])} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px' }}>+ Thêm ngày khởi hành</button>
                                    <table className="data-table">
                                        <thead><tr><th>Đợt</th><th>Ngày Khởi Hành</th><th>Ngày Về</th><th>Số Chỗ</th><th>Hành động</th></tr></thead>
                                        <tbody>
                                            {departures.map((dep, idx) => (
                                                <tr key={idx}>
                                                    <td>#{idx + 1}</td>
                                                    <td><input type="date" value={dep.departure_date} onChange={e => { const up = [...departures]; up[idx].departure_date = e.target.value; setDepartures(up); }} style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></td>
                                                    <td><input type="date" value={dep.return_date} onChange={e => { const up = [...departures]; up[idx].return_date = e.target.value; setDepartures(up); }} style={{ padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></td>
                                                    <td><input type="number" value={dep.max_slots} onChange={e => { const up = [...departures]; up[idx].max_slots = Number(e.target.value); setDepartures(up); }} style={{ width: '80px', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></td>
                                                    <td><button onClick={() => setDepartures(departures.filter((_, i) => i !== idx))} style={{ color: '#ef4444', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>🗑️ Xóa</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TourOperationalManager;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../index.css';

const TourOperationalManager = () => {
    const [tours, setTours] = useState([]);
    const [selectedTour, setSelectedTour] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Core states needed for Departures
    const [departures, setDepartures] = useState([]);
    const [guides, setGuides] = useState([]);

    // Hidden states needed to preserve Tour Designer data when saving
    const [itineraryDays, setItineraryDays] = useState([]);
    const [markupPercent, setMarkupPercent] = useState(20);
    const [baseCost, setBaseCost] = useState(0);
    const [basePrice, setBasePrice] = useState(0);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // 1. Fetch Approved/Active Tours
            const resTours = await axios.get('http://localhost:5000/api/tours/staff/tours', { headers });
            if (resTours.data.success) {
                const opsTours = (resTours.data.data || []).filter(t => t.status === 'Approved' || t.status === 'Active');
                setTours(opsTours);
            }

            // 2. Fetch Guides
            const resEmployees = await axios.get('http://localhost:5000/api/hr/employees', { headers });
            if (resEmployees.data.success) {
                const guideList = (resEmployees.data.data || []).filter(e => e.role_name === 'Tour Guide' && e.status === 'Active');
                setGuides(guideList);
            }
        } catch (error) { 
            console.error('Error fetching initial data', error); 
        }
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
                setDepartures(d.departures || []);
                
                // Preserve existing design configuration
                setItineraryDays(d.itineraryDays || []);
                setMarkupPercent(d.markup_percent || 20);
                setBaseCost(d.base_cost || 0);
                setBasePrice(d.base_price || 0);
            }
        } catch (e) { 
            alert("Lỗi tải thông tin tour!"); 
        } finally { 
            setLoading(false); 
        }
    };

    const formatMoney = (val) => Number(val || 0).toLocaleString('vi-VN') + ' ₫';

    const handleSaveDepartures = async () => {
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
                base_price: basePrice,
                itineraryDays: JSON.stringify(itineraryDays),
                departures: JSON.stringify(departures)
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (res.data.success) {
                alert(`🎉 Đã lưu cấu hình đợt khởi hành cho Tour: ${selectedTour.tour_name}`);
            }
        } catch (e) { 
            alert("Lỗi khi lưu lịch trình khởi hành!"); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleActivateTour = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn mở bán Tour này ra website không?')) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`http://localhost:5000/api/tours/admin/status/${selectedTour.tour_id}`, { status: 'Active' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                alert('🚀 Đã mở bán Tour thành công!');
                setSelectedTour({ ...selectedTour, status: 'Active' });
                setTours(tours.map(t => t.tour_id === selectedTour.tour_id ? { ...t, status: 'Active' } : t));
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi khi mở bán tour!');
        } finally {
            setLoading(false);
        }
    };

    const handleDepartureDateChange = (idx, value) => {
        const up = [...departures];
        up[idx].departure_date = value;
        
        // Tự động tính Ngày Về = Ngày Đi + (duration_days - 1)
        if (value && selectedTour?.duration_days) {
            const depDate = new Date(value);
            depDate.setDate(depDate.getDate() + (Number(selectedTour.duration_days) - 1));
            up[idx].return_date = depDate.toISOString().split('T')[0];
        }
        
        setDepartures(up);
    };

    // Hàm format Date sang dạng dd/mm/yyyy thân thiện
    const formatDateStr = (dateStr) => {
        if (!dateStr) return 'Chưa chọn';
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: '"Outfit", "Inter", sans-serif', background: '#f5f7fa' }}>
            <div className="page-header" style={{ marginBottom: '25px', padding: '0 10px' }}>
                <h2 style={{ fontSize: '28px', color: '#111827', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>🚀 Quản Lý Điều Hành</h2>
                <p style={{ color: '#4b5563', fontSize: '15px', margin: 0, fontWeight: '500' }}>Thiết lập lịch khởi hành và phân công Hướng dẫn viên chuyên nghiệp.</p>
            </div>

            <div style={{ flex: 1, display: 'flex', gap: '24px', width: '100%', height: 'calc(100vh - 140px)' }}>
                {/* LEFT COLUMN: Modern Tour List */}
                <div style={{ flex: '0 0 340px', display: 'flex', flexDirection: 'column', background: '#fff', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' }}>
                    <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', color: '#111827', fontWeight: '800', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Tất cả Tour</span>
                        <span style={{ background: '#0194f3', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>{tours.length}</span>
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', paddingRight: '4px' }}>
                        {tours.map(t => (
                            <div 
                                key={t.tour_id} 
                                onClick={() => handleSelectTour(t)} 
                                style={{ 
                                    padding: '16px', 
                                    borderRadius: '16px', 
                                    cursor: 'pointer', 
                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    background: selectedTour?.tour_id === t.tour_id ? '#0194f3' : '#fff',
                                    boxShadow: selectedTour?.tour_id === t.tour_id ? '0 10px 25px rgba(1, 148, 243, 0.3)' : '0 2px 10px rgba(0,0,0,0.02)',
                                    border: selectedTour?.tour_id === t.tour_id ? '1px solid #0194f3' : '1px solid #e5e7eb',
                                    transform: selectedTour?.tour_id === t.tour_id ? 'translateY(-2px)' : 'translateY(0)',
                                    color: selectedTour?.tour_id === t.tour_id ? '#fff' : '#111827'
                                }}
                            >
                                <strong style={{ display: 'block', fontSize: '16px', fontWeight: '700', marginBottom: '10px', lineHeight: '1.4' }}>
                                    {t.tour_name}
                                </strong>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '500', opacity: selectedTour?.tour_id === t.tour_id ? 0.9 : 0.6 }}>🕒 {t.duration_days} Ngày</span>
                                    <span style={{ 
                                        fontSize: '11px', 
                                        padding: '4px 10px', 
                                        borderRadius: '12px', 
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        background: t.status === 'Active' 
                                            ? (selectedTour?.tour_id === t.tour_id ? 'rgba(255,255,255,0.25)' : '#ecfdf5') 
                                            : (selectedTour?.tour_id === t.tour_id ? 'rgba(255,255,255,0.25)' : '#fffbeb'),
                                        color: t.status === 'Active' 
                                            ? (selectedTour?.tour_id === t.tour_id ? '#fff' : '#059669') 
                                            : (selectedTour?.tour_id === t.tour_id ? '#fff' : '#d97706')
                                    }}>
                                        {t.status === 'Active' ? 'Đang mở bán' : 'Chờ mở bán'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT COLUMN: Modern Cards Departures */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '24px', boxShadow: '0 4px 25px rgba(0,0,0,0.04)', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
                    {!selectedTour ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
                            <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.3 }}>🗺️</div>
                            <h3 style={{ fontWeight: '600', fontSize: '18px', color: '#6b7280' }}>Chọn một Tour để bắt đầu quản lý lịch chạy</h3>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            {/* Rich Header Area */}
                            <div style={{ padding: '32px', borderBottom: '1px solid #f3f4f6', background: 'linear-gradient(to right, #ffffff, #f8fafc)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', background: '#e0f2fe', color: '#0369a1', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        📍 {selectedTour.destination}
                                    </div>
                                    <h2 style={{ margin: '0 0 12px 0', fontSize: '26px', color: '#111827', fontWeight: '800', letterSpacing: '-0.5px' }}>{selectedTour.tour_name}</h2>
                                    <div style={{ fontSize: '16px', color: '#059669', fontWeight: '700' }}>
                                        Giá Niêm Yết: {formatMoney(basePrice)}
                                    </div>
                                </div>
                            </div>

                            {/* Content Area - Modern Cards */}
                            <div style={{ padding: '32px', flex: 1, overflowY: 'auto', background: '#f9fafb' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ margin: 0, fontSize: '20px', color: '#111827', fontWeight: '800' }}>Danh Sách Đợt Khởi Hành</h3>
                                    <button 
                                        onClick={() => setDepartures([{ departure_date: '', return_date: '', max_slots: 30 }, ...departures])} 
                                        style={{ padding: '12px 24px', background: '#fff', color: '#0194f3', border: '2px solid #e0f2fe', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                        Thêm Đợt
                                    </button>
                                </div>

                                {departures.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: '20px', border: '2px dashed #e5e7eb' }}>
                                        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📅</div>
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#374151' }}>Chưa có lịch chạy nào</h4>
                                        <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>Bấm thêm đợt để bắt đầu tạo các chuyến đi cho khách hàng.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
                                        {departures.map((dep, idx) => (
                                            <div key={idx} style={{ background: '#fff', borderRadius: '20px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.06)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.02)'; }}>
                                                {/* Card Header (Dates) */}
                                                <div style={{ padding: '20px', background: 'linear-gradient(to bottom, #f8fafc, #ffffff)', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Khởi Hành</div>
                                                        <input type="date" value={dep.departure_date} onChange={e => handleDepartureDateChange(idx, e.target.value)} style={{ padding: '0', border: 'none', background: 'transparent', width: '100%', fontFamily: 'inherit', color: '#111827', fontSize: '16px', fontWeight: '700', outline: 'none', cursor: 'pointer' }} />
                                                    </div>
                                                    
                                                    <div style={{ padding: '0 15px', color: '#cbd5e1' }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                                                    </div>

                                                    <div style={{ flex: 1, textAlign: 'right' }}>
                                                        <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ngày Về</div>
                                                        <div style={{ fontSize: '16px', fontWeight: '700', color: dep.return_date ? '#111827' : '#9ca3af' }}>
                                                            {formatDateStr(dep.return_date)}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card Body (Config) */}
                                                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    <div style={{ display: 'flex', gap: '16px' }}>
                                                        <div style={{ flex: '0 0 100px' }}>
                                                            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '8px' }}>SỐ KHÁCH</label>
                                                            <div style={{ display: 'flex', alignItems: 'center', background: '#f3f4f6', padding: '10px 14px', borderRadius: '12px' }}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                                                <input type="number" value={dep.max_slots} onChange={e => { const up = [...departures]; up[idx].max_slots = Number(e.target.value); setDepartures(up); }} style={{ width: '100%', border: 'none', background: 'transparent', fontFamily: 'inherit', color: '#111827', fontSize: '15px', fontWeight: '700', outline: 'none', textAlign: 'center' }} />
                                                            </div>
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '8px' }}>HƯỚNG DẪN VIÊN</label>
                                                            <div style={{ background: dep.guide_id ? '#e0f2fe' : '#f3f4f6', borderRadius: '12px', border: dep.guide_id ? '1px solid #bae6fd' : '1px solid transparent', transition: 'all 0.2s', height: '44px', display: 'flex', alignItems: 'center', padding: '0 14px' }}>
                                                                <select value={dep.guide_id || ''} onChange={e => { const up = [...departures]; up[idx].guide_id = e.target.value ? Number(e.target.value) : null; setDepartures(up); }} style={{ width: '100%', border: 'none', background: 'transparent', fontFamily: 'inherit', color: dep.guide_id ? '#0369a1' : '#4b5563', fontSize: '14px', fontWeight: '600', outline: 'none', cursor: 'pointer', appearance: 'none' }}>
                                                                    <option value="">Chưa phân công</option>
                                                                    {guides.map(g => (
                                                                        <option key={g.user_id} value={g.user_id}>{g.full_name}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button 
                                                        onClick={() => setDepartures(departures.filter((_, i) => i !== idx))} 
                                                        style={{ width: '100%', padding: '12px', background: '#fff', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                                        Gỡ Đợt Chạy Này
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Action Buttons at the Bottom */}
                                {departures.length > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                                        <button onClick={handleSaveDepartures} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: '#111827', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(17, 24, 39, 0.2)' }}>
                                            💾 Lưu Lịch Trình
                                        </button>
                                        {selectedTour.status === 'Approved' && (
                                            <button onClick={handleActivateTour} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: '#0194f3', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(1, 148, 243, 0.3)' }}>
                                                🚀 Mở Bán Tour
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TourOperationalManager;

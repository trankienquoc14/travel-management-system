import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../index.css';

const TourDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tour, setTour] = useState(null);
    const [selectedDeparture, setSelectedDeparture] = useState('');
    const [numPeople, setNumPeople] = useState(1);

    useEffect(() => {
        fetchTourDetail();
    }, [id]);

    const fetchTourDetail = async () => {
        try {
            const response = await axios.get(`http://localhost:5000/api/tours/${id}`);
            if (response.data.success) {
                // Bảo vệ dữ liệu trả về từ backend
                let data = response.data.data;
                while (Array.isArray(data)) data = data[0];
                setTour(data);
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi khi tải thông tin tour!');
        }
    };

    // Hàm chuyển hướng sang trang điền form Checkout
    const handleGoToBooking = () => {
        if (!selectedDeparture) {
            return alert('Vui lòng chọn ngày khởi hành!');
        }
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Bạn cần đăng nhập để đặt tour!');
            return navigate('/login');
        }

        const totalAmount = tour.base_price * numPeople;

        navigate('/booking-form', {
            state: {
                tour: tour,
                departureId: selectedDeparture,
                numPeople: numPeople,
                totalAmount: totalAmount
            }
        });
    };

    if (!tour) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Đang tải dữ liệu...</div>;

    // ==========================================
    // LOGIC XỬ LÝ ẢNH THÔNG MINH
    // ==========================================
    let finalImageUrl = 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2000';
    if (tour.image_url) {
        if (tour.image_url.startsWith('http')) {
            finalImageUrl = tour.image_url;
        } else {
            let imagePath = tour.image_url.startsWith('/') ? tour.image_url.substring(1) : tour.image_url;
            if (!imagePath.startsWith('uploads/')) {
                imagePath = `uploads/${imagePath}`;
            }
            finalImageUrl = `http://localhost:5000/${imagePath}`;
        }
    }
    const bgImage = finalImageUrl;

    // ==========================================
    // GIẢI MÃ DỮ LIỆU THIẾT KẾ (KÉO THẢ)
    // ==========================================
    let parsedDesign = null;
    if (tour.design_data) {
        try {
            parsedDesign = typeof tour.design_data === 'string' ? JSON.parse(tour.design_data) : tour.design_data;
        } catch (e) {
            console.error("Lỗi parse design_data", e);
        }
    }

    const durationCount = parsedDesign?.itineraryDays?.length || tour.itineraries?.length || 0;
    const totalAmount = tour.base_price * numPeople;

    return (
        <div className="tour-detail-page">
            <nav className="home-navbar">
                <div className="home-logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
                    Travel<span className="text-primary">ERP</span>
                </div>
                <button onClick={() => navigate('/home')} className="btn-outline">Quay lại</button>
            </nav>

            <div className="detail-hero" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${bgImage})` }}>
                <div className="detail-hero-content">
                    <span className="badge-location">📍 {tour.destination}</span>
                    <h1>{tour.tour_name}</h1>
                    <p>{tour.duration_days} Ngày | Trải nghiệm đẳng cấp</p>
                </div>
            </div>

            <div className="detail-container">
                <div className="detail-main">
                    <h2>Tổng quan chuyến đi</h2>
                    <p className="tour-desc" style={{ whiteSpace: 'pre-line', lineHeight: '1.8', color: '#475569' }}>
                        {tour.description || "Hãy cùng chúng tôi khám phá những trải nghiệm tuyệt vời nhất trong chuyến đi này!"}
                    </p>

                    <h2 className="mt-4" style={{ marginBottom: '20px' }}>Lịch trình chi tiết ({durationCount} ngày)</h2>

                    {/* HIỂN THỊ LỊCH TRÌNH */}
                    {parsedDesign ? (
                        <div className="modern-itinerary">
                            {/* Dịch vụ cố định */}
                            {parsedDesign.fixedServices && (
                                <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                                    <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <strong style={{ fontSize: '14px', color: '#64748b', display: 'block', marginBottom: '10px' }}>🏨 Dịch vụ Lưu trú</strong>
                                        {parsedDesign.fixedServices.accommodation?.length > 0 ?
                                            parsedDesign.fixedServices.accommodation.map(a => <div key={a.id} style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{a.name}</div>)
                                            : <span style={{ fontSize: '14px', color: '#94a3b8' }}>Tiêu chuẩn linh hoạt</span>
                                        }
                                    </div>
                                    <div style={{ flex: 1, background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <strong style={{ fontSize: '14px', color: '#64748b', display: 'block', marginBottom: '10px' }}>✈️ Phương tiện Di chuyển</strong>
                                        {parsedDesign.fixedServices.transport?.length > 0 ?
                                            parsedDesign.fixedServices.transport.map(t => <div key={t.id} style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{t.name}</div>)
                                            : <span style={{ fontSize: '14px', color: '#94a3b8' }}>Dịch vụ tiêu chuẩn cao</span>
                                        }
                                    </div>
                                </div>
                            )}

                            {/* Lịch trình từng ngày theo timeline */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {parsedDesign.itineraryDays.map((day) => (
                                    <div key={day.dayIndex} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 10px -2px rgba(0,0,0,0.05)' }}>
                                        <div style={{ background: '#ecfdf5', padding: '15px 20px', borderBottom: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: '800', color: '#047857', fontSize: '16px' }}>NGÀY {day.dayIndex} {day.title ? `- ${day.title}` : ''}</span>
                                            <span style={{ fontSize: '14px', color: '#059669', fontWeight: '700', backgroundColor: '#d1fae5', padding: '6px 12px', borderRadius: '20px' }}>🗓️ {day.dateString || `Ngày ${day.dayIndex}`}</span>
                                        </div>
                                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {['morning', 'noon', 'evening'].map(slot => {
                                                if (!day.slots[slot] || day.slots[slot].length === 0) return null;
                                                const slotConfig = {
                                                    morning: { icon: '🌅', name: 'BUỔI SÁNG', color: '#d97706', border: '#fde68a' },
                                                    noon: { icon: '☀️', name: 'BUỔI TRƯA', color: '#ea580c', border: '#fdba74' },
                                                    evening: { icon: '🌙', name: 'BUỔI TỐI', color: '#4f46e5', border: '#a5b4fc' }
                                                }[slot];
                                                return (
                                                    <div key={slot} style={{ display: 'flex', gap: '15px' }}>
                                                        <div style={{ width: '120px', flexShrink: 0, color: slotConfig.color, fontSize: '14px', fontWeight: '800', marginTop: '5px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                            <span style={{ fontSize: '18px' }}>{slotConfig.icon}</span> <span>{slotConfig.name}</span>
                                                        </div>
                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: `3px solid ${slotConfig.border}`, paddingLeft: '20px' }}>
                                                            {day.slots[slot].map((item, idx) => (
                                                                <div key={idx} style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', fontSize: '15px', color: '#334155', border: '1px solid #f1f5f9' }}>
                                                                    <strong style={{ display: 'block', marginBottom: '4px', color: '#0f172a' }}>{item.name}</strong>
                                                                    <span style={{ fontSize: '13px', color: '#64748b' }}>{item.type}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* FALLBACK CHO CÁC TOUR CŨ NHẬP BẰNG TAY (VD: Tour Phú Quốc) */
                        <div className="itinerary-list">
                            {tour.itineraries?.length > 0 ? tour.itineraries.map((it) => (
                                <div className="itinerary-item" key={it.itinerary_id}>
                                    <div className="day-badge">Ngày {it.day_number}</div>
                                    <div className="day-content">
                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>{it.title}</h3>
                                        <p style={{ color: '#475569', lineHeight: '1.6' }}>{it.description}</p>
                                    </div>
                                </div>
                            )) : <p style={{ color: '#64748b' }}>Lịch trình đang được cập nhật...</p>}
                        </div>
                    )}
                </div>

                <div className="detail-sidebar">
                    <div className="booking-card">
                        <div className="price-tag">
                            <span>Giá từ</span>
                            <h3>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tour.base_price)}<small>/khách</small></h3>
                        </div>

                        <div className="form-group">
                            <label>Chọn ngày khởi hành:</label>
                            <select value={selectedDeparture} onChange={(e) => setSelectedDeparture(e.target.value)}>
                                <option value="">-- Lịch khởi hành --</option>
                                {tour.departures?.map((dep) => (
                                    <option key={dep.departure_id} value={dep.departure_id}>
                                        {new Date(dep.departure_date).toLocaleDateString('vi-VN')} (Còn {dep.available_slots} chỗ)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Số lượng hành khách:</label>
                            <input type="number" min="1" max="20" value={numPeople} onChange={(e) => setNumPeople(e.target.value)} />
                        </div>

                        <div className="total-amount">
                            <span>Tổng tiền:</span>
                            <span className="text-price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}</span>
                        </div>

                        <button className="btn-confirm-booking" onClick={handleGoToBooking}>
                            Yêu cầu đặt Tour
                        </button>
                        <p className="booking-note">Bạn sẽ không bị trừ tiền cho đến khi nhân viên xác nhận lịch trình.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TourDetail;
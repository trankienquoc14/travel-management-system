import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../index.css'; // Đảm bảo CSS được áp dụng để không bị lỗi giao diện

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
                setTour(response.data.data);
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

        // Đẩy dữ liệu sang trang booking-form
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
    // LOGIC XỬ LÝ ẢNH THÔNG MINH (ĐÃ SỬA)
    // ==========================================
    let finalImageUrl = 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2000'; // Ảnh mặc định

    if (tour.image_url) {
        if (tour.image_url.startsWith('http')) {
            // Nếu Database lưu link online (vd: Phú Quốc đang lưu link Unsplash) -> Dùng luôn
            finalImageUrl = tour.image_url;
        } else {
            // Nếu Database chỉ lưu tên file (vd: da-lat.png) -> Tự động gắn /uploads/ vào
            let imagePath = tour.image_url.startsWith('/') ? tour.image_url.substring(1) : tour.image_url;
            if (!imagePath.startsWith('uploads/')) {
                imagePath = `uploads/${imagePath}`;
            }
            finalImageUrl = `http://localhost:5000/${imagePath}`;
        }
    }
    
    const bgImage = finalImageUrl;
    // ==========================================

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
                    <p className="tour-desc">{tour.description}</p>

                    <h2 className="mt-4">Lịch trình chi tiết ({tour.itineraries?.length || 0} ngày)</h2>
                    <div className="itinerary-list">
                        {tour.itineraries?.length > 0 ? tour.itineraries.map((it) => (
                            <div className="itinerary-item" key={it.itinerary_id}>
                                <div className="day-badge">Ngày {it.day_number}</div>
                                <div className="day-content">
                                    <h3>{it.title}</h3>
                                    <p>{it.description}</p>
                                </div>
                            </div>
                        )) : <p>Lịch trình đang được cập nhật...</p>}
                    </div>
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
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BookingForm = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Lấy dữ liệu được truyền từ trang TourDetail sang
    const bookingData = location.state;
    const [user, setUser] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [contactInfo, setContactInfo] = useState({
        fullName: '', phone: '', email: '', address: '', notes: ''
    });

    useEffect(() => {
        // Nếu không có dữ liệu truyền sang (do user F5 hoặc gõ link trực tiếp), đẩy về trang chủ
        if (!bookingData) {
            navigate('/home');
            return;
        }
        
        // Tự động điền thông tin khách hàng nếu đã đăng nhập
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setContactInfo({
                ...contactInfo,
                fullName: parsedUser.fullName || '',
                email: parsedUser.email || ''
            });
        }
    }, [navigate, bookingData]);

    const handleInputChange = (e) => {
        setContactInfo({ ...contactInfo, [e.target.name]: e.target.value });
    };

    const submitBooking = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const token = localStorage.getItem('token');

        try {
            // Gọi API lưu đơn hàng vào DB
            const response = await axios.post('http://localhost:5000/api/bookings', {
                departure_id: bookingData.departureId,
                num_people: bookingData.numPeople,
                total_amount: bookingData.totalAmount,
                // Thực tế bạn có thể truyền thêm contactInfo xuống Backend để lưu vào bảng khách hàng
                notes: contactInfo.notes 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                alert('🎉 Tuyệt vời! Bạn đã đặt tour thành công. Chúng tôi sẽ liên hệ sớm nhất.');
                navigate('/my-bookings'); // Đẩy về trang Đơn hàng của tôi
            }
        } catch (error) {
            alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!bookingData) return null;

    const { tour, numPeople, totalAmount } = bookingData;
    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    return (
        <div className="checkout-page">
            <nav className="home-navbar">
                <div className="home-logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
                    Travel<span className="text-primary">ERP</span>
                </div>
                <button onClick={() => navigate(-1)} className="btn-outline">Quay lại chi tiết</button>
            </nav>

            <div className="checkout-container">
                {/* Cột trái: Form thông tin */}
                <div className="checkout-main">
                    <div className="checkout-steps">
                        <span className="step active">1. Điền thông tin</span>
                        <span className="step-divider"></span>
                        <span className="step">2. Thanh toán</span>
                    </div>

                    <form onSubmit={submitBooking} className="checkout-form">
                        <div className="form-section">
                            <h2>Thông tin liên hệ</h2>
                            <p className="section-desc">Hệ thống sẽ sử dụng thông tin này để gửi xác nhận và liên hệ trong chuyến đi.</p>
                            
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Họ và Tên *</label>
                                    <input type="text" name="fullName" value={contactInfo.fullName} onChange={handleInputChange} required placeholder="VD: Nguyễn Văn A" />
                                </div>
                                <div className="form-group">
                                    <label>Số điện thoại *</label>
                                    <input type="tel" name="phone" value={contactInfo.phone} onChange={handleInputChange} required placeholder="VD: 0901234567" />
                                </div>
                                <div className="form-group full-width">
                                    <label>Email *</label>
                                    <input type="email" name="email" value={contactInfo.email} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group full-width">
                                    <label>Địa chỉ</label>
                                    <input type="text" name="address" value={contactInfo.address} onChange={handleInputChange} placeholder="Số nhà, Tên đường, Quận/Huyện, Tỉnh/TP" />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h2>Yêu cầu đặc biệt</h2>
                            <div className="form-group full-width">
                                <textarea name="notes" value={contactInfo.notes} onChange={handleInputChange} rows="4" placeholder="Ví dụ: Ăn chay, có trẻ nhỏ, yêu cầu phòng tầng thấp..."></textarea>
                            </div>
                        </div>

                        <div className="checkout-actions">
                            <button type="submit" className="btn-submit-order" disabled={isSubmitting}>
                                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Đặt Tour'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Cột phải: Tóm tắt đơn hàng (Giống hệt Vietravel/Traveloka) */}
                <div className="checkout-sidebar">
                    <div className="order-summary-card">
                        <h2>Tóm tắt chuyến đi</h2>
                        <div className="summary-tour-info">
                            <img src={tour.image_url || 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=500'} alt="Tour" />
                            <div className="summary-tour-text">
                                <h3>{tour.tour_name}</h3>
                                <span>📍 {tour.destination} | 🕒 {tour.duration_days} Ngày</span>
                            </div>
                        </div>

                        <div className="summary-details">
                            <div className="summary-row">
                                <span>Hành khách:</span>
                                <strong>{numPeople} người lớn</strong>
                            </div>
                            <div className="summary-row">
                                <span>Loại phòng:</span>
                                <strong>Tiêu chuẩn (2 người/phòng)</strong>
                            </div>
                        </div>

                        <div className="summary-pricing">
                            <div className="summary-row">
                                <span>Giá tour cơ bản ({numPeople}x)</span>
                                <span>{formatCurrency(tour.base_price * numPeople)}</span>
                            </div>
                            <div className="summary-row discount">
                                <span>Mã giảm giá</span>
                                <span>- 0 ₫</span>
                            </div>
                            <div className="summary-total">
                                <span>Tổng cộng</span>
                                <span className="total-price">{formatCurrency(totalAmount)}</span>
                            </div>
                        </div>
                        
                        <div className="secure-badge">
                            🔒 Thông tin của bạn được bảo mật tuyệt đối
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingForm;
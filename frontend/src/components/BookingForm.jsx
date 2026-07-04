import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BookingForm = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Nhận dữ liệu truyền sang từ TourDetail hoặc CustomerQuotes
    const bookingData = location.state;
    const [user, setUser] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state thông tin
    const [contactInfo, setContactInfo] = useState({
        fullName: '', phone: '', email: '', address: '', notes: ''
    });

    // 🚀 STATE PHƯƠNG THỨC THANH TOÁN (Mặc định chọn QR Code)
    const [paymentMethod, setPaymentMethod] = useState('VNPAY_QR'); // 'VNPAY_QR' hoặc 'Cash'

    useEffect(() => {
        if (!bookingData) {
            navigate('/home');
            return;
        }

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setContactInfo(prev => ({
                ...prev,
                fullName: parsedUser.fullName || '',
                email: parsedUser.email || '',
                phone: parsedUser.phone || ''
            }));
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
            if (bookingData.isCustomTour) {
                // 1. GỌI API CHO TOUR THIẾT KẾ RIÊNG
                const response = await axios.post(
                    `http://localhost:5000/api/custom-tours/quotes/${bookingData.quoteData.quote_id}/book`,
                    {
                        payment_method: paymentMethod,
                        notes: contactInfo.notes
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data.success) {
                    if (paymentMethod === 'Cash') {
                        alert('💵 Đặt tour thành công! Vui lòng đến văn phòng TravelERP để thanh toán tiền mặt. Đơn hàng sẽ chờ nhân viên văn phòng xác nhận!');
                    } else {
                        alert('📸 Đặt tour thành công! Hệ thống chuyển sang trang Đơn Hàng để bạn quét mã QR thanh toán.');
                    }
                    navigate('/my-bookings');
                }
            } else {
                // 2. GỌI API CHO TOUR TRỌN GÓI BÌNH THƯỜNG
                const response = await axios.post('http://localhost:5000/api/bookings', {
                    departure_id: bookingData.departureId,
                    num_people: bookingData.numPeople,
                    total_amount: bookingData.totalAmount,
                    payment_method: paymentMethod, // Truyền phương thức thanh toán
                    notes: contactInfo.notes
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.success) {
                    if (paymentMethod === 'Cash') {
                        alert('💵 Đặt tour thành công! Vui lòng đến văn phòng TravelERP để thanh toán tiền mặt.');
                    } else {
                        alert('📸 Đặt tour thành công! Chuyển sang trang Đơn Hàng để quét mã QR.');
                    }
                    navigate('/my-bookings');
                }
            }
        } catch (error) {
            alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!bookingData) return null;

    // Chuẩn hóa dữ liệu tóm tắt cho cả 2 trường hợp (Tour ghép vs Tour tự thiết kế)
    const isCustom = bookingData.isCustomTour;
    const quote = bookingData.quoteData;
    const tour = bookingData.tour;

    const title = isCustom ? `✨ Tour thiết kế riêng: ${quote.destination}` : tour?.tour_name;
    const numPeople = isCustom ? quote.people_count : bookingData.numPeople;
    const totalAmount = isCustom ? (quote.quoted_price || quote.quote_price) : bookingData.totalAmount;
    const bgImage = isCustom
        ? 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600'
        : (tour?.image_url || 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=500');

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

    return (
        <div className="checkout-page">
            <nav className="home-navbar">
                <div className="home-logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
                    Travel<span className="text-primary">ERP</span>
                </div>
                <button onClick={() => navigate(-1)} className="btn-outline">Quay lại</button>
            </nav>

            <div className="checkout-container">
                {/* Cột trái: Form thông tin & Chọn thanh toán */}
                <div className="checkout-main">
                    <div className="checkout-steps">
                        <span className="step active">1. Điền thông tin</span>
                        <span className="step-divider"></span>
                        <span className="step active">2. Chọn thanh toán</span>
                    </div>

                    <form onSubmit={submitBooking} className="checkout-form">
                        <div className="form-section">
                            <h2>Thông tin liên hệ hành khách</h2>
                            <p className="section-desc">Hệ thống sẽ sử dụng thông tin này để gửi xác nhận hợp đồng và liên hệ trong chuyến đi.</p>

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

                        {/* 🚀 KHU VỰC CHỌN PHƯƠNG THỨC THANH TOÁN */}
                        <div className="form-section">
                            <h2>💳 Phương thức thanh toán</h2>
                            <p className="section-desc">Vui lòng chọn hình thức thanh toán thuận tiện nhất cho bạn.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {/* Option 1: Quét QR */}
                                <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '16px', border: paymentMethod === 'VNPAY_QR' ? '2px solid #FF5E1F' : '1px solid #cbd5e1', borderRadius: '12px', background: paymentMethod === 'VNPAY_QR' ? '#fff7ed' : '#fff', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        checked={paymentMethod === 'VNPAY_QR'}
                                        onChange={() => setPaymentMethod('VNPAY_QR')}
                                    />
                                    <div>
                                        <strong style={{ fontSize: '16px', color: '#0f172a', display: 'block' }}>📸 Chuyển khoản / Quét mã VietQR (Khuyên dùng)</strong>
                                        <span style={{ fontSize: '13px', color: '#64748b' }}>Hệ thống tự động xướng đơn 24/7 ngay sau khi ngân hàng nhận được tiền chuyển khoản.</span>
                                    </div>
                                </label>

                                {/* Option 2: Tiền mặt */}
                                <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '16px', border: paymentMethod === 'Cash' ? '2px solid #FF5E1F' : '1px solid #cbd5e1', borderRadius: '12px', background: paymentMethod === 'Cash' ? '#fff7ed' : '#fff', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        checked={paymentMethod === 'Cash'}
                                        onChange={() => setPaymentMethod('Cash')}
                                    />
                                    <div>
                                        <strong style={{ fontSize: '16px', color: '#0f172a', display: 'block' }}>💵 Thanh toán Tiền mặt tại văn phòng</strong>
                                        <span style={{ fontSize: '13px', color: '#64748b' }}>Bạn đến trực tiếp trụ sở công ty để đóng tiền. Đơn hàng sẽ chờ Nhân viên Văn Phòng xác nhận.</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="form-section">
                            <h2>Yêu cầu đặc biệt</h2>
                            <div className="form-group full-width">
                                <textarea name="notes" value={contactInfo.notes} onChange={handleInputChange} rows="3" placeholder="Ví dụ: Ăn chay, đoàn có người già/trẻ nhỏ, yêu cầu phòng tầng thấp..."></textarea>
                            </div>
                        </div>

                        <div className="checkout-actions">
                            <button type="submit" className="btn-submit-order" disabled={isSubmitting}>
                                {isSubmitting ? '⏳ Đang xử lý...' : 'Xác Nhận Đặt Tour & Hoàn Tất ➔'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Cột phải: Tóm tắt đơn hàng */}
                <div className="checkout-sidebar">
                    <div className="order-summary-card">
                        <h2>📌 Tóm tắt chuyến đi</h2>
                        <div className="summary-tour-info">
                            <img src={bgImage} alt="Tour" />
                            <div className="summary-tour-text">
                                <h3 style={{ fontSize: '16px' }}>{title}</h3>
                                <span>👥 {numPeople} hành khách</span>
                            </div>
                        </div>

                        <div className="summary-details">
                            <div className="summary-row">
                                <span>Hình thức tour:</span>
                                <strong>{isCustom ? 'Thiết kế theo yêu cầu' : 'Tour trọn gói'}</strong>
                            </div>
                            {isCustom && (
                                <div className="summary-row">
                                    <span>Lịch trình:</span>
                                    <strong>{new Date(quote.departure_date).toLocaleDateString('vi-VN')}</strong>
                                </div>
                            )}
                        </div>

                        <div className="summary-pricing">
                            <div className="summary-row">
                                <span>Giá tour dịch vụ ({numPeople}x)</span>
                                <span>{formatCurrency(totalAmount)}</span>
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
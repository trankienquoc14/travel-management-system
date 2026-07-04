import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchMyBookings(token);
    }, [navigate]);

    const fetchMyBookings = async (token) => {
        try {
            const response = await axios.get('http://localhost:5000/api/bookings/my-bookings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setBookings(response.data.data);
            }
        } catch (error) {
            console.error("Lỗi tải đơn hàng:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Hàm render nhãn trạng thái đơn hàng
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'Pending': return <span className="status-badge warning">⏳ Đang chờ duyệt</span>;
            case 'Confirmed': return <span className="status-badge success">✅ Đã xác nhận</span>;
            case 'Cancelled': return <span className="status-badge danger">❌ Đã hủy</span>;
            default: return <span className="status-badge default">{status}</span>;
        }
    };

    // Hàm render nhãn trạng thái thanh toán
    const renderPaymentBadge = (status) => {
        if (status === 'Paid') return <span className="payment-badge success">Đã thanh toán</span>;
        return <span className="payment-badge danger">Chưa thanh toán</span>;
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Đang tải dữ liệu...</div>;

    return (
        <div className="my-bookings-page">
            <nav className="home-navbar">
                <div className="home-logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
                    Travel<span className="text-primary">ERP</span>
                </div>
                <button onClick={() => navigate('/home')} className="btn-outline">Về trang chủ</button>
            </nav>

            <div className="bookings-container">
                <div className="page-header-title">
                    <h2>Đơn hàng của tôi</h2>
                    <p>Quản lý và theo dõi các chuyến đi bạn đã đặt.</p>
                </div>

                {bookings.length === 0 ? (
                    <div className="empty-state">
                        <img src="https://img.icons8.com/clouds/100/null/sad-cloud.png" alt="Trống" />
                        <h3>Bạn chưa đặt chuyến đi nào</h3>
                        <button className="btn-primary" onClick={() => navigate('/home')}>Khám phá Tour ngay</button>
                    </div>
                ) : (
                    <div className="bookings-list">
                        {bookings.map(booking => {
                            const bgImage = booking.image_url || 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=1000';

                            return (
                                <div className="booking-card-item" key={booking.booking_id}>
                                    <div className="booking-img" style={{ backgroundImage: `url(${bgImage})` }}></div>
                                    <div className="booking-details">
                                        <div className="booking-header">
                                            <h3>{booking.tour_name}</h3>
                                            <div className="booking-badges">
                                                {renderStatusBadge(booking.booking_status)}
                                                {renderPaymentBadge(booking.payment_status)}
                                            </div>
                                        </div>

                                        <div className="booking-meta">
                                            <p><strong>Mã đơn:</strong> #BKG-{booking.booking_id.toString().padStart(4, '0')}</p>
                                            <p><strong>Ngày khởi hành:</strong> {new Date(booking.departure_date).toLocaleDateString('vi-VN')}</p>
                                            <p><strong>Số lượng:</strong> {booking.num_people} hành khách</p>
                                        </div>

                                        <div className="booking-footer">
                                            <div className="booking-total">
                                                <span>Tổng tiền:</span>
                                                <span className="price">{formatCurrency(booking.total_amount)}</span>
                                            </div>

                                            {/* Nút thanh toán chỉ hiện khi đơn chưa thanh toán và không bị hủy */}
                                            {booking.payment_status === 'Unpaid' && booking.booking_status !== 'Cancelled' && (
                                                <button className="btn-pay-now">Thanh toán ngay</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyBookings;
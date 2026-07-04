import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // 🚀 Đã thêm import Link
import axios from 'axios';
import '../index.css'; // Đảm bảo luôn import CSS

const HomePage = () => {
    const [user, setUser] = useState(null);
    const [tours, setTours] = useState([]);
    const navigate = useNavigate();

    // 🚀 ĐÃ BỔ SUNG: Khai báo roleId để React biết nó là gì
    const roleId = Number(localStorage.getItem('roleId')) || JSON.parse(localStorage.getItem('user'))?.role_id;

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        fetchTours();
    }, []);

    const fetchTours = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/tours');
            if (response.data.success) {
                setTours(response.data.data);
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách tour:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // ==========================================
    // HÀM XỬ LÝ ẢNH THÔNG MINH CHO TRANG CHỦ
    // ==========================================
    const getImageUrl = (url) => {
        if (!url) return 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2000'; // Ảnh mặc định
        if (url.startsWith('http')) return url; // Link online

        // Xử lý ảnh tải về máy (tự động ghép domain và thư mục uploads)
        let imagePath = url.startsWith('/') ? url.substring(1) : url;
        if (!imagePath.startsWith('uploads/')) {
            imagePath = `uploads/${imagePath}`;
        }
        return `http://localhost:5000/${imagePath}`;
    };
    // ==========================================

    return (
        <div className="homepage-container">
            {/* 1. NAVBAR */}
            <nav className="home-navbar">
                <div className="home-logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
                    Travel<span className="text-primary">ERP</span>
                </div>
                <ul className="home-menu">
                    <li className="active" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>Khám phá</li>
                    <li onClick={() => navigate('/my-bookings')} style={{ cursor: 'pointer' }}>Đơn hàng của tôi</li>

                    {/* Menu dành cho Khách hàng xem danh sách Báo giá (Chỉ hiện khi đã đăng nhập) */}
                    {user && (
                        <li onClick={() => navigate('/my-quotes')} style={{ cursor: 'pointer'}}>
                            Báo giá thiết kế
                        </li>
                    )}

                    <li>
                        <Link to="/build-tour" className="menu-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                            Tự thiết kế Tour
                        </Link>
                    </li>
                    <li>Khuyến mãi</li>
                </ul>
                <div className="home-user-actions">
                    {user ? (
                        <>
                            <div className="user-info">
                                <div className="user-avatar">{user.fullName.charAt(0)}</div>
                                <span>{user.fullName}</span>
                            </div>
                            <button onClick={handleLogout} className="btn-outline">Đăng xuất</button>
                        </>
                    ) : (
                        <button onClick={() => navigate('/login')} className="btn-primary">Đăng nhập</button>
                    )}
                </div>
            </nav>

            {/* 2. HERO BANNER & SEARCH */}
            <div className="hero-wrapper">
                <header className="home-hero">
                    <div className="hero-overlay">
                        <h1>Thế giới bao la, chờ bạn khám phá</h1>
                        <p>Hàng ngàn tour du lịch, khách sạn và dịch vụ đang chờ bạn với mức giá tốt nhất.</p>
                    </div>
                </header>

                <div className="search-widget-container">
                    <div className="search-widget">
                        <div className="search-field">
                            <label>📍 Điểm đến</label>
                            <input type="text" placeholder="Thành phố, địa danh..." />
                        </div>
                        <div className="search-field divider">
                            <label>📅 Ngày khởi hành</label>
                            <input type="date" />
                        </div>
                        <div className="search-field divider">
                            <label>👥 Hành khách</label>
                            <input type="text" placeholder="2 người lớn, 0 trẻ em" />
                        </div>
                        <button className="btn-search-primary">🔍 Tìm kiếm</button>
                    </div>
                </div>
            </div>

            {/* 3. QUICK ACCESS */}
            <section className="quick-access">
                {['Tour Trong Nước', 'Tour Quốc Tế', 'Khách Sạn', 'Vé Máy Bay', 'Thuê Xe', 'Thiết Kế Riêng'].map((item, index) => (
                    <div className="access-item" key={index}>
                        <div className={`access-icon-modern icon-${index + 1}`}></div>
                        <span>{item}</span>
                    </div>
                ))}
            </section>

            {/* 4. TOUR THỊNH HÀNH */}
            <section className="home-section bg-gray-light">
                <div className="section-container">
                    <div className="section-header">
                        <h2>🔥 Điểm đến thịnh hành</h2>
                        <button className="btn-view-all">Xem tất cả</button>
                    </div>
                    <div className="tour-grid">
                        {tours.map((tour) => {
                            const bgImage = getImageUrl(tour.image_url);

                            return (
                                <div className="tour-card" key={tour.tour_id}>
                                    {tour.base_price < 4000000 && <div className="tour-badge">Khuyến mãi HOT</div>}
                                    <div className="tour-img" style={{ backgroundImage: `url(${bgImage})` }}></div>
                                    <div className="tour-info">
                                        <div className="tour-meta">
                                            <span className="tour-location">📍 {tour.destination || 'Đang cập nhật'}</span>
                                            <span className="tour-duration">🕒 {tour.duration_days} Ngày</span>
                                        </div>
                                        <h3 className="tour-title">{tour.tour_name}</h3>
                                        <div className="tour-rating">⭐⭐⭐⭐⭐ <span>(Tốt)</span></div>
                                        <div className="tour-price-row">
                                            <span className="new-price">{formatCurrency(tour.base_price)}</span>
                                            <button className="btn-book" onClick={() => navigate(`/tour/${tour.tour_id}`)}>
                                                Xem chi tiết
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 5. DỊCH VỤ KÈM THEO */}
            <section className="home-section">
                <div className="section-container">
                    <div className="section-header">
                        <h2>🏨 Dịch vụ kèm theo tiện ích</h2>
                        <p className="section-sub">Hoàn thiện chuyến đi của bạn với các dịch vụ từ đối tác uy tín.</p>
                    </div>
                    <div className="services-grid">
                        <div className="service-card" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000')" }}>
                            <div className="service-content">
                                <h3>Khách sạn & Resort</h3>
                                <p>Giảm đến 20% khi đặt kèm Tour</p>
                                <button>Tìm phòng ngay</button>
                            </div>
                        </div>
                        <div className="service-card" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1000')" }}>
                            <div className="service-content">
                                <h3>Thuê xe tự lái & Đưa đón</h3>
                                <p>Đa dạng dòng xe, tài xế bản địa</p>
                                <button>Thuê xe ngay</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. BANNER THIẾT KẾ TOUR */}
            <section className="custom-tour-banner">
                <div className="banner-content">
                    <h2>Bạn muốn một lịch trình độc nhất?</h2>
                    <p>Đội ngũ của chúng tôi sẵn sàng thiết kế Tour theo đúng sở thích, ngân sách và thời gian của riêng bạn.</p>
                    <button className="btn-custom-cta" onClick={() => navigate('/build-tour')}>
                        Gửi yêu cầu thiết kế riêng
                    </button>
                </div>
            </section>

            {/* 7. FOOTER */}
            <footer className="home-footer">
                <div className="footer-container">
                    <div className="footer-col">
                        <h2 className="footer-logo">Travel<span className="text-primary">ERP</span></h2>
                        <p>Hệ thống quản lý và vận hành du lịch toàn diện. Mang đến trải nghiệm tuyệt vời nhất cho khách hàng.</p>
                    </div>
                    <div className="footer-col">
                        <h4>Về chúng tôi</h4>
                        <ul><li>Giới thiệu</li><li>Tuyển dụng</li><li>Chính sách bảo mật</li></ul>
                    </div>
                    <div className="footer-col">
                        <h4>Hỗ trợ khách hàng</h4>
                        <ul><li>Hướng dẫn đặt tour</li><li>Câu hỏi thường gặp</li><li>Liên hệ: 1900 1234</li></ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 TravelERP System. Tự hào đồng hành cùng bạn.</p>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
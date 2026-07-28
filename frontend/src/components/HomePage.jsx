import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import CustomerNavbar from './CustomerNavbar';
import '../index.css';

const HomePage = () => {
    const [user, setUser] = useState(null);
    const [tours, setTours] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Tất cả');
    const [dateFilter, setDateFilter] = useState('');
    const navigate = useNavigate();

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
        setUser(null);
        navigate('/login');
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const getImageUrl = (url) => {
        if (!url) return 'https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?q=80&w=2000';
        if (url.startsWith('http')) return url;

        let imagePath = url.startsWith('/') ? url.substring(1) : url;
        if (!imagePath.startsWith('uploads/')) {
            imagePath = `uploads/${imagePath}`;
        }
        return `http://localhost:5000/${imagePath}`;
    };

    // Bộ lọc Tour thông minh theo Tìm kiếm & Danh mục
    const filteredTours = tours.filter(tour => {
        const matchSearch = searchTerm === '' || 
            tour.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tour.tour_name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchCat = selectedCategory === 'Tất cả' ||
            (selectedCategory === 'Đà Lạt' && tour.destination?.includes('Đà Lạt')) ||
            (selectedCategory === 'Phú Quốc' && tour.destination?.includes('Phú Quốc')) ||
            (selectedCategory === 'Sapa' && tour.destination?.includes('Sapa')) ||
            (selectedCategory === 'Giá Tốt' && tour.base_price <= 4000000);

        return matchSearch && matchCat;
    });

    return (
        <div className="homepage-container">
            
            {/* 1. NAVBAR GIAO DIỆN GLASSMORPHISM KÈM DROPDOWN USER */}
            <CustomerNavbar activeTab="home" />

            {/* 2. HERO BANNER & SEARCH BAR HOÀN HẢO */}
            <div className="hero-wrapper">
                <header className="home-hero">
                    <div className="hero-overlay">
                        <span className="hero-badge">🌟 Khám phá 1,000+ điểm đến hàng đầu 2026</span>
                        <h1>Hành Trình Trong Mơ, Kỷ Niệm Vô Giá</h1>
                        <p>Trải nghiệm các tour du lịch đẳng cấp, thiết kế cá nhân hóa và ưu đãi đặc quyền độc bản.</p>
                    </div>
                </header>

                <div className="search-widget-container">
                    <div className="search-widget">
                        <div className="search-field">
                            <label>📍 Điểm đến</label>
                            <input 
                                type="text" 
                                placeholder="Thành phố, địa danh (Đà Lạt, Phú Quốc, Sapa...)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="search-field divider">
                            <label>📅 Ngày khởi hành</label>
                            <input 
                                type="date" 
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        </div>
                        <div className="search-field divider">
                            <label>👥 Hành khách</label>
                            <input type="text" placeholder="2 người lớn, 0 trẻ em" readOnly />
                        </div>
                        <button 
                            className="btn-search-primary"
                            onClick={() => {
                                const section = document.getElementById('tour-showcase');
                                if (section) section.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            🔍 Tìm kiếm
                        </button>
                    </div>
                </div>
            </div>

            {/* 3. THANH THỐNG KÊ UY TÍN (TRUST COUNTER) */}
            <div className="trust-stats-bar">
                <div className="stat-item">
                    <span className="stat-icon">⭐</span>
                    <div>
                        <strong>4.9 / 5.0</strong>
                        <span>15,000+ Đánh giá hài lòng</span>
                    </div>
                </div>
                <div className="stat-item border-left">
                    <span className="stat-icon">✈️</span>
                    <div>
                        <strong>500+ Chuyến đi</strong>
                        <span>Được tổ chức hàng tháng</span>
                    </div>
                </div>
                <div className="stat-item border-left">
                    <span className="stat-icon">🛡️</span>
                    <div>
                        <strong>100% Bảo hiểm</strong>
                        <span>Bảo vệ toàn diện cho đoàn</span>
                    </div>
                </div>
                <div className="stat-item border-left">
                    <span className="stat-icon">🤝</span>
                    <div>
                        <strong>24/7 Tư vấn</strong>
                        <span>Hỗ trợ trực tiếp 24/7</span>
                    </div>
                </div>
            </div>

            {/* 4. QUICK ACCESS DANH MỤC KHÁM PHÁ */}
            <section className="quick-access-section">
                <div className="section-title-center">
                    <h2>🌈 Khám phá theo nhu cầu chuyến đi</h2>
                    <p>Lựa chọn loại hình du lịch phù hợp nhất cho gia đình và bạn bè</p>
                </div>
                
                <div className="quick-access-grid">
                    {[
                        { title: 'Tour Trong Nước', icon: '⛰️', desc: 'Đà Lạt, Sapa, Phú Quốc', bg: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', cat: 'Tất cả' },
                        { title: 'Tour Biển Đảo', icon: '🏖️', desc: 'Phú Quốc, Nha Trang', bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', cat: 'Phú Quốc' },
                        { title: 'Nghỉ Dưỡng Mát Mẻ', icon: '🌲', desc: 'Đà Lạt, Sapa', bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', cat: 'Đà Lạt' },
                        { title: 'Tour Giá Tiết Kiệm', icon: '🔥', desc: 'Ưu đãi dưới 4,000,000đ', bg: 'linear-gradient(135deg, #fee2e2 0%, #fca5a5 100%)', cat: 'Giá Tốt' },
                        { title: 'Tự Thiết Kế Tour', icon: '🎨', desc: 'Tùy chỉnh lịch trình theo ý bạn', bg: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)', isBuild: true }
                    ].map((item, index) => (
                        <div 
                            className="access-card-modern" 
                            key={index}
                            style={{ background: item.bg }}
                            onClick={() => {
                                if (item.isBuild) {
                                    navigate('/build-tour');
                                } else {
                                    setSelectedCategory(item.cat);
                                    const section = document.getElementById('tour-showcase');
                                    if (section) section.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                        >
                            <span className="access-emoji">{item.icon}</span>
                            <h4>{item.title}</h4>
                            <p>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* 5. TOUR THỊNH HÀNH SHOWCASE */}
            <section className="home-section bg-gray-light" id="tour-showcase">
                <div className="section-container">
                    <div className="section-header-flex">
                        <div>
                            <h2>🔥 Điểm đến thịnh hành & Nổi bật</h2>
                            <p className="section-sub">Những hành trình được khách hàng lựa chọn nhiều nhất trong mùa du lịch này.</p>
                        </div>

                        {/* Bộ lọc Tab chọn nhanh */}
                        <div className="category-tabs">
                            {['Tất cả', 'Đà Lạt', 'Phú Quốc', 'Sapa', 'Giá Tốt'].map((cat) => (
                                <button 
                                    key={cat}
                                    className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Danh sách Tour Grid */}
                    <div className="tour-grid">
                        {filteredTours.length === 0 ? (
                            <div className="no-tour-found">
                                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
                                <h3>Không tìm thấy tour phù hợp</h3>
                                <p>Rất tiếc, không có chuyến đi nào phù hợp với từ khóa "{searchTerm}". Vui lòng thử lại với từ khóa khác!</p>
                                <button 
                                    onClick={() => { setSearchTerm(''); setSelectedCategory('Tất cả'); }}
                                    className="btn-reset-filter"
                                >
                                    Xem tất cả tour
                                </button>
                            </div>
                        ) : (
                            filteredTours.map((tour) => {
                                const bgImage = getImageUrl(tour.image_url);

                                return (
                                    <div className="tour-card" key={tour.tour_id}>
                                        <div className="tour-img-wrapper">
                                            <div className="tour-img" style={{ backgroundImage: `url(${bgImage})` }}></div>
                                            {tour.base_price <= 4000000 && <div className="tour-badge-hot">🔥 Ưu đãi HOT</div>}
                                            <span className="tour-duration-badge">⏱️ {tour.duration_days} Ngày</span>
                                        </div>

                                        <div className="tour-info">
                                            <div className="tour-meta">
                                                <span className="tour-location">📍 {tour.destination || 'Việt Nam'}</span>
                                                <span className="tour-rating">⭐ 4.9 (128)</span>
                                            </div>

                                            <h3 className="tour-title">{tour.tour_name}</h3>
                                            
                                            <div className="tour-price-row">
                                                <div className="price-block">
                                                    <span className="price-label">Giá từ</span>
                                                    <span className="new-price">{formatCurrency(tour.base_price)}</span>
                                                </div>
                                                <button className="btn-book" onClick={() => navigate(`/tour/${tour.tour_id}`)}>
                                                    Khám phá ➡️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>

            {/* 6. BANNER TỰ THIẾT KẾ TOUR RỰC RỠ */}
            <section className="custom-tour-banner">
                <div className="banner-overlay-dark">
                    <div className="banner-content">
                        <span className="banner-tag">🎨 Dịch vụ cao cấp</span>
                        <h2>Bạn muốn một chuyến đi độc nhất theo phong cách riêng?</h2>
                        <p>Tùy chọn khách sạn, phương tiện di chuyển, điểm tham quan và dịch vụ ăn uống chỉ trong 2 phút.</p>
                        <button className="btn-custom-cta" onClick={() => navigate('/build-tour')}>
                            🎨 Bắt đầu tự thiết kế Tour ngay ➡️
                        </button>
                    </div>
                </div>
            </section>

            {/* 7. ĐÁNH GIÁ TỪ KHÁCH HÀNG (REVIEWS) */}
            <section className="home-section">
                <div className="section-container">
                    <div className="section-title-center">
                        <h2>💬 Khách hàng nói gì về TravelERP?</h2>
                        <p>Hơn 15,000 hành khách đã đồng hành và trải nghiệm dịch vụ tuyệt vời của chúng tôi</p>
                    </div>

                    <div className="reviews-grid">
                        {[
                            { name: 'Nguyễn Thị Hồng', tour: 'Tour Phú Quốc 3N2Đ', text: 'Chuyến đi Phú Quốc cùng gia đình thực sự tuyệt vời. Hướng dẫn viên nhiệt tình, lịch trình siêu hợp lý và khách sạn rất đẹp!', avatar: '👩' },
                            { name: 'Trần Anh Tuấn', tour: 'Tour Tự Thiết Kế Đà Lạt', text: 'Tự thiết kế tour trên hệ thống TravelERP cực kỳ nhanh chóng. Nhận được báo giá chi tiết từng dịch vụ công khai minh bạch.', avatar: '👨' },
                            { name: 'Lê Hoàng Nam', tour: 'Tour Sapa Khám Phá', text: 'Dịch vụ 5 sao đúng như cam kết. Chuyến đi diễn ra an toàn, đúng giờ và không phát sinh bất kỳ chi phí ẩn nào.', avatar: '🧑' }
                        ].map((rev, i) => (
                            <div className="review-card" key={i}>
                                <div className="review-stars">⭐⭐⭐⭐⭐</div>
                                <p className="review-text">"{rev.text}"</p>
                                <div className="review-user">
                                    <span className="review-avatar">{rev.avatar}</span>
                                    <div>
                                        <strong>{rev.name}</strong>
                                        <span>{rev.tour}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 8. FOOTER ĐẲNG CẤP */}
            <footer className="home-footer">
                <div className="footer-container">
                    <div className="footer-col">
                        <h2 className="footer-logo">Travel<span className="text-primary">ERP</span></h2>
                        <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginTop: '12px' }}>
                            Hệ thống quản trị & vận hành du lịch lữ hành toàn diện. Mang đến những chuyến đi tuyệt vời và kỷ niệm vô giá cho mọi khách hàng.
                        </p>
                    </div>
                    <div className="footer-col">
                        <h4>Về chúng tôi</h4>
                        <ul>
                            <li>Giới thiệu công ty</li>
                            <li>Đội ngũ Hướng dẫn viên</li>
                            <li>Chính sách bảo mật</li>
                            <li>Điều khoản sử dụng</li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h4>Dịch vụ du lịch</h4>
                        <ul>
                            <li>Tour du lịch trong nước</li>
                            <li>Tour nghỉ dưỡng biển</li>
                            <li>Tự thiết kế Tour cá nhân</li>
                            <li>Đặt vé xe & Khách sạn</li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h4>Hỗ trợ khách hàng</h4>
                        <div style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                            <span>📞 Hotline: <strong>1900 1234</strong></span>
                            <span>✉️ Email: <strong>cskh@travelerp.vn</strong></span>
                            <span>🏢 Địa chỉ: Tòa nhà TravelERP, TP. Hồ Chí Minh</span>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2026 TravelERP System. Tự hào đồng hành cùng các hành trình của bạn.</p>
                </div>
            </footer>

        </div>
    );
};

export default HomePage;
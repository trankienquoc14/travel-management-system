import React from 'react';
import { useNavigate } from 'react-router-dom';

const CustomerFooter = () => {
    const navigate = useNavigate();

    return (
        <footer className="home-footer" style={{ marginTop: 'auto', background: '#0f172a', color: '#cbd5e1', paddingTop: '50px', paddingBottom: '24px' }}>
            <div className="footer-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px' }}>
                
                {/* COL 1: GIỚI THIỆU VIETTRAVEL ERP */}
                <div className="footer-col">
                    <h2 className="footer-logo" style={{ fontSize: '24px', fontWeight: '900', color: '#ffffff', margin: 0, cursor: 'pointer' }} onClick={() => navigate('/home')}>
                        TravelVN<span style={{ color: '#0194f3' }}> ERP</span>
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '13.5px', lineHeight: '1.6', marginTop: '12px' }}>
                        Hệ thống quản trị du lịch & lữ hành hàng đầu Việt Nam. Cung cấp giải pháp trải nghiệm du lịch cá nhân hóa, đặt tour trực tuyến & tự thiết kế tour thông minh.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px', fontSize: '20px' }}>
                        <span style={{ cursor: 'pointer' }} title="Facebook">📘</span>
                        <span style={{ cursor: 'pointer' }} title="Zalo">💬</span>
                        <span style={{ cursor: 'pointer' }} title="Youtube">🔴</span>
                        <span style={{ cursor: 'pointer' }} title="Instagram">📸</span>
                    </div>
                </div>

                {/* COL 2: VỀ CHÚNG TÔI (ĐIỀU HƯỚNG TRANG BÀI VIẾT ĐỘC LẬP) */}
                <div className="footer-col">
                    <h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Về TravelVN ERP</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
                        <li 
                            onClick={() => navigate('/article/about')}
                            style={{ cursor: 'pointer', color: '#94a3b8', transition: 'color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                        >
                            📄 Giới thiệu thương hiệu
                        </li>
                        <li 
                            onClick={() => navigate('/article/guides')}
                            style={{ cursor: 'pointer', color: '#94a3b8', transition: 'color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                        >
                            🚩 Đội ngũ Hướng dẫn viên
                        </li>
                        <li 
                            onClick={() => navigate('/article/privacy')}
                            style={{ cursor: 'pointer', color: '#94a3b8', transition: 'color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                        >
                            🔒 Chính sách bảo mật
                        </li>
                        <li 
                            onClick={() => navigate('/article/terms')}
                            style={{ cursor: 'pointer', color: '#94a3b8', transition: 'color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                        >
                            📜 Điều khoản & Quy định
                        </li>
                    </ul>
                </div>

                {/* COL 3: DỊCH VỤ DU LỊCH */}
                <div className="footer-col">
                    <h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Dịch Vụ Du Lịch</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
                        <li 
                            onClick={() => {
                                navigate('/home');
                                setTimeout(() => window.scrollTo({ top: 700, behavior: 'smooth' }), 200);
                            }}
                            style={{ cursor: 'pointer', color: '#94a3b8', transition: 'color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                        >
                            ✈️ Tour Trong Nước Trọn Gói
                        </li>
                        <li 
                            onClick={() => {
                                navigate('/home');
                                setTimeout(() => {
                                    const prefs = JSON.parse(localStorage.getItem('user_travel_preferences') || '{}');
                                    localStorage.setItem('user_travel_preferences', JSON.stringify({ ...prefs, searchTerm: 'Hạ Long' }));
                                    window.scrollTo({ top: 700, behavior: 'smooth' });
                                }, 200);
                            }}
                            style={{ cursor: 'pointer', color: '#94a3b8', transition: 'color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                        >
                            🛳️ Du Thuyền 5★ Hạ Long
                        </li>
                        <li 
                            onClick={() => navigate('/build-tour')}
                            style={{ cursor: 'pointer', color: '#94a3b8', transition: 'color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                        >
                            🎨 Tự Thiết Kế Tour Cá Nhân
                        </li>
                        <li 
                            onClick={() => navigate('/services')}
                            style={{ cursor: 'pointer', color: '#94a3b8', transition: 'color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
                            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                        >
                            🚗 Thuê Xe Du Lịch & Khách Sạn
                        </li>
                    </ul>
                </div>

                {/* COL 4: HỖ TRỢ & LIÊN HỆ */}
                <div className="footer-col">
                    <h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Hỗ Trợ Khách Hàng</h4>
                    <div style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <span>📞 Hotline: <strong style={{ color: '#0194f3', fontSize: '15px' }}>1900 1234</strong> (24/7)</span>
                        <span>✉️ Email: <strong>cskh@viettravel-erp.vn</strong></span>
                        <span>🏢 Trụ sở: Tòa nhà TravelVN ERP, Quận 1, TP. Hồ Chí Minh</span>
                    </div>
                </div>

            </div>

            <div className="footer-bottom" style={{ borderTop: '1px solid #1e293b', marginTop: '40px', paddingTop: '20px', textAlign: 'center', fontSize: '12.5px', color: '#64748b' }}>
                <p>© 2026 TravelVN ERP System. Tự hào mang đến những hành trình du lịch kỷ niệm vô giá.</p>
            </div>
        </footer>
    );
};

export default CustomerFooter;

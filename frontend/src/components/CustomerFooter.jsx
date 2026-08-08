import React from 'react';

const CustomerFooter = () => {
    return (
        <footer className="home-footer" style={{ marginTop: 'auto' }}>
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
    );
};

export default CustomerFooter;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, ChevronRight, Globe, Camera, Share2, MessageCircle } from 'lucide-react';

const CustomerFooter = () => {
    const navigate = useNavigate();

    return (
        <footer style={{ background: '#0f172a', color: '#f8fafc', paddingTop: '60px', paddingBottom: '20px', marginTop: 'auto' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '28px', marginBottom: '40px' }}>
                
                {/* COL 1: BRAND & INTRO */}
                <div>
                    <h2 onClick={() => navigate('/home')} style={{ fontSize: '28px', fontWeight: '900', color: '#ffffff', margin: '0 0 16px 0', cursor: 'pointer', letterSpacing: '-0.5px' }}>
                        TravelVN<span style={{ color: '#0194f3' }}> ERP</span>
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                        Hệ thống quản trị du lịch và lữ hành hàng đầu Việt Nam. Chúng tôi cung cấp trải nghiệm du lịch thông minh, đặt tour trực tuyến, và dịch vụ thiết kế tour cá nhân hóa.
                    </p>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <a href="#" style={{ color: '#94a3b8', transition: 'color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} onMouseEnter={e => { e.currentTarget.style.color = '#38bdf8'; e.currentTarget.style.background = 'rgba(56,189,248,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
                            <Globe size={18} />
                        </a>
                        <a href="#" style={{ color: '#94a3b8', transition: 'color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} onMouseEnter={e => { e.currentTarget.style.color = '#38bdf8'; e.currentTarget.style.background = 'rgba(56,189,248,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
                            <Camera size={18} />
                        </a>
                        <a href="#" style={{ color: '#94a3b8', transition: 'color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} onMouseEnter={e => { e.currentTarget.style.color = '#38bdf8'; e.currentTarget.style.background = 'rgba(56,189,248,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
                            <MessageCircle size={18} />
                        </a>
                    </div>
                </div>

                {/* COL 2: DỊCH VỤ DU LỊCH */}
                <div>
                    <h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '700', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dịch Vụ & Khám Phá</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { name: 'Giới thiệu', path: '/article/about' },
                            { name: 'Trang chủ', path: '/home' },
                            { name: 'Danh sách Tour Trọn Gói', path: '/tours' },
                            { name: 'Dịch vụ Xe Di Chuyển', path: '/services' },
                            { name: 'Tự Thiết Kế Tour Cá Nhân', path: '/build-tour' },
                            { name: 'Cẩm nang & Bài viết du lịch', path: '/articles' }
                        ].map((link, idx) => (
                            <li key={idx} 
                                onClick={() => navigate(link.path)}
                                style={{ cursor: 'pointer', color: '#94a3b8', fontSize: '14px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
                                onMouseEnter={e => { e.currentTarget.style.color = '#38bdf8'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = 'none'; }}
                            >
                                <ChevronRight size={14} /> {link.name}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* COL 3: CONTACT INFO */}
                <div>
                    <h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '700', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hỗ Trợ & Liên Hệ</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#94a3b8', fontSize: '14px' }}>
                            <div style={{ background: 'rgba(56,189,248,0.1)', padding: '8px', borderRadius: '50%' }}>
                                <Phone size={18} style={{ color: '#38bdf8' }} />
                            </div>
                            <div>
                                <span style={{ display: 'block', marginBottom: '4px' }}>Hotline Tư Vấn (24/7)</span>
                                <strong style={{ color: '#ffffff', fontSize: '18px' }}>1800 646 888</strong>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#94a3b8', fontSize: '14px' }}>
                            <div style={{ background: 'rgba(56,189,248,0.1)', padding: '8px', borderRadius: '50%' }}>
                                <Mail size={18} style={{ color: '#38bdf8' }} />
                            </div>
                            <span>cskh@viettravel.vn</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#94a3b8', fontSize: '14px' }}>
                            <div style={{ background: 'rgba(56,189,248,0.1)', padding: '8px', borderRadius: '50%' }}>
                                <MapPin size={18} style={{ color: '#38bdf8' }} />
                            </div>
                            <span style={{ lineHeight: '1.5' }}>190 Pasteur, Phường Xuân Hòa,<br/>Quận 1, TP. Hồ Chí Minh</span>
                        </div>
                    </div>
                </div>

                {/* COL 4: MAP */}
                <div>
                    <h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '700', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bản Đồ Vị Trí</h4>
                    <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', width: '100%', height: '164px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}>
                        <iframe 
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.349681534062!2d106.6908422153343!3d10.784507092315758!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528cb3e77f0bf%3A0x5db422eeb8e860bc!2s190%20Pasteur%2C%20Ph%C6%B0%E1%BB%9Dng%206%2C%20Qu%E1%BA%ADn%203%2C%20Th%C3%A0nh%20ph%E1%BB%91%20H%E1%BB%93%20Ch%C3%AD%20Minh%2C%20Vietnam!5e0!3m2!1sen!2s!4v1689154940000!5m2!1sen!2s" 
                            width="100%" 
                            height="100%" 
                            style={{ border: 0, display: 'block', filter: 'opacity(0.9) contrast(1.1)' }} 
                            allowFullScreen="" 
                            loading="lazy" 
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                </div>

                {/* COL 5: THANH TOÁN */}
                <div>
                    <h4 style={{ color: '#ffffff', fontSize: '14px', fontWeight: '700', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Thanh Toán</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        <div style={{ background: '#fff', borderRadius: '6px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                            <span style={{ color: '#1a1f71', fontWeight: '900', fontSize: '16px', fontStyle: 'italic', letterSpacing: '-0.5px' }}>VISA</span>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '6px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', flexDirection: 'column', lineHeight: '1' }}>
                            <span style={{ color: '#1a1f71', fontSize: '9px', fontWeight: '500' }}>Verified by</span>
                            <span style={{ color: '#1a1f71', fontWeight: '900', fontSize: '14px', fontStyle: 'italic' }}>VISA</span>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '6px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', gap: '3px' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ width: '14px', height: '14px', background: '#eb001b', borderRadius: '50%', zIndex: 2 }}></div>
                                <div style={{ width: '14px', height: '14px', background: '#f79e1b', borderRadius: '50%', marginLeft: '-6px', zIndex: 1, opacity: 0.9 }}></div>
                            </div>
                            <span style={{ color: '#111', fontWeight: 'bold', fontSize: '11px' }}>MasterCard</span>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '6px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontWeight: '900', fontSize: '14px', letterSpacing: '-0.5px' }}>
                                <span style={{ color: '#ed1c24' }}>VN</span><span style={{ color: '#005baa' }}>PAY</span>
                            </span>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '6px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', gap: '2px' }}>
                            <div style={{ background: '#004899', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '1px 3px', borderRadius: '2px' }}>J</div>
                            <div style={{ background: '#ed1c24', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '1px 3px', borderRadius: '2px' }}>C</div>
                            <div style={{ background: '#009f4d', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '1px 3px', borderRadius: '2px' }}>B</div>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '6px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontWeight: '900', fontSize: '14px' }}>
                                <span style={{ color: '#0068ff' }}>Zalo</span><span style={{ color: '#00c300' }}>Pay</span>
                            </span>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '6px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', flexDirection: 'column', lineHeight: '1', padding: '0 4px', textAlign: 'center' }}>
                            <span style={{ color: '#002663', fontWeight: '900', fontSize: '8px' }}>AMERICAN</span>
                            <span style={{ color: '#002663', fontWeight: '900', fontSize: '8px' }}>EXPRESS</span>
                        </div>
                        <div style={{ background: '#fff', borderRadius: '6px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                            <span style={{ color: '#a50064', fontWeight: '900', fontSize: '15px', letterSpacing: '-0.5px' }}>momo</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* BOTTOM FOOTER */}
            <div style={{ borderTop: '1px solid #1e293b', padding: '24px 32px 0 32px', maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                    © 2026 TravelVN ERP ERP System. Đồ Án Tốt Nghiệp Trần Kiên Quốc.
                </p>
                

            </div>
        </footer>
    );
};

export default CustomerFooter;

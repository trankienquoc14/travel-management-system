import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, ChevronRight, Globe, Camera, Share2, MessageCircle } from 'lucide-react';

const CustomerFooter = () => {
    const navigate = useNavigate();

    return (
        <footer style={{ background: '#0f172a', color: '#f8fafc', paddingTop: '60px', paddingBottom: '20px', marginTop: 'auto' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', marginBottom: '40px' }}>
                
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
                    <h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>Dịch Vụ & Khám Phá</h4>
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
                    <h4 style={{ color: '#ffffff', fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>Hỗ Trợ & Liên Hệ</h4>
                    
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

            </div>

            {/* BOTTOM FOOTER */}
            <div style={{ borderTop: '1px solid #1e293b', padding: '24px 24px 0 24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                    © 2026 TravelVN ERP ERP System. Đồ Án Tốt Nghiệp Trần Kiên Quốc.
                </p>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Thanh toán:</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ background: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '900', color: '#1a1f71', fontStyle: 'italic' }}>VISA</div>
                        <div style={{ background: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '900', color: '#ff5f00' }}>MasterCard</div>
                        <div style={{ background: '#a50064', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '900', color: '#ffffff' }}>MoMo</div>
                        <div style={{ background: '#005baa', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: '900', color: '#ffffff' }}>VNPay</div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default CustomerFooter;

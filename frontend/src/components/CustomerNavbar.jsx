import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserProfile from './UserProfile';

const CustomerNavbar = ({ activeTab = 'home' }) => {
    const [user, setUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Modals
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showFavoritesModal, setShowFavoritesModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // Notifications state
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: '✨ Báo giá thiết kế mới!',
            desc: 'Tour Phú Quốc 3N2Đ theo yêu cầu của bạn đã có báo giá chi tiết.',
            time: '10 phút trước',
            read: false,
            link: '/my-quotes'
        },
        {
            id: 2,
            title: '✅ Đặt tour thành công',
            desc: 'Đơn hàng của bạn đã được hệ thống ghi nhận thành công.',
            time: '2 giờ trước',
            read: false,
            link: '/my-bookings'
        },
        {
            id: 3,
            title: '🎉 Ưu đãi du lịch mới',
            desc: 'Khám phá danh sách các điểm đến thịnh hành mùa hè này.',
            time: '1 ngày trước',
            read: true,
            link: '/home'
        }
    ]);

    // Favorites state
    const [favorites, setFavorites] = useState([
        { id: 1, name: 'Khám phá Đảo Ngọc Phú Quốc 3N2Đ', price: 3490000, img: 'https://images.unsplash.com/photo-1540206395-68808572332f?q=80&w=800' },
        { id: 2, name: 'Chinh phục Đỉnh Fansipan Sapa 3N2Đ', price: 2990000, img: 'https://images.unsplash.com/photo-1542314831-c6a4d14d8373?q=80&w=800' }
    ]);

    // Settings state
    const [settings, setSettings] = useState({
        emailNotify: true,
        smsNotify: false,
        language: 'vi'
    });

    const dropdownRef = useRef(null);
    const notifRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setShowDropdown(false);
        navigate('/home');
    };

    const handleExploreClick = () => {
        navigate('/tours');
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllNotificationsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    return (
        <>
            {/* HEADER TRANG CHỦ KHÁCH HÀNG THÀNH VIÊN */}
            <nav className="home-navbar" style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.92)', 
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 4px 25px rgba(0, 0, 0, 0.06)', 
                position: 'sticky', 
                top: 0,
                zIndex: 1000,
                padding: '12px 5%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.3s ease'
            }}>
                {/* LOGO THƯƠNG HIỆU */}
                <div 
                    className="home-logo" 
                    onClick={() => navigate('/home')} 
                    style={{ 
                        cursor: 'pointer', 
                        fontSize: '24px', 
                        fontWeight: '900', 
                        letterSpacing: '-0.5px',
                        color: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                >
                    TravelVN<span style={{ color: '#0194f3' }}> ERP</span>
                </div>

                {/* MENU HEADER CHÍNH (Chức năng sử dụng thường xuyên) */}
                <ul className="home-menu" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '24px', 
                    listStyle: 'none',
                    margin: 0,
                    padding: 0
                }}>
                    {/* 1. Trang chủ */}
                    <li 
                        className={activeTab === 'home' ? 'active' : ''} 
                        onClick={() => navigate('/home')} 
                        style={{ 
                            cursor: 'pointer', 
                            fontWeight: activeTab === 'home' ? '800' : '600',
                            color: activeTab === 'home' ? '#0194f3' : '#475569',
                            fontSize: '15px',
                            transition: 'color 0.2s ease',
                            position: 'relative'
                        }}
                    >
                        Trang chủ
                    </li>

                    {/* 2. Dịch vụ */}
                    <li 
                        className={activeTab === 'services' ? 'active' : ''} 
                        onClick={() => navigate('/services')} 
                        style={{ 
                            cursor: 'pointer', 
                            fontWeight: activeTab === 'services' ? '800' : '600',
                            color: activeTab === 'services' ? '#0194f3' : '#475569',
                            fontSize: '15px',
                            transition: 'color 0.2s ease'
                        }}
                    >
                        Dịch vụ
                    </li>

                    {/* 3. Khám phá */}
                    <li 
                        className={activeTab === 'explore' ? 'active' : ''} 
                        onClick={handleExploreClick} 
                        style={{ 
                            cursor: 'pointer', 
                            fontWeight: activeTab === 'explore' ? '800' : '600',
                            color: activeTab === 'explore' ? '#0194f3' : '#475569',
                            fontSize: '15px',
                            transition: 'color 0.2s ease'
                        }}
                    >
                        Khám phá
                    </li>

                    {/* 4. Tự thiết kế Tour */}
                    <li 
                        className={activeTab === 'build-tour' ? 'active' : ''} 
                        onClick={() => {
                            if (!user) {
                                navigate('/login');
                            } else {
                                navigate('/build-tour');
                            }
                        }} 
                        style={{ 
                            cursor: 'pointer', 
                            fontWeight: activeTab === 'build-tour' ? '800' : '600',
                            color: activeTab === 'build-tour' ? '#0194f3' : '#0284c7',
                            fontSize: '15px',
                            background: '#eff6ff',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            border: '1px solid #bae6fd',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        ✨ Tự thiết kế Tour
                    </li>

                </ul>

                {/* HÀNH ĐỘNG KHÁCH HÀNG: THÔNG BÁO & TÀI KHOẢN */}
                <div className="home-user-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {user ? (
                        <>
                            {/* 6. THÔNG BÁO (HEADER ICON & DROPDOWN) */}
                            <div ref={notifRef} style={{ position: 'relative' }}>
                                <button 
                                    onClick={() => { setShowNotifications(!showNotifications); setShowDropdown(false); }}
                                    style={{ 
                                        position: 'relative',
                                        width: '42px',
                                        height: '42px',
                                        borderRadius: '50%',
                                        border: '1.5px solid #e2e8f0',
                                        background: showNotifications ? '#f0f9ff' : '#ffffff',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '18px',
                                        color: '#334155',
                                        transition: 'all 0.2s ease',
                                        boxShadow: showNotifications ? '0 0 0 3px rgba(1, 148, 243, 0.15)' : '0 2px 6px rgba(0,0,0,0.03)'
                                    }}
                                    title="Thông báo"
                                >
                                    🔔
                                    {unreadCount > 0 && (
                                        <span style={{ 
                                            position: 'absolute', 
                                            top: '-2px', 
                                            right: '-2px', 
                                            background: '#ef4444', 
                                            color: '#fff', 
                                            fontSize: '11px', 
                                            fontWeight: '800', 
                                            width: '18px', 
                                            height: '18px', 
                                            borderRadius: '50%', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            border: '2px solid #fff'
                                        }}>
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* DROPDOWN THÔNG BÁO */}
                                {showNotifications && (
                                    <div style={{ 
                                        position: 'absolute', 
                                        top: 'calc(100% + 12px)', 
                                        right: 0, 
                                        width: '320px', 
                                        background: '#ffffff', 
                                        borderRadius: '20px', 
                                        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)', 
                                        border: '1px solid #e2e8f0', 
                                        zIndex: 9999, 
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <strong style={{ fontSize: '15px', color: '#0f172a' }}>🔔 Thông báo của bạn</strong>
                                            {unreadCount > 0 && (
                                                <button 
                                                    onClick={markAllNotificationsRead}
                                                    style={{ border: 'none', background: 'none', color: '#0284c7', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                                                >
                                                    Đọc tất cả
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {notifications.map(n => (
                                                <div 
                                                    key={n.id}
                                                    onClick={() => {
                                                        setShowNotifications(false);
                                                        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
                                                        navigate(n.link);
                                                    }}
                                                    style={{ 
                                                        padding: '14px 18px', 
                                                        borderBottom: '1px solid #f1f5f9', 
                                                        background: n.read ? '#fff' : '#f0f9ff', 
                                                        cursor: 'pointer',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                    onMouseLeave={e => e.currentTarget.style.background = n.read ? '#fff' : '#f0f9ff'}
                                                >
                                                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#1e293b', marginBottom: '4px' }}>{n.title}</div>
                                                    <div style={{ fontSize: '12.5px', color: '#64748b', lineHeight: '1.4' }}>{n.desc}</div>
                                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', fontWeight: '600' }}>{n.time}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 7. TÀI KHOẢN (HEADER ICON & DROPDOWN MENU TÀI KHOẢN) */}
                            <div ref={dropdownRef} style={{ position: 'relative' }}>
                                <div 
                                    onClick={() => { setShowDropdown(!showDropdown); setShowNotifications(false); }}
                                    style={{ 
                                        cursor: 'pointer', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '10px',
                                        padding: '5px 14px 5px 6px',
                                        borderRadius: '30px',
                                        background: '#f8fafc',
                                        border: '1.5px solid #e2e8f0',
                                        transition: 'all 0.2s ease',
                                        boxShadow: showDropdown ? '0 0 0 3px rgba(1, 148, 243, 0.15)' : 'none'
                                    }}
                                >
                                    <div style={{ 
                                        width: '36px', 
                                        height: '36px', 
                                        borderRadius: '50%', 
                                        background: 'linear-gradient(135deg, #0194f3 0%, #0066cc 100%)', 
                                        color: '#fff', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        fontWeight: '800',
                                        fontSize: '15px',
                                        boxShadow: '0 2px 8px rgba(1, 148, 243, 0.3)'
                                    }}>
                                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>
                                        {user.fullName}
                                    </span>
                                    <span style={{ 
                                        fontSize: '10px', 
                                        color: '#64748b', 
                                        transition: 'transform 0.2s', 
                                        transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)' 
                                    }}>
                                        ▼
                                    </span>
                                </div>

                                {/* MENU TÀI KHOẢN DROPDOWN (LOẠI BỎ TRÙNG LẶP HÒAN TOÀN) */}
                                {showDropdown && (
                                    <div 
                                        style={{ 
                                            position: 'absolute', 
                                            top: 'calc(100% + 12px)', 
                                            right: 0, 
                                            width: '260px', 
                                            background: '#ffffff', 
                                            borderRadius: '20px', 
                                            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.15)', 
                                            border: '1px solid #e2e8f0', 
                                            zIndex: 9999, 
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {/* User Card Header */}
                                        <div style={{ padding: '18px 20px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderBottom: '1px solid #e2e8f0' }}>
                                            <div style={{ fontWeight: '800', color: '#1e3a8a', fontSize: '15px' }}>{user.fullName}</div>
                                            <div style={{ fontSize: '12px', color: '#2563eb', marginTop: '2px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span>⭐</span> Thành viên VIP
                                            </div>
                                        </div>

                                        {/* Danh Sách Menu Tài Khoản Chuẩn UX/UI */}
                                        <div style={{ padding: '8px 0' }}>
                                            {/* 1. Hồ sơ cá nhân */}
                                            <div 
                                                onClick={() => { setShowDropdown(false); setShowProfileModal(true); }}
                                                style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#334155', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                👤 Hồ sơ cá nhân
                                            </div>

                                            {/* 2. Đơn hàng của tôi */}
                                            <div 
                                                onClick={() => { setShowDropdown(false); navigate('/my-bookings'); }}
                                                style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#334155', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                📦 Đơn hàng của tôi
                                            </div>

                                            {/* 3. Tour đã thiết kế */}
                                            <div 
                                                onClick={() => { setShowDropdown(false); navigate('/my-quotes'); }}
                                                style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#334155', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                📋 Tour đã thiết kế
                                            </div>

                                            {/* 3. Yêu thích */}
                                            <div 
                                                onClick={() => { setShowDropdown(false); setShowFavoritesModal(true); }}
                                                style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#334155', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                ⭐ Yêu thích
                                            </div>

                                            {/* 4. Cài đặt */}
                                            <div 
                                                onClick={() => { setShowDropdown(false); setShowSettingsModal(true); }}
                                                style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#334155', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                ⚙️ Cài đặt
                                            </div>

                                            <div style={{ height: '1px', background: '#f1f5f9', margin: '6px 0' }} />

                                            {/* 5. Đăng xuất */}
                                            <div 
                                                onClick={handleLogout}
                                                style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#ef4444', transition: 'background 0.2s' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                🚪 Đăng xuất
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => navigate('/login')} className="btn-login-outline" style={{ padding: '8px 20px', borderRadius: '20px', border: '1px solid #0194f3', color: '#0194f3', background: '#fff', fontWeight: '700', cursor: 'pointer' }}>Đăng nhập</button>
                            <button onClick={() => navigate('/login')} className="btn-primary" style={{ padding: '8px 20px', borderRadius: '20px', border: 'none', background: '#0194f3', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>Đăng ký</button>
                        </div>
                    )}
                </div>
            </nav>

            {/* MODAL 1: HỒ SƠ CÁ NHÂN */}
            {showProfileModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(6px)',
                    zIndex: 99999,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '850px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        background: '#ffffff',
                        borderRadius: '24px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        position: 'relative',
                        padding: '30px'
                    }}>
                        <button 
                            onClick={() => setShowProfileModal(false)}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                border: 'none',
                                background: '#f1f5f9',
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                fontSize: '18px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#64748b'
                            }}
                        >
                            ✕
                        </button>
                        <UserProfile onProfileUpdated={(updated) => {
                            const newObj = { ...user, fullName: updated.full_name || user.fullName };
                            setUser(newObj);
                            localStorage.setItem('user', JSON.stringify(newObj));
                        }} />
                    </div>
                </div>
            )}

            {/* MODAL 2: YÊU THÍCH (FAVORITES) */}
            {showFavoritesModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', zIndex: 99999,
                    display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
                }}>
                    <div style={{
                        width: '100%', maxWidth: '600px', background: '#ffffff', borderRadius: '24px',
                        padding: '28px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        <button onClick={() => setShowFavoritesModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: '#f1f5f9', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>✕</button>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#0f172a', fontWeight: '800' }}>⭐ Chuyến đi yêu thích của bạn</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '400px', overflowY: 'auto' }}>
                            {favorites.map(f => (
                                <div key={f.id} style={{ display: 'flex', gap: '14px', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                    <img src={f.img} alt={f.name} style={{ width: '80px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>{f.name}</div>
                                        <div style={{ color: '#0284c7', fontWeight: '800', fontSize: '14px', marginTop: '4px' }}>{formatCurrency(f.price)}</div>
                                    </div>
                                    <button onClick={() => { setShowFavoritesModal(false); navigate('/home'); }} style={{ padding: '8px 16px', background: '#0194f3', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                                        Đặt Tour
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: CÀI ĐẶT (SETTINGS) */}
            {showSettingsModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', zIndex: 99999,
                    display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'
                }}>
                    <div style={{
                        width: '100%', maxWidth: '520px', background: '#ffffff', borderRadius: '24px',
                        padding: '28px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        <button onClick={() => setShowSettingsModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', border: 'none', background: '#f1f5f9', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>✕</button>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#0f172a', fontWeight: '800' }}>⚙️ Cài đặt tài khoản</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <div>
                                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>Thông báo qua Email</div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Nhận thông báo báo giá & xác nhận đơn qua Email</div>
                                </div>
                                <input type="checkbox" checked={settings.emailNotify} onChange={e => setSettings({ ...settings, emailNotify: e.target.checked })} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                <div>
                                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>Ngôn ngữ giao diện</div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Chọn ngôn ngữ hiển thị chính trên website</div>
                                </div>
                                <select value={settings.language} onChange={e => setSettings({ ...settings, language: e.target.value })} style={{ padding: '6px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '700', background: '#fff' }}>
                                    <option value="vi">🇻🇳 Tiếng Việt</option>
                                    <option value="en">🇬🇧 English</option>
                                </select>
                            </div>

                            <button onClick={() => { setShowSettingsModal(false); alert('🎉 Đã lưu cài đặt của bạn!'); }} style={{ padding: '12px', background: '#0194f3', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', fontSize: '15px' }}>
                                Lưu Cài Đặt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CustomerNavbar;

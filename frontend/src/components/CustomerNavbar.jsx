import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UserProfile from './UserProfile';

const CustomerNavbar = ({ activeTab = 'home' }) => {
    const [user, setUser] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));

        // Click outside listener to close dropdown
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    return (
        <>
            <nav className="home-navbar" style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.85)', 
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 4px 30px rgba(0,0,0,0.08)', 
                position: 'sticky', 
                top: 0,
                zIndex: 1000 
            }}>
                <div className="home-logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
                    Travel<span className="text-primary">ERP</span>
                </div>

                <ul className="home-menu">
                    <li className={activeTab === 'home' ? 'active' : ''} onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
                        Trang chủ
                    </li>
                    <li className={activeTab === 'services' ? 'active' : ''} onClick={() => navigate('/services')} style={{ cursor: 'pointer' }}>
                        Dịch vụ Khác
                    </li>
                    <li className={activeTab === 'my-bookings' ? 'active' : ''} style={{ cursor: 'pointer' }} onClick={() => {
                        if (!user) {
                            alert('Vui lòng đăng nhập hoặc đăng ký thành viên để xem đơn hàng!');
                            navigate('/login');
                        } else {
                            navigate('/my-bookings');
                        }
                    }}>
                        Đơn hàng của tôi
                    </li>
                    <li className={activeTab === 'my-quotes' ? 'active' : ''} style={{ cursor: 'pointer' }} onClick={() => {
                        if (!user) {
                            alert('Vui lòng đăng nhập hoặc đăng ký thành viên để xem báo giá thiết kế!');
                            navigate('/login');
                        } else {
                            navigate('/my-quotes');
                        }
                    }}>
                        Báo giá thiết kế
                    </li>
                    <li className={activeTab === 'build-tour' ? 'active' : ''} style={{ cursor: 'pointer' }} onClick={() => {
                        if (!user) {
                            alert('Vui lòng đăng nhập hoặc đăng ký thành viên để sử dụng tính năng Tự thiết kế Tour!');
                            navigate('/login');
                        } else {
                            navigate('/build-tour');
                        }
                    }}>
                        ✨ Tự thiết kế Tour
                    </li>
                </ul>

                <div className="home-user-actions" ref={dropdownRef} style={{ position: 'relative' }}>
                    {user ? (
                        <div style={{ position: 'relative' }}>
                            {/* Icon Avatar + Tên khách hàng (Bấm để bật Dropdown) */}
                            <div 
                                onClick={() => setShowDropdown(!showDropdown)}
                                style={{ 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '10px',
                                    padding: '6px 14px',
                                    borderRadius: '30px',
                                    background: '#f8fafc',
                                    border: '1.5px solid #e2e8f0',
                                    transition: 'all 0.2s ease',
                                    boxShadow: showDropdown ? '0 0 0 3px rgba(1, 148, 243, 0.15)' : 'none'
                                }}
                            >
                                <div style={{ 
                                    width: '34px', 
                                    height: '34px', 
                                    borderRadius: '50%', 
                                    background: 'linear-gradient(135deg, #0194f3 0%, #0066cc 100%)', 
                                    color: '#fff', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    fontWeight: '700',
                                    fontSize: '15px'
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

                            {/* DROPDOWN MENU CỦA KHÁCH HÀNG */}
                            {showDropdown && (
                                <div 
                                    style={{ 
                                        position: 'absolute', 
                                        top: 'calc(100% + 10px)', 
                                        right: 0, 
                                        width: '260px', 
                                        background: '#ffffff', 
                                        borderRadius: '18px', 
                                        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)', 
                                        border: '1px solid #e2e8f0', 
                                        zIndex: 9999, 
                                        overflow: 'hidden',
                                        animation: 'fadeIn 0.2s ease-out'
                                    }}
                                >
                                    {/* Header Banner thông tin khách hàng */}
                                    <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderBottom: '1px solid #e2e8f0' }}>
                                        <div style={{ fontWeight: '800', color: '#1e3a8a', fontSize: '15px' }}>{user.fullName}</div>
                                        <div style={{ fontSize: '12px', color: '#2563eb', marginTop: '2px', fontWeight: '600' }}>Khách hàng thân thiết</div>
                                    </div>

                                    {/* Danh sách tính năng */}
                                    <div style={{ padding: '8px 0' }}>
                                        <div 
                                            onClick={() => { setShowDropdown(false); navigate('/my-bookings'); }}
                                            style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#334155', transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            🛒 Xem đơn của tôi
                                        </div>

                                        <div 
                                            onClick={() => { setShowDropdown(false); navigate('/my-quotes'); }}
                                            style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#334155', transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            🛎️ Lịch sử tour thiết kế
                                        </div>

                                        <div 
                                            onClick={() => { setShowDropdown(false); setShowProfileModal(true); }}
                                            style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#334155', transition: 'background 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            👤 Hồ sơ cá nhân
                                        </div>

                                        <div style={{ height: '1px', background: '#f1f5f9', margin: '6px 0' }} />

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
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => navigate('/login')} className="btn-login-outline">Đăng nhập</button>
                            <button onClick={() => navigate('/login')} className="btn-primary">Đăng ký</button>
                        </div>
                    )}
                </div>
            </nav>

            {/* MODAL HỒ SƠ CÁ NHÂN NỔI */}
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
        </>
    );
};

export default CustomerNavbar;

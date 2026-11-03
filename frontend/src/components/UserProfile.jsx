import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserProfile = ({ onProfileUpdated }) => {
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Form Hồ sơ cá nhân
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('Male');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [address, setAddress] = useState('');
    const [avatar, setAvatar] = useState('');

    // Form Đổi mật khẩu
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                const data = res.data.data;
                setProfile(data);
                setFullName(data.full_name || '');
                setPhone(data.phone || '');
                setGender(data.gender || 'Male');
                setDateOfBirth(data.date_of_birth ? data.date_of_birth.split('T')[0] : '');
                setAddress(data.address || '');
                setAvatar(data.avatar || '');
            }
        } catch (error) {
            console.error('Lỗi tải hồ sơ cá nhân:', error);
            setMessage({ type: 'error', text: 'Không thể tải thông tin hồ sơ cá nhân!' });
        } finally {
            setLoading(false);
        }
    };

    // Xử lý upload avatar kèm kiểm tra dung lượng (< 3MB) và định dạng (Luồng ngoại lệ 5.1)
    const handleAvatarChange = (e) => {
        setMessage({ type: '', text: '' });
        const file = e.target.files[0];
        if (!file) return;

        // 1. Kiểm tra định dạng ảnh
        if (!file.type.startsWith('image/')) {
            setMessage({
                type: 'error',
                text: 'Không thể tải lên ảnh đại diện. Vui lòng kiểm tra dung lượng ảnh (< 3MB) và thử lại'
            });
            return;
        }

        // 2. Kiểm tra dung lượng (< 3MB = 3,145,728 bytes)
        const MAX_SIZE = 3 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            setMessage({
                type: 'error',
                text: 'Không thể tải lên ảnh đại diện. Vui lòng kiểm tra dung lượng ảnh (< 3MB) và thử lại'
            });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatar(reader.result);
        };
        reader.onerror = () => {
            setMessage({
                type: 'error',
                text: 'Không thể tải lên ảnh đại diện. Vui lòng kiểm tra dung lượng ảnh (< 3MB) và thử lại'
            });
        };
        reader.readAsDataURL(file);
    };

    // Xử lý Lưu hồ sơ cá nhân (Luồng chính 4, 5, 6, 7)
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!fullName || !fullName.trim()) {
            setMessage({ type: 'error', text: 'Vui lòng nhập họ và tên' });
            return;
        }

        // Kiểm tra định dạng số điện thoại nếu có nhập (Luồng 5)
        if (phone && phone.trim()) {
            const phoneRegex = /^(0|\+84)[0-9]{9}$/;
            if (!phoneRegex.test(phone.trim())) {
                setMessage({
                    type: 'error',
                    text: 'Số điện thoại không đúng định dạng. Vui lòng nhập số điện thoại hợp lệ (10 chữ số)!'
                });
                return;
            }
        }

        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            const payload = {
                full_name: fullName.trim(),
                phone: phone ? phone.trim() : '',
                gender: gender,
                date_of_birth: dateOfBirth || null,
                address: address ? address.trim() : '',
                avatar: avatar
            };

            const res = await axios.put('http://localhost:5000/api/auth/profile', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                // Luồng 7: Thông báo cập nhật thành công
                setMessage({ type: 'success', text: 'Cập nhật hồ sơ cá nhân thành công!' });
                setProfile(res.data.data);

                // Cập nhật lại thông tin phiên làm việc (Luồng 6)
                const currentStored = JSON.parse(localStorage.getItem('user') || '{}');
                const updatedUser = {
                    ...currentStored,
                    fullName: res.data.data.full_name,
                    avatar: res.data.data.avatar,
                    phone: res.data.data.phone,
                    address: res.data.data.address
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                if (onProfileUpdated) {
                    onProfileUpdated(res.data.data);
                }
            }
        } catch (error) {
            console.error('Lỗi cập nhật hồ sơ:', error);
            const errMsg = error.response?.data?.message || 'Lỗi cập nhật hồ sơ cá nhân!';
            setMessage({ type: 'error', text: errMsg });
        } finally {
            setSaving(false);
        }
    };

    // Xử lý Xác nhận đổi mật khẩu (Luồng thay thế 3.1 - 3.5)
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        // 1. Kiểm tra bỏ trống các trường
        if (!currentPassword || !newPassword || !confirmPassword) {
            setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ các thông tin bắt buộc' });
            return;
        }

        // 2. Luồng 3.4: Kiểm tra mật khẩu mới dưới 6 ký tự
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Mật khẩu mới phải từ 6 ký tự trở lên' });
            return;
        }

        // 3. Luồng 3.4: Kiểm tra mật khẩu xác nhận không khớp
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
            return;
        }

        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            const res = await axios.put('http://localhost:5000/api/auth/change-password', {
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                // Luồng 3.5: Thông báo thành công & yêu cầu đăng nhập lại
                setMessage({
                    type: 'success',
                    text: 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới'
                });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');

                // Tự động đăng xuất sau 2.5 giây
                setTimeout(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }, 2500);
            }
        } catch (error) {
            console.error('Lỗi đổi mật khẩu:', error);
            const errMsg = error.response?.data?.message || 'Đổi mật khẩu thất bại!';
            setMessage({ type: 'error', text: errMsg });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '360px', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', border: '4px solid #e2e8f0', borderTop: '4px solid #0194f3', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <div style={{ fontSize: '15px', color: '#64748b', fontWeight: '600' }}>Đang tải thông tin hồ sơ...</div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '860px', margin: '0 auto', fontFamily: '"Outfit", "Inter", -apple-system, sans-serif' }}>
            {/* Header Profile Hero Card */}
            <div style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%)',
                borderRadius: '24px',
                padding: '28px 32px',
                color: '#fff',
                boxShadow: '0 12px 30px -5px rgba(3, 105, 161, 0.3)',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Decor Shapes */}
                <div style={{ position: 'absolute', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: '-60px', right: '-40px', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: '-30px', right: '120px', pointerEvents: 'none' }} />

                {/* Avatar Preview + Upload Trigger */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                        width: '96px',
                        height: '96px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '34px',
                        fontWeight: '800',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        border: '3px solid rgba(255,255,255,0.85)',
                        overflow: 'hidden'
                    }}>
                        {avatar ? (
                            <img
                                src={avatar.startsWith('data:') || avatar.startsWith('http') ? avatar : `http://localhost:5000${avatar}`}
                                alt="Avatar"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            (fullName || 'U').charAt(0).toUpperCase()
                        )}
                    </div>
                    <label
                        style={{
                            position: 'absolute',
                            bottom: '0',
                            right: '0',
                            background: '#ffffff',
                            color: '#0284c7',
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 3px 10px rgba(0,0,0,0.25)',
                            fontSize: '15px',
                            border: '2px solid #ffffff',
                            transition: 'transform 0.15s ease'
                        }}
                        title="Tải lên ảnh đại diện mới (< 3MB)"
                    >
                        📷
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>

                {/* Info Text */}
                <div style={{ flex: 1, zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '-0.4px' }}>
                            {fullName || 'Người dùng'}
                        </h2>
                        <span style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: '#ffffff',
                            padding: '3px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '700',
                            backdropFilter: 'blur(4px)'
                        }}>
                            {profile?.role_name || 'Khách hàng'}
                        </span>
                    </div>
                    <div style={{ margin: '6px 0 0 0', opacity: 0.92, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>✉️</span> {profile?.email}
                    </div>
                    {profile?.phone && (
                        <div style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>📞</span> {profile.phone}
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Tabs (Hồ sơ cá nhân & Đổi mật khẩu) */}
            <div style={{
                display: 'flex',
                gap: '8px',
                background: '#f1f5f9',
                padding: '6px',
                borderRadius: '16px',
                marginBottom: '20px'
            }}>
                <button
                    type="button"
                    onClick={() => { setActiveTab('profile'); setMessage({ type: '', text: '' }); }}
                    style={{
                        flex: 1,
                        padding: '12px 20px',
                        borderRadius: '12px',
                        border: 'none',
                        background: activeTab === 'profile' ? '#ffffff' : 'transparent',
                        color: activeTab === 'profile' ? '#0284c7' : '#64748b',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        boxShadow: activeTab === 'profile' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <span>👤</span> Hồ sơ cá nhân
                </button>
                <button
                    type="button"
                    onClick={() => { setActiveTab('password'); setMessage({ type: '', text: '' }); }}
                    style={{
                        flex: 1,
                        padding: '12px 20px',
                        borderRadius: '12px',
                        border: 'none',
                        background: activeTab === 'password' ? '#ffffff' : 'transparent',
                        color: activeTab === 'password' ? '#0284c7' : '#64748b',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: 'pointer',
                        boxShadow: activeTab === 'password' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <span>🔒</span> Đổi mật khẩu
                </button>
            </div>

            {/* Alert Notification Box */}
            {message.text && (
                <div style={{
                    padding: '14px 18px',
                    borderRadius: '14px',
                    marginBottom: '20px',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    background: message.type === 'error' ? '#fef2f2' : '#ecfdf5',
                    color: message.type === 'error' ? '#b91c1c' : '#047857',
                    border: message.type === 'error' ? '1px solid #fecaca' : '1px solid #a7f3d0'
                }}>
                    <span style={{ fontSize: '18px' }}>{message.type === 'error' ? '⚠️' : '✅'}</span>
                    <span style={{ flex: 1 }}>{message.text}</span>
                    <button
                        onClick={() => setMessage({ type: '', text: '' })}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'inherit', padding: 0 }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Content Container */}
            <div style={{
                background: '#ffffff',
                padding: '30px',
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                border: '1px solid #e2e8f0'
            }}>
                {/* ================================= TAB 1: HỒ SƠ CÁ NHÂN ================================= */}
                {activeTab === 'profile' && (
                    <form onSubmit={handleSaveProfile}>
                        <div style={{ marginBottom: '22px' }}>
                            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                                Thông tin tài khoản
                            </h3>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                                Cập nhật thông tin chi tiết hồ sơ cá nhân và thông tin liên hệ của bạn
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '24px' }}>
                            {/* Họ và tên */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                    Họ và tên <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Ví dụ: Nguyễn Văn A"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '11px 14px',
                                        borderRadius: '10px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Email (Chỉ đọc) */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                    Email <span style={{ color: '#64748b', fontWeight: '500' }}>(Chỉ đọc)</span>
                                </label>
                                <input
                                    type="email"
                                    value={profile?.email || ''}
                                    disabled
                                    style={{
                                        width: '100%',
                                        padding: '11px 14px',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                        background: '#f8fafc',
                                        color: '#64748b',
                                        fontSize: '14px',
                                        boxSizing: 'border-box',
                                        cursor: 'not-allowed'
                                    }}
                                />
                            </div>

                            {/* Số điện thoại */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                    Số điện thoại
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Ví dụ: 0912345678 (10 số)"
                                    style={{
                                        width: '100%',
                                        padding: '11px 14px',
                                        borderRadius: '10px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Giới tính */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                    Giới tính
                                </label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '11px 14px',
                                        borderRadius: '10px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '14px',
                                        outline: 'none',
                                        background: '#fff',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <option value="Male">Nam</option>
                                    <option value="Female">Nữ</option>
                                    <option value="Other">Khác</option>
                                </select>
                            </div>

                            {/* Ngày sinh */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                    Ngày sinh
                                </label>
                                <input
                                    type="date"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '11px 14px',
                                        borderRadius: '10px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Ngày tham gia */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                    Ngày tham gia hệ thống
                                </label>
                                <input
                                    type="text"
                                    value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('vi-VN') : 'Mới khởi tạo'}
                                    disabled
                                    style={{
                                        width: '100%',
                                        padding: '11px 14px',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                        background: '#f8fafc',
                                        color: '#64748b',
                                        fontSize: '14px',
                                        boxSizing: 'border-box',
                                        cursor: 'not-allowed'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Địa chỉ (Toàn hàng) */}
                        <div style={{ marginBottom: '28px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                Địa chỉ
                            </label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Ví dụ: Số 123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh"
                                style={{
                                    width: '100%',
                                    padding: '11px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Nút submit: Lưu hồ sơ cá nhân (Luồng 4) */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    padding: '12px 28px',
                                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                                    transition: 'all 0.2s',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {saving ? '⏳ Đang lưu...' : '💾 Lưu hồ sơ cá nhân'}
                            </button>
                        </div>
                    </form>
                )}

                {/* ================================= TAB 2: ĐỔI MẬT KHẨU ================================= */}
                {activeTab === 'password' && (
                    <form onSubmit={handleChangePassword}>
                        <div style={{ marginBottom: '22px' }}>
                            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                                Thay đổi mật khẩu tài khoản
                            </h3>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                                Mật khẩu mới cần có độ dài tối thiểu từ 6 ký tự để đảm bảo tính an toàn
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '520px', marginBottom: '28px' }}>
                            {/* Mật khẩu hiện tại (Luồng 3.1) */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                    Mật khẩu hiện tại <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Nhập mật khẩu hiện tại"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '11px 40px 11px 14px',
                                            borderRadius: '10px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '14px',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '16px',
                                            color: '#64748b'
                                        }}
                                    >
                                        {showCurrentPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>

                            {/* Mật khẩu mới (Luồng 3.1) */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                    Mật khẩu mới <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Tối thiểu 6 ký tự"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '11px 40px 11px 14px',
                                            borderRadius: '10px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '14px',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '16px',
                                            color: '#64748b'
                                        }}
                                    >
                                        {showNewPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>

                            {/* Nhập lại mật khẩu mới (Luồng 3.1) */}
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                    Nhập lại mật khẩu mới <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Nhập lại mật khẩu mới"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '11px 40px 11px 14px',
                                            borderRadius: '10px',
                                            border: '1px solid #cbd5e1',
                                            fontSize: '14px',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '16px',
                                            color: '#64748b'
                                        }}
                                    >
                                        {showConfirmPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Nút submit: Xác nhận đổi mật khẩu (Luồng 3.2) */}
                        <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    padding: '12px 28px',
                                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                                    transition: 'all 0.2s',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {saving ? '⏳ Đang xử lý...' : '🔑 Xác nhận đổi mật khẩu'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default UserProfile;

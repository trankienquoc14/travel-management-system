import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserProfile = ({ onProfileUpdated }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Editable form state
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('Male');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [avatar, setAvatar] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

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
                setAvatar(data.avatar || '');
            }
        } catch (error) {
            console.error('Lỗi tải hồ sơ cá nhân:', error);
            setMessage({ type: 'error', text: 'Khổng thể tải thông tin hồ sơ cá nhân!' });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatar(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (newPassword && newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Mật khẩu mới và xác nhận mật khẩu không khớp!' });
            return;
        }

        try {
            setSaving(true);
            const token = localStorage.getItem('token');
            const payload = {
                full_name: fullName,
                phone: phone,
                gender: gender,
                date_of_birth: dateOfBirth,
                avatar: avatar
            };

            if (newPassword) {
                payload.new_password = newPassword;
            }

            const res = await axios.put('http://localhost:5000/api/auth/profile', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setMessage({ type: 'success', text: '🎉 Cập nhật hồ sơ cá nhân thành công!' });
                setProfile(res.data.data);
                setNewPassword('');
                setConfirmPassword('');

                if (onProfileUpdated) {
                    onProfileUpdated(res.data.data);
                }
            }
        } catch (error) {
            console.error('Lỗi cập nhật hồ sơ:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Lỗi cập nhật hồ sơ!' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <div style={{ fontSize: '18px', color: '#0194f3', fontWeight: '600' }}>⏳ Đang tải thông tin hồ sơ...</div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', fontFamily: '"Outfit", "Inter", sans-serif', padding: '10px 0 40px 0' }}>
            {/* Header Banner */}
            <div style={{ 
                background: 'linear-gradient(135deg, #0194f3 0%, #0056b3 100%)', 
                borderRadius: '24px', 
                padding: '36px', 
                color: '#fff', 
                boxShadow: '0 10px 30px rgba(1, 148, 243, 0.25)', 
                marginBottom: '30px',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '50%', 
                        background: '#fff', 
                        color: '#0194f3', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '36px', 
                        fontWeight: '800',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                        border: '4px solid rgba(255,255,255,0.4)',
                        overflow: 'hidden'
                    }}>
                        {avatar ? (
                            <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            (fullName || 'U').charAt(0).toUpperCase()
                        )}
                    </div>
                    <label style={{ 
                        position: 'absolute', 
                        bottom: '0', 
                        right: '0', 
                        background: '#fff', 
                        color: '#111827', 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        fontSize: '14px'
                    }} title="Đổi ảnh đại diện">
                        📷
                        <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                    </label>
                </div>

                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: '0 0 6px 0', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>{fullName || 'Người dùng'}</h2>
                    <p style={{ margin: '0 0 12px 0', opacity: 0.9, fontSize: '15px' }}>📧 {profile?.email}</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', backdropFilter: 'blur(4px)' }}>
                        👑 Vai trò: {profile?.role_name || 'Hệ thống'}
                    </div>
                </div>
            </div>

            {/* Notification alert */}
            {message.text && (
                <div style={{ 
                    padding: '16px 20px', 
                    borderRadius: '16px', 
                    marginBottom: '24px', 
                    fontWeight: '600',
                    fontSize: '15px',
                    background: message.type === 'error' ? '#fef2f2' : '#ecfdf5',
                    color: message.type === 'error' ? '#991b1b' : '#065f46',
                    border: message.type === 'error' ? '1px solid #fecaca' : '1px solid #a7f3d0'
                }}>
                    {message.text}
                </div>
            )}

            {/* Form Edit */}
            <form onSubmit={handleSave} style={{ background: '#fff', padding: '36px', borderRadius: '24px', boxShadow: '0 4px 25px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6' }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', color: '#111827', fontWeight: '800', borderBottom: '2px solid #f3f4f6', paddingBottom: '16px' }}>
                    👤 Thông Tin Cá Nhân
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                            Họ và Tên <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input 
                            type="text" 
                            value={fullName} 
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            placeholder="Nhập họ và tên"
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none', transition: 'border-color 0.2s' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                            Địa Chỉ Email (Không thể đổi)
                        </label>
                        <input 
                            type="email" 
                            value={profile?.email || ''} 
                            disabled
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', fontSize: '15px' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                            Số Điện Thoại
                        </label>
                        <input 
                            type="text" 
                            value={phone} 
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Nhập số điện thoại"
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                            Giới Tính
                        </label>
                        <select 
                            value={gender} 
                            onChange={(e) => setGender(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none', background: '#fff' }}
                        >
                            <option value="Male">Nam</option>
                            <option value="Female">Nữ</option>
                            <option value="Other">Khác</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                            Ngày Sinh
                        </label>
                        <input 
                            type="date" 
                            value={dateOfBirth} 
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                            Ngày Gia Nhập Hệ Thống
                        </label>
                        <input 
                            type="text" 
                            value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('vi-VN') : 'Mới khởi tạo'} 
                            disabled
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', fontSize: '15px' }}
                        />
                    </div>
                </div>

                <h3 style={{ margin: '32px 0 20px 0', fontSize: '20px', color: '#111827', fontWeight: '800', borderBottom: '2px solid #f3f4f6', paddingBottom: '16px' }}>
                    🔒 Bảo Mật & Mật Khẩu (Để trống nếu không đổi)
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                            Mật Khẩu Mới
                        </label>
                        <input 
                            type="password" 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
                            Xác Nhận Mật Khẩu Mới
                        </label>
                        <input 
                            type="password" 
                            value={confirmPassword} 
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                        type="submit" 
                        disabled={saving}
                        style={{ 
                            padding: '14px 32px', 
                            background: '#0194f3', 
                            color: '#fff', 
                            border: 'none', 
                            borderRadius: '14px', 
                            fontSize: '16px', 
                            fontWeight: '700', 
                            cursor: 'pointer', 
                            boxShadow: '0 4px 14px rgba(1, 148, 243, 0.3)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {saving ? '⏳ Đang lưu...' : '💾 Lưu Hồ Sơ Cá Nhân'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserProfile;

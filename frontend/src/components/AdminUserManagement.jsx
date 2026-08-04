import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');

  // Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [newRoleId, setNewRoleId] = useState(4);
  const [newStatus, setNewStatus] = useState('Active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/hr/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setUsers(res.data.data || []);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách người dùng:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setNewRoleId(user.role_id || 4);
    setNewStatus(user.status || 'Active');
  };

  const handleSaveUserRole = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        role_id: Number(newRoleId),
        status: newStatus
      };

      const res = await axios.put(
        `http://localhost:5000/api/hr/users/${editingUser.user_id}/role`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data && res.data.success) {
        setAlertMsg({ type: 'success', text: `🎉 Đã cập nhật vai trò cho người dùng #${editingUser.user_id} (${editingUser.full_name}) thành công!` });
        setEditingUser(null);
        fetchUsers();
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật vai trò người dùng:', error);
      setAlertMsg({ type: 'error', text: error.response?.data?.message || 'Không thể cập nhật vai trò người dùng!' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (roleId) => {
    switch (Number(roleId)) {
      case 1:
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontWeight: '700', fontSize: '12px' }}>🛡️ Admin</span>;
      case 2:
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', fontWeight: '700', fontSize: '12px' }}>👥 HR Manager</span>;
      case 3:
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontWeight: '700', fontSize: '12px' }}>🗺️ Tour Manager</span>;
      case 4:
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#faf5ff', color: '#6b21a8', border: '1px solid #e9d5ff', fontWeight: '700', fontSize: '12px' }}>💼 Office Staff</span>;
      case 5:
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a', fontWeight: '700', fontSize: '12px' }}>🚩 Tour Guide</span>;
      case 6:
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#f0f9ff', color: '#075985', border: '1px solid #bae6fd', fontWeight: '700', fontSize: '12px' }}>👤 Customer</span>;
      case 7:
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#fdf2f8', color: '#9d174d', border: '1px solid #fbcfe8', fontWeight: '700', fontSize: '12px' }}>🏪 Partner</span>;
      default:
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', fontWeight: '700', fontSize: '12px' }}>Role {roleId}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: '700' }}>● Hoạt động</span>;
      case 'Inactive':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#fef3c7', color: '#b45309', fontSize: '12px', fontWeight: '700' }}>● Tạm ngưng</span>;
      case 'Blocked':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#fef2f2', color: '#b91c1c', fontSize: '12px', fontWeight: '700' }}>● Đã khóa</span>;
      default:
        return <span style={{ padding: '4px 10px', borderRadius: '12px', background: '#f1f5f9', color: '#64748b', fontSize: '12px', fontWeight: '700' }}>{status}</span>;
    }
  };

  // Lọc người dùng
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      (u.phone && u.phone.includes(search));

    if (selectedRoleFilter === 'All') return matchesSearch;
    return matchesSearch && Number(u.role_id) === Number(selectedRoleFilter);
  });

  return (
    <div style={{ padding: '24px', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '20px', padding: '28px', color: '#fff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800' }}>
          🛡️ Quản Lý Người Dùng & Phân Vai Trò Hệ Thống (Role Management)
        </h2>
        <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
          Trung tâm quản lý phân quyền tập trung dành riêng cho Admin. Cấp phát vai trò (Role) và kiểm soát quyền truy cập cho tất cả tài khoản trong toàn bộ hệ thống ERP.
        </p>
      </div>

      {alertMsg.text && (
        <div style={{
          padding: '12px 18px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', fontWeight: '600',
          backgroundColor: alertMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: alertMsg.type === 'success' ? '#15803d' : '#b91c1c',
          border: `1px solid ${alertMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {alertMsg.text}
        </div>
      )}

      {/* Role Filter Tabs & Search */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'All', label: 'Tất cả tài khoản' },
            { id: '1', label: '🛡️ Admin' },
            { id: '2', label: '👥 HR Manager' },
            { id: '3', label: '🗺️ Tour Manager' },
            { id: '4', label: '💼 Office Staff' },
            { id: '5', label: '🚩 Tour Guide' },
            { id: '6', label: '👤 Customer' },
            { id: '7', label: '🏪 Partner' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedRoleFilter(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: selectedRoleFilter === tab.id ? 'none' : '1px solid #cbd5e1',
                background: selectedRoleFilter === tab.id ? '#0f172a' : '#ffffff',
                color: selectedRoleFilter === tab.id ? '#ffffff' : '#475569',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="🔍 Tìm theo tên, email, số điện thoại..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '10px 16px',
            border: '1px solid #cbd5e1',
            borderRadius: '10px',
            fontSize: '14px',
            width: '300px',
            outline: 'none'
          }}
        />
      </div>

      {/* User Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '16px', fontWeight: '700', color: '#0284c7' }}>
          ⏳ Đang tải danh sách tài khoản người dùng...
        </div>
      ) : (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '13px', textTransform: 'uppercase' }}>
                <th style={{ padding: '14px 16px' }}>ID</th>
                <th style={{ padding: '14px 16px' }}>Họ và Tên</th>
                <th style={{ padding: '14px 16px' }}>Email (Tài khoản)</th>
                <th style={{ padding: '14px 16px' }}>Số điện thoại</th>
                <th style={{ padding: '14px 16px' }}>Vai trò hiện tại (Role)</th>
                <th style={{ padding: '14px 16px' }}>Trạng thái</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>Thao tác Phân Role</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Không tìm thấy tài khoản người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.user_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#64748b' }}>#{u.user_id}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0f172a' }}>{u.full_name}</td>
                    <td style={{ padding: '14px 16px', color: '#334155' }}>{u.email}</td>
                    <td style={{ padding: '14px 16px', color: '#64748b' }}>{u.phone || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>{getRoleBadge(u.role_id)}</td>
                    <td style={{ padding: '14px 16px' }}>{getStatusBadge(u.status)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        style={{
                          padding: '6px 14px',
                          background: '#0f172a',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '12.5px',
                          cursor: 'pointer'
                        }}
                      >
                        ✏️ Đổi Role / Phân quyền
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Role Assignment Modal */}
      {editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '28px', width: '480px', maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              🛡️ Phân Vai Trò Tài Khoản Người Dùng
            </h3>

            <form onSubmit={handleSaveUserRole}>
              <div style={{ marginBottom: '16px', fontSize: '14px', color: '#475569', background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div><strong>Người dùng:</strong> {editingUser.full_name}</div>
                <div><strong>Email:</strong> {editingUser.email} (ID #{editingUser.user_id})</div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '14px', color: '#334155', marginBottom: '8px' }}>
                  Chọn Vai trò Hệ thống (Role) mới *
                </label>
                <select
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                >
                  <option value={1}>🛡️ Administrator (Quản trị viên hệ thống)</option>
                  <option value={2}>👥 HR Manager (Quản lý Nhân sự)</option>
                  <option value={3}>🗺️ Tour Manager (Quản lý Tour & Vận hành)</option>
                  <option value={4}>💼 Office Staff (Nhân viên văn phòng / Điều hành)</option>
                  <option value={5}>🚩 Tour Guide (Hướng dẫn viên du lịch)</option>
                  <option value={6}>👤 Customer (Khách hàng / Du khách)</option>
                  <option value={7}>🏪 Partner (Đối tác cung ứng dịch vụ)</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '700', fontSize: '14px', color: '#334155', marginBottom: '8px' }}>
                  Trạng thái tài khoản *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                >
                  <option value="Active">🟢 Active (Hoạt động bình thường)</option>
                  <option value="Inactive">🟡 Inactive (Tạm ngưng hoạt động)</option>
                  <option value="Blocked">🔴 Blocked (Khóa tài khoản)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '10px 24px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}
                >
                  {isSubmitting ? 'Đang lưu...' : 'Cập Nhật Vai Trò'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminUserManagement;

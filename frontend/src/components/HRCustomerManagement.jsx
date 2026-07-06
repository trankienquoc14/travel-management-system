import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/partner.css';

const HRCustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Trạng thái Form
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    gender: 'Male',
    date_of_birth: '',
    status: 'Active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/hr/customers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách khách hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cust) => {
    setEditData(cust);
    setFormData({
      full_name: cust.full_name || '',
      email: cust.email || '',
      password: '', // Để trống nếu không muốn đổi mật khẩu
      phone: cust.phone || '',
      gender: cust.gender || 'Male',
      date_of_birth: cust.date_of_birth ? cust.date_of_birth.slice(0, 10) : '',
      status: cust.status || 'Active'
    });
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditData(null);
    setFormData({
      full_name: '',
      email: '',
      password: '',
      phone: '',
      gender: 'Male',
      date_of_birth: '',
      status: 'Active'
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`http://localhost:5000/api/hr/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        alert('Xóa khách hàng thành công!');
        fetchCustomers();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể xóa khách hàng này.');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name.trim()) return alert('Vui lòng nhập họ tên.');
    if (!formData.email.trim()) return alert('Vui lòng nhập email.');
    if (!editData && !formData.password.trim()) return alert('Vui lòng nhập mật khẩu cho tài khoản mới.');

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (editData) {
        // Cập nhật
        const res = await axios.put(
          `http://localhost:5000/api/hr/customers/${editData.user_id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          alert('Cập nhật khách hàng thành công!');
          setShowForm(false);
          fetchCustomers();
        }
      } else {
        // Thêm mới
        const res = await axios.post(
          'http://localhost:5000/api/hr/customers',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          alert('Thêm khách hàng thành công!');
          setShowForm(false);
          fetchCustomers();
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'warning';
      case 'Blocked': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Active': return 'Đang hoạt động';
      case 'Inactive': return 'Tạm ngưng';
      case 'Blocked': return 'Đã khóa';
      default: return status;
    }
  };

  // Lọc tìm kiếm
  const filteredCustomers = customers.filter(cust => 
    cust.full_name.toLowerCase().includes(search.toLowerCase()) ||
    cust.email.toLowerCase().includes(search.toLowerCase()) ||
    (cust.phone && cust.phone.includes(search))
  );

  if (loading && customers.length === 0) {
    return <div style={{ padding: 20 }}>Đang tải danh sách khách hàng...</div>;
  }

  if (showForm) {
    return (
      <div className="form-page-container">
        <div className="form-page-header">
          <button className="btn-back" type="button" onClick={() => setShowForm(false)}>
            ⬅ Quay lại danh sách
          </button>
          <h2>{editData ? `Cập nhật khách hàng: ${editData.full_name}` : 'Thêm Khách hàng mới'}</h2>
        </div>

        <form className="full-page-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Họ và Tên *</label>
              <input 
                type="text" 
                name="full_name" 
                value={formData.full_name} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
                disabled={!!editData}
              />
            </div>

            <div className="form-group">
              <label>Mật khẩu {editData ? '(Bỏ trống nếu giữ nguyên)' : '*'}</label>
              <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                placeholder={editData ? '••••••' : 'Nhập mật khẩu'} 
                required={!editData}
              />
            </div>

            <div className="form-group">
              <label>Số điện thoại</label>
              <input 
                type="text" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
              />
            </div>

            <div className="form-group">
              <label>Giới tính</label>
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="Male">Nam</option>
                <option value="Female">Nữ</option>
                <option value="Other">Khác</option>
              </select>
            </div>

            <div className="form-group">
              <label>Ngày sinh</label>
              <input 
                type="date" 
                name="date_of_birth" 
                value={formData.date_of_birth} 
                onChange={handleChange} 
              />
            </div>

            <div className="form-group">
              <label>Trạng thái tài khoản *</label>
              <select name="status" value={formData.status} onChange={handleChange} required>
                <option value="Active">Hoạt động</option>
                <option value="Inactive">Tạm ngưng</option>
                <option value="Blocked">Khóa tài khoản</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel-lg" onClick={() => setShowForm(false)}>
              Hủy bỏ
            </button>
            <button type="submit" className="btn-save-lg" disabled={isSubmitting}>
              {isSubmitting ? 'Đang xử lý...' : editData ? 'Lưu thay đổi' : 'Tạo khách hàng'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <div>
          <h2>Quản lý Khách hàng</h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Xem, sửa, thêm và khóa/mở tài khoản của tệp khách hàng thành viên.
          </p>
        </div>
        <button className="btn-add-new" onClick={handleAddNew}>
          + Thêm Khách hàng
        </button>
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Tìm theo tên, email, số điện thoại..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          style={{
            padding: '8px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            width: '320px',
            fontSize: '14px'
          }}
        />
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ và Tên</th>
              <th>Tài khoản Email</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
              <th>Giới tính</th>
              <th>Ngày sinh</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                  Không tìm thấy khách hàng nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredCustomers.map(cust => (
                <tr key={cust.user_id}>
                  <td>#{cust.user_id}</td>
                  <td style={{ fontWeight: '600', color: '#0f172a' }}>{cust.full_name}</td>
                  <td>{cust.email}</td>
                  <td>{cust.phone || '—'}</td>
                  <td>
                    <span 
                      style={{ 
                        padding: '4px 8px', 
                        background: '#f8fafc', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px', 
                        fontSize: '12px',
                        fontWeight: '500' 
                      }}
                    >
                      Khách hàng
                    </span>
                  </td>
                  <td>{cust.gender === 'Male' ? 'Nam' : cust.gender === 'Female' ? 'Nữ' : 'Khác'}</td>
                  <td>{cust.date_of_birth ? new Date(cust.date_of_birth).toLocaleDateString('vi-VN') : '—'}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(cust.status)}`}>
                      {getStatusText(cust.status)}
                    </span>
                  </td>
                  <td>
                    <button className="btn-action edit" onClick={() => handleEdit(cust)} title="Chỉnh sửa">
                      ✏️
                    </button>
                    <button className="btn-action delete" onClick={() => handleDelete(cust.user_id)} title="Xóa tài khoản">
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HRCustomerManagement;

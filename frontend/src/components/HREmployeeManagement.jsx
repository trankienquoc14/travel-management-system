import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/partner.css'; // Tái sử dụng CSS chung của Partner/Service Management

const HREmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
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
    role_id: 4, // Mặc định Nhân viên văn phòng
    gender: 'Male',
    date_of_birth: '',
    status: 'Active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/hr/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setEmployees(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách nhân viên:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (emp) => {
    setEditData(emp);
    setFormData({
      full_name: emp.full_name || '',
      email: emp.email || '',
      password: '', // Để trống nếu không muốn đổi mật khẩu
      phone: emp.phone || '',
      role_id: emp.role_id || 4,
      gender: emp.gender || 'Male',
      date_of_birth: emp.date_of_birth ? emp.date_of_birth.slice(0, 10) : '',
      status: emp.status || 'Active'
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
      role_id: 4,
      gender: 'Male',
      date_of_birth: '',
      status: 'Active'
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhân viên này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`http://localhost:5000/api/hr/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        alert('Xóa nhân viên thành công!');
        fetchEmployees();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể xóa nhân viên này.');
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
          `http://localhost:5000/api/hr/employees/${editData.user_id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          alert('Cập nhật nhân viên thành công!');
          setShowForm(false);
          fetchEmployees();
        }
      } else {
        // Thêm mới
        const res = await axios.post(
          'http://localhost:5000/api/hr/employees',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          alert('Thêm nhân viên thành công!');
          setShowForm(false);
          fetchEmployees();
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleName = (roleId) => {
    switch (Number(roleId)) {
      case 1: return 'Quản trị viên';
      case 2: return 'Quản lý nhân sự';
      case 3: return 'Quản lý Tour';
      case 4: return 'Nhân viên văn phòng';
      case 5: return 'Hướng dẫn viên';
      case 7: return 'Đối tác';
      default: return 'Khác';
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
  const filteredEmployees = employees.filter(emp => 
    emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
    emp.email.toLowerCase().includes(search.toLowerCase()) ||
    (emp.phone && emp.phone.includes(search))
  );

  if (loading && employees.length === 0) {
    return <div style={{ padding: 20 }}>Đang tải danh sách nhân sự...</div>;
  }

  if (showForm) {
    return (
      <div className="form-page-container">
        <div className="form-page-header">
          <button className="btn-back" type="button" onClick={() => setShowForm(false)}>
            ⬅ Quay lại danh sách
          </button>
          <h2>{editData ? `Cập nhật nhân viên: ${editData.full_name}` : 'Thêm Nhân viên mới'}</h2>
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
              <label>Email (Tài khoản) *</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
                disabled={!!editData} // Không cho đổi email của user đã có để tránh lỗi
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
              <label>Vai trò hệ thống *</label>
              <select name="role_id" value={formData.role_id} onChange={handleChange} required>
                <option value={2}>HR Manager (Quản lý nhân sự)</option>
                <option value={3}>Tour Manager (Quản lý Tour)</option>
                <option value={4}>Office Staff (Nhân viên văn phòng)</option>
                <option value={5}>Tour Guide (Hướng dẫn viên)</option>
                <option value={7}>Partner (Đối tác cung ứng)</option>
                <option value={1}>Administrator (Quản trị viên)</option>
              </select>
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
              {isSubmitting ? 'Đang xử lý...' : editData ? 'Lưu thay đổi' : 'Tạo nhân viên'}
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
          <h2>Quản lý Hồ sơ Nhân viên</h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Xem, sửa, thêm và quản lý trạng thái tài khoản của toàn bộ nhân sự nội bộ.
          </p>
        </div>
        <button className="btn-add-new" onClick={handleAddNew}>
          + Thêm Nhân viên
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
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                  Không tìm thấy nhân viên nào phù hợp.
                </td>
              </tr>
            ) : (
              filteredEmployees.map(emp => (
                <tr key={emp.user_id}>
                  <td>#{emp.user_id}</td>
                  <td style={{ fontWeight: '600', color: '#0f172a' }}>{emp.full_name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.phone || '—'}</td>
                  <td>
                    <span 
                      style={{ 
                        padding: '4px 8px', 
                        background: '#f1f5f9', 
                        borderRadius: '6px', 
                        fontSize: '12px',
                        fontWeight: '500' 
                      }}
                    >
                      {getRoleName(emp.role_id)}
                    </span>
                  </td>
                  <td>{emp.gender === 'Male' ? 'Nam' : emp.gender === 'Female' ? 'Nữ' : 'Khác'}</td>
                  <td>{emp.date_of_birth ? new Date(emp.date_of_birth).toLocaleDateString('vi-VN') : '—'}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(emp.status)}`}>
                      {getStatusText(emp.status)}
                    </span>
                  </td>
                  <td>
                    <button className="btn-action edit" onClick={() => handleEdit(emp)} title="Chỉnh sửa">
                      ✏️
                    </button>
                    <button className="btn-action delete" onClick={() => handleDelete(emp.user_id)} title="Xóa tài khoản">
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

export default HREmployeeManagement;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, UserPlus, Filter, Shield, Edit, Lock, Unlock, Users, UserCheck, UserX, UserPlus2, ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/partner.css';

const HRCustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Active', 'Locked'

  // Booking Data for Profile
  const [customerBookings, setCustomerBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const fetchCustomerBookings = async (customerId) => {
    try {
      setLoadingBookings(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/bookings/admin/all-bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const allBookings = res.data.data;
        setCustomerBookings(allBookings.filter(b => Number(b.customer_id) === Number(customerId)));
      }
    } catch (error) {
      console.error('Lỗi tải lịch sử đặt tour:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    fetchCustomerBookings(cust.user_id);
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

  const handleToggleLock = async (cust) => {
    const isLocked = cust.status === 'Blocked' || cust.status === 'Inactive';
    const newStatus = isLocked ? 'Active' : 'Blocked';
    const actionName = isLocked ? 'mở khóa' : 'khóa';
    
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionName} tài khoản của ${cust.full_name}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
          full_name: cust.full_name,
          email: cust.email,
          phone: cust.phone,
          gender: cust.gender,
          date_of_birth: cust.date_of_birth,
          status: newStatus
      };
      const res = await axios.put(`http://localhost:5000/api/hr/customers/${cust.user_id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        alert(`Đã ${actionName} tài khoản thành công!`);
        fetchCustomers();
      }
    } catch (error) {
      alert(error.response?.data?.message || `Không thể ${actionName} tài khoản này.`);
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

  const getStatusBadgeStyle = (status) => {
    const isLocked = status === 'Blocked' || status === 'Inactive';
    return isLocked 
        ? { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }
        : { background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac' };
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Active': return 'Đang hoạt động';
      case 'Inactive': return 'Tạm ngưng';
      case 'Blocked': return 'Đã khóa';
      default: return status;
    }
  };

  // Thống kê (Stats)
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'Active').length;
  const lockedCustomers = customers.filter(c => c.status === 'Blocked' || c.status === 'Inactive').length;
  const newCustomers = customers.filter(c => {
      if(!c.created_at) return false;
      const daysDiff = (new Date() - new Date(c.created_at)) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
  }).length;

  // Lọc tìm kiếm
  const filteredCustomers = customers.filter(cust => {
    const matchSearch = cust.full_name.toLowerCase().includes(search.toLowerCase()) ||
                        cust.email.toLowerCase().includes(search.toLowerCase()) ||
                        (cust.phone && cust.phone.includes(search));
    const matchStatus = filterStatus === 'All' ? true :
                        filterStatus === 'Active' ? cust.status === 'Active' :
                        (cust.status === 'Blocked' || cust.status === 'Inactive');
    return matchSearch && matchStatus;
  });

  // Phân trang
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
      setCurrentPage(1); // Reset page on filter
  }, [search, filterStatus]);

  if (loading && customers.length === 0) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Đang tải danh sách khách hàng...</div>;
  }

  if (showForm) {
    const isEditing = !!editData;
    
    // Stats calc
    const totalBookings = customerBookings.length;
    const completedBookings = customerBookings.filter(b => b.booking_status === 'Completed').length;
    const processingBookings = customerBookings.filter(b => b.booking_status === 'Pending' || b.booking_status === 'Confirmed' || b.payment_status === 'Pending').length;
    const canceledBookings = customerBookings.filter(b => b.booking_status === 'Cancelled' || b.booking_status === 'Cancel').length;
    const totalSpent = customerBookings.reduce((sum, b) => sum + (b.payment_status === 'Paid' ? Number(b.total_amount) || 0 : 0), 0);

    return (
      <div className="form-page-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        {/* HEADER */}
        <div className="management-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <button 
              className="btn-back" 
              type="button" 
              onClick={() => setShowForm(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: '#64748b', fontWeight: '600', cursor: 'pointer', padding: 0, marginBottom: '12px' }}
            >
              <ChevronLeft size={18} /> Quay lại danh sách
            </button>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#0f172a' }}>
              {isEditing ? `Hồ sơ khách hàng: ${editData.full_name}` : 'Thêm Khách hàng mới'}
            </h2>
          </div>
          {isEditing && (
            <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button"
                  onClick={() => handleToggleLock(editData)}
                  style={{ padding: '10px 20px', background: (editData.status === 'Blocked' || editData.status === 'Inactive') ? '#10b981' : '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s' }}
                >
                  {(editData.status === 'Blocked' || editData.status === 'Inactive') ? <><Unlock size={18} /> Mở khóa tài khoản</> : <><Lock size={18} /> Khóa tài khoản</>}
                </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* 1. THÔNG TIN CÁ NHÂN */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={20} color="#3b82f6" /> Thông tin cá nhân
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Họ và Tên *</label>
                <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Giới tính</label>
                <select name="gender" value={formData.gender} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}>
                  <option value="Male">Nam</option>
                  <option value="Female">Nữ</option>
                  <option value="Other">Khác</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Ngày sinh</label>
                <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Số điện thoại</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
              </div>
            </div>
          </div>

          {/* 2. THÔNG TIN TÀI KHOẢN & MẬT KHẨU */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
              <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={20} color="#10b981" /> Thông tin tài khoản
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Email (Tài khoản đăng nhập) *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled={isEditing} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: isEditing ? '#f8fafc' : '#fff' }} />
                  </div>
                  
                  {isEditing && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                          <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>ID Khách hàng</label>
                            <input type="text" value={`#${editData.user_id}`} disabled style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#f8fafc', color: '#64748b' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Ngày đăng ký</label>
                            <input type="text" value={editData.created_at ? new Date(editData.created_at).toLocaleDateString('vi-VN') : '—'} disabled style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', background: '#f8fafc', color: '#64748b' }} />
                          </div>
                      </div>
                  )}

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Trạng thái tài khoản *</label>
                    <select name="status" value={formData.status} onChange={handleChange} required style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', background: '#fff' }}>
                      <option value="Active">🟢 Đang hoạt động</option>
                      <option value="Inactive">🟡 Tạm ngưng</option>
                      <option value="Blocked">🔴 Đã khóa</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={20} color="#f59e0b" /> Mật khẩu
                </h3>
                
                {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>Mật khẩu hiện tại</div>
                                <div style={{ fontSize: '20px', letterSpacing: '2px', color: '#0f172a' }}>••••••••</div>
                            </div>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Đặt lại mật khẩu mới</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Nhập mật khẩu mới nếu muốn thay đổi" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                        </div>
                    </div>
                ) : (
                    <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#475569', fontSize: '14px' }}>Mật khẩu *</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Nhập mật khẩu" required style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
                    </div>
                )}
              </div>
          </div>

          {/* 3. TỔNG QUAN & LỊCH SỬ ĐẶT TOUR (Chỉ hiện khi Edit) */}
          {isEditing && (
            <>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={20} color="#8b5cf6" /> Tổng quan đặt tour
                    </h3>
                    
                    {loadingBookings ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Đang tải dữ liệu...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Tổng đơn</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{totalBookings}</div>
                            </div>
                            <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                                <div style={{ fontSize: '13px', color: '#16a34a', marginBottom: '4px' }}>Đã hoàn thành</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#15803d' }}>{completedBookings}</div>
                            </div>
                            <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a' }}>
                                <div style={{ fontSize: '13px', color: '#d97706', marginBottom: '4px' }}>Đang xử lý</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#b45309' }}>{processingBookings}</div>
                            </div>
                            <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                                <div style={{ fontSize: '13px', color: '#dc2626', marginBottom: '4px' }}>Đã hủy</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#b91c1c' }}>{canceledBookings}</div>
                            </div>
                            <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                                <div style={{ fontSize: '13px', color: '#2563eb', marginBottom: '4px' }}>Tổng chi tiêu</div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1d4ed8' }}>{totalSpent.toLocaleString('vi-VN')} đ</div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Search size={20} color="#0ea5e9" /> Lịch sử đặt tour
                        </h3>
                    </div>
                    
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>Mã đơn</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>Tour</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>Ngày khởi hành</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>Số tiền</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingBookings ? (
                                    <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Đang tải...</td></tr>
                                ) : customerBookings.length === 0 ? (
                                    <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Khách hàng chưa có lịch sử đặt tour.</td></tr>
                                ) : (
                                    customerBookings.slice(0, 5).map(b => (
                                        <tr key={b.booking_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0284c7', fontWeight: '600', whiteSpace: 'nowrap' }}>#BKG-{b.booking_id}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0f172a', fontWeight: '500', whiteSpace: 'nowrap', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.tour_name}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b', whiteSpace: 'nowrap' }}>{b.departure_date ? new Date(b.departure_date).toLocaleDateString('vi-VN') : '—'}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#10b981', fontWeight: '600', whiteSpace: 'nowrap' }}>{Number(b.total_amount).toLocaleString('vi-VN')} đ</td>
                                            <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                                <span style={{ 
                                                    padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                                                    background: b.booking_status === 'Completed' ? '#dcfce7' : b.booking_status === 'Cancelled' ? '#fee2e2' : '#fef3c7',
                                                    color: b.booking_status === 'Completed' ? '#16a34a' : b.booking_status === 'Cancelled' ? '#ef4444' : '#d97706'
                                                }}>
                                                    {b.booking_status === 'Completed' ? 'Đã hoàn thành' : b.booking_status === 'Cancelled' ? 'Đã hủy' : b.booking_status === 'Confirmed' ? 'Đã xác nhận' : 'Chờ xử lý'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {customerBookings.length > 5 && (
                            <div style={{ textAlign: 'center', padding: '12px', background: '#f8fafc', color: '#3b82f6', fontSize: '13px', fontWeight: '600', cursor: 'pointer', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
                                Xem tất cả {customerBookings.length} đơn đặt tour
                            </div>
                        )}
                    </div>
                </div>
            </>
          )}

          {/* ACTIONS */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '12px 24px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#475569', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }}>
              Hủy bỏ
            </button>
            <button type="submit" disabled={isSubmitting} style={{ padding: '12px 24px', background: '#2563eb', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: '0.2s', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="management-container">
      {/* 1. HEADER */}
      <div className="management-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', color: '#0f172a' }}>Quản lý Khách hàng</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Quản lý thông tin và trạng thái tài khoản khách hàng.</p>
        </div>
        <button 
          onClick={handleAddNew}
          style={{ padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)', transition: '0.2s' }}
        >
          <UserPlus size={18} /> Thêm Khách hàng
        </button>
      </div>

      {/* 2. STATISTIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '12px', color: '#3b82f6' }}><Users size={24} /></div>
              <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{totalCustomers}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Tổng khách hàng</div>
              </div>
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '12px', color: '#16a34a' }}><UserCheck size={24} /></div>
              <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{activeCustomers}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Đang hoạt động</div>
              </div>
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '12px', color: '#dc2626' }}><UserX size={24} /></div>
              <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{lockedCustomers}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Đã khóa</div>
              </div>
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: '#fdf4ff', padding: '12px', borderRadius: '12px', color: '#c026d3' }}><UserPlus2 size={24} /></div>
              <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{newCustomers}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Khách hàng mới</div>
              </div>
          </div>
      </div>

      {/* 3. FILTER BAR */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => setFilterStatus('All')} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filterStatus === 'All' ? '#0f172a' : '#f8fafc', color: filterStatus === 'All' ? '#fff' : '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>Tất cả</button>
              <button onClick={() => setFilterStatus('Active')} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filterStatus === 'Active' ? '#10b981' : '#f8fafc', color: filterStatus === 'Active' ? '#fff' : '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>Đang hoạt động</button>
              <button onClick={() => setFilterStatus('Locked')} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filterStatus === 'Locked' ? '#ef4444' : '#f8fafc', color: filterStatus === 'Locked' ? '#fff' : '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>Đã khóa</button>
          </div>

          <div style={{ position: 'relative', width: '350px', maxWidth: '100%' }}>
              <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder="Tìm theo tên, email, số điện thoại..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 16px 10px 42px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#334155', outline: 'none', background: '#f8fafc', transition: '0.2s' }} />
          </div>
      </div>

      {/* 4. DATA TABLE */}
      <div className="table-responsive" style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap' }}>ID</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap' }}>Họ và Tên</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap' }}>Email</th>
              <th style={{ padding: '16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap' }}>Số điện thoại</th>
              <th style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap' }}>Trạng thái</th>
              <th style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  Không tìm thấy khách hàng nào phù hợp.
                </td>
              </tr>
            ) : (
              paginatedCustomers.map(cust => {
                const isLocked = cust.status === 'Blocked' || cust.status === 'Inactive';
                return (
                  <tr key={cust.user_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px', whiteSpace: 'nowrap', color: '#94a3b8', fontSize: '14px' }}>#{cust.user_id}</td>
                    <td style={{ padding: '16px', fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap', fontSize: '14px' }}>{cust.full_name}</td>
                    <td style={{ padding: '16px', color: '#475569', fontSize: '14px' }}>{cust.email}</td>
                    <td style={{ padding: '16px', whiteSpace: 'nowrap', color: '#475569', fontSize: '14px' }}>{cust.phone || '—'}</td>
                    <td style={{ padding: '16px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                      <span 
                        style={{ 
                          padding: '6px 12px', 
                          borderRadius: '20px', 
                          fontSize: '12px',
                          fontWeight: '600',
                          display: 'inline-block',
                          ...getStatusBadgeStyle(cust.status)
                        }}
                      >
                        {getStatusText(cust.status)}
                      </span>
                    </td>
                    <td style={{ padding: '16px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleEdit(cust)} 
                        title="Chỉnh sửa" 
                        style={{ background: '#eff6ff', color: '#3b82f6', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', marginRight: '8px', transition: '0.2s' }}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleToggleLock(cust)} 
                        title={isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"} 
                        style={{ background: isLocked ? '#f0fdf4' : '#fef2f2', color: isLocked ? '#16a34a' : '#ef4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' }}
                      >
                        {isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. PAGINATION */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
            <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#cbd5e1' : '#475569' }}
            >
                <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: '14px', color: '#475569', fontWeight: '500' }}>
                Trang {currentPage} / {totalPages}
            </span>
            <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#cbd5e1' : '#475569' }}
            >
                <ChevronRight size={18} />
            </button>
        </div>
      )}

    </div>
  );
};

export default HRCustomerManagement;
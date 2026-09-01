import React, { useEffect, useState } from 'react';
import axios from 'axios';

const HRLeaveRequest = ({ mode = 'my_requests' }) => {
  const [user, setUser] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState(mode === 'approval' ? 'approval' : 'my_requests');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(null);
  const [managerNote, setManagerNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    request_type: 'Future_Leave',
    leave_type: 'Nghỉ phép năm',
    explanation_type: 'Quên Check-in',
    start_date: '',
    end_date: '',
    target_date: '',
    proposed_check_in: '08:00',
    proposed_check_out: '17:00',
    reason: '',
    attachment: null
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const cleanDate = dateStr.split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return '—';
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeStr;
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    if (mode === 'approval') {
      setActiveSubTab('approval');
    } else {
      setActiveSubTab('my_requests');
    }
  }, [mode]);

  useEffect(() => {
    fetchRequests();
  }, [activeSubTab, filterStatus, filterType]);

  const fetchRequests = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/hr/leave-requests/my-requests';
      if (activeSubTab === 'approval') {
        url = `http://localhost:5000/api/hr/leave-requests/all?status=${filterStatus}&request_type=${filterType}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setRequests(response.data.data || []);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách đơn:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    const todayStr = new Date().toISOString().split('T')[0];

    if (!formData.reason.trim()) {
      alert("Vui lòng điền lý do xin nghỉ phép / giải trình!");
      return;
    }

    if (formData.request_type === 'Future_Leave') {
      if (!formData.start_date || !formData.end_date) {
        alert("Vui lòng chọn từ ngày và đến ngày xin nghỉ phép!");
        return;
      }
      if (formData.start_date < todayStr) {
        alert("Đơn nghỉ phép tương lai: Ngày bắt đầu phải từ ngày hôm nay trở đi!");
        return;
      }
      if (formData.end_date < formData.start_date) {
        alert("Đơn nghỉ phép tương lai: Ngày kết thúc không được nhỏ hơn ngày bắt đầu!");
        return;
      }
    } else if (formData.request_type === 'Past_Explanation') {
      if (!formData.target_date) {
        alert("Vui lòng chọn ngày cần giải trình trong quá khứ!");
        return;
      }
      if (formData.target_date > todayStr) {
        alert("Giải trình quên chấm công: Ngày chọn phải là ngày trong quá khứ (tối đa là hôm nay)!");
        return;
      }
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('request_type', formData.request_type);
      data.append('reason', formData.reason);

      if (formData.request_type === 'Future_Leave') {
        data.append('leave_type', formData.leave_type);
        data.append('start_date', formData.start_date);
        data.append('end_date', formData.end_date);
      } else {
        data.append('explanation_type', formData.explanation_type);
        data.append('target_date', formData.target_date);
        if (formData.proposed_check_in) {
          data.append('proposed_check_in', formData.proposed_check_in.length === 5 ? formData.proposed_check_in + ':00' : formData.proposed_check_in);
        }
        if (formData.proposed_check_out) {
          data.append('proposed_check_out', formData.proposed_check_out.length === 5 ? formData.proposed_check_out + ':00' : formData.proposed_check_out);
        }
      }

      if (formData.attachment) {
        data.append('attachment', formData.attachment);
      }

      const response = await axios.post('http://localhost:5000/api/hr/leave-requests', data, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        alert(response.data.message);
        setShowCreateModal(false);
        setFormData({
          request_type: 'Future_Leave',
          leave_type: 'Nghỉ phép năm',
          explanation_type: 'Quên Check-in',
          start_date: '',
          end_date: '',
          target_date: '',
          proposed_check_in: '08:00',
          proposed_check_out: '17:00',
          reason: '',
          attachment: null
        });
        fetchRequests();
      }
    } catch (error) {
      console.error("Lỗi khi gửi đơn:", error);
      const serverMsg = error.response?.data?.message;
      if (serverMsg) {
        alert(`❌ Gửi đơn thất bại: ${serverMsg}`);
      } else if (error.message) {
        alert(`❌ Gửi đơn thất bại (${error.message}). Vui lòng kiểm tra lại dịch vụ Backend!`);
      } else {
        alert("❌ Có lỗi xảy ra khi gửi đơn!");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async (status) => {
    if (!showReviewModal) return;
    const token = localStorage.getItem('token');
    
    setSubmitting(true);
    try {
      const response = await axios.put(
        `http://localhost:5000/api/hr/leave-requests/${showReviewModal.request_id}/review`,
        { status, manager_note: managerNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert(response.data.message);
        setShowReviewModal(null);
        setManagerNote('');
        fetchRequests();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi duyệt đơn!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn rút lại đơn này không?")) return;
    const token = localStorage.getItem('token');

    try {
      const response = await axios.delete(`http://localhost:5000/api/hr/leave-requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        alert(response.data.message);
        fetchRequests();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra!');
    }
  };

  const isHRorAdmin = user && (user.role === 1 || user.role === 2 || user.role_id === 1 || user.role_id === 2);

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
            📝 Quản Lý Đơn Xin Nghỉ Phép & Giải Trình Chấm Công
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', margin: 0 }}>
            Lập đơn xin nghỉ phép tương lai hoặc giải trình quên chấm công trong quá khứ.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {isHRorAdmin && (
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '4px' }}>
              <button
                onClick={() => setActiveSubTab('my_requests')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: activeSubTab === 'my_requests' ? '#0284c7' : 'transparent',
                  color: activeSubTab === 'my_requests' ? '#fff' : '#64748b'
                }}
              >
                👤 Đơn của tôi
              </button>
              <button
                onClick={() => setActiveSubTab('approval')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: activeSubTab === 'approval' ? '#0284c7' : 'transparent',
                  color: activeSubTab === 'approval' ? '#fff' : '#64748b'
                }}
              >
                📋 Duyệt đơn nhân sự
              </button>
            </div>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              border: 'none',
              background: '#10b981',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
            }}
          >
            ➕ Tạo Đơn Mới
          </button>
        </div>
      </div>

      {/* Filter Toolbar (For Approval mode) */}
      {activeSubTab === 'approval' && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>Trạng thái:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="Pending">⏳ Chờ duyệt</option>
              <option value="Approved">✅ Đã duyệt</option>
              <option value="Rejected">❌ Từ chối</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px' }}>Loại đơn:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            >
              <option value="All">Tất cả loại đơn</option>
              <option value="Future_Leave">🌴 Xin nghỉ phép tương lai</option>
              <option value="Past_Explanation">🕒 Giải trình quên chấm công</option>
            </select>
          </div>
        </div>
      )}

      {/* Table List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Đang tải dữ liệu đơn...</div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
          <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>Chưa có đơn xin nghỉ phép hay giải trình nào được ghi nhận.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', color: '#475569', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px' }}>Mã Đơn</th>
                {activeSubTab === 'approval' && <th style={{ padding: '12px' }}>Nhân Viên</th>}
                <th style={{ padding: '12px' }}>Loại Đơn</th>
                <th style={{ padding: '12px' }}>Chi Tiết Thời Gian</th>
                <th style={{ padding: '12px' }}>Lý Do</th>
                <th style={{ padding: '12px' }}>Trạng Thái</th>
                <th style={{ padding: '12px' }}>Ngày Gửi</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item) => (
                <tr key={item.request_id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: '700', color: '#0284c7' }}>#{item.request_id}</td>
                  {activeSubTab === 'approval' && (
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.employee_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{item.employee_role}</div>
                    </td>
                  )}
                  <td style={{ padding: '12px' }}>
                    {item.request_type === 'Future_Leave' ? (
                      <span style={{ display: 'inline-block', background: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '4px', fontWeight: '600', fontSize: '12px' }}>
                        🌴 Nghỉ phép tương lai ({item.leave_type || 'Nghỉ phép năm'})
                      </span>
                    ) : (
                      <span style={{ display: 'inline-block', background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '4px', fontWeight: '600', fontSize: '12px' }}>
                        🕒 Giải trình quá khứ ({item.explanation_type || 'Quên chấm công'})
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {item.request_type === 'Future_Leave' ? (
                      <div>📅 <b>{formatDate(item.start_date)}</b> → <b>{formatDate(item.end_date)}</b></div>
                    ) : (
                      <div>
                        <div>📅 Ngày: <b>{formatDate(item.target_date)}</b></div>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                          ⏰ Check-in: <b>{formatTimeDisplay(item.proposed_check_in)}</b> | Check-out: <b>{formatTimeDisplay(item.proposed_check_out)}</b>
                        </div>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.reason}>
                    {item.reason}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {item.status === 'Pending' && <span style={{ background: '#ffedd5', color: '#c2410c', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '11px' }}>⏳ Chờ duyệt</span>}
                    {item.status === 'Approved' && <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '11px' }}>✅ Đã duyệt</span>}
                    {item.status === 'Rejected' && <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '11px' }}>❌ Từ chối</span>}
                  </td>
                  <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>
                    {new Date(item.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button
                        onClick={() => setShowDetailModal(item)}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '12px', cursor: 'pointer' }}
                        title="Xem chi tiết"
                      >
                        👁️ Xem
                      </button>

                      {activeSubTab === 'approval' && item.status === 'Pending' && (
                        <button
                          onClick={() => { setShowReviewModal(item); setManagerNote(''); }}
                          style={{ padding: '4px 10px', borderRadius: '4px', border: 'none', background: '#0284c7', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          ⚡ Duyệt đơn
                        </button>
                      )}

                      {activeSubTab === 'my_requests' && item.status === 'Pending' && (
                        <button
                          onClick={() => handleDeleteRequest(item.request_id)}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
                          title="Rút đơn"
                        >
                          🗑️ Rút đơn
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 1: Tạo Đơn Mới */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '550px', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>➕ Tạo Đơn Nghỉ Phép / Giải Trình</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              {/* Type Switcher */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Loại Đơn Yêu Cầu:</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, request_type: 'Future_Leave' })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: formData.request_type === 'Future_Leave' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: formData.request_type === 'Future_Leave' ? '#f0f9ff' : '#fff',
                      color: formData.request_type === 'Future_Leave' ? '#0369a1' : '#475569',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    🌴 Xin nghỉ phép (Tương lai)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, request_type: 'Past_Explanation' })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: formData.request_type === 'Past_Explanation' ? '2px solid #d97706' : '1px solid #cbd5e1',
                      background: formData.request_type === 'Past_Explanation' ? '#fffbeb' : '#fff',
                      color: formData.request_type === 'Past_Explanation' ? '#b45309' : '#475569',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    🕒 Giải trình (Quá khứ)
                  </button>
                </div>
              </div>

              {/* Chế độ 1: Xin nghỉ phép tương lai */}
              {formData.request_type === 'Future_Leave' && (
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Loại Nghỉ Phép:</label>
                    <select
                      value={formData.leave_type}
                      onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="Nghỉ phép năm">🌴 Nghỉ phép năm</option>
                      <option value="Nghỉ việc riêng">🏠 Nghỉ việc riêng</option>
                      <option value="Nghỉ ốm">🏥 Nghỉ ốm (Có giấy bác sĩ)</option>
                      <option value="Nghỉ thai sản / chế độ">👶 Nghỉ thai sản / Chế độ nhà nước</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Từ Ngày (* - Tương lai):</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Đến Ngày (* - Tương lai):</label>
                      <input
                        type="date"
                        min={formData.start_date || new Date().toISOString().split('T')[0]}
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Chế độ 2: Giải trình chấm công quá khứ */}
              {formData.request_type === 'Past_Explanation' && (
                <>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Loại Giải Trình:</label>
                    <select
                      value={formData.explanation_type}
                      onChange={(e) => setFormData({ ...formData, explanation_type: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    >
                      <option value="Quên Check-in">🌅 Quên Check-in (Vào ca)</option>
                      <option value="Quên Check-out">🌆 Quên Check-out (Ra ca)</option>
                      <option value="Quên cả Check-in & Check-out">🔄 Quên cả Check-in & Check-out</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Ngày Quên Chấm Công (* - Quá khứ):</label>
                    <input
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      value={formData.target_date}
                      onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Giờ Check-in Đề Xuất:</label>
                      <input
                        type="time"
                        value={formData.proposed_check_in}
                        onChange={(e) => setFormData({ ...formData, proposed_check_in: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Giờ Check-out Đề Xuất:</label>
                      <input
                        type="time"
                        value={formData.proposed_check_out}
                        onChange={(e) => setFormData({ ...formData, proposed_check_out: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Reason */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Lý Do Chi Tiết (*):</label>
                <textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Ghi rõ lý do xin nghỉ hoặc lý do quên chấm công..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  required
                />
              </div>

              {/* Attachment */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Ảnh Minh Chứng Đính Kèm (Không bắt buộc):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, attachment: e.target.files[0] || null })}
                  style={{ fontSize: '12px', color: '#475569' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px', cursor: 'pointer' }}
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {submitting ? 'Đang gửi...' : 'Gửi Đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Xem Chi Tiết Đơn */}
      {showDetailModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>📄 Chi Tiết Đơn #{showDetailModal.request_id}</h3>
              <button onClick={() => setShowDetailModal(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#334155' }}>
              <p><b>Nhân viên:</b> {showDetailModal.employee_name} ({showDetailModal.employee_role})</p>
              <p><b>Loại đơn:</b> {showDetailModal.request_type === 'Future_Leave' ? `🌴 Xin nghỉ phép (${showDetailModal.leave_type})` : `🕒 Giải trình quá khứ (${showDetailModal.explanation_type})`}</p>
              
              {showDetailModal.request_type === 'Future_Leave' ? (
                <p><b>Thời gian nghỉ:</b> {formatDate(showDetailModal.start_date)} → {formatDate(showDetailModal.end_date)}</p>
              ) : (
                <>
                  <p><b>Ngày giải trình:</b> {formatDate(showDetailModal.target_date)}</p>
                  <p><b>Giờ check-in / check-out:</b> {formatTimeDisplay(showDetailModal.proposed_check_in)} → {formatTimeDisplay(showDetailModal.proposed_check_out)}</p>
                </>
              )}

              <p><b>Lý do:</b> {showDetailModal.reason}</p>
              
              {showDetailModal.attachment_url && (
                <div style={{ marginTop: '10px' }}>
                  <b>Ảnh minh chứng:</b>
                  <div style={{ marginTop: '6px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', maxHeight: '200px' }}>
                    <img src={`http://localhost:5000${showDetailModal.attachment_url}`} alt="Minh chứng" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
              )}

              <div style={{ marginTop: '12px', padding: '10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: 0 }}><b>Trạng thái:</b> {showDetailModal.status}</p>
                {showDetailModal.manager_name && <p style={{ margin: '4px 0 0 0' }}><b>Người duyệt:</b> {showDetailModal.manager_name}</p>}
                {showDetailModal.manager_note && <p style={{ margin: '4px 0 0 0', color: '#dc2626' }}><b>Ghi chú người duyệt:</b> {showDetailModal.manager_note}</p>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                onClick={() => setShowDetailModal(null)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px', cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Duyệt / Từ Chối Đơn (Dành cho HR Manager & Admin) */}
      {showReviewModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '480px', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>⚡ Duyệt Đơn #{showReviewModal.request_id} - {showReviewModal.employee_name}</h3>
              <button onClick={() => setShowReviewModal(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <div style={{ fontSize: '13px', color: '#334155', marginBottom: '14px' }}>
              <p><b>Loại đơn:</b> {showReviewModal.request_type === 'Future_Leave' ? `Xin nghỉ phép (${showReviewModal.leave_type})` : `Giải trình quá khứ (${showReviewModal.explanation_type})`}</p>
              <p><b>Lý do:</b> {showReviewModal.reason}</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Ghi chú của Người duyệt (nếu có):</label>
              <textarea
                rows={3}
                value={managerNote}
                onChange={(e) => setManagerNote(e.target.value)}
                placeholder="Nhập phản hồi hoặc lý do từ chối..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowReviewModal(null)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleReviewSubmit('Rejected')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                ❌ Từ Chối
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleReviewSubmit('Approved')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#10b981', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                ✅ Phê Duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRLeaveRequest;

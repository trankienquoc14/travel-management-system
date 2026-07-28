import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GATEWAY_URL = 'http://localhost:5000';

const StaffChangeRequestManager = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [staffNote, setStaffNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${GATEWAY_URL}/api/bookings/admin/change-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setRequests(res.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách yêu cầu hủy/đổi lịch:", err);
      setAlertMsg({ type: 'error', text: 'Không thể tải danh sách yêu cầu. Vui lòng thử lại!' });
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (status) => {
    if (!selectedReq) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${GATEWAY_URL}/api/bookings/admin/change-requests/${selectedReq.change_id}/process`, {
        status,
        staff_note: staffNote
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        setAlertMsg({ type: 'success', text: res.data.message });
        setSelectedReq(null);
        setStaffNote('');
        fetchRequests();
      } else {
        setAlertMsg({ type: 'error', text: res.data?.message || 'Thao tác thất bại!' });
      }
    } catch (err) {
      console.error("Lỗi xử lý yêu cầu:", err);
      setAlertMsg({ type: 'error', text: err.response?.data?.message || 'Có lỗi xảy ra khi xử lý!' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lọc dữ liệu
  const filteredRequests = requests.filter(r => {
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
    const matchesSearch = 
      (r.booking_id && r.booking_id.toString().includes(searchTerm)) ||
      (r.customer_name && r.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.customer_phone && r.customer_phone.includes(searchTerm)) ||
      (r.tour_name && r.tour_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Thống kê
  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCancelCount = requests.filter(r => r.status === 'Approved' && r.request_type === 'Cancel').length;
  const approvedRescheduleCount = requests.filter(r => r.status === 'Approved' && r.request_type === 'Reschedule').length;
  const rejectedCount = requests.filter(r => r.status === 'Rejected').length;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            🔄 Xử Lý Hủy & Đổi Lịch Tour
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
            Quản lý và tiếp nhận các yêu cầu xin Hủy Tour / Thay đổi ngày khởi hành từ Khách hàng
          </p>
        </div>
        <button 
          onClick={fetchRequests} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', 
            backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', 
            cursor: 'pointer', fontWeight: '600', fontSize: '14px', boxShadow: '0 2px 4px rgba(2,132,199,0.2)' 
          }}
        >
          🔄 Tải lại dữ liệu
        </button>
      </div>

      {/* ALERT NOTIFICATION */}
      {alertMsg.text && (
        <div style={{ 
          padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '600',
          backgroundColor: alertMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: alertMsg.type === 'success' ? '#15803d' : '#b91c1c',
          border: `1px solid ${alertMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {alertMsg.text}
        </div>
      )}

      {/* OVERVIEW STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #f59e0b', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Chờ Xử Lý</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#d97706', marginTop: '6px' }}>{pendingCount}</div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #ef4444', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Đã Duyệt Hủy</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#dc2626', marginTop: '6px' }}>{approvedCancelCount}</div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #3b82f6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Đã Đổi Lịch</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', marginTop: '6px' }}>{approvedRescheduleCount}</div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #64748b', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Đã Từ Chối</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#475569', marginTop: '6px' }}>{rejectedCount}</div>
        </div>
      </div>

      {/* CONTROLS: FILTER TABS & SEARCH */}
      <div style={{ backgroundColor: '#fff', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: 'Tất cả', val: 'All' },
            { label: `Chờ xử lý (${pendingCount})`, val: 'Pending' },
            { label: 'Đã duyệt', val: 'Approved' },
            { label: 'Từ chối', val: 'Rejected' }
          ].map(tab => (
            <button
              key={tab.val}
              onClick={() => setFilterStatus(tab.val)}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                backgroundColor: filterStatus === tab.val ? '#0f172a' : '#f1f5f9',
                color: filterStatus === tab.val ? '#fff' : '#475569'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="🔍 Tìm theo mã Booking, tên khách hàng, SĐT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '320px', fontSize: '14px', outline: 'none'
          }}
        />
      </div>

      {/* MAIN DATA TABLE */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách yêu cầu...</div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Không có yêu cầu nào phù hợp.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '14px 16px' }}>Mã YC</th>
                <th style={{ padding: '14px 16px' }}>Mã Đơn</th>
                <th style={{ padding: '14px 16px' }}>Loại Yêu Cầu</th>
                <th style={{ padding: '14px 16px' }}>Khách Hàng</th>
                <th style={{ padding: '14px 16px' }}>Tour & Ngày Đi</th>
                <th style={{ padding: '14px 16px' }}>Lý Do</th>
                <th style={{ padding: '14px 16px' }}>Trạng Thái</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((r, idx) => (
                <tr key={r.change_id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0f172a' }}>#{r.change_id}</td>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0284c7' }}>#{r.booking_id}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {r.request_type === 'Cancel' ? (
                      <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '12px' }}>
                        ❌ Xin Hủy Tour
                      </span>
                    ) : (
                      <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '12px' }}>
                        🔄 Xin Đổi Ngày
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{r.customer_name || 'Khách hàng'}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{r.customer_phone}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '600', color: '#334155' }}>{r.tour_name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Ngày khởi hành: <strong>{r.current_departure_date ? new Date(r.current_departure_date).toLocaleDateString('vi-VN') : 'N/A'}</strong>
                    </div>
                    {r.request_type === 'Reschedule' && r.requested_departure_date && (
                      <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600', marginTop: '2px' }}>
                        ➡️ Muốn đổi sang: {new Date(r.requested_departure_date).toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#475569' }}>
                    {r.reason || 'Không có lý do cụ thể'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {r.status === 'Pending' && <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '12px' }}>⏳ Chờ duyệt</span>}
                    {r.status === 'Approved' && <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '12px' }}>✅ Đã duyệt</span>}
                    {r.status === 'Rejected' && <span style={{ backgroundColor: '#f3f4f6', color: '#6b7280', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '12px' }}>🚫 Từ chối</span>}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => { setSelectedReq(r); setStaffNote(r.staff_note || ''); }}
                      style={{
                        padding: '6px 14px', backgroundColor: r.status === 'Pending' ? '#0f172a' : '#f1f5f9',
                        color: r.status === 'Pending' ? '#fff' : '#475569',
                        border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                      }}
                    >
                      {r.status === 'Pending' ? '⚡ Xử lý' : '👁️ Xem'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PROCESS MODAL */}
      {selectedReq && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px', width: '540px', maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              📝 Xử Lý Yêu Cầu #{selectedReq.change_id}
            </h2>

            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              <p style={{ margin: '0 0 8px 0' }}><strong>Đơn Hàng:</strong> #{selectedReq.booking_id} - {selectedReq.tour_name}</p>
              <p style={{ margin: '0 0 8px 0' }}><strong>Khách Hàng:</strong> {selectedReq.customer_name} ({selectedReq.customer_phone})</p>
              <p style={{ margin: '0 0 8px 0' }}><strong>Loại Yêu Cầu:</strong> {selectedReq.request_type === 'Cancel' ? '❌ Hủy Tour' : '🔄 Đổi Lịch Khởi Hành'}</p>
              <p style={{ margin: '0 0 8px 0' }}><strong>Lý Do Khách Gửi:</strong> <span style={{ color: '#dc2626' }}>{selectedReq.reason || 'N/A'}</span></p>
              {selectedReq.request_type === 'Reschedule' && selectedReq.requested_departure_date && (
                <p style={{ margin: 0, color: '#2563eb', fontWeight: '700' }}>
                  📅 Khách Muốn Chuyển Sang Ngày: {new Date(selectedReq.requested_departure_date).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '14px', color: '#334155', marginBottom: '8px' }}>
                Ghi chú xử lý / Phản hồi tới khách hàng:
              </label>
              <textarea
                rows={3}
                placeholder="VD: Đã duyệt hủy tour và đồng ý hoàn 100% cọc / Hoặc từ chối vì lý do hủy sát giờ khởi hành..."
                value={staffNote}
                onChange={(e) => setStaffNote(e.target.value)}
                disabled={selectedReq.status !== 'Pending'}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setSelectedReq(null)}
                style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                Đóng
              </button>

              {selectedReq.status === 'Pending' && (
                <>
                  <button
                    onClick={() => handleProcess('Rejected')}
                    disabled={isSubmitting}
                    style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {isSubmitting ? 'Đang xử lý...' : '🚫 Từ Chối'}
                  </button>

                  <button
                    onClick={() => handleProcess('Approved')}
                    disabled={isSubmitting}
                    style={{ padding: '10px 20px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    {isSubmitting ? 'Đang xử lý...' : '✅ Duyệt Yêu Cầu'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffChangeRequestManager;

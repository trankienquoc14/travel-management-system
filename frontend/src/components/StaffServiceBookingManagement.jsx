import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GATEWAY_URL = 'http://localhost:5000';

const StaffServiceBookingManagement = () => {
  const [serviceBookings, setServiceBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchServiceBookings();
  }, []);

  const fetchServiceBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${GATEWAY_URL}/api/bookings/admin/all-services`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setServiceBookings(res.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách dịch vụ:", err);
      setAlertMsg({ type: 'error', text: 'Lỗi tải danh sách dịch vụ.' });
    } finally {
      setLoading(false);
    }
  };

  const handleForwardToPartner = async (bookingId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${GATEWAY_URL}/api/bookings/admin/services/${bookingId}/forward-to-partner`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        alert('Đã gửi yêu cầu cho đối tác thành công!');
        fetchServiceBookings();
      } else {
        alert(res.data?.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi hệ thống');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            🛎️ Quản Lý Đặt Dịch Vụ Đơn Lẻ
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
            Duyệt đơn khách sạn, nhà xe và gửi yêu cầu sang cho Đối tác.
          </p>
        </div>
        <button onClick={fetchServiceBookings} style={styles.refreshBtn}>🔄 Tải lại</button>
      </div>

      {alertMsg.text && (
        <div style={{ padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '20px' }}>
          {alertMsg.text}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu...</div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Mã Đơn</th>
              <th style={styles.th}>ID Khách</th>
              <th style={styles.th}>Dịch Vụ</th>
              <th style={styles.th}>Ngày Dùng</th>
              <th style={styles.th}>Tổng Tiền</th>
              <th style={styles.th}>Trạng thái</th>
              <th style={styles.th}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {serviceBookings.map((b) => (
              <tr key={b.booking_id} style={styles.tr}>
                <td style={styles.td}>#SVC-{b.booking_id}</td>
                <td style={styles.td}>{b.customer_id}</td>
                <td style={styles.td}>{b.service_name}</td>
                <td style={styles.td}>{new Date(b.usage_date).toLocaleDateString('vi-VN')}</td>
                <td style={styles.td}>{formatCurrency(b.total_amount)}</td>
                <td style={styles.td}>{b.status}</td>
                <td style={styles.td}>
                  {b.status === 'Pending' && !b.partner_status && (
                    <button 
                      onClick={() => handleForwardToPartner(b.booking_id)}
                      disabled={actionLoading}
                      style={styles.forwardBtn}
                    >
                      🚀 Gửi Yêu Cầu Đối Tác
                    </button>
                  )}
                  {b.status === 'Pending' && b.partner_status && (
                    <span style={{ color: '#0284c7', fontWeight: 'bold', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0f2fe', padding: '6px 12px', borderRadius: '20px' }}>
                      ⏳ Đang chờ ĐT xác nhận
                    </span>
                  )}
                  {b.status === 'Confirmed' && (
                    <span style={{ color: '#059669', fontWeight: 'bold', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#d1fae5', padding: '6px 12px', borderRadius: '20px' }}>
                      ✅ Đã xác nhận
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {serviceBookings.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Chưa có đơn đặt dịch vụ nào</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

const styles = {
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  th: { padding: '16px', textAlign: 'left', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase' },
  td: { padding: '16px', borderBottom: '1px solid #e2e8f0', fontSize: '14px', color: '#1e293b' },
  tr: { transition: 'background-color 0.2s', ':hover': { backgroundColor: '#f8fafc' } },
  forwardBtn: { backgroundColor: '#8b5cf6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  refreshBtn: { backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }
};

export default StaffServiceBookingManagement;

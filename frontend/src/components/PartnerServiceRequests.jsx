import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GATEWAY_URL = 'http://localhost:5000';

const PartnerServiceRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${GATEWAY_URL}/api/bookings/partner/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setRequests(res.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải yêu cầu:", err);
      setAlertMsg({ type: 'error', text: 'Không thể tải danh sách yêu cầu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, status, bookingId) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Cập nhật request
      const res = await axios.put(`${GATEWAY_URL}/api/bookings/partner/requests/${requestId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        // Nếu chấp nhận, tự động chốt đơn bên service_bookings để tạo voucher cho khách
        if (status === 'Accepted') {
            await axios.put(`${GATEWAY_URL}/api/bookings/admin/services/${bookingId}/confirm`, { action: 'confirm' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } else if (status === 'Rejected') {
            await axios.put(`${GATEWAY_URL}/api/bookings/admin/services/${bookingId}/confirm`, { action: 'reject' }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }
        
        alert(`Đã ${status === 'Accepted' ? 'chấp nhận' : 'từ chối'} yêu cầu thành công!`);
        fetchRequests();
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
            🤝 Yêu Cầu Cung Cấp Dịch Vụ
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
            Xem và phản hồi các đơn đặt phòng/xe từ TravelERP.
          </p>
        </div>
        <button onClick={fetchRequests} style={styles.refreshBtn}>🔄 Tải lại</button>
      </div>

      {alertMsg.text && (
        <div style={{ padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '20px' }}>
          {alertMsg.text}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu...</div>
      ) : (
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {requests.map((r) => (
            <div key={r.request_id} style={styles.card}>
              <div style={styles.cardHeader}>
                <strong>{r.service_name}</strong>
                <span style={styles.badge(r.status)}>{r.status}</span>
              </div>
              <div style={styles.cardBody}>
                <p><strong>Ngày khách dùng:</strong> {new Date(r.usage_date).toLocaleDateString('vi-VN')}</p>
                <p><strong>Số lượng yêu cầu:</strong> {r.quantity}</p>
                <p><strong>Nội dung:</strong> {r.request_content}</p>
                <p><strong>Giá thỏa thuận:</strong> <span style={{ color: 'red', fontWeight: 'bold' }}>{formatCurrency(r.agreed_price)}</span></p>
              </div>
              {r.status === 'Pending' && (
                <div style={styles.cardFooter}>
                  <button 
                    disabled={actionLoading} 
                    onClick={() => handleUpdateStatus(r.request_id, 'Rejected', r.service_booking_id)} 
                    style={styles.btnReject}
                  >Hết chỗ</button>
                  <button 
                    disabled={actionLoading} 
                    onClick={() => handleUpdateStatus(r.request_id, 'Accepted', r.service_booking_id)} 
                    style={styles.btnAccept}
                  >Xác nhận còn chỗ</button>
                </div>
              )}
            </div>
          ))}
          {requests.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Hiện tại bạn chưa nhận được yêu cầu nào.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  refreshBtn: { backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' },
  card: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '12px' },
  cardBody: { fontSize: '14px', color: '#475569', lineHeight: '1.6' },
  cardFooter: { display: 'flex', gap: '10px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' },
  btnAccept: { flex: 1, backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  btnReject: { flex: 1, backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  badge: (status) => ({
    backgroundColor: status === 'Accepted' ? '#dcfce7' : status === 'Rejected' ? '#fee2e2' : '#fef9c3',
    color: status === 'Accepted' ? '#166534' : status === 'Rejected' ? '#991b1b' : '#854d0e',
    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'
  })
};

export default PartnerServiceRequests;

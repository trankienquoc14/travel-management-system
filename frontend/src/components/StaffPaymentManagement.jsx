import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../index.css';

const StaffPaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All'); // 'All', 'Pending', 'Success'

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/bookings/admin/payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPayments(res.data.data || []);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách thanh toán:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCash = async (bookingId, customerName, amount) => {
    if (!window.confirm(`Xác nhận đã thu đủ ${formatMoney(amount)} tiền mặt từ khách hàng "${customerName}" cho Mã Đơn #BKG-${bookingId}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:5000/api/bookings/${bookingId}/confirm-cash`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        alert(res.data.message);
        fetchPayments(); // Reload lại danh sách sau khi duyệt
      }
    } catch (error) {
      alert("Lỗi khi xác nhận thanh toán!");
    }
  };

  const formatMoney = (amount) => Number(amount || 0).toLocaleString('vi-VN') + ' đ';
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleString('vi-VN') : 'Chưa cập nhật';

  const filteredPayments = payments.filter(item => {
    if (filter === 'All') return true;
    return item.payment_status === filter;
  });

  return (
    <div className="management-container">
      <div className="management-header" style={{ marginBottom: '25px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#0f172a' }}>💳 Quản lý & Xác nhận Thanh toán</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Dành cho Nhân viên văn phòng theo dõi công nợ và thu tiền mặt trực tiếp.</p>
        </div>

        {/* Lọc trạng thái */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setFilter('All')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: filter === 'All' ? '#2D6A4F' : '#f1f5f9', color: filter === 'All' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer' }}>Tất cả ({payments.length})</button>
          <button onClick={() => setFilter('Pending')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: filter === 'Pending' ? '#f59e0b' : '#f1f5f9', color: filter === 'Pending' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer' }}>⏳ Chờ thu tiền ({payments.filter(p => p.payment_status === 'Pending').length})</button>
          <button onClick={() => setFilter('Success')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: filter === 'Success' ? '#10b981' : '#f1f5f9', color: filter === 'Success' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer' }}>✅ Đã thanh toán</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>⏳ Đang tải dữ liệu giao dịch...</div>
      ) : filteredPayments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', background: '#f8fafc', borderRadius: '12px', color: '#94a3b8' }}>Không có giao dịch nào phù hợp.</div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách hàng</th>
                <th>Số tiền</th>
                <th>Hình thức</th>
                <th>Mã Giao dịch</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((item) => (
                <tr key={item.payment_id} style={{ background: item.payment_status === 'Pending' ? '#fffbeb' : 'transparent' }}>
                  <td><strong style={{ color: '#0284c7' }}>#BKG-{item.booking_id}</strong></td>
                  <td>
                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{item.customer_name || 'Khách vãng lai'}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>📞 {item.customer_phone || 'N/A'}</div>
                  </td>
                  <td><span className="text-price" style={{ fontSize: '16px' }}>{formatMoney(item.amount)}</span></td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                      background: item.payment_method === 'Cash' ? '#ffedd5' : '#e0f2fe',
                      color: item.payment_method === 'Cash' ? '#c2410c' : '#0369a1'
                    }}>
                      {item.payment_method === 'Cash' ? '💵 Tiền mặt' : `📸 ${item.payment_method}`}
                    </span>
                  </td>
                  <td><code style={{ fontSize: '12px', color: '#64748b' }}>{item.transaction_code || 'Chưa có'}</code></td>
                  <td>
                    {item.payment_status === 'Success' ? (
                      <div>
                        <span className="status-badge success" style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>✅ Đã thanh toán</span>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Lúc: {formatDate(item.paid_at)}</div>
                      </div>
                    ) : (
                      <span className="status-badge warning" style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>⏳ Chưa thanh toán</span>
                    )}
                  </td>
                  <td>
                    {item.payment_status === 'Pending' && (
                      <button 
                        onClick={() => handleConfirmCash(item.booking_id, item.customer_name, item.amount)}
                        style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)', transition: '0.2s' }}
                      >
                        💵 Xác nhận đã thu tiền
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StaffPaymentManagement;
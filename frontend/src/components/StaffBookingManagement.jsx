import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GATEWAY_URL = 'http://localhost:5000';

const StaffBookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${GATEWAY_URL}/api/bookings/admin/all-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setBookings(res.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách booking:", err);
      setAlertMsg({ type: 'error', text: 'Không thể tải danh sách đơn hàng. Vui lòng thử lại!' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${GATEWAY_URL}/api/bookings/admin/bookings/${bookingId}/status`, {
        booking_status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        setAlertMsg({ type: 'success', text: res.data.message });
        fetchBookings();
        setSelectedBooking(null);
      } else {
        setAlertMsg({ type: 'error', text: res.data?.message || 'Cập nhật thất bại!' });
      }
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái booking:", err);
      setAlertMsg({ type: 'error', text: err.response?.data?.message || 'Có lỗi xảy ra!' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  // Lọc dữ liệu
  const filteredBookings = bookings.filter(b => {
    const matchesStatus = filterStatus === 'All' || b.booking_status === filterStatus;
    const matchesSearch =
      (b.booking_id && b.booking_id.toString().includes(searchTerm)) ||
      (b.customer_name && b.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.customer_phone && b.customer_phone.includes(searchTerm)) ||
      (b.tour_name && b.tour_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Thống kê
  const totalCount = bookings.length;
  const pendingCount = bookings.filter(b => b.booking_status === 'Pending').length;
  const confirmedCount = bookings.filter(b => b.booking_status === 'Confirmed').length;
  const cancelledCount = bookings.filter(b => b.booking_status === 'Cancelled').length;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            🛒 Quản Lý Đơn Đặt Tour (Bookings)
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '14px' }}>
            Quản lý, xác nhận và tra cứu toàn bộ đơn đặt tour trọn gói và tour thiết kế riêng trên hệ thống
          </p>
        </div>
        <button
          onClick={fetchBookings}
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

      {/* OVERVIEW CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #0f172a', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Tổng Số Đơn</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>{totalCount}</div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #f59e0b', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Chờ Xác Nhận</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#d97706', marginTop: '6px' }}>{pendingCount}</div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #16a34a', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Đã Xác Nhận</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a', marginTop: '6px' }}>{confirmedCount}</div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #ef4444', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Đã Hủy Tour</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#dc2626', marginTop: '6px' }}>{cancelledCount}</div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div style={{ backgroundColor: '#fff', padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: 'Tất cả', val: 'All' },
            { label: `Chờ duyệt (${pendingCount})`, val: 'Pending' },
            { label: 'Đã xác nhận', val: 'Confirmed' },
            { label: 'Đã hủy', val: 'Cancelled' }
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
          placeholder="🔍 Tìm theo mã Booking, tên khách hàng, SĐT, tour..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '340px', fontSize: '14px', outline: 'none'
          }}
        />
      </div>

      {/* TABLE */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách đơn đặt tour...</div>
        ) : filteredBookings.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy đơn đặt tour nào.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '14px 16px' }}>Mã Booking</th>
                <th style={{ padding: '14px 16px' }}>Khách Hàng</th>
                <th style={{ padding: '14px 16px' }}>Tour & Khởi Hành</th>
                <th style={{ padding: '14px 16px' }}>Số Khách & Tổng Tiền</th>
                <th style={{ padding: '14px 16px' }}>Thanh Toán</th>
                <th style={{ padding: '14px 16px' }}>Trạng Thái Đơn</th>
                <th style={{ padding: '14px 16px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b, idx) => (
                <tr key={b.booking_id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#0284c7' }}>
                    #BKG-{b.booking_id.toString().padStart(4, '0')}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{b.customer_name || 'Khách vãng lai'}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{b.customer_phone || b.customer_email || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '600', color: '#334155' }}>{b.tour_name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Khởi hành: <strong>{b.departure_date ? new Date(b.departure_date).toLocaleDateString('vi-VN') : 'N/A'}</strong> ({b.duration_days} ngày)
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{formatCurrency(b.total_amount)}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>👥 {b.num_people} hành khách</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {b.payment_status === 'Paid' ? (
                      <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '12px' }}>
                        💵 Đã thanh toán
                      </span>
                    ) : (
                      <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '12px' }}>
                        ⏳ Chưa thanh toán
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {b.booking_status === 'Confirmed' && (
                      <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '12px' }}>
                        ✅ Đã xác nhận
                      </span>
                    )}
                    {b.booking_status === 'Pending' && (
                      <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '12px' }}>
                        ⏳ Chờ duyệt
                      </span>
                    )}
                    {b.booking_status === 'Cancelled' && (
                      <span style={{ backgroundColor: '#f3f4f6', color: '#6b7280', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '12px' }}>
                        ❌ Đã hủy
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => setSelectedBooking(b)}
                      style={{
                        padding: '6px 14px', backgroundColor: '#0f172a', color: '#fff',
                        border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                      }}
                    >
                      👁️ Xem & Duyệt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* DETAIL & ACTION MODAL */}
      {selectedBooking && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '28px', width: '540px', maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              📋 Đơn Hàng #BKG-{selectedBooking.booking_id.toString().padStart(4, '0')}
            </h2>

            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              <p style={{ margin: '0 0 8px 0' }}><strong>Tên Tour:</strong> {selectedBooking.tour_name}</p>
              <p style={{ margin: '0 0 8px 0' }}><strong>Khách Hàng:</strong> {selectedBooking.customer_name} ({selectedBooking.customer_phone || selectedBooking.customer_email || 'N/A'})</p>
              <p style={{ margin: '0 0 8px 0' }}><strong>Số Lượng:</strong> {selectedBooking.num_people} hành khách</p>
              <p style={{ margin: '0 0 8px 0' }}><strong>Tổng Tiền:</strong> <span style={{ color: '#0284c7', fontWeight: '800' }}>{formatCurrency(selectedBooking.total_amount)}</span></p>
              <p style={{ margin: '0 0 8px 0' }}><strong>Ngày Đặt:</strong> {new Date(selectedBooking.booking_date).toLocaleString('vi-VN')}</p>
              <p style={{ margin: 0 }}><strong>Ghi Chú:</strong> {selectedBooking.notes || 'Không có ghi chú'}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setSelectedBooking(null)}
                style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                Đóng
              </button>

              {selectedBooking.booking_status !== 'Confirmed' && (
                <button
                  onClick={() => handleUpdateStatus(selectedBooking.booking_id, 'Confirmed')}
                  disabled={actionLoading}
                  style={{ padding: '10px 20px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                  {actionLoading ? 'Đang xử lý...' : '✅ Xác Nhận Đơn Hàng'}
                </button>
              )}

              {selectedBooking.booking_status !== 'Cancelled' && (
                <button
                  onClick={() => handleUpdateStatus(selectedBooking.booking_id, 'Cancelled')}
                  disabled={actionLoading}
                  style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                  {actionLoading ? 'Đang xử lý...' : '❌ Hủy Đơn Hàng'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffBookingManagement;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Filter, Calendar, MapPin, X } from 'lucide-react';
import '../index.css';

const StaffPaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Pending', 'Success'
  const [filterDate, setFilterDate] = useState('');
  
  const [filterEndLoc, setFilterEndLoc] = useState('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchPaymentsAndBookings();
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/destinations');
      if (res.data.success) {
        setDestinations(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPaymentsAndBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const [payRes, bookRes] = await Promise.all([
          axios.get('http://localhost:5000/api/bookings/admin/payments', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({data:{}})),
          axios.get('http://localhost:5000/api/bookings/admin/all', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({data:{}}))
      ]);
      
      if (payRes.data.success) {
        setPayments(payRes.data.data || []);
      }
      if (bookRes.data.success) {
        setBookings(bookRes.data.data || []);
      }
    } catch (error) {
      console.error("Lỗi tải danh sách:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCash = async (bookingId, customerName, amount) => {
    const confirmMsg = `Xác nhận đã nhận đủ số tiền từ khách hàng?\n\nSố tiền: ${formatMoney(amount)}\nPhương thức: Tiền mặt\nBooking: #BKG-${bookingId}`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:5000/api/bookings/${bookingId}/confirm-cash`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        alert(res.data.message);
        fetchPaymentsAndBookings();
        setSelectedPayment(null); // Reload lại danh sách sau khi duyệt
      }
    } catch (error) {
      alert("Lỗi khi xác nhận thanh toán!");
    }
  };

  const formatMoney = (amount) => Number(amount || 0).toLocaleString('vi-VN') + ' đ';
  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleString('vi-VN') : 'Chưa cập nhật';

  // Process and filter
  const processedPayments = payments.map(item => {
    const matchedBook = bookings.find(b => b.booking_id === item.booking_id) || {};
    
    // Ưu tiên lấy từ API payments (nếu backend đã update)
    let depDate = item.departure_date || matchedBook.departure_date;
    let startLoc = '';
    let endLoc = item.destination || '';
    let fallbackTourName = matchedBook.tour_name || '';

    try {
        if (item.design_data) {
            const parsed = typeof item.design_data === 'string' ? JSON.parse(item.design_data) : item.design_data;
            if (parsed.departureCity) startLoc = parsed.departureCity;
            if (!startLoc && parsed.days && parsed.days[0]?.start_destination_id && destinations.length) {
                const dest = destinations.find(d => String(d.destination_id) === String(parsed.days[0].start_destination_id));
                if (dest) startLoc = dest.destination_name;
            }
        } 
        
        if (item.requirements) {
            const reqs = typeof item.requirements === 'string' ? JSON.parse(item.requirements) : item.requirements;
            if (reqs.departureCity && !startLoc) startLoc = reqs.departureCity;
            if (!depDate && reqs.departure_date) depDate = reqs.departure_date;
        }
    } catch(e) {}

    return { 
        ...item, 
        parsedDepDate: depDate, 
        parsedStartLoc: startLoc, 
        parsedEndLoc: endLoc,
        fallbackTourName
    };
  });

  const filteredPayments = processedPayments.filter(item => {
    // 1. Status Filter
    if (filterStatus !== 'All' && item.payment_status !== filterStatus) return false;
    
    // 2. Date Filter (YYYY-MM-DD)
    if (filterDate) {
        if (!item.parsedDepDate || !item.parsedDepDate.startsWith(filterDate)) return false;
    }



    // 4. Advanced Search Filter
    const searchStr = `${item.parsedEndLoc} ${item.fallbackTourName} ${item.customer_name || matchedBook.customer_name || ''} ${item.booking_id} #bkg-${item.booking_id} bkg-${item.booking_id}`.toLowerCase();
    if (filterEndLoc && filterEndLoc.trim() !== '') {
        if (!searchStr.includes(filterEndLoc.trim().toLowerCase())) return false;
    }

    // 5. Payment Method Filter
    if (filterPaymentMethod !== 'All' && item.payment_method !== filterPaymentMethod) {
        return false;
    }

    return true;
  });

  return (
    <div className="management-container">
      <div className="management-header" style={{ marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#0f172a' }}>💳 Quản lý & Xác nhận Thanh toán</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Dành cho Nhân viên văn phòng theo dõi công nợ và thu tiền mặt trực tiếp.</p>
        </div>
      </div>

      {/* FILTER BAR - MODERN REDESIGN */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
                  <div style={{ padding: '8px', background: '#eff6ff', borderRadius: '10px' }}><Filter size={18} color="#3b82f6" /></div>
                  Bộ lọc giao dịch
              </h3>
              
              {/* Status Pills */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={() => setFilterStatus('All')} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filterStatus === 'All' ? '#0f172a' : '#f8fafc', color: filterStatus === 'All' ? '#fff' : '#64748b', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>Tất cả</button>
                  <button onClick={() => setFilterStatus('Pending')} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filterStatus === 'Pending' ? '#f59e0b' : '#f8fafc', color: filterStatus === 'Pending' ? '#fff' : '#64748b', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>Chờ thu tiền</button>
                  <button onClick={() => setFilterStatus('Success')} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filterStatus === 'Success' ? '#10b981' : '#f8fafc', color: filterStatus === 'Success' ? '#fff' : '#64748b', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}>Đã thanh toán</button>
              </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {/* Date Filter */}
              <div style={{ position: 'relative' }}>
                  <Calendar size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#334155', outline: 'none', background: '#f8fafc', transition: '0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)' }} title="Ngày khởi hành" />
                  {filterDate && <X size={16} color="#94a3b8" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} onClick={() => setFilterDate('')} />}
              </div>
              


              {/* Search Filter */}
              <div style={{ position: 'relative' }}>
                  <MapPin size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input type="text" placeholder="Tìm theo mã đơn, tên khách hàng, tên Tour, điểm đến..." value={filterEndLoc} onChange={(e) => setFilterEndLoc(e.target.value)} style={{ width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#334155', outline: 'none', background: '#f8fafc', transition: '0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.01)' }} />
                  {filterEndLoc && <X size={16} color="#94a3b8" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} onClick={() => setFilterEndLoc('')} />}
              </div>
              <div style={{ position: 'relative' }}>
                <select 
                  value={filterPaymentMethod}
                  onChange={(e) => setFilterPaymentMethod(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', color: '#334155', background: '#f8fafc', outline: 'none' }}
                >
                  <option value="All">Tất cả hình thức TT</option>
                  <option value="Cash">Tiền mặt</option>
                  <option value="BankTransfer">Chuyển khoản</option>
                  <option value="CreditCard">Thẻ tín dụng</option>
                  <option value="VNPay">VNPay</option>
                  <option value="MoMo">MoMo</option>
                </select>
              </div>
          </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>⏳ Đang tải dữ liệu giao dịch...</div>
      ) : processedPayments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', background: '#f8fafc', borderRadius: '12px', color: '#94a3b8' }}>Chưa có giao dịch nào trong hệ thống.</div>
      ) : filteredPayments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', background: '#f8fafc', borderRadius: '12px', color: '#94a3b8' }}>Không có giao dịch nào phù hợp với bộ lọc hiện tại.</div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ whiteSpace: 'nowrap' }}>Mã Đơn</th>
                <th style={{ whiteSpace: 'nowrap' }}>Khách hàng</th>
                <th style={{ whiteSpace: 'nowrap', minWidth: '150px' }}>Tour / Lịch khởi hành</th>
                <th style={{ whiteSpace: 'nowrap' }}>Số tiền</th>
                <th style={{ whiteSpace: 'nowrap' }}>Hình thức</th>
                <th style={{ whiteSpace: 'nowrap' }}>Trạng thái</th>
                <th style={{ whiteSpace: 'nowrap' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((item) => (
                <tr key={item.payment_id} style={{ background: item.payment_status === 'Pending' ? '#fffbeb' : 'transparent' }}>
                  <td style={{ whiteSpace: 'nowrap' }}><strong style={{ color: '#0284c7' }}>#BKG-{item.booking_id}</strong></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{item.customer_name || 'Khách vãng lai'}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>📞 {item.customer_phone || 'N/A'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '600', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.parsedEndLoc || item.fallbackTourName}>
                        📍 {item.parsedEndLoc || item.fallbackTourName || 'Chưa cập nhật'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>📅 {item.parsedDepDate ? new Date(item.parsedDepDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}><span className="text-price" style={{ fontSize: '16px' }}>{formatMoney(item.amount)}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                      background: item.payment_method === 'Cash' ? '#ffedd5' : '#e0f2fe',
                      color: item.payment_method === 'Cash' ? '#c2410c' : '#0369a1'
                    }}>
                      {item.payment_method === 'Cash' ? '💵 Tiền mặt' : `📸 ${item.payment_method}`}
                    </span>
                  </td>
                  
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {item.payment_status === 'Success' ? (
                      <div>
                        <span className="status-badge success" style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>✅ Đã thanh toán</span>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Lúc: {formatDate(item.paid_at)}</div>
                      </div>
                    ) : (
                      <span className="status-badge warning" style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>⏳ Chưa thanh toán</span>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button 
                        onClick={() => setSelectedPayment(item)}
                        style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)', transition: '0.2s', whiteSpace: 'nowrap' }}
                      >
                        👁 Chi tiết
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    
      {/* THÔNG TIN CHI TIẾT THANH TOÁN (MODAL) */}
      {selectedPayment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '800px', maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            
            {/* 1. HEADER */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', zIndex: 10, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
                  💳 Chi tiết thanh toán
                </h2>
                <div style={{ color: '#64748b', fontSize: '15px', fontWeight: '600' }}>Booking #BKG-{selectedPayment.booking_id.toString().padStart(4, '0')}</div>
              </div>
              <div>
                {selectedPayment.payment_status === 'Paid' ? (
                  <span style={{ padding: '6px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                    🟢 Đã thanh toán
                  </span>
                ) : (
                  <span style={{ padding: '6px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                    🟡 Chưa thanh toán
                  </span>
                )}
              </div>
            </div>

            {/* MODAL BODY */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {/* 2. THÔNG TIN KHOẢN THU */}
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thông tin khoản thu</h3>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Số tiền phải thu</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{formatMoney(selectedPayment.amount)}</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px dashed #e2e8f0', marginBottom: '12px' }}>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>Đã thanh toán</span>
                    <span style={{ fontWeight: '700', color: selectedPayment.payment_status === 'Paid' ? '#15803d' : '#0f172a' }}>
                      {selectedPayment.payment_status === 'Paid' ? formatMoney(selectedPayment.amount) : '0 đ'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>Còn phải thu</span>
                    <span style={{ fontWeight: '700', color: selectedPayment.payment_status === 'Paid' ? '#0f172a' : '#ef4444' }}>
                      {selectedPayment.payment_status === 'Paid' ? '0 đ' : formatMoney(selectedPayment.amount)}
                    </span>
                  </div>
                </div>

                {/* 3. THÔNG TIN GIAO DỊCH */}
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thông tin giao dịch</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>Phương thức:</div>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>
                        {selectedPayment.payment_method === 'Cash' ? '💵 Tiền mặt' : 
                         selectedPayment.payment_method === 'BankTransfer' ? '🏦 Chuyển khoản' :
                         selectedPayment.payment_method === 'CreditCard' ? '💳 Thẻ tín dụng' :
                         selectedPayment.payment_method === 'VNPay' ? '📱 VNPay' : 
                         selectedPayment.payment_method === 'MoMo' ? '💖 MoMo' :
                         selectedPayment.payment_method}
                      </div>
                    </div>
                    
                    {selectedPayment.transaction_code && (
                      <div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>Mã giao dịch:</div>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedPayment.transaction_code}</div>
                      </div>
                    )}
                    
                    {selectedPayment.paid_at && (
                      <div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>Thời gian:</div>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{formatDate(selectedPayment.paid_at)}</div>
                      </div>
                    )}

                    <div>
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>Trạng thái:</div>
                      <div style={{ fontWeight: '600', color: '#0f172a' }}>
                        {selectedPayment.payment_status === 'Paid' ? (
                          <span style={{ color: '#15803d' }}>🟢 Đã thanh toán</span>
                        ) : selectedPayment.payment_method === 'Cash' ? (
                          <span style={{ color: '#b45309' }}>🟡 Chờ xác nhận (Tiền mặt)</span>
                        ) : (
                          <span style={{ color: '#b45309' }}>🟡 Chưa thanh toán</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. THÔNG TIN NGƯỜI THANH TOÁN */}
              <div style={{ backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569', fontWeight: '700', textTransform: 'uppercase' }}>Người thanh toán</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>Họ tên:</div>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedPayment.customer_name || 'Khách vãng lai'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '2px' }}>Số điện thoại:</div>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{selectedPayment.customer_phone || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* 7. LIÊN KẾT VỚI BOOKING */}
              <div style={{ backgroundColor: '#eff6ff', padding: '16px 20px', borderRadius: '12px', border: '1px dashed #bfdbfe' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1d4ed8', fontWeight: '700', textTransform: 'uppercase' }}>Booking liên quan</h3>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e3a8a' }}>
                  #BKG-{selectedPayment.booking_id.toString().padStart(4, '0')} | {selectedPayment.tour_name}
                </div>
              </div>

            </div>

            {/* FOOTER ACTIONS */}
            <div style={{ padding: '20px 28px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', justifyContent: 'flex-end', gap: '12px', zIndex: 10, flexShrink: 0 }}>
              <button
                onClick={() => setSelectedPayment(null)}
                style={{ padding: '10px 24px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                Đóng
              </button>

              {/* TRƯỜNG HỢP TIỀN MẶT CHƯA XÁC NHẬN */}
              {selectedPayment.payment_status === 'Pending' && selectedPayment.payment_method === 'Cash' && (
                <button
                  onClick={() => handleConfirmCash(selectedPayment.booking_id, selectedPayment.customer_name, selectedPayment.amount)}
                  style={{ padding: '10px 24px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}
                >
                  ✓ Xác nhận đã thu
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default StaffPaymentManagement;

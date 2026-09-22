import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GATEWAY_URL = 'http://localhost:5000';

const StaffBookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPayment, setFilterPayment] = useState('All');
  const [selectedDestination, setSelectedDestination] = useState('All');
  const [dateType, setDateType] = useState('departure');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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

  // Trích xuất danh sách địa điểm tự động
  const destinationOptions = Array.from(new Set(
    bookings.map(b => {
      let dest = b.destination;
      if (!dest && b.tour_name) {
        if (b.tour_name.includes('Đà Lạt')) dest = 'Đà Lạt';
        else if (b.tour_name.includes('Nha Trang')) dest = 'Nha Trang';
        else if (b.tour_name.includes('Đà Nẵng')) dest = 'Đà Nẵng';
        else if (b.tour_name.includes('Cần Thơ')) dest = 'Cần Thơ';
        else if (b.tour_name.includes('Hà Nội')) dest = 'Hà Nội';
        else if (b.tour_name.includes('Phú Quốc')) dest = 'Phú Quốc';
        else if (b.tour_name.includes('Tây Ninh')) dest = 'Tây Ninh';
        else if (b.tour_name.includes('Phan Thiết') || b.tour_name.includes('Phú Quý')) dest = 'Phan Thiết / Phú Quý';
        else if (b.tour_name.includes('Măng Đen') || b.tour_name.includes('Tây Nguyên')) dest = 'Tây Nguyên';
        else if (b.tour_name.includes('Hồ Tràm')) dest = 'Hồ Tràm';
      }
      return dest ? String(dest).trim() : null;
    }).filter(Boolean)
  )).sort();

  // Lọc dữ liệu đa tiêu chí
  const filteredBookings = bookings.filter(b => {
    // 1. Trạng thái Booking
    const matchesStatus = filterStatus === 'All' || b.booking_status === filterStatus;

    // 2. Trạng thái Thanh toán
    const matchesPayment = filterPayment === 'All' || 
      (filterPayment === 'Paid' && b.payment_status === 'Paid') ||
      (filterPayment === 'Unpaid' && b.payment_status !== 'Paid');

    // 3. Địa điểm
    const matchesDestination = (() => {
      if (selectedDestination === 'All') return true;
      const destVal = (b.destination || '').toLowerCase();
      const tourVal = (b.tour_name || '').toLowerCase();
      const selVal = selectedDestination.toLowerCase();
      return destVal.includes(selVal) || tourVal.includes(selVal);
    })();

    // 4. Khoảng ngày (Khởi hành hoặc Ngày đặt)
    const matchesDate = (() => {
      if (!startDate && !endDate) return true;
      const rawDateStr = dateType === 'departure' ? b.departure_date : b.booking_date;
      if (!rawDateStr) return false;
      const targetDate = new Date(rawDateStr);
      if (isNaN(targetDate.getTime())) return false;
      const targetYMD = targetDate.toISOString().split('T')[0];
      if (startDate && targetYMD < startDate) return false;
      if (endDate && targetYMD > endDate) return false;
      return true;
    })();

    // 5. Từ khóa tìm kiếm
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || (
      (b.booking_id && b.booking_id.toString().includes(term)) ||
      (b.customer_name && b.customer_name.toLowerCase().includes(term)) ||
      (b.customer_phone && b.customer_phone.includes(term)) ||
      (b.customer_email && b.customer_email.toLowerCase().includes(term)) ||
      (b.tour_name && b.tour_name.toLowerCase().includes(term))
    );

    return matchesStatus && matchesPayment && matchesDestination && matchesDate && matchesSearch;
  });

  const hasActiveFilters = filterStatus !== 'All' || filterPayment !== 'All' || selectedDestination !== 'All' || startDate || endDate || searchTerm;

  const handleResetFilters = () => {
    setFilterStatus('All');
    setFilterPayment('All');
    setSelectedDestination('All');
    setStartDate('');
    setEndDate('');
    setDateType('departure');
    setSearchTerm('');
  };

  // Thống kê
  const totalCount = bookings.length;
  const pendingCount = bookings.filter(b => b.booking_status === 'Pending').length;
  const confirmedCount = bookings.filter(b => b.booking_status === 'Confirmed').length;
  const cancelledCount = bookings.filter(b => b.booking_status === 'Cancelled').length;

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', sans-serif", display: 'flex', justifyContent: 'center' }}>
      {selectedBooking ? (
        
        <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '1000px', minHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'visible' }}>
            
            {/* 1. HEADER */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff', zIndex: 10, flexShrink: 0 }}>
              <button onClick={() => setSelectedBooking(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', fontWeight: '600', cursor: 'pointer', padding: 0, marginBottom: '16px' }}>← Quay lại danh sách</button>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>
                📋 Chi tiết Booking #BKG-{selectedBooking.booking_id.toString().padStart(4, '0')}
              </h2>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ 
                  padding: '6px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px',
                  backgroundColor: selectedBooking.booking_status === 'Confirmed' ? '#dcfce7' : selectedBooking.booking_status === 'Cancelled' ? '#f3f4f6' : '#fef3c7', 
                  color: selectedBooking.booking_status === 'Confirmed' ? '#15803d' : selectedBooking.booking_status === 'Cancelled' ? '#6b7280' : '#d97706' 
                }}>
                  Trạng thái Booking: {selectedBooking.booking_status === 'Confirmed' ? 'Đã xác nhận' : selectedBooking.booking_status === 'Cancelled' ? 'Đã hủy' : 'Chờ thanh toán'}
                </span>
                <span style={{ 
                  padding: '6px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px',
                  backgroundColor: selectedBooking.payment_status === 'Paid' ? '#dcfce7' : '#fef2f2', 
                  color: selectedBooking.payment_status === 'Paid' ? '#15803d' : '#dc2626' 
                }}>
                  Trạng thái thanh toán: {selectedBooking.payment_status === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </span>
              </div>
            </div>

            {/* BODY SCROLLABLE */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#f8fafc', flex: 1 }}>
              
              {/* 2. THÔNG TIN CHUYẾN TOUR */}
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Thông tin chuyến tour</span>
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', fontSize: '14px' }}>
                    <div style={{ gridColumn: '1 / -1', paddingBottom: '12px', borderBottom: '1px dashed #e2e8f0', marginBottom: '4px' }}>
                        <span style={{ color: '#64748b', display: 'block', marginBottom: '6px' }}>Tên Tour:</span> 
                        <div style={{ fontWeight: '700', color: '#0ea5e9', fontSize: '18px', lineHeight: '1.4' }}>{selectedBooking.tour_name}</div>
                    </div>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Mã Booking:</span> <div style={{ fontWeight: '600', color: '#1e293b' }}>#BKG-{selectedBooking.booking_id.toString().padStart(4, '0')}</div></div>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Ngày đặt:</span> <div style={{ fontWeight: '600', color: '#1e293b' }}>{new Date(selectedBooking.booking_date).toLocaleString('vi-VN')}</div></div>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Điểm đến:</span> <div style={{ fontWeight: '600', color: '#1e293b' }}>{selectedBooking.destination || 'Chưa có thông tin'}</div></div>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Ngày khởi hành:</span> <div style={{ fontWeight: '600', color: '#1e293b' }}>{selectedBooking.departure_date ? new Date(selectedBooking.departure_date).toLocaleDateString('vi-VN') : 'N/A'}</div></div>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Ngày kết thúc:</span> <div style={{ fontWeight: '600', color: '#1e293b' }}>
                      {selectedBooking.departure_date && selectedBooking.duration_days ? (() => {
                          const end = new Date(selectedBooking.departure_date);
                          end.setDate(end.getDate() + (selectedBooking.duration_days - 1));
                          return end.toLocaleDateString('vi-VN');
                      })() : 'N/A'}
                    </div></div>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Thời lượng:</span> <div style={{ fontWeight: '600', color: '#1e293b' }}>{selectedBooking.duration_days ? `${selectedBooking.duration_days} ngày` : 'N/A'}</div></div>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Số hành khách:</span> <div style={{ fontWeight: '600', color: '#1e293b' }}>{selectedBooking.num_people}</div></div>
                  </div>
              </div>

              {/* 3. THÔNG TIN NGƯỜI ĐẶT */}
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '700' }}>Thông tin người đặt</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '14px' }}>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Họ và tên:</span> <div style={{ fontWeight: '600', color: '#1e293b' }}>{selectedBooking.customer_name || 'Khách vãng lai'}</div></div>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Số điện thoại:</span> <div style={{ fontWeight: '600', color: '#1e293b' }}>{selectedBooking.customer_phone || 'N/A'}</div></div>
                    <div><span style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Email:</span> <div style={{ fontWeight: '600', color: '#1e293b' }}>{selectedBooking.customer_email || 'N/A'}</div></div>
                  </div>
              </div>

              
              {/* 4. DANH SÁCH HÀNH KHÁCH */}
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '700' }}>Danh sách hành khách {selectedBooking.passengers_list ? `(${selectedBooking.passengers_list.split('||').length})` : ''}</h3>
                  {selectedBooking.passengers_list ? (
                      <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                              <thead>
                                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600' }}>
                                      <th style={{ padding: '12px 16px' }}>STT</th>
                                      <th style={{ padding: '12px 16px' }}>Họ và tên</th>
                                      <th style={{ padding: "12px 16px" }}>Loại hành khách</th>
                                      <th style={{ padding: '12px 16px' }}>Ngày sinh</th>
                                      <th style={{ padding: '12px 16px' }}>Số điện thoại</th>
                                      
                                  </tr>
                              </thead>
                              <tbody>
                                  {selectedBooking.passengers_list.split('||').map((p, idx) => {
                                      const parts = p.split('::');
                                      return (
                                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                              <td style={{ padding: '12px 16px', color: '#64748b' }}>{idx + 1}</td>
                                              <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0f172a' }}>{parts[0] || '—'}</td>
                                              <td style={{ padding: '12px 16px', color: '#475569', fontWeight: '500' }}>
                                                {(() => {
                                                    let bd = selectedBooking.breakdown;
                                                    if (typeof bd === 'string') {
                                                        try { bd = JSON.parse(bd); } catch(e) { bd = null; }
                                                    }
                                                    if (!bd) return '—';
                                                    let count = 0;
                                                    if (bd.adults > 0) { count += bd.adults; if (idx < count) return 'Người lớn'; }
                                                    if (bd.children > 0) { count += bd.children; if (idx < count) return 'Trẻ em'; }
                                                    if (bd.toddlers > 0) { count += bd.toddlers; if (idx < count) return 'Trẻ nhỏ'; }
                                                    if (bd.infants > 0) { count += bd.infants; if (idx < count) return 'Em bé'; }
                                                    return '—';
                                                })()}
                                              </td>
                                              <td style={{ padding: '12px 16px', color: '#475569' }}>{parts[2] ? new Date(parts[2]).toLocaleDateString('vi-VN') : '—'}</td>
                                              <td style={{ padding: '12px 16px', color: '#475569' }}>{parts[3] || '—'}</td>
                                              
                                          </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                      </div>
                  ) : (
                      <div style={{ fontSize: '14px', color: '#64748b', fontStyle: 'italic', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                        API hiện tại chưa cung cấp dữ liệu danh sách hành khách chi tiết.
                      </div>
                  )}
              </div>


              {/* 5. CHI TIẾT GIÁ & 6. THÔNG TIN THANH TOÁN (GỘP HOẶC HIỂN THỊ DỮ LIỆU THỰC TẾ) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  
                  {/* CHI TIẾT GIÁ */}
                  <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '700' }}>Chi tiết giá</h3>
                      <div style={{ fontSize: '14px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '12px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(() => {
                            let adults = 1, children = 0, toddlers = 0, infants = 0;
                            let p = null;
                            if (selectedBooking.breakdown) {
                                p = typeof selectedBooking.breakdown === 'string' ? JSON.parse(selectedBooking.breakdown) : selectedBooking.breakdown;
                            } else if (selectedBooking.requirements) {
                                const reqs = typeof selectedBooking.requirements === 'string' ? JSON.parse(selectedBooking.requirements) : selectedBooking.requirements;
                                if (reqs.participantBreakdown) p = reqs.participantBreakdown;
                            }
                            if (p) {
                                adults = p.adults || 0; children = p.children || 0; toddlers = p.toddlers || 0; infants = p.infants || 0;
                            } else { adults = selectedBooking.num_people || 1; }

                            let adultPrice = 0, childPrice = 0, toddlerPrice = 0, infantPrice = 0;
                            const basePr = Number(selectedBooking.base_price) || 0;
                            let itConfig = {};
                            try {
                                if (selectedBooking.design_data) {
                                    const parsed = typeof selectedBooking.design_data === 'string' ? JSON.parse(selectedBooking.design_data) : selectedBooking.design_data;
                                    if (parsed.costConfig) itConfig = parsed.costConfig;
                                }
                            } catch(e) {}
                            
                            const sC = itConfig.ageMultiplier?.child || { percent: 75, fixed_surcharge: 0 };
                            const sT = itConfig.ageMultiplier?.toddler || { percent: 50, fixed_surcharge: 0 };
                            const sI = itConfig.ageMultiplier?.infant || { percent: 0, fixed_surcharge: 0 };

                            adultPrice = basePr;
                            childPrice = (basePr * (sC.percent !== undefined ? sC.percent : 75) / 100) + Number(sC.fixed_surcharge || 0);
                            toddlerPrice = (basePr * (sT.percent !== undefined ? sT.percent : 50) / 100) + Number(sT.fixed_surcharge || 0);
                            infantPrice = (basePr * (sI.percent !== undefined ? sI.percent : 0) / 100) + Number(sI.fixed_surcharge || 0);

                            const totalCalc = (adults * adultPrice) + (children * childPrice) + (toddlers * toddlerPrice) + (infants * infantPrice);
                            let discount = selectedBooking.discount_amount || 0;
                            
                            if (!selectedBooking.discount_amount && totalCalc > selectedBooking.total_amount) {
                                discount = totalCalc - selectedBooking.total_amount;
                            }

                            if (!basePr) {
                                return (
                                    <div style={{ color: '#64748b', fontStyle: 'italic', marginBottom: '12px' }}>
                                        Hệ thống chỉ lưu tổng tiền Booking, chưa hỗ trợ chi tiết đơn giá hoặc số lượng.
                                    </div>
                                );
                            }

                            return (
                                <div style={{ width: '100%' }}>
                                    {adults > 0 && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <div style={{ marginBottom: '4px', fontWeight: '700', color: '#0f172a' }}>Người lớn</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                                <span>{adults} × {formatCurrency(adultPrice)}</span>
                                                <strong style={{ color: '#0f172a' }}>{formatCurrency(adults * adultPrice)}</strong>
                                            </div>
                                        </div>
                                    )}
                                    {children > 0 && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <div style={{ marginBottom: '4px', fontWeight: '700', color: '#0f172a' }}>Trẻ em</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                                <span>{children} × {formatCurrency(childPrice)}</span>
                                                <strong style={{ color: '#0f172a' }}>{formatCurrency(children * childPrice)}</strong>
                                            </div>
                                        </div>
                                    )}
                                    {toddlers > 0 && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <div style={{ marginBottom: '4px', fontWeight: '700', color: '#0f172a' }}>Trẻ nhỏ</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                                <span>{toddlers} × {formatCurrency(toddlerPrice)}</span>
                                                <strong style={{ color: '#0f172a' }}>{formatCurrency(toddlers * toddlerPrice)}</strong>
                                            </div>
                                        </div>
                                    )}
                                    {infants > 0 && (
                                        <div style={{ marginBottom: '8px' }}>
                                            <div style={{ marginBottom: '4px', fontWeight: '700', color: '#0f172a' }}>Em bé</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                                <span>{infants} × {formatCurrency(infantPrice)}</span>
                                                <strong style={{ color: '#0f172a' }}>{formatCurrency(infants * infantPrice)}</strong>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div style={{ borderTop: '1px dashed #cbd5e1', margin: '12px 0' }}></div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: '#0f172a', fontWeight: '600' }}>Tiền tour</span>
                                        <strong style={{ color: '#0f172a' }}>{formatCurrency(totalCalc)}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: '#0f172a', fontWeight: '600' }}>Bảo hiểm</span>
                                        <strong style={{ color: '#0f172a' }}>Đã bao gồm</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#0f172a', fontWeight: '600' }}>Khuyến mãi</span>
                                        <strong style={{ color: '#0f172a' }}>{formatCurrency(discount)}</strong>
                                    </div>
                                </div>
                            );
                        })()}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#0f172a', fontWeight: '700', fontSize: '16px' }}>Tổng tiền Booking</span>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#0284c7', whiteSpace: 'nowrap', textAlign: 'right', flexShrink: 0 }}>{formatCurrency(selectedBooking.total_amount)}</div>
                      </div>
                  </div>

                  {/* THÔNG TIN THANH TOÁN */}
                  <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '700' }}>Thông tin thanh toán</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Trạng thái:</span>
                          <span style={{ fontWeight: '700', color: selectedBooking.payment_status === 'Paid' ? '#15803d' : '#dc2626' }}>
                            {selectedBooking.payment_status === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Tổng đã thu:</span>
                          <span style={{ fontWeight: '600', color: '#0f172a' }}>{selectedBooking.payment_status === 'Paid' ? formatCurrency(selectedBooking.total_amount) : '0 đ'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Còn phải thu:</span>
                          <span style={{ fontWeight: '600', color: '#0f172a' }}>{selectedBooking.payment_status === 'Paid' ? '0 đ' : formatCurrency(selectedBooking.total_amount)}</span>
                        </div>
                        {selectedBooking.payment_method && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Phương thức:</span>
                            <span style={{ fontWeight: '600', color: '#0f172a' }}>{selectedBooking.payment_method}</span>
                          </div>
                        )}
                        {selectedBooking.transaction_code && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Mã giao dịch:</span>
                            <span style={{ fontWeight: '600', color: '#0f172a' }}>{selectedBooking.transaction_code}</span>
                          </div>
                        )}
                        {selectedBooking.paid_at && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748b' }}>Thời gian:</span>
                            <span style={{ fontWeight: '600', color: '#0f172a' }}>{new Date(selectedBooking.paid_at).toLocaleString('vi-VN')}</span>
                          </div>
                        )}
                      </div>
                  </div>
              </div>

              {/* 7. GHI CHÚ / YÊU CẦU ĐẶC BIỆT */}
              <div style={{ backgroundColor: '#fffbeb', padding: '16px', borderRadius: '12px', border: '1px solid #fde68a' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#d97706', fontWeight: '700' }}>Ghi chú / Yêu cầu đặc biệt</h3>
                  <div style={{ fontSize: '14px', color: '#b45309' }}>{selectedBooking.notes || 'Không có ghi chú'}</div>
              </div>

            </div>

            {/* 9. FOOTER ACTIONS */}
            <div style={{ padding: '20px 28px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', justifyContent: 'flex-end', gap: '12px', zIndex: 10, flexShrink: 0 }}>
              

              {/* Giữ lại Duyệt cho Tour yêu cầu riêng nếu cần, nếu không thì ẩn */}
              {selectedBooking.booking_status !== 'Confirmed' && selectedBooking.quote_id && (
                <button
                  onClick={() => handleUpdateStatus(selectedBooking.booking_id, 'Confirmed')}
                  disabled={actionLoading}
                  style={{ padding: '10px 24px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                  {actionLoading ? 'Đang xử lý...' : 'Xác Nhận (Custom Tour)'}
                </button>
              )}

              {selectedBooking.booking_status !== 'Cancelled' && (
                <button
                  onClick={() => handleCancelBooking(selectedBooking)}
                  disabled={actionLoading}
                  style={{ padding: '10px 24px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                >
                  {actionLoading ? 'Đang xử lý...' : 'Hủy Booking'}
                </button>
              )}
            </div>
          </div>
        </div>
      
      ) : (
        <div style={{ width: '100%', maxWidth: '1200px' }}>
          
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>Quản lý Đơn đặt Tour (Bookings)</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>Xem danh sách, kiểm tra thanh toán và theo dõi trạng thái đơn hàng.</p>
        </div>
      </div>

      {alertMsg.text && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: '600',
          backgroundColor: alertMsg.type === 'success' ? '#dcfce7' : '#fef2f2',
          color: alertMsg.type === 'success' ? '#16a34a' : '#dc2626'
        }}>
          {alertMsg.text}
        </div>
      )}

      {/* DASHBOARD STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #0f172a', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Tổng Số Đơn</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>{totalCount}</div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #f59e0b', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Chờ Thanh Toán</div>
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

      {/* BỘ LỌC & TÌM KIẾM ĐA TIÊU CHÍ */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* HÀNG 1: TAB TRẠNG THÁI BOOKING & TÌM KIẾM TỪ KHÓA */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: 'Tất cả', val: 'All' },
              { label: `Chờ thanh toán (${pendingCount})`, val: 'Pending' },
              { label: `Đã xác nhận (${confirmedCount})`, val: 'Confirmed' },
              { label: `Đã hủy (${cancelledCount})`, val: 'Cancelled' }
            ].map(tab => (
              <button
                key={tab.val}
                onClick={() => setFilterStatus(tab.val)}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                  backgroundColor: filterStatus === tab.val ? '#0f172a' : '#f1f5f9',
                  color: filterStatus === tab.val ? '#fff' : '#475569',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
            <input
              type="text"
              placeholder="🔍 Tìm mã booking, tên KH, SĐT, tour..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
              }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>&times;</button>
            )}
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '2px 0' }}></div>

        {/* HÀNG 2: BỘ LỌC CHI TIẾT (ĐỊA ĐIỂM, THANH TOÁN, KHOẢNG NGÀY, RESET) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', fontSize: '14px' }}>
          
          {/* 📍 LỌC ĐỊA ĐIỂM */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>📍 Địa điểm:</span>
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#fff', color: '#0f172a', fontWeight: '600', outline: 'none', cursor: 'pointer' }}
            >
              <option value="All">🌐 Tất cả địa điểm ({destinationOptions.length})</option>
              {destinationOptions.map(dest => (
                <option key={dest} value={dest}>{dest}</option>
              ))}
            </select>
          </div>

          {/* 💳 LỌC THANH TOÁN */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>💳 Thanh toán:</span>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#fff', color: '#0f172a', fontWeight: '500', outline: 'none', cursor: 'pointer' }}
            >
              <option value="All">Tất cả thanh toán</option>
              <option value="Paid">🟢 Đã thanh toán</option>
              <option value="Unpaid">🟡 Chưa thanh toán</option>
            </select>
          </div>

          {/* 📅 LỌC KHOẢNG NGÀY */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '600', color: '#475569', whiteSpace: 'nowrap' }}>📅 Ngày:</span>
            <select
              value={dateType}
              onChange={(e) => setDateType(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#f8fafc', color: '#334155', fontWeight: '600', outline: 'none', cursor: 'pointer' }}
            >
              <option value="departure">Khởi hành</option>
              <option value="booking">Ngày đặt</option>
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
              title="Từ ngày"
            />
            <span style={{ color: '#94a3b8' }}>-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#0f172a', outline: 'none' }}
              title="Đến ngày"
            />
          </div>

          {/* NÚT ĐẶT LẠI BỘ LỌC (LUÔN HIỂN THỊ) */}
          <button
            onClick={handleResetFilters}
            style={{
              padding: '8px 16px', borderRadius: '8px',
              border: hasActiveFilters ? '1px solid #fca5a5' : '1px solid #cbd5e1',
              backgroundColor: hasActiveFilters ? '#fef2f2' : '#f8fafc',
              color: hasActiveFilters ? '#ef4444' : '#475569',
              fontWeight: '700', fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto',
              transition: 'all 0.2s'
            }}
            title="Đặt lại toàn bộ các bộ lọc về mặc định"
          >
            🔄 Đặt lại
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách đơn đặt tour...</div>
        ) : filteredBookings.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy đơn đặt tour nào.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', minWidth: '900px' }}>
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
                      <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '12px', display: 'inline-block' }}>
                        🟢 Đã thanh toán
                      </span>
                    ) : (
                      <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '12px', display: 'inline-block' }}>
                        🟡 Chưa thanh toán
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {b.booking_status === 'Confirmed' && (
                      <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '12px', display: 'inline-block' }}>
                        Đã xác nhận
                      </span>
                    )}
                    {b.booking_status === 'Pending' && (
                      <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '12px', display: 'inline-block' }}>
                        Chờ thanh toán
                      </span>
                    )}
                    {b.booking_status === 'Cancelled' && (
                      <span style={{ backgroundColor: '#f3f4f6', color: '#6b7280', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '12px', display: 'inline-block' }}>
                        Đã hủy
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
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      
        </div>
      )}
    </div>
  );
};

export default StaffBookingManagement;

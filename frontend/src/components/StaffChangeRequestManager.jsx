import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GATEWAY_URL = 'http://localhost:5000';

const extractBankInfo = (reasonStr) => {
  if (!reasonStr) return null;
  const match = reasonStr.match(/\[Tài khoản (?:nhận )?hoàn tiền:\s*([^-]+)\s*-\s*STK:\s*([^-]+)\s*-\s*Chủ TK:\s*([^\]]+)\]/i);
  if (match) {
    return {
      bankName: match[1].trim(),
      accountNumber: match[2].trim(),
      accountHolder: match[3].trim()
    };
  }
  return null;
};

const StaffChangeRequestManager = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [staffNote, setStaffNote] = useState('');
  const [showPolicyTable, setShowPolicyTable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });
  const [copySuccess, setCopySuccess] = useState(false);

  // STATE TIẾP NHẬN TẠI QUẦY (COUNTER WORKFLOW)
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [allBookings, setAllBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [counterSearch, setCounterSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [counterRequestType, setCounterRequestType] = useState('Cancel');
  const [counterReason, setCounterReason] = useState('');
  const [counterRefundMethod, setCounterRefundMethod] = useState('Cash'); // 'Cash' | 'Bank'
  const [counterBankInfo, setCounterBankInfo] = useState({ bankName: '', accountNumber: '', accountHolder: '' });
  const [tourDepartures, setTourDepartures] = useState([]);
  const [counterNewDepartureId, setCounterNewDepartureId] = useState('');
  const [loadingDepartures, setLoadingDepartures] = useState(false);
  const [counterStaffNote, setCounterStaffNote] = useState('');
  const [isSubmittingCounter, setIsSubmittingCounter] = useState(false);

  // STATE ĐỔI LỊCH CHO REVIEW MODAL
  const [reviewDepartures, setReviewDepartures] = useState([]);
  const [selectedNewDepForReview, setSelectedNewDepForReview] = useState('');
  const [loadingReviewDeps, setLoadingReviewDeps] = useState(false);

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

  // TÍNH TOÁN BIỂU PHÍ HỦY / ĐỔI LỊCH THEO CHÍNH SÁCH 5 MỨC
  const getPolicyDetails = (booking, reqType) => {
    if (!booking) return { days: 0, feePercent: 0, feeAmt: 0, refundAmt: 0, isPaid: false };
    let days = 0;
    if (booking.departure_date) {
      const depDate = new Date(booking.departure_date);
      const today = new Date();
      depDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      days = Math.ceil((depDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
    const isPaid = booking.payment_status === 'Paid';
    const totalAmount = Number(booking.total_amount || 0);

    if (!isPaid) {
      return { days, feePercent: 0, feeAmt: 0, refundAmt: 0, isPaid: false };
    }

    let feePercent = 0;
    if (reqType === 'Cancel') {
      if (days >= 30) feePercent = 10;
      else if (days >= 15) feePercent = 30;
      else if (days >= 7) feePercent = 50;
      else if (days >= 3) feePercent = 75;
      else feePercent = 100;
      const feeAmt = Math.round(totalAmount * (feePercent / 100));
      const refundAmt = Math.max(0, totalAmount - feeAmt);
      return { days, feePercent, feeAmt, refundAmt, isPaid: true };
    } else {
      if (days >= 30) feePercent = 0;
      else if (days >= 15) feePercent = 10;
      else if (days >= 7) feePercent = 20;
      else if (days >= 3) feePercent = 40;
      else feePercent = 100; // Không áp dụng đổi lịch khi < 3 ngày
      const feeAmt = Math.round(totalAmount * (feePercent / 100));
      return { days, feePercent, feeAmt, refundAmt: 0, isPaid: true };
    }
  };

  const handleOpenCounterModal = async () => {
    setShowCounterModal(true);
    setSelectedBooking(null);
    setCounterRequestType('Cancel');
    setCounterReason('');
    setCounterRefundMethod('Cash');
    setCounterBankInfo({ bankName: '', accountNumber: '', accountHolder: '' });
    setCounterNewDepartureId('');
    setTourDepartures([]);
    setCounterStaffNote('');
    setCounterSearch('');
    
    setLoadingBookings(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${GATEWAY_URL}/api/bookings/admin/all-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setAllBookings(res.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách booking cho quầy:", err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleSelectBooking = async (booking) => {
    setSelectedBooking(booking);
    setCounterNewDepartureId('');
    setTourDepartures([]);
    
    if (booking.tour_id) {
      setLoadingDepartures(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${GATEWAY_URL}/api/tours/${booking.tour_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.success && res.data.data?.departures) {
          const deps = res.data.data.departures.filter(d => 
            String(d.departure_id) !== String(booking.departure_id) && 
            d.status === 'Open' && 
            Number(d.available_slots || 0) >= Number(booking.num_people || 1)
          );
          setTourDepartures(deps);
        }
      } catch (err) {
        console.error("Lỗi tải departures của tour:", err);
      } finally {
        setLoadingDepartures(false);
      }
    }
  };

  const handleChangeCounterReqType = async (type) => {
    setCounterRequestType(type);
    if (type === 'Reschedule' && selectedBooking?.tour_id && tourDepartures.length === 0) {
      setLoadingDepartures(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${GATEWAY_URL}/api/tours/${selectedBooking.tour_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.success && res.data.data?.departures) {
          const deps = res.data.data.departures.filter(d => 
            String(d.departure_id) !== String(selectedBooking.departure_id) && 
            d.status === 'Open' && 
            Number(d.available_slots || 0) >= Number(selectedBooking.num_people || 1)
          );
          setTourDepartures(deps);
        }
      } catch (err) {
        console.error("Lỗi tải departures:", err);
      } finally {
        setLoadingDepartures(false);
      }
    }
  };

  const handleSubmitCounter = async (autoApprove) => {
    if (!selectedBooking) {
      alert("Vui lòng chọn đơn tour cần tiếp nhận xử lý!");
      return;
    }
    if (!counterReason.trim()) {
      alert("Vui lòng nhập lý do hủy hoặc đổi lịch của khách hàng!");
      return;
    }
    if (counterRequestType === 'Reschedule' && !counterNewDepartureId) {
      alert("Vui lòng chọn đợt khởi hành mới muốn chuyển sang!");
      return;
    }
    if (counterRequestType === 'Cancel' && counterRefundMethod === 'Bank') {
      if (!counterBankInfo.bankName || !counterBankInfo.accountNumber || !counterBankInfo.accountHolder) {
        alert("Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng để chuyển tiền hoàn!");
        return;
      }
    }

    const policy = getPolicyDetails(selectedBooking, counterRequestType);

    if (counterRequestType === 'Reschedule' && policy.days < 3) {
      alert("Ngày khởi hành còn dưới 3 ngày, quy định biểu phí không áp dụng đổi lịch!");
      return;
    }

    const confirmText = autoApprove
      ? (counterRequestType === 'Cancel'
          ? `Xác nhận PHÊ DUYỆT & QUYẾT TOÁN HỦY ngay tại quầy cho đơn #${selectedBooking.booking_id}?\n- Phí khấu trừ: ${policy.feePercent}% (${policy.feeAmt.toLocaleString('vi-VN')} ₫)\n- Số tiền hoàn lại: ${policy.refundAmt.toLocaleString('vi-VN')} ₫`
          : `Xác nhận PHÊ DUYỆT & ĐỔI LỊCH ngay tại quầy cho đơn #${selectedBooking.booking_id}?`)
      : `Tạo yêu cầu ${counterRequestType === 'Cancel' ? 'Hủy' : 'Đổi lịch'} (chờ duyệt) cho đơn #${selectedBooking.booking_id}?`;

    if (!window.confirm(confirmText)) return;

    setIsSubmittingCounter(true);
    try {
      const token = localStorage.getItem('token');
      let formattedReason = counterReason.trim();
      if (counterRequestType === 'Cancel') {
        if (counterRefundMethod === 'Bank') {
          formattedReason += ` [Tài khoản nhận hoàn tiền: ${counterBankInfo.bankName} - STK: ${counterBankInfo.accountNumber} - Chủ TK: ${counterBankInfo.accountHolder}]`;
        } else {
          formattedReason += ` [Hình thức hoàn tiền: Tiền mặt trực tiếp tại quầy]`;
        }
      }

      const res = await axios.post(`${GATEWAY_URL}/api/bookings/change-requests`, {
        booking_id: selectedBooking.booking_id,
        request_type: counterRequestType,
        reason: formattedReason,
        new_departure_id: counterRequestType === 'Reschedule' ? counterNewDepartureId : null,
        auto_approve: autoApprove,
        staff_note: counterStaffNote.trim() || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        setAlertMsg({ type: 'success', text: res.data.message || 'Tiếp nhận yêu cầu tại quầy thành công!' });
        setShowCounterModal(false);
        setSelectedBooking(null);
        fetchRequests();
      } else {
        setAlertMsg({ type: 'error', text: res.data?.message || 'Có lỗi xảy ra!' });
      }
    } catch (err) {
      console.error("Lỗi tiếp nhận tại quầy:", err);
      setAlertMsg({ type: 'error', text: err.response?.data?.message || 'Không thể thực hiện yêu cầu tiếp nhận tại quầy!' });
    } finally {
      setIsSubmittingCounter(false);
    }
  };

  const handleProcess = async (status, customNote, customNewDepId) => {
    if (!selectedReq) return;
    const depIdToUse = customNewDepId || selectedNewDepForReview || selectedReq.new_departure_id;
    if (status === 'Approved' && selectedReq.request_type === 'Reschedule') {
      if (!depIdToUse) {
        alert("Vui lòng chọn đợt khởi hành mới để chuyển lịch trình!");
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${GATEWAY_URL}/api/bookings/admin/change-requests/${selectedReq.change_id}/process`, {
        status,
        staff_note: customNote !== undefined ? customNote : staffNote,
        new_departure_id: selectedReq.request_type === 'Reschedule' ? depIdToUse : undefined
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

  // Sao chép số tài khoản không làm gián đoạn giao diện
  const handleCopyAccountNumber = (accountNumber) => {
    if (!accountNumber) return;
    navigator.clipboard.writeText(accountNumber);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Phân biệt trạng thái rõ ràng giữa Đã duyệt và Đã hoàn tiền
  const getDetailedStatus = (r) => {
    if (!r) return { label: 'Chờ xử lý', color: '#b45309', bg: '#fef3c7', border: '#fde68a' };

    if (r.status === 'Pending') {
      return { label: 'Chờ quyết toán', color: '#b45309', bg: '#fef3c7', border: '#fde68a' };
    }

    if (r.status === 'Rejected') {
      return { label: 'Từ chối', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' };
    }

    if (r.status === 'Approved') {
      if (r.request_type === 'Cancel') {
        const isPaidRefunded = r.payment_status === 'Refunded' || (r.staff_note && r.staff_note.toLowerCase().includes('đã hoàn'));
        if (isPaidRefunded) {
          return { label: 'Đã hoàn tiền', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' };
        }
        return { label: 'Đã duyệt (Chờ chi tiền)', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' };
      }
      return { label: 'Đã đổi lịch', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' };
    }

    return { label: r.status, color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' };
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
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            Quản Lý Yêu Cầu Đổi & Hủy Vé
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '13.5px' }}>
            Hệ thống tiếp nhận, thẩm định chính sách và xử lý quyết toán hoàn tiền khách hàng
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={fetchRequests} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', 
              backgroundColor: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '8px', 
              cursor: 'pointer', fontWeight: '600', fontSize: '13.5px', transition: 'all 0.2s ease'
            }}
          >
            Làm mới
          </button>
          <button 
            onClick={handleOpenCounterModal} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', 
              backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', 
              cursor: 'pointer', fontWeight: '600', fontSize: '13.5px', transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)'
            }}
          >
            + Tiếp nhận tại quầy
          </button>
        </div>
      </div>

      {/* ALERT NOTIFICATION */}
      {alertMsg.text && (
        <div style={{ 
          padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13.5px', fontWeight: '500',
          backgroundColor: alertMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: alertMsg.type === 'success' ? '#15803d' : '#b91c1c',
          border: `1px solid ${alertMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`
        }}>
          {alertMsg.text}
        </div>
      )}

      {/* OVERVIEW STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#fff', padding: '18px 20px', borderRadius: '10px', borderLeft: '4px solid #f59e0b', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', borderLeftWidth: '4px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chờ Quyết Toán</div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '6px' }}>{pendingCount}</div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '18px 20px', borderRadius: '10px', borderLeft: '4px solid #10b981', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', borderLeftWidth: '4px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Đã Quyết Toán Hủy</div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '6px' }}>{approvedCancelCount}</div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '18px 20px', borderRadius: '10px', borderLeft: '4px solid #3b82f6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', borderLeftWidth: '4px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Đã Đổi Lịch</div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '6px' }}>{approvedRescheduleCount}</div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '18px 20px', borderRadius: '10px', borderLeft: '4px solid #94a3b8', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', borderLeftWidth: '4px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Đã Từ Chối</div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '6px' }}>{rejectedCount}</div>
        </div>
      </div>

      {/* CONTROLS: FILTER TABS & SEARCH */}
      <div style={{ backgroundColor: '#fff', padding: '14px 18px', borderRadius: '10px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: 'Tất cả', val: 'All' },
            { label: `Chờ quyết toán (${pendingCount})`, val: 'Pending' },
            { label: 'Đã duyệt', val: 'Approved' },
            { label: 'Từ chối', val: 'Rejected' }
          ].map(tab => (
            <button
              key={tab.val}
              onClick={() => setFilterStatus(tab.val)}
              style={{
                padding: '7px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13.5px',
                backgroundColor: filterStatus === tab.val ? '#0f172a' : '#f1f5f9',
                color: filterStatus === tab.val ? '#fff' : '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Tìm theo mã đơn, tên khách, số điện thoại..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '320px', fontSize: '13.5px', outline: 'none'
          }}
        />
      </div>

      {/* MAIN DATA TABLE */}
      <div style={{ backgroundColor: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải danh sách yêu cầu...</div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Không có yêu cầu nào phù hợp.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '600', fontSize: '13px' }}>
                <th style={{ padding: '12px 16px' }}>Mã YC</th>
                <th style={{ padding: '12px 16px' }}>Mã Đơn</th>
                <th style={{ padding: '12px 16px' }}>Loại Yêu Cầu</th>
                <th style={{ padding: '12px 16px' }}>Khách Hàng</th>
                <th style={{ padding: '12px 16px' }}>Tour & Khởi Hành</th>
                <th style={{ padding: '12px 16px' }}>Quyết Toán & Phí</th>
                <th style={{ padding: '12px 16px' }}>Trạng Thái</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((r, idx) => {
                const statusMeta = getDetailedStatus(r);
                return (
                  <tr key={r.change_id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#fff' : '#fcfcfd' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0f172a' }}>#{r.change_id}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#0284c7' }}>#{r.booking_id}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        backgroundColor: r.request_type === 'Cancel' ? '#fef2f2' : '#eff6ff', 
                        color: r.request_type === 'Cancel' ? '#dc2626' : '#2563eb', 
                        padding: '3px 8px', borderRadius: '4px', fontWeight: '600', fontSize: '12px',
                        border: `1px solid ${r.request_type === 'Cancel' ? '#fecaca' : '#bfdbfe'}`
                      }}>
                        {r.request_type === 'Cancel' ? 'Hủy tour' : 'Đổi lịch'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{r.customer_name || 'Khách hàng'}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{r.customer_phone || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: '500', color: '#334155' }}>{r.tour_name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        Ngày đi: {r.current_departure_date ? new Date(r.current_departure_date).toLocaleDateString('vi-VN') : 'N/A'}
                      </div>
                      {r.request_type === 'Reschedule' && r.requested_departure_date && (
                        <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: '500', marginTop: '2px' }}>
                          Muốn đổi sang: {new Date(r.requested_departure_date).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                        Phí khấu trừ: <strong style={{ color: Number(r.fee_percentage || 0) > 0 ? '#dc2626' : '#16a34a' }}>{Number(r.fee_percentage || 0)}%</strong> (-{Number(r.fee_amount || 0).toLocaleString('vi-VN')} ₫)
                      </div>
                      {r.request_type === 'Cancel' ? (
                        <div style={{ fontSize: '13px', color: '#047857', fontWeight: '700', marginTop: '2px' }}>
                          Hoàn trả: {Number(r.refund_amount || 0).toLocaleString('vi-VN')} ₫
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                          {Number(r.fee_percentage || 0) === 0 ? 'Miễn phí đổi lịch' : `Phụ thu: ${Number(r.fee_amount || 0).toLocaleString('vi-VN')} ₫`}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        backgroundColor: statusMeta.bg, 
                        color: statusMeta.color, 
                        border: `1px solid ${statusMeta.border}`,
                        padding: '3px 8px', borderRadius: '4px', fontWeight: '600', fontSize: '12px' 
                      }}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          setSelectedReq(r);
                          setCopySuccess(false);
                          setSelectedNewDepForReview(r.new_departure_id ? String(r.new_departure_id) : '');
                          if (r.request_type === 'Reschedule' && r.tour_id) {
                            setLoadingReviewDeps(true);
                            axios.get(`${GATEWAY_URL}/api/tours/${r.tour_id}`, {
                              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                            }).then(res => {
                              if (res.data?.success && res.data.data?.departures) {
                                const deps = res.data.data.departures.filter(d => 
                                  String(d.departure_id) !== String(r.old_departure_id || r.current_departure_id) &&
                                  d.status === 'Open'
                                );
                                setReviewDepartures(deps);
                              }
                            }).catch(err => console.error("Lỗi tải departures review:", err))
                              .finally(() => setLoadingReviewDeps(false));
                          } else {
                            setReviewDepartures([]);
                          }
                          if (r.staff_note) {
                            setStaffNote(r.staff_note);
                          } else if (r.status === 'Pending') {
                            if (r.request_type === 'Cancel') {
                              const ref = Number(r.refund_amount || 0);
                              const fee = Number(r.fee_percentage || 0);
                              const feeAmt = Number(r.fee_amount || 0);
                              setStaffNote(ref > 0 
                                ? `Đã duyệt hoàn tiền ${ref.toLocaleString('vi-VN')} ₫ (khấu trừ ${fee}% phí = ${feeAmt.toLocaleString('vi-VN')} ₫ theo quy định). Kế toán thực hiện lệnh chuyển khoản hoàn trả.` 
                                : `Đã duyệt hủy tour. Áp dụng chính sách hủy sát giờ khởi hành không hoàn tiền (${fee}% phí).`);
                            } else {
                              setStaffNote(`Đã duyệt chấp thuận đổi lịch khởi hành theo yêu cầu.`);
                            }
                          } else {
                            setStaffNote('');
                          }
                        }}
                        style={{
                          padding: '6px 14px', 
                          backgroundColor: r.status === 'Pending' ? '#0f172a' : '#ffffff',
                          color: r.status === 'Pending' ? '#ffffff' : '#334155',
                          border: r.status === 'Pending' ? 'none' : '1px solid #cbd5e1', 
                          borderRadius: '6px', 
                          cursor: 'pointer', 
                          fontWeight: '600', 
                          fontSize: '12.5px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {r.status === 'Pending' ? 'Xử lý' : 'Chi tiết'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: TIẾP NHẬN HỦY / ĐỔI LỊCH TRỰC TIẾP TẠI QUẦY (COUNTER WORKFLOW)     */}
      {/* ========================================================================= */}
      {showCounterModal && (() => {
        const policy = getPolicyDetails(selectedBooking, counterRequestType);
        const filteredBookings = allBookings.filter(b => {
          const isNotTerminated = b.booking_status !== 'Cancelled' && b.booking_status !== 'Completed';
          if (!isNotTerminated) return false;
          if (!counterSearch.trim()) return true;
          const q = counterSearch.toLowerCase();
          return (
            (b.booking_id && b.booking_id.toString().includes(q)) ||
            (b.customer_name && b.customer_name.toLowerCase().includes(q)) ||
            (b.customer_phone && b.customer_phone.includes(q)) ||
            (b.tour_name && b.tour_name.toLowerCase().includes(q))
          );
        });

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              width: '740px',
              maxWidth: '100%',
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}>
              {/* MODAL HEADER */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '20px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                      Tiếp Nhận & Xử Lý Hủy / Đổi Lịch Tại Quầy
                    </h2>
                    <span style={{
                      fontSize: '11.5px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px',
                      backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd'
                    }}>
                      TIẾP NHẬN TRỰC TIẾP
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                    Áp dụng cho khách hàng đến quầy giao dịch hoặc gọi điện thoại báo hủy / đổi tour
                  </div>
                </div>
                <button
                  onClick={() => setShowCounterModal(false)}
                  title="Đóng cửa sổ"
                  style={{
                    background: 'transparent', border: 'none', color: '#94a3b8',
                    fontSize: '18px', cursor: 'pointer', padding: '4px', lineHeight: 1
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  ✕
                </button>
              </div>

              {/* MODAL BODY (SCROLLABLE) */}
              <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* 1. TÌM KIẾM HOẶC THÔNG TIN ĐƠN BOOKING */}
                <div>
                  <div style={{
                    fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase',
                    letterSpacing: '0.6px', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span>1. Thông Tin Đơn Đặt Tour</span>
                    {selectedBooking && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBooking(null);
                          setTourDepartures([]);
                          setCounterNewDepartureId('');
                        }}
                        style={{
                          background: 'transparent', border: 'none', color: '#0284c7',
                          fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                        }}
                      >
                        Đổi đơn khác
                      </button>
                    )}
                  </div>

                  {!selectedBooking ? (
                    <div>
                      <input
                        type="text"
                        placeholder="Tìm theo Mã đơn, Họ tên khách, Số điện thoại hoặc Tên tour..."
                        value={counterSearch}
                        onChange={(e) => setCounterSearch(e.target.value)}
                        style={{
                          width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                          fontSize: '13.5px', outline: 'none', boxSizing: 'border-box', marginBottom: '10px'
                        }}
                      />

                      {loadingBookings ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                          Đang tải danh sách đơn đặt tour...
                        </div>
                      ) : filteredBookings.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                          Không tìm thấy đơn tour hợp lệ cần xử lý.
                        </div>
                      ) : (
                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                          {filteredBookings.slice(0, 15).map((b) => (
                            <div
                              key={b.booking_id}
                              onClick={() => handleSelectBooking(b)}
                              style={{
                                padding: '10px 14px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                transition: 'background 0.15s ease'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                            >
                              <div>
                                <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a' }}>
                                  #{b.booking_id} &bull; {b.customer_name} ({b.customer_phone || 'N/A'})
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                  {b.tour_name} &bull; Khởi hành: {b.departure_date ? new Date(b.departure_date).toLocaleDateString('vi-VN') : 'N/A'} ({b.num_people} khách)
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                                  {Number(b.total_amount || 0).toLocaleString('vi-VN')} ₫
                                </div>
                                <span style={{
                                  fontSize: '11px', fontWeight: '600', padding: '2px 6px', borderRadius: '4px',
                                  backgroundColor: b.payment_status === 'Paid' ? '#ecfdf5' : '#fef3c7',
                                  color: b.payment_status === 'Paid' ? '#047857' : '#b45309'
                                }}>
                                  {b.payment_status === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px',
                      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px'
                    }}>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11.5px', display: 'block' }}>Mã đơn & Khách hàng</span>
                        <strong style={{ color: '#0f172a' }}>#{selectedBooking.booking_id} &bull; {selectedBooking.customer_name}</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{selectedBooking.customer_phone || 'Không có SĐT'}</div>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11.5px', display: 'block' }}>Tour du lịch</span>
                        <strong style={{ color: '#0f172a' }}>{selectedBooking.tour_name}</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Số lượng khách: {selectedBooking.num_people} người</div>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11.5px', display: 'block' }}>Ngày khởi hành hiện tại</span>
                        <strong style={{ color: '#0f172a' }}>
                          {selectedBooking.departure_date ? new Date(selectedBooking.departure_date).toLocaleDateString('vi-VN') : 'N/A'}
                        </strong>
                        <div style={{ fontSize: '12px', color: policy.days >= 3 ? '#047857' : '#dc2626', fontWeight: '600' }}>
                          Còn {policy.days} ngày trước khởi hành
                        </div>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '11.5px', display: 'block' }}>Tổng tiền & Thanh toán</span>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                          {Number(selectedBooking.total_amount || 0).toLocaleString('vi-VN')} ₫
                        </strong>
                        <div>
                          <span style={{
                            fontSize: '11px', fontWeight: '600', padding: '2px 6px', borderRadius: '4px',
                            backgroundColor: selectedBooking.payment_status === 'Paid' ? '#ecfdf5' : '#fef3c7',
                            color: selectedBooking.payment_status === 'Paid' ? '#047857' : '#b45309'
                          }}>
                            {selectedBooking.payment_status === 'Paid' ? 'Đã thanh toán (Paid)' : 'Chưa thanh toán (Unpaid)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {selectedBooking && (
                  <>
                    {/* 2. CHỌN LOẠI NGHIỆP VỤ */}
                    <div>
                      <div style={{
                        fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase',
                        letterSpacing: '0.6px', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9'
                      }}>
                        2. Chọn Loại Nghiệp Vụ Tại Quầy
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div
                          onClick={() => handleChangeCounterReqType('Cancel')}
                          style={{
                            padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
                            border: counterRequestType === 'Cancel' ? '2px solid #dc2626' : '1px solid #cbd5e1',
                            backgroundColor: counterRequestType === 'Cancel' ? '#fef2f2' : '#ffffff',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ fontWeight: '700', fontSize: '14px', color: counterRequestType === 'Cancel' ? '#b91c1c' : '#334155' }}>
                            Hủy Tour & Quyết Toán Hoàn Tiền
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                            Khách hàng yêu cầu hủy tour, hệ thống tính phí phạt và hoàn tiền theo quy định
                          </div>
                        </div>

                        <div
                          onClick={() => handleChangeCounterReqType('Reschedule')}
                          style={{
                            padding: '12px 16px', borderRadius: '8px', cursor: 'pointer',
                            border: counterRequestType === 'Reschedule' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                            backgroundColor: counterRequestType === 'Reschedule' ? '#eff6ff' : '#ffffff',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ fontWeight: '700', fontSize: '14px', color: counterRequestType === 'Reschedule' ? '#1d4ed8' : '#334155' }}>
                            Đổi Ngày Khởi Hành (Reschedule)
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                            Khách hàng đổi sang đợt khởi hành khác cùng tour, áp dụng phí đổi lịch nếu có
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. CHI TIẾT TÍNH PHÍ & QUYẾT TOÁN TÀI CHÍNH */}
                    <div>
                      <div style={{
                        fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase',
                        letterSpacing: '0.6px', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9'
                      }}>
                        3. Quyết Toán Tài Chính Theo Biểu Phí Áp Dụng
                      </div>

                      <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
                        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', marginBottom: '10px'
                      }}>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '11.5px', display: 'block' }}>Tổng giá trị đơn</span>
                          <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                            {Number(selectedBooking.total_amount || 0).toLocaleString('vi-VN')} ₫
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '11.5px', display: 'block' }}>Thời điểm tiếp nhận</span>
                          <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                            Trước ngày đi {policy.days} ngày
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '11.5px', display: 'block' }}>
                            {counterRequestType === 'Cancel' ? 'Tỷ lệ khấu trừ' : 'Phí đổi lịch'}
                          </span>
                          <strong style={{ fontSize: '13.5px', color: policy.feePercent > 0 ? '#dc2626' : '#16a34a' }}>
                            {policy.feePercent}% ({policy.feeAmt.toLocaleString('vi-VN')} ₫)
                          </strong>
                        </div>
                      </div>

                      {/* KHỐI NỔI BẬT: SỐ TIỀN HOÀN LẠI / PHỤ THU */}
                      <div style={{
                        backgroundColor: counterRequestType === 'Cancel' ? '#f0fdf4' : '#eff6ff',
                        border: `1px solid ${counterRequestType === 'Cancel' ? '#bbf7d0' : '#bfdbfe'}`,
                        borderRadius: '8px',
                        padding: '14px 18px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <span style={{
                            fontSize: '12px', fontWeight: '700', color: counterRequestType === 'Cancel' ? '#166534' : '#1d4ed8',
                            textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block'
                          }}>
                            {counterRequestType === 'Cancel' ? 'Số tiền hoàn lại cho khách hàng' : 'Phí phụ thu đổi lịch khởi hành'}
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                            {counterRequestType === 'Cancel'
                              ? (policy.isPaid ? 'Chi tiền mặt trực tiếp tại quầy hoặc thực hiện lệnh chuyển khoản' : 'Đơn chưa thanh toán - hủy miễn phí 0 ₫')
                              : (policy.feeAmt > 0 ? 'Thu phí trực tiếp từ khách hàng khi xác nhận đổi lịch' : 'Miễn phí đổi lịch')}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '22px', fontWeight: '700', color: counterRequestType === 'Cancel' ? '#15803d' : '#2563eb'
                        }}>
                          {counterRequestType === 'Cancel'
                            ? `${policy.refundAmt.toLocaleString('vi-VN')} ₫`
                            : (policy.feeAmt > 0 ? `${policy.feeAmt.toLocaleString('vi-VN')} ₫` : 'Miễn phí (0 ₫)')}
                        </div>
                      </div>
                    </div>

                    {/* 4. CHI TIẾT NGHIỆP VỤ (HÌNH THỨC HOÀN TIỀN HOẶC CHỌN ĐỢT MỚI) */}
                    {counterRequestType === 'Cancel' ? (
                      <div>
                        <div style={{
                          fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase',
                          letterSpacing: '0.6px', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9'
                        }}>
                          4. Phương Thức Chi Tiền Hoàn Trả
                        </div>

                        <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer', fontWeight: '600', color: '#334155' }}>
                            <input
                              type="radio"
                              name="refundMethod"
                              checked={counterRefundMethod === 'Cash'}
                              onChange={() => setCounterRefundMethod('Cash')}
                            />
                            Chi tiền mặt trực tiếp tại quầy
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer', fontWeight: '600', color: '#334155' }}>
                            <input
                              type="radio"
                              name="refundMethod"
                              checked={counterRefundMethod === 'Bank'}
                              onChange={() => setCounterRefundMethod('Bank')}
                            />
                            Chuyển khoản qua ngân hàng
                          </label>
                        </div>

                        {counterRefundMethod === 'Bank' ? (
                          <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
                            background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0'
                          }}>
                            <div>
                              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Ngân hàng *</label>
                              <input
                                type="text"
                                placeholder="VD: Vietcombank, MB Bank..."
                                value={counterBankInfo.bankName}
                                onChange={(e) => setCounterBankInfo({ ...counterBankInfo, bankName: e.target.value })}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Số tài khoản *</label>
                              <input
                                type="text"
                                placeholder="Nhập số tài khoản..."
                                value={counterBankInfo.accountNumber}
                                onChange={(e) => setCounterBankInfo({ ...counterBankInfo, accountNumber: e.target.value })}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Chủ tài khoản *</label>
                              <input
                                type="text"
                                placeholder="Họ và tên chủ thẻ..."
                                value={counterBankInfo.accountHolder}
                                onChange={(e) => setCounterBankInfo({ ...counterBankInfo, accountHolder: e.target.value })}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12.5px', color: '#475569' }}>
                            Nhân viên chi trả trực tiếp {policy.refundAmt.toLocaleString('vi-VN')} ₫ tiền mặt cho khách hàng tại quầy và lưu phiếu thu chi vào sổ quỹ.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div style={{
                          fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase',
                          letterSpacing: '0.6px', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9'
                        }}>
                          4. Chọn Đợt Khởi Hành Mới
                        </div>

                        {loadingDepartures ? (
                          <div style={{ padding: '12px', fontSize: '13px', color: '#64748b' }}>Đang tải danh sách đợt khởi hành...</div>
                        ) : tourDepartures.length === 0 ? (
                          <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '13px', color: '#b91c1c' }}>
                            Không tìm thấy đợt khởi hành nào khác còn đủ chỗ trống cho tour này. Vui lòng liên hệ bộ phận điều hành để bổ sung lịch khởi hành.
                          </div>
                        ) : (
                          <div>
                            <select
                              value={counterNewDepartureId}
                              onChange={(e) => setCounterNewDepartureId(e.target.value)}
                              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none' }}
                            >
                              <option value="">-- Chọn đợt khởi hành muốn chuyển sang --</option>
                              {tourDepartures.map(d => (
                                <option key={d.departure_id} value={d.departure_id}>
                                  Khởi hành: {new Date(d.departure_date).toLocaleDateString('vi-VN')} - Trở về: {d.return_date ? new Date(d.return_date).toLocaleDateString('vi-VN') : 'N/A'} (Còn {d.available_slots} chỗ trống)
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 5. LÝ DO & GHI CHÚ NHÂN VIÊN */}
                    <div>
                      <div style={{
                        fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase',
                        letterSpacing: '0.6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9'
                      }}>
                        5. Lý Do Của Khách Hàng & Ghi Chú Tiếp Nhận
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '12.5px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                            Lý do hủy / đổi lịch của khách hàng *
                          </label>
                          <input
                            type="text"
                            placeholder="Nhập lý do khách báo (VD: Khách bận việc gia đình, đổi lịch công tác...)"
                            value={counterReason}
                            onChange={(e) => setCounterReason(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12.5px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                            Ghi chú nội bộ / Kế toán (tùy chọn)
                          </label>
                          <input
                            type="text"
                            placeholder="Ghi chú thêm về chứng từ, phiếu chi hoặc chỉ đạo quản lý..."
                            value={counterStaffNote}
                            onChange={(e) => setCounterStaffNote(e.target.value)}
                            style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                    </div>

                  </>
                )}

              </div>

              {/* MODAL FOOTER BUTTONS */}
              <div style={{
                padding: '16px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc',
                display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center'
              }}>
                <button
                  type="button"
                  onClick={() => setShowCounterModal(false)}
                  style={{
                    padding: '8px 18px', backgroundColor: '#ffffff', color: '#475569',
                    border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer',
                    fontWeight: '600', fontSize: '13.5px'
                  }}
                >
                  Đóng
                </button>

                {selectedBooking && (
                  <>
                    <button
                      type="button"
                      disabled={isSubmittingCounter}
                      onClick={() => handleSubmitCounter(false)}
                      style={{
                        padding: '8px 18px', backgroundColor: '#ffffff', color: '#0f172a',
                        border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer',
                        fontWeight: '600', fontSize: '13.5px'
                      }}
                    >
                      {isSubmittingCounter ? 'Đang lưu...' : 'Tạo yêu cầu (Chờ duyệt)'}
                    </button>

                    <button
                      type="button"
                      disabled={isSubmittingCounter}
                      onClick={() => handleSubmitCounter(true)}
                      style={{
                        padding: '8px 22px',
                        backgroundColor: counterRequestType === 'Cancel' ? '#0f172a' : '#0284c7',
                        color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer',
                        fontWeight: '600', fontSize: '13.5px'
                      }}
                    >
                      {isSubmittingCounter ? 'Đang xử lý...' : (counterRequestType === 'Cancel' ? 'Xác nhận & Quyết toán ngay' : 'Xác nhận & Đổi lịch ngay')}
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* FORM MODAL: XỬ LÝ YÊU CẦU QUYẾT TOÁN TÀI CHÍNH (CHUẨN ERP)               */}
      {/* ========================================================================= */}
      {selectedReq && (() => {
        const bankInfo = extractBankInfo(selectedReq.reason);
        const detailedStatus = getDetailedStatus(selectedReq);
        const isCancel = selectedReq.request_type === 'Cancel';
        const isPending = selectedReq.status === 'Pending';
        const isApproved = selectedReq.status === 'Approved';

        return (
          <div style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            backgroundColor: 'rgba(15, 23, 42, 0.6)', 
            backdropFilter: 'blur(4px)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            zIndex: 1000, padding: '16px' 
          }}>
            <div style={{ 
              backgroundColor: '#ffffff', 
              borderRadius: '12px', 
              width: '680px', 
              maxWidth: '100%', 
              maxHeight: '92vh', 
              display: 'flex', 
              flexDirection: 'column', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', 
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}>
              {/* MODAL HEADER */}
              <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', 
                padding: '20px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' 
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                      Xử Lý Yêu Cầu Quyết Toán Tài Chính
                    </h2>
                    <span style={{ 
                      fontSize: '12px', fontWeight: '600', padding: '3px 8px', borderRadius: '4px',
                      backgroundColor: detailedStatus.bg, color: detailedStatus.color, border: `1px solid ${detailedStatus.border}` 
                    }}>
                      {detailedStatus.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                    Yêu cầu #{selectedReq.change_id} &bull; Đơn hàng #{selectedReq.booking_id} &bull; {selectedReq.tour_name}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReq(null)}
                  title="Đóng cửa sổ"
                  style={{ 
                    background: 'transparent', border: 'none', color: '#94a3b8', 
                    fontSize: '18px', cursor: 'pointer', padding: '4px', lineHeight: 1 
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  ✕
                </button>
              </div>

              {/* MODAL BODY (SCROLLABLE) */}
              <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                
                {/* 1. THÔNG TIN YÊU CẦU */}
                <div>
                  <div style={{ 
                    fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', 
                    letterSpacing: '0.6px', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' 
                  }}>
                    1. Thông Tin Yêu Cầu
                  </div>

                  <div style={{ 
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', 
                    fontSize: '13.5px', marginBottom: '10px' 
                  }}>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Khách hàng:</span>
                      <strong style={{ color: '#0f172a' }}>{selectedReq.customer_name}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Số điện thoại:</span>
                      <strong style={{ color: '#0f172a' }}>{selectedReq.customer_phone || 'Chưa cung cấp'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Loại yêu cầu:</span>
                      <strong style={{ color: isCancel ? '#dc2626' : '#2563eb' }}>
                        {isCancel ? 'Hủy tour & Quyết toán hoàn tiền' : 'Đổi lịch khởi hành'}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Ngày khởi hành hiện tại:</span>
                      <strong style={{ color: '#0f172a' }}>
                        {selectedReq.current_departure_date ? new Date(selectedReq.current_departure_date).toLocaleDateString('vi-VN') : 'N/A'}
                      </strong>
                    </div>
                  </div>

                  {selectedReq.request_type === 'Reschedule' && (
                    <div style={{ background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', padding: '14px 16px', marginBottom: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e40af', marginBottom: '6px' }}>
                        📅 Lịch Trình Khởi Hành Xác Nhận Chuyển Sang:
                      </div>
                      {selectedReq.requested_departure_date && (
                        <div style={{ fontSize: '12.5px', color: '#1d4ed8', marginBottom: '8px' }}>
                          Khách hàng đề xuất: <strong>{new Date(selectedReq.requested_departure_date).toLocaleDateString('vi-VN')}</strong>
                        </div>
                      )}
                      {isPending ? (
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>
                            Đợt khởi hành xác nhận chuyển sang: *
                          </label>
                          {loadingReviewDeps ? (
                            <div style={{ fontSize: '12px', color: '#64748b' }}>Đang tải danh sách đợt khởi hành...</div>
                          ) : reviewDepartures.length === 0 ? (
                            <div style={{ fontSize: '12px', color: '#b91c1c' }}>Tour này hiện chưa có đợt khởi hành mở bán khác còn đủ chỗ.</div>
                          ) : (
                            <select
                              value={selectedNewDepForReview}
                              onChange={(e) => setSelectedNewDepForReview(e.target.value)}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                            >
                              <option value="">-- Chọn đợt khởi hành mới --</option>
                              {reviewDepartures.map(d => (
                                <option key={d.departure_id} value={d.departure_id}>
                                  {new Date(d.departure_date).toLocaleDateString('vi-VN')} - Về: {d.return_date ? new Date(d.return_date).toLocaleDateString('vi-VN') : 'N/A'} (Còn {d.available_slots} chỗ trống)
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: '13px', color: '#0f172a' }}>
                          Đợt khởi hành mới: <strong>{selectedReq.requested_departure_date ? new Date(selectedReq.requested_departure_date).toLocaleDateString('vi-VN') : 'N/A'}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>Lý do của khách hàng: </span>
                    <span style={{ color: '#334155' }}>{selectedReq.reason || 'Không có ghi chú thêm.'}</span>
                  </div>
                </div>

                {/* 2. THÔNG TIN HOÀN TIỀN (NGÂN HÀNG) */}
                {isCancel && (
                  <div>
                    <div style={{ 
                      fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', 
                      letterSpacing: '0.6px', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span>2. Thông Tin Tài Khoản Hoàn Tiền</span>
                      {bankInfo && (
                        <button
                          type="button"
                          onClick={() => handleCopyAccountNumber(bankInfo.accountNumber)}
                          style={{ 
                            padding: '3px 8px', fontSize: '11.5px', background: copySuccess ? '#dcfce7' : '#f1f5f9', 
                            color: copySuccess ? '#15803d' : '#334155', border: '1px solid #cbd5e1', 
                            borderRadius: '4px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.15s ease' 
                          }}
                        >
                          {copySuccess ? 'Đã sao chép' : 'Sao chép STK'}
                        </button>
                      )}
                    </div>

                    {bankInfo ? (
                      <div style={{ 
                        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px',
                        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px'
                      }}>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '11.5px', display: 'block', textTransform: 'uppercase' }}>Ngân hàng</span>
                          <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{bankInfo.bankName}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '11.5px', display: 'block', textTransform: 'uppercase' }}>Số tài khoản</span>
                          <strong style={{ fontSize: '14px', color: '#0284c7', fontFamily: 'monospace' }}>{bankInfo.accountNumber}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '11.5px', display: 'block', textTransform: 'uppercase' }}>Chủ tài khoản</span>
                          <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{bankInfo.accountHolder}</strong>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b' }}>
                        Khách hàng chưa cung cấp thông tin tài khoản ngân hàng trong nội dung yêu cầu. Vui lòng liên hệ số điện thoại khách hàng để xác nhận trước khi thực hiện chuyển tiền hoàn lại.
                      </div>
                    )}
                  </div>
                )}

                {/* 3. CHI TIẾT QUYẾT TOÁN TÀI CHÍNH */}
                <div>
                  <div style={{ 
                    fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', 
                    letterSpacing: '0.6px', marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' 
                  }}>
                    3. Chi Tiết Quyết Toán Tài Chính
                  </div>

                  {/* THÔNG SỐ ĐỐI SOÁT */}
                  <div style={{ 
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', 
                    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 16px', marginBottom: '12px' 
                  }}>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Tổng giá trị đơn hàng</span>
                      <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                        {Number(selectedReq.total_amount || 0).toLocaleString('vi-VN')} ₫
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Thời điểm tiếp nhận</span>
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                        Trước ngày đi {selectedReq.days_before_departure != null ? selectedReq.days_before_departure : 0} ngày
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>
                        Phí khấu trừ ({Number(selectedReq.fee_percentage || 0)}%)
                      </span>
                      <strong style={{ fontSize: '14px', color: '#dc2626' }}>
                        -{Number(selectedReq.fee_amount || 0).toLocaleString('vi-VN')} ₫
                      </strong>
                    </div>
                  </div>

                  {/* KHỐI NỔI BẬT: SỐ TIỀN THỰC HOÀN */}
                  <div style={{ 
                    backgroundColor: isCancel ? '#f0fdf4' : '#eff6ff', 
                    border: `1px solid ${isCancel ? '#bbf7d0' : '#bfdbfe'}`, 
                    borderRadius: '8px', 
                    padding: '16px 20px', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <div>
                      <span style={{ 
                        fontSize: '12px', fontWeight: '700', color: isCancel ? '#166534' : '#1d4ed8', 
                        textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' 
                      }}>
                        {isCancel ? 'Số tiền thực hoàn trả cho khách hàng' : 'Phí phụ thu đổi lịch khởi hành'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                        {isCancel ? 'Kế toán thực hiện lệnh chuyển khoản sau khi phê duyệt quyết toán' : 'Khách hàng thanh toán phụ thu (nếu có)'}
                      </span>
                    </div>

                    <div style={{ 
                      fontSize: '24px', fontWeight: '700', color: isCancel ? '#15803d' : '#2563eb',
                      fontFamily: "'Segoe UI', Roboto, sans-serif"
                    }}>
                      {isCancel 
                        ? `${Number(selectedReq.refund_amount || 0).toLocaleString('vi-VN')} ₫`
                        : (Number(selectedReq.fee_amount || 0) > 0 ? `${Number(selectedReq.fee_amount || 0).toLocaleString('vi-VN')} ₫` : 'Miễn phí (0 ₫)')
                      }
                    </div>
                  </div>

                  {/* ACCORDION ĐỐI SOÁT QUY ĐỊNH */}
                  <div style={{ marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setShowPolicyTable(!showPolicyTable)}
                      style={{ 
                        background: 'transparent', border: 'none', color: '#0284c7', 
                        fontSize: '12.5px', fontWeight: '600', cursor: 'pointer', padding: '4px 0' 
                      }}
                    >
                      {showPolicyTable ? 'Thu gọn bảng quy định tính phí' : 'Xem bảng quy định tính phí đối soát'}
                    </button>

                    {showPolicyTable && (
                      <div style={{ marginTop: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden', fontSize: '12.5px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0', fontWeight: '600' }}>
                              <th style={{ padding: '8px 12px' }}>Thời Điểm Hủy</th>
                              <th style={{ padding: '8px 12px' }}>Tỷ Lệ Khấu Trừ</th>
                              <th style={{ padding: '8px 12px' }}>Tỷ Lệ Hoàn Lại</th>
                              <th style={{ padding: '8px 12px' }}>Phí Đổi Lịch</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '6px 12px' }}>Trước ≥ 30 ngày</td><td>10%</td><td style={{ color: '#15803d', fontWeight: '600' }}>Hoàn 90%</td><td>Miễn phí (0%)</td></tr>
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '6px 12px' }}>Từ 15 – 29 ngày</td><td>30%</td><td style={{ color: '#15803d', fontWeight: '600' }}>Hoàn 70%</td><td>10%</td></tr>
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '6px 12px' }}>Từ 7 – 14 ngày</td><td>50%</td><td style={{ color: '#15803d', fontWeight: '600' }}>Hoàn 50%</td><td>20%</td></tr>
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '6px 12px' }}>Từ 3 – 6 ngày</td><td>75%</td><td style={{ color: '#15803d', fontWeight: '600' }}>Hoàn 25%</td><td>40%</td></tr>
                            <tr><td style={{ padding: '6px 12px' }}>Dưới 3 ngày (&lt; 72 giờ)</td><td style={{ color: '#b91c1c', fontWeight: '600' }}>100%</td><td style={{ color: '#b91c1c', fontWeight: '600' }}>Không hoàn</td><td>Không áp dụng đổi</td></tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. GHI CHÚ XỬ LÝ & PHẢN HỒI */}
                <div>
                  <div style={{ 
                    fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', 
                    letterSpacing: '0.6px', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' 
                  }}>
                    4. Ghi Chú Xử Lý & Nội Dung Phản Hồi
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Nhập ghi chú xử lý hoàn tiền hoặc lý do từ chối gửi tới khách hàng..."
                    value={staffNote}
                    onChange={(e) => setStaffNote(e.target.value)}
                    disabled={!isPending && !isApproved}
                    style={{ 
                      width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', 
                      fontSize: '13.5px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                      backgroundColor: !isPending && !isApproved ? '#f8fafc' : '#ffffff'
                    }}
                  />

                  {isCancel && isPending && (
                    <div style={{ 
                      marginTop: '8px', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', 
                      borderRadius: '6px', fontSize: '12.5px', color: '#475569', lineHeight: '1.5' 
                    }}>
                      Lưu ý nghiệp vụ: Khi xác nhận quyết toán, hệ thống sẽ tự động cập nhật đơn hàng sang trạng thái <strong>ĐÃ HỦY</strong>, hoàn trả lại số chỗ cho tour và <strong>vô hiệu hóa toàn bộ mã QR Code check-in</strong> của vé.
                    </div>
                  )}
                </div>

              </div>

              {/* MODAL FOOTER BUTTONS */}
              <div style={{ 
                padding: '16px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', 
                display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' 
              }}>
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  style={{ 
                    padding: '8px 18px', backgroundColor: '#ffffff', color: '#475569', 
                    border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', 
                    fontWeight: '600', fontSize: '13.5px', transition: 'all 0.15s ease' 
                  }}
                >
                  Đóng
                </button>

                {isPending && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Xác nhận từ chối yêu cầu của khách hàng ${selectedReq.customer_name}?`)) {
                          handleProcess('Rejected');
                        }
                      }}
                      disabled={isSubmitting}
                      style={{ 
                        padding: '8px 18px', backgroundColor: '#ffffff', color: '#dc2626', 
                        border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', 
                        fontWeight: '600', fontSize: '13.5px', transition: 'all 0.15s ease' 
                      }}
                    >
                      {isSubmitting ? 'Đang xử lý...' : 'Từ chối yêu cầu'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!isCancel && !selectedNewDepForReview && !selectedReq.new_departure_id) {
                          alert("Vui lòng chọn đợt khởi hành mới muốn chuyển sang trước khi phê duyệt!");
                          return;
                        }
                        const confirmMsg = isCancel
                          ? `Xác nhận phê duyệt hủy đơn hàng #${selectedReq.booking_id} và hoàn trả ${Number(selectedReq.refund_amount || 0).toLocaleString('vi-VN')} ₫ cho khách hàng ${selectedReq.customer_name}?`
                          : `Xác nhận phê duyệt đổi lịch đơn hàng #${selectedReq.booking_id} sang đợt khởi hành mới?`;
                        if (window.confirm(confirmMsg)) {
                          handleProcess('Approved', undefined, selectedNewDepForReview);
                        }
                      }}
                      disabled={isSubmitting}
                      style={{ 
                        padding: '8px 22px', backgroundColor: '#0f172a', color: '#ffffff', 
                        border: 'none', borderRadius: '6px', cursor: 'pointer', 
                        fontWeight: '600', fontSize: '13.5px', transition: 'all 0.15s ease' 
                      }}
                    >
                      {isSubmitting ? 'Đang xử lý...' : (isCancel ? 'Xác nhận quyết toán' : 'Xác nhận duyệt đổi lịch')}
                    </button>
                  </>
                )}

                {isApproved && isCancel && selectedReq.payment_status !== 'Refunded' && (
                  <button
                    type="button"
                    onClick={() => {
                      const noteText = staffNote.includes('đã hoàn tiền') 
                        ? staffNote 
                        : `${staffNote ? staffNote + '. ' : ''}Kế toán đã hoàn tiền chuyển khoản thành công ${Number(selectedReq.refund_amount || 0).toLocaleString('vi-VN')} ₫.`;
                      handleProcess('Approved', noteText);
                    }}
                    disabled={isSubmitting}
                    style={{ 
                      padding: '8px 20px', backgroundColor: '#047857', color: '#ffffff', 
                      border: 'none', borderRadius: '6px', cursor: 'pointer', 
                      fontWeight: '600', fontSize: '13.5px' 
                    }}
                  >
                    {isSubmitting ? 'Đang lưu...' : 'Hoàn tất xử lý (Đã chuyển tiền)'}
                  </button>
                )}
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default StaffChangeRequestManager;

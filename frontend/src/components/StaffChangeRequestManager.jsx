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

  const handleProcess = async (status, customNote) => {
    if (!selectedReq) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${GATEWAY_URL}/api/bookings/admin/change-requests/${selectedReq.change_id}/process`, {
        status,
        staff_note: customNote !== undefined ? customNote : staffNote
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
        <button 
          onClick={fetchRequests} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', 
            backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', 
            cursor: 'pointer', fontWeight: '600', fontSize: '13.5px', transition: 'all 0.2s ease'
          }}
        >
          Làm mới
        </button>
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

                  {selectedReq.request_type === 'Reschedule' && selectedReq.requested_departure_date && (
                    <div style={{ 
                      padding: '8px 12px', background: '#eff6ff', borderRadius: '6px', fontSize: '13px', 
                      color: '#1d4ed8', border: '1px solid #dbeafe', marginBottom: '10px' 
                    }}>
                      Ngày khách hàng đề xuất chuyển sang: <strong>{new Date(selectedReq.requested_departure_date).toLocaleDateString('vi-VN')}</strong>
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
                        const confirmMsg = isCancel
                          ? `Xác nhận phê duyệt hủy đơn hàng #${selectedReq.booking_id} và hoàn trả ${Number(selectedReq.refund_amount || 0).toLocaleString('vi-VN')} ₫ cho khách hàng ${selectedReq.customer_name}?`
                          : `Xác nhận phê duyệt đổi lịch đơn hàng #${selectedReq.booking_id}?`;
                        if (window.confirm(confirmMsg)) {
                          handleProcess('Approved');
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

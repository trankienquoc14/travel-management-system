import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GeneralOverview = () => {
  const [activeSubTab, setActiveSubTab] = useState('tour_reports'); // 'tour_reports', 'revenue', 'hr_stats', 'incidents', 'partners'
  const [loading, setLoading] = useState(true);

  // Dữ liệu Báo cáo Vận hành Tour & HDV
  const [allTripReports, setAllTripReports] = useState([]);
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('all');

  // Dữ liệu Thống kê Sự cố
  const [incidents, setIncidents] = useState([]);

  // Dữ liệu Thống kê Doanh thu & Booking
  const [bookingStats, setBookingStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    paidAmount: 0,
    pendingAmount: 0
  });

  // Dữ liệu Nhân sự & Chấm công
  const [hrStats, setHrStats] = useState({
    totalEmployees: 0,
    leaveRequestsPending: 0,
    leaveRequestsApproved: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 1. Tải danh sách Báo cáo Chuyến đi HDV từ hr-service (port 5000/5004)
      const resReports = await axios.get('http://localhost:5000/api/guide/all-reports', { headers }).catch(() => null);
      if (resReports && resReports.data && resReports.data.success) {
        setAllTripReports(resReports.data.data || []);
      }

      // 2. Tải danh sách sự cố
      const resIncidents = await axios.get('http://localhost:5000/api/guide/incidents/all', { headers }).catch(() => null);
      if (resIncidents && resIncidents.data && resIncidents.data.success) {
        setIncidents(resIncidents.data.data || []);
      }

      // 3. Tải danh sách Booking & Doanh thu từ booking-service
      const resBookings = await axios.get('http://localhost:5000/api/bookings', { headers }).catch(() => null);
      if (resBookings && resBookings.data && resBookings.data.success) {
        const bookingsList = resBookings.data.data || [];
        const revenue = bookingsList.reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0);
        const paid = bookingsList.reduce((sum, b) => sum + (parseFloat(b.paid_amount) || 0), 0);
        setBookingStats({
          totalBookings: bookingsList.length,
          totalRevenue: revenue,
          paidAmount: paid,
          pendingAmount: Math.max(0, revenue - paid)
        });
      }

      // 4. Tải thống kê Nhân sự & Đơn xin nghỉ phép
      const resLeaves = await axios.get('http://localhost:5000/api/hr/leave-requests', { headers }).catch(() => null);
      if (resLeaves && resLeaves.data && resLeaves.data.success) {
        const leaves = resLeaves.data.data || [];
        setHrStats(prev => ({
          ...prev,
          leaveRequestsPending: leaves.filter(l => l.status === 'Pending').length,
          leaveRequestsApproved: leaves.filter(l => l.status === 'Approved').length
        }));
      }

    } catch (error) {
      console.error('Lỗi tải dữ liệu tổng quan báo cáo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReport = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:5000/api/guide/reports/${reportId}/approve`, {
        admin_note: 'Đã phê duyệt hoàn tất chuyến đi từ Trung tâm Báo cáo Tổng quan.'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        alert(res.data.message);
        fetchData();
      }
    } catch (err) {
      alert('Lỗi phê duyệt: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  return (
    <div style={{ padding: '0px', background: '#f8fafc', minHeight: '85vh', fontFamily: "'Inter', sans-serif" }}>
      
      {/* 🚀 BANNER HEADER TRUNG TÂM BÁO CÁO TỔNG QUAN */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        color: '#ffffff',
        padding: '24px 28px',
        borderRadius: '16px',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)'
      }}>
        <div style={{ fontSize: '12px', fontWeight: '800', color: '#38bdf8', letterSpacing: '1px', textTransform: 'uppercase' }}>
          📊 TRUNG TÂM DỮ LIỆU & BÁO CÁO TỔNG QUAN VIETTRAVEL ERP
        </div>
        <h2 style={{ margin: '6px 0 4px 0', fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>
          📊 Tổng Quan Báo Cáo & Thống Kê Toàn Hệ Thống
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', opacity: 0.9 }}>
          Tập trung quản lý báo cáo vận hành tour, kết quả doanh thu, tình hình nhân sự, xử lý sự cố và chất lượng đối tác.
        </p>
      </div>

      {/* 📍 THANH CHUYỂN MỤC BÁO CÁO TẬP TRUNG (5 SUB-TABS CHUYÊN NGHIỆP) */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        padding: '6px',
        marginBottom: '24px',
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        <button
          onClick={() => setActiveSubTab('tour_reports')}
          style={{
            flex: 1, minWidth: '180px', padding: '12px 16px', border: 'none', borderRadius: '10px',
            fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease',
            background: activeSubTab === 'tour_reports' ? '#1e3a8a' : 'transparent',
            color: activeSubTab === 'tour_reports' ? '#ffffff' : '#475569'
          }}
        >
          🚩 1. Báo Cáo Tour HDV Hoàn Thành ({allTripReports.length})
        </button>

        <button
          onClick={() => setActiveSubTab('revenue')}
          style={{
            flex: 1, minWidth: '180px', padding: '12px 16px', border: 'none', borderRadius: '10px',
            fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease',
            background: activeSubTab === 'revenue' ? '#1e3a8a' : 'transparent',
            color: activeSubTab === 'revenue' ? '#ffffff' : '#475569'
          }}
        >
          📈 2. Doanh Thu & Booking
        </button>

        <button
          onClick={() => setActiveSubTab('hr_stats')}
          style={{
            flex: 1, minWidth: '180px', padding: '12px 16px', border: 'none', borderRadius: '10px',
            fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease',
            background: activeSubTab === 'hr_stats' ? '#1e3a8a' : 'transparent',
            color: activeSubTab === 'hr_stats' ? '#ffffff' : '#475569'
          }}
        >
          👥 3. Nhân Sự & Nghỉ Phép
        </button>

        <button
          onClick={() => setActiveSubTab('incidents')}
          style={{
            flex: 1, minWidth: '180px', padding: '12px 16px', border: 'none', borderRadius: '10px',
            fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease',
            background: activeSubTab === 'incidents' ? '#1e3a8a' : 'transparent',
            color: activeSubTab === 'incidents' ? '#ffffff' : '#475569'
          }}
        >
          🚨 4. Nhật Ký Sự Cố ({incidents.length})
        </button>

        <button
          onClick={() => setActiveSubTab('partners')}
          style={{
            flex: 1, minWidth: '180px', padding: '12px 16px', border: 'none', borderRadius: '10px',
            fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease',
            background: activeSubTab === 'partners' ? '#1e3a8a' : 'transparent',
            color: activeSubTab === 'partners' ? '#ffffff' : '#475569'
          }}
        >
          ⭐ 5. Chất Lượng Đối Tác
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #1e3a8a', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          Đang tổng hợp dữ liệu báo cáo hệ thống...
        </div>
      ) : (
        <div>
          {/* ========================================================= */}
          {/* MỤC 1: BÁO CÁO TOUR HDV ĐÃ HOÀN THÀNH (TỜ KHAI THỰC TẾ)    */}
          {/* ========================================================= */}
          {activeSubTab === 'tour_reports' && (
            <div>
              {/* KPIS CARDS THỐNG KÊ TOUR HOÀN THÀNH */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#fff', border: '1px solid #bae6fd', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#0284c7' }}>🚀 TOUR ĐÃ HOÀN THÀNH</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginTop: '6px' }}>{allTripReports.length} chuyến</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Báo cáo dẫn đoàn thực tế</div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #bbf7d0', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#15803d' }}>👤 HDV DẪN ĐOÀN</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#166534', marginTop: '6px' }}>
                    {new Set(allTripReports.map(r => r.guide_id)).size} nhân sự
                  </div>
                  <div style={{ fontSize: '11px', color: '#16532d', marginTop: '4px' }}>HDV hoàn tất tour</div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>👥 KHÁCH HÀNG ĐIỂM DANH</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginTop: '6px' }}>
                    {allTripReports.reduce((s, r) => s + (parseInt(r.checked_in_passengers) || 0), 0)} khách
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Tổng lượt khách thực tế</div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #e9d5ff', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#6b21a8' }}>🌟 ĐÁNH GIÁ CHẤT LƯỢNG CAO</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#581c87', marginTop: '6px' }}>
                    {allTripReports.length > 0 ? Math.round((allTripReports.filter(r => ['Xuất sắc', 'Tốt'].includes(r.overall_rating)).length / allTripReports.length) * 100) : 100}%
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b21a8', marginTop: '4px' }}>Xếp loại Xuất sắc & Tốt</div>
                </div>
              </div>

              {/* BỘ LỌC TÌM KIẾM THEO HDV HOẶC XẾP LOẠI */}
              <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="🔍 Tìm kiếm theo tên Tour, Hướng dẫn viên làm việc..."
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', width: '320px' }}
                />

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setReportStatusFilter('all')}
                    style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: reportStatusFilter === 'all' ? '#0f172a' : '#fff', color: reportStatusFilter === 'all' ? '#fff' : '#475569', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Tất cả ({allTripReports.length})
                  </button>
                  <button
                    onClick={() => setReportStatusFilter('excellent')}
                    style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #86efac', background: reportStatusFilter === 'excellent' ? '#166534' : '#fff', color: reportStatusFilter === 'excellent' ? '#fff' : '#15803d', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    🌟 Xuất sắc ({allTripReports.filter(r => r.overall_rating === 'Xuất sắc').length})
                  </button>
                  <button
                    onClick={() => setReportStatusFilter('good')}
                    style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #bae6fd', background: reportStatusFilter === 'good' ? '#0284c7' : '#fff', color: reportStatusFilter === 'good' ? '#fff' : '#0369a1', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    👍 Tốt ({allTripReports.filter(r => r.overall_rating === 'Tốt').length})
                  </button>
                </div>
              </div>

              {/* DANH SÁCH CHI TIẾT BÁO CÁO TOUR HOÀN THÀNH */}
              {allTripReports.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                  Chưa có báo cáo chuyến đi nào được nộp.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {allTripReports
                    .filter(rp => {
                      const matchesQuery = rp.tour_name?.toLowerCase().includes(reportSearchQuery.toLowerCase()) || rp.guide_name?.toLowerCase().includes(reportSearchQuery.toLowerCase());
                      if (reportStatusFilter === 'excellent') return matchesQuery && rp.overall_rating === 'Xuất sắc';
                      if (reportStatusFilter === 'good') return matchesQuery && rp.overall_rating === 'Tốt';
                      return matchesQuery;
                    })
                    .map((rp) => (
                      <div key={rp.report_id} style={{ border: '1px solid #cbd5e1', borderRadius: '14px', padding: '22px', background: '#fff', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                        
                        {/* THÔNG TIN CHUYẾN ĐỊ & HDV PHỤ TRÁCH */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                              🚩 BÁO CÁO TOUR HOÀN THÀNH THỰC TẾ
                            </div>
                            <h4 style={{ margin: '4px 0 0 0', color: '#1e3a8a', fontSize: '18px', fontWeight: '800' }}>
                              {rp.tour_name} <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>(Đoàn #{rp.departure_id})</span>
                            </h4>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: '#334155', marginTop: '8px' }}>
                              <div>👤 <strong>HDV Phụ trách:</strong> <span style={{ color: '#1e3a8a', fontWeight: '700' }}>{rp.guide_name}</span> ({rp.guide_phone || 'SĐT: Đã lưu'})</div>
                              <div>📅 <strong>Thời gian khởi hành:</strong> <span style={{ fontWeight: '700' }}>{new Date(rp.departure_date).toLocaleDateString('vi-VN')}</span></div>
                              <div>📍 <strong>Điểm đến:</strong> <span style={{ fontWeight: '700' }}>{rp.destination}</span></div>
                            </div>
                          </div>

                          <div>
                            <span style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              ✅ ĐÃ HOÀN THÀNH TOUR
                            </span>
                          </div>
                        </div>

                        {/* THỐNG KÊ SĨ SỐ, SỰ CỐ VÀ ĐÁNH GIÁ CHẤT LƯỢNG TỔNG QUAN */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px', background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', marginBottom: '14px', border: '1px solid #e2e8f0' }}>
                          <div>👥 <strong>Sĩ số thực tế:</strong> <span style={{ color: '#0f172a', fontWeight: '700' }}>{rp.checked_in_passengers}/{rp.total_passengers} khách có mặt</span></div>
                          <div>🚨 <strong>Số sự cố phát sinh:</strong> <span style={{ color: rp.incident_count > 0 ? '#dc2626' : '#166534', fontWeight: '700' }}>{rp.incident_count} sự cố</span></div>
                          <div>⭐ <strong>Chất lượng tổng quan:</strong> <span style={{ color: '#0284c7', fontWeight: '800' }}>{rp.overall_rating}</span></div>
                        </div>

                        {/* CHI TIẾT ĐÁNH GIÁ DỊCH VỤ CÁC ĐỐI TÁC TRONG CHUYẾN ĐỊ */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: '12px', marginBottom: '14px' }}>
                          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px', borderRadius: '8px' }}>
                            <strong style={{ color: '#b45309' }}>🚌 Xe & Lái xe:</strong>
                            <p style={{ margin: '4px 0 0 0', color: '#78350f', lineHeight: '1.5' }}>{rp.vehicle_feedback || 'Xe đời mới, tài xế lái an toàn.'}</p>
                          </div>
                          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', padding: '12px', borderRadius: '8px' }}>
                            <strong style={{ color: '#0369a1' }}>🏨 Khách sạn lưu trú:</strong>
                            <p style={{ margin: '4px 0 0 0', color: '#0c4a6e', lineHeight: '1.5' }}>{rp.hotel_feedback || 'Khách sạn nhận phòng đúng giờ.'}</p>
                          </div>
                          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '8px' }}>
                            <strong style={{ color: '#15803d' }}>🍽️ Nhà hàng & Suất ăn:</strong>
                            <p style={{ margin: '4px 0 0 0', color: '#14532d', lineHeight: '1.5' }}>{rp.restaurant_feedback || 'Thức ăn ngon, phục vụ chu đáo.'}</p>
                          </div>
                        </div>

                        {/* GHI CHÚ VÀ NHẬN XÉT CỦA HDV */}
                        <div style={{ background: '#f1f5f9', borderLeft: '4px solid #0284c7', padding: '12px 16px', borderRadius: '6px', fontSize: '13px' }}>
                          <strong style={{ color: '#0f172a' }}>📝 Ghi chú & Nhận xét tổng kết chuyến đi của HDV {rp.guide_name}:</strong>
                          <p style={{ margin: '4px 0 0 0', color: '#334155', lineHeight: '1.6' }}>{rp.guide_notes}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* MỤC 2: BÁO CÁO DOANH THU & BOOKING                        */}
          {/* ========================================================= */}
          {activeSubTab === 'revenue' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#0284c7' }}>🛒 TỔNG SỐ BOOKING</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', marginTop: '6px' }}>{bookingStats.totalBookings} đơn</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Toàn hệ thống</div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #bae6fd', padding: '20px', borderRadius: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1' }}>💰 TỔNG DOANH THU BOOKING</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#0284c7', marginTop: '6px' }}>{formatVND(bookingStats.totalRevenue)}</div>
                  <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '4px' }}>Tổng giá trị tour đã bán</div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #bbf7d0', padding: '20px', borderRadius: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#15803d' }}>✅ ĐÃ THU TIỀN</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#166534', marginTop: '6px' }}>{formatVND(bookingStats.paidAmount)}</div>
                  <div style={{ fontSize: '11px', color: '#15803d', marginTop: '4px' }}>Đã thanh toán thực tế</div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #fde68a', padding: '20px', borderRadius: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#b45309' }}>⏳ CÒN PHẢI THU</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#92400e', marginTop: '6px' }}>{formatVND(bookingStats.pendingAmount)}</div>
                  <div style={{ fontSize: '11px', color: '#b45309', marginTop: '4px' }}>Cần tiếp tục thu hồi công nợ</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MỤC 3: BÁO CÁO NHÂN SỰ & NGHỈ PHÉP                         */}
          {/* ========================================================= */}
          {activeSubTab === 'hr_stats' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#fff', border: '1px solid #fde68a', padding: '20px', borderRadius: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#b45309' }}>⏳ ĐƠN NGHỈ PHÉP CHỜ DUYỆT</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#92400e', marginTop: '6px' }}>{hrStats.leaveRequestsPending} đơn</div>
                  <div style={{ fontSize: '11px', color: '#b45309', marginTop: '4px' }}>Cần HR / Admin xem xét</div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #bbf7d0', padding: '20px', borderRadius: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#15803d' }}>✅ ĐƠN NGHỈ PHÉP ĐÃ DUYỆT</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#166534', marginTop: '6px' }}>{hrStats.leaveRequestsApproved} đơn</div>
                  <div style={{ fontSize: '11px', color: '#15803d', marginTop: '4px' }}>Đã chấp thuận cho nghỉ</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MỤC 4: BÁO CÁO SỰ CỐ VẬN HÀNH TOUR                        */}
          {/* ========================================================= */}
          {activeSubTab === 'incidents' && (
            <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#991b1b' }}>
                🚨 Nhật Ký Báo Cáo Sự Cố Khẩn Cấp Của Các Đoàn
              </h4>

              {incidents.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '12px' }}>
                  Chưa ghi nhận sự cố nào phát sinh trong quá trình vận hành tour.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {incidents.map(inc => (
                    <div key={inc.incident_id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', background: inc.status === 'Resolved' ? '#f0fdf4' : '#fff8f8', borderLeft: `5px solid ${inc.status === 'Resolved' ? '#10b981' : '#dc2626'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <strong style={{ color: '#0f172a', fontSize: '14px' }}>🚨 {inc.title}</strong>
                        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', background: inc.status === 'Resolved' ? '#dcfce7' : '#fee2e2', color: inc.status === 'Resolved' ? '#15803d' : '#991b1b' }}>
                          {inc.status === 'Resolved' ? '✅ Đã xử lý' : '⏳ Đang xử lý'}
                        </span>
                      </div>
                      {inc.location && <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: '700', marginBottom: '4px' }}>📍 Vị trí: {inc.location}</div>}
                      <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#475569' }}>{inc.description}</p>
                      {inc.resolution_notes && (
                        <div style={{ background: '#fff', border: '1px dashed #bbf7d0', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', color: '#166534' }}>
                          💡 <strong>Ghi chú xử lý điều hành:</strong> {inc.resolution_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* MỤC 5: ĐÁNH GIÁ CHẤT LƯỢNG DỊCH VỤ ĐỐI TÁC                 */}
          {/* ========================================================= */}
          {activeSubTab === 'partners' && (
            <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                ⭐ Báo Cáo Chất Lượng Dịch Vụ Xe, Khách Sạn & Nhà Hàng Đối Tác
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {allTripReports.map(rp => (
                  <div key={rp.report_id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', background: '#f8fafc' }}>
                    <div style={{ fontWeight: '700', color: '#1e3a8a', fontSize: '14px', marginBottom: '8px' }}>
                      🚩 Tour: {rp.tour_name} (Đoàn #{rp.departure_id}) - HDV {rp.guide_name}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', fontSize: '12px' }}>
                      <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <strong>🚌 Xe & Lái xe:</strong>
                        <p style={{ margin: '4px 0 0 0', color: '#475569' }}>{rp.vehicle_feedback || 'Đạt yêu cầu'}</p>
                      </div>
                      <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <strong>🏨 Khách sạn lưu trú:</strong>
                        <p style={{ margin: '4px 0 0 0', color: '#475569' }}>{rp.hotel_feedback || 'Đạt yêu cầu'}</p>
                      </div>
                      <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                        <strong>🍽️ Nhà hàng & Suất ăn:</strong>
                        <p style={{ margin: '4px 0 0 0', color: '#475569' }}>{rp.restaurant_feedback || 'Đạt yêu cầu'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default GeneralOverview;

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Printer, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  FileText, 
  CreditCard,
  Building,
  ChevronRight,
  Filter,
  Eye,
  X
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import soundService from '../utils/soundService';
import { notifySuccess, notifyError } from '../context/NotificationContext';

const OfficeStaffDashboard = ({ onNavigateToOrders, onNavigateToChangeRequests }) => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month'); // 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const printableReportRef = useRef(null);

  // Lấy thông tin user hiện tại
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `http://localhost:5000/api/bookings/admin/staff-dashboard-stats?period=${period}`;
      if (period === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu dashboard nhân viên văn phòng:', err);
      notifyError('Lỗi tải dữ liệu', 'Không thể kết nối đến máy chủ thống kê!');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc!');
      return;
    }
    fetchDashboardData();
  };

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(amount || 0));
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return 'Hôm nay';
      case 'week': return '7 ngày gần nhất';
      case 'month': return '30 ngày qua (Tháng này)';
      case 'quarter': return 'Quý này (90 ngày qua)';
      case 'year': return 'Năm hiện tại (2026)';
      case 'custom': return `Từ ${startDate ? new Date(startDate).toLocaleDateString('vi-VN') : ''} đến ${endDate ? new Date(endDate).toLocaleDateString('vi-VN') : ''}`;
      default: return 'Toàn bộ thời gian';
    }
  };

  // Xuất file PDF chính thức bằng html2pdf
  const handleExportPDF = () => {
    const element = printableReportRef.current;
    if (!element) {
      alert('Không tìm thấy mẫu báo cáo để xuất!');
      return;
    }

    setIsExportingPdf(true);
    soundService.playSuccessChime();

    const opt = {
      margin: [8, 8, 8, 8],
      filename: `Bao-Cao-Kinh-Doanh-VietTravel-${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        setIsExportingPdf(false);
        notifySuccess('Xuất PDF thành công!', 'File báo cáo đã được tải về máy của bạn.');
      })
      .catch((err) => {
        console.error('Lỗi xuất PDF:', err);
        setIsExportingPdf(false);
        // Fallback mở hộp thoại in trình duyệt
        window.print();
      });
  };

  // In trực tiếp qua Print Dialog
  const handlePrint = () => {
    window.print();
  };

  const kpis = dashboardData?.kpis || {};
  const changeReqs = dashboardData?.changeRequests || {};
  const departures = dashboardData?.departures || [];
  const topTours = dashboardData?.topTours || [];
  const timeline = dashboardData?.timeline || [];
  const paymentMethods = dashboardData?.paymentMethods || [];
  const recentBookings = dashboardData?.recentBookings || [];

  // Mẫu văn bản báo cáo chính thức dùng cho cả Modal Xem Trước và Bản In / PDF
  const renderReportContent = () => (
    <div 
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '16mm 14mm',
        background: '#ffffff',
        color: '#0f172a',
        fontFamily: "'Times New Roman', Times, serif",
        boxSizing: 'border-box',
        margin: '0 auto',
        lineHeight: 1.4
      }}
    >
      {/* HEADER DOANH NGHIỆP */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            CÔNG TY CỔ PHẦN DU LỊCH & LỮ HÀNH VIETTRAVEL
          </div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
            Hệ thống Quản lý & Vận hành Doanh nghiệp Lữ hành (ERP)
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>
            Địa chỉ: Tòa nhà VietTravel Tower, 190 Pasteur, Quận 3, TP. Hồ Chí Minh
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
            MÃ BÁO CÁO: <span style={{ color: '#0284c7' }}>RP-{Date.now().toString().slice(-6)}</span>
          </div>
          <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>
            Ngày lập: {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>
            Bảo mật: Lưu hành nội bộ
          </div>
        </div>
      </div>

      {/* TIÊU ĐỀ BÁO CÁO CHÍNH THỨC */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', color: '#0f172a' }}>
          BÁO CÁO TỔNG HỢP HOẠT ĐỘNG KINH DOANH VÀ VẬN HÀNH TOUR DU LỊCH
        </h1>
        <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#334155' }}>
          Kỳ báo cáo: {getPeriodLabel()}
        </div>
        <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
          Người lập biểu: <strong>{currentUser.fullName || currentUser.full_name || 'Nhân viên Văn phòng'}</strong> ({currentUser.email || 'office@travel.com'})
        </div>
      </div>

      {/* 1. BẢNG TỔNG HỢP CHỈ TIÊU KINH DOANH */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '12.5px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 8px 0', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>
          I. BẢNG TỔNG HỢP CÁC CHỈ TIÊU KINH DOANH CHÍNH
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <tbody>
            <tr style={{ background: '#f8fafc' }}>
              <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold', width: '35%' }}>Tổng Doanh Thu Thực Thu (Đã nhận):</td>
              <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#16a34a', width: '25%' }}>{formatVND(kpis.total_revenue)}</td>
              <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold', width: '25%' }}>Tổng Số Đơn Hàng:</td>
              <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', width: '15%' }}>{kpis.total_bookings || 0} đơn</td>
            </tr>
            <tr>
              <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Doanh Số Đang Chờ Thanh Toán:</td>
              <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', color: '#d97706' }}>{formatVND(kpis.pending_revenue)}</td>
              <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Số Đơn Đã Thanh Toán:</td>
              <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1' }}>{kpis.paid_bookings_count || 0} đơn</td>
            </tr>
            <tr style={{ background: '#f8fafc' }}>
              <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Tiền Đã Hoàn Trả Khách (Đổi/Hủy):</td>
              <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', color: '#ef4444' }}>{formatVND(kpis.refunded_amount || changeReqs.total_refund_approved)}</td>
              <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Tổng Lượt Khách Phục Vụ:</td>
              <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{kpis.total_passengers || 0} khách</td>
            </tr>
            <tr>
              <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Yêu Cầu Đổi / Hủy Chờ Xử Lý:</td>
              <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1' }}>{changeReqs.pending_change_requests || 0} yêu cầu</td>
              <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Tỷ Lệ Thu Tiền Thành Công:</td>
              <td style={{ padding: '6px 10px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: '#0284c7' }}>
                {kpis.total_bookings > 0 ? Math.round((kpis.paid_bookings_count / kpis.total_bookings) * 100) : 0}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 2. TOP TOUR BÁN CHẠY NHẤT */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '12.5px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 8px 0', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>
          II. DOANH SỐ CÁC TOUR DU LỊCH TIÊU BIỂU TRONG KỲ
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', fontWeight: 'bold', textAlign: 'left' }}>
              <th style={{ padding: '5px', border: '1px solid #cbd5e1', width: '30px', textAlign: 'center' }}>STT</th>
              <th style={{ padding: '5px', border: '1px solid #cbd5e1' }}>Tên Tour Du Lịch</th>
              <th style={{ padding: '5px', border: '1px solid #cbd5e1' }}>Tuyến Điểm</th>
              <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Số Đơn</th>
              <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Lượng Khách</th>
              <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'right' }}>Doanh Thu Thực Thu</th>
            </tr>
          </thead>
          <tbody>
            {topTours.length > 0 ? topTours.slice(0, 6).map((t, idx) => (
              <tr key={idx}>
                <td style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ padding: '5px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{t.tour_name}</td>
                <td style={{ padding: '5px', border: '1px solid #cbd5e1' }}>{t.destination}</td>
                <td style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{t.order_count}</td>
                <td style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{t.passenger_count}</td>
                <td style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold' }}>{formatVND(t.revenue)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} style={{ padding: '8px', textAlign: 'center', color: '#64748b' }}>Chưa ghi nhận số liệu tour trong kỳ</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 3. TÌNH HÌNH LẤP ĐẦY KHỞI HÀNH */}
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '12.5px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 8px 0', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>
          III. TÌNH HÌNH LẤP ĐẦY GHẾ CÁC ĐỢT KHỞI HÀNH SẮP TỚI
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', fontWeight: 'bold', textAlign: 'left' }}>
              <th style={{ padding: '5px', border: '1px solid #cbd5e1', width: '35px', textAlign: 'center' }}>Mã</th>
              <th style={{ padding: '5px', border: '1px solid #cbd5e1' }}>Tên Tour</th>
              <th style={{ padding: '5px', border: '1px solid #cbd5e1' }}>Ngày Đi</th>
              <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Tổng Ghế</th>
              <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Đã Bán</th>
              <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Còn Trống</th>
              <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Lấp Đầy (%)</th>
            </tr>
          </thead>
          <tbody>
            {departures.length > 0 ? departures.slice(0, 8).map(d => (
              <tr key={d.departure_id}>
                <td style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'center' }}>#{d.departure_id}</td>
                <td style={{ padding: '5px', border: '1px solid #cbd5e1' }}>{d.tour_name}</td>
                <td style={{ padding: '5px', border: '1px solid #cbd5e1' }}>{new Date(d.departure_date).toLocaleDateString('vi-VN')}</td>
                <td style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{d.max_slots}</td>
                <td style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{d.booked_slots}</td>
                <td style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{d.available_slots}</td>
                <td style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{d.occupancy_rate}%</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} style={{ padding: '8px', textAlign: 'center', color: '#64748b' }}>Chưa có lịch khởi hành sắp tới</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. ĐÁNH GIÁ & ĐỀ XUẤT ĐIỀU HÀNH */}
      <div style={{ marginBottom: '18px' }}>
        <h3 style={{ fontSize: '12.5px', fontWeight: 'bold', textTransform: 'uppercase', margin: '0 0 8px 0', color: '#0f172a', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>
          IV. ĐÁNH GIÁ TÌNH HÌNH & ĐỀ XUẤT CỦA BỘ PHẬN VĂN PHÒNG
        </h3>
        <div style={{ fontSize: '11px', lineHeight: 1.6, color: '#334155', background: '#f8fafc', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
          <p style={{ margin: '0 0 6px 0' }}>
            - <strong>Tỷ lệ chuyển đổi thu tiền:</strong> Đạt {kpis.total_bookings > 0 ? Math.round((kpis.paid_bookings_count / kpis.total_bookings) * 100) : 0}% trên tổng số {kpis.total_bookings || 0} đơn đặt. Đề xuất tiếp tục gửi email và gọi điện nhắc lịch thanh toán cho các đơn hàng đang chờ thu tiền ({formatVND(kpis.pending_revenue)}).
          </p>
          <p style={{ margin: '0 0 6px 0' }}>
            - <strong>Điều phối ghế các đợt khởi hành:</strong> Các chuyến có tỷ lệ lấp đầy trên 80% cần sớm chốt danh sách hành khách với Hướng dẫn viên và Đội xe để đảm bảo đúng tiến độ tour. Các chuyến còn nhiều ghế trống tiếp tục phối hợp Marketing để áp dụng ưu đãi kích cầu.
          </p>
          <p style={{ margin: 0 }}>
            - <strong>Xử lý hoàn hủy:</strong> Tổng số {changeReqs.pending_change_requests || 0} yêu cầu đổi/hủy đang được bộ phận chuyên trách thẩm định và giải quyết đúng chính sách của công ty.
          </p>
        </div>
      </div>

      {/* 5. CHỮ KÝ 3 BÊN CHUẨN VĂN BẢN KẾ TOÁN LỮ HÀNH */}
      <div style={{ marginTop: '26px', display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: '11px', pageBreakInside: 'avoid' }}>
        <div style={{ width: '30%' }}>
          <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>NGƯỜI LẬP BIỂU</div>
          <div style={{ fontSize: '10px', fontStyle: 'italic', color: '#64748b', marginTop: '2px' }}>(Ký, ghi rõ họ tên)</div>
          <div style={{ height: '55px' }} />
          <div style={{ fontWeight: 'bold' }}>{currentUser.fullName || currentUser.full_name || 'Nhân viên Văn phòng'}</div>
        </div>

        <div style={{ width: '30%' }}>
          <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>KẾ TOÁN TRƯỞNG</div>
          <div style={{ fontSize: '10px', fontStyle: 'italic', color: '#64748b', marginTop: '2px' }}>(Ký, ghi rõ họ tên)</div>
          <div style={{ height: '55px' }} />
          <div style={{ fontWeight: 'bold' }}>Vũ Thị Thanh Thảo</div>
        </div>

        <div style={{ width: '30%' }}>
          <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>GIÁM ĐỐC / TRƯỞNG PHÒNG</div>
          <div style={{ fontSize: '10px', fontStyle: 'italic', color: '#64748b', marginTop: '2px' }}>(Ký tên và đóng dấu)</div>
          <div style={{ height: '55px' }} />
          <div style={{ fontWeight: 'bold' }}>Trần Đình Trọng</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="staff-dashboard-container" style={{ padding: '0px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      
      {/* 🚀 HEADER BẢNG ĐIỀU KHIỂN & BÁO CÁO */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)',
        borderRadius: '16px',
        padding: '24px 28px',
        color: '#ffffff',
        marginBottom: '20px',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{
              background: 'rgba(56, 189, 248, 0.2)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              fontSize: '11px',
              fontWeight: '800',
              padding: '3px 10px',
              borderRadius: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Phòng Điều Hành & Bán Vé Lữ Hành
            </span>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>•</span>
            <span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: '500' }}>
              Nhân viên: <strong style={{ color: '#ffffff' }}>{currentUser.fullName || currentUser.full_name || 'Nhân viên VP'}</strong>
            </span>
          </div>

          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            📊 Tổng Quan Bán Hàng & Trung Tâm Báo Cáo Doanh Thu
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#cbd5e1', opacity: 0.9 }}>
            Thống kê tình hình đặt tour, tỷ lệ lấp đầy chỗ, tiến độ thanh toán và xuất file báo cáo kinh doanh chuẩn doanh nghiệp.
          </p>
        </div>

        {/* NÚT TÁC VỤ IN & XUẤT PDF CHUYÊN NGHIỆP */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => fetchDashboardData()}
            disabled={loading}
            title="Tải lại số liệu mới nhất"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            title="Xem trước mẫu in và định dạng A4"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Eye size={15} />
            <span>Xem trước Báo Cáo</span>
          </button>

          <button
            onClick={handlePrint}
            title="In trực tiếp trang báo cáo"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              color: '#0f172a',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Printer size={15} color="#0f172a" />
            <span>In Báo Cáo</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExportingPdf}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
            }}
          >
            <Download size={16} />
            <span>{isExportingPdf ? 'Đang xuất PDF...' : 'Xuất File PDF'}</span>
          </button>
        </div>
      </div>

      {/* 📅 BỘ LỌC KỲ BÁO CÁO NGHIỆP VỤ */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        padding: '12px 18px',
        marginBottom: '20px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#0284c7" />
          <strong style={{ fontSize: '13px', color: '#1e293b' }}>Kỳ Báo Cáo:</strong>
          <span style={{ fontSize: '13px', color: '#0284c7', fontWeight: '700' }}>{getPeriodLabel()}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'today', label: 'Hôm nay' },
            { id: 'week', label: '7 ngày qua' },
            { id: 'month', label: 'Tháng này' },
            { id: 'quarter', label: 'Quý này' },
            { id: 'year', label: 'Năm nay' },
            { id: 'all', label: 'Tất cả' },
            { id: 'custom', label: 'Tùy chọn...' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: period === p.id ? '#0284c7' : '#e2e8f0',
                background: period === p.id ? '#0284c7' : '#f8fafc',
                color: period === p.id ? '#ffffff' : '#475569',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* NẾU CHỌN TÙY CHỌN NGÀY */}
        {period === 'custom' && (
          <form onSubmit={handleCustomDateSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', width: '100%' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Từ ngày:</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }} 
            />
            <span style={{ fontSize: '12px', color: '#64748b' }}>Đến ngày:</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }} 
            />
            <button 
              type="submit" 
              style={{ padding: '6px 14px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
            >
              Áp dụng
            </button>
          </form>
        )}
      </div>

      {loading && !dashboardData ? (
        <div style={{ padding: '60px', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <strong style={{ color: '#0f172a', fontSize: '15px' }}>Đang tổng hợp số liệu kinh doanh & vận hành...</strong>
          <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>Vui lòng đợi giây lát trong khi hệ thống truy xuất dữ liệu.</p>
        </div>
      ) : (
        <>
          {/* 📊 1. KHU VỰC CHỈ SỐ KPI CHÍNH (6 CARDS CHUẨN NGHIỆP VỤ BÁN TOUR) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
            marginBottom: '22px'
          }}>
            {/* THỰC THU */}
            <div style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              borderLeft: '5px solid #16a34a',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Doanh Thu Thực Thu
                </span>
                <span style={{ background: '#dcfce7', color: '#16a34a', padding: '6px', borderRadius: '8px' }}>
                  <DollarSign size={18} />
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginTop: '10px' }}>
                {formatVND(kpis.total_revenue)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} color="#16a34a" />
                <span>Đã thu tiền từ <strong>{kpis.paid_bookings_count || 0}</strong> đơn</span>
              </div>
            </div>

            {/* CHỜ THANH TOÁN */}
            <div style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              borderLeft: '5px solid #d97706',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Doanh Số Chờ Thu
                </span>
                <span style={{ background: '#fef3c7', color: '#d97706', padding: '6px', borderRadius: '8px' }}>
                  <Clock size={18} />
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginTop: '10px' }}>
                {formatVND(kpis.pending_revenue)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>⏳ Cần đôn đốc <strong>{kpis.pending_bookings_count || 0}</strong> đơn hàng</span>
              </div>
            </div>

            {/* TỔNG ĐƠN ĐẶT TOUR */}
            <div style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              borderLeft: '5px solid #0284c7',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Tổng Đơn Đặt Vé
                </span>
                <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '6px', borderRadius: '8px' }}>
                  <ShoppingCart size={18} />
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginTop: '10px' }}>
                {kpis.total_bookings || 0} <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>đơn</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                Tỷ lệ thanh toán: <strong>{kpis.total_bookings > 0 ? Math.round((kpis.paid_bookings_count / kpis.total_bookings) * 100) : 0}%</strong>
              </div>
            </div>

            {/* HÀNH KHÁCH */}
            <div style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              borderLeft: '5px solid #8b5cf6',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Hành Khách Phục Vụ
                </span>
                <span style={{ background: '#ede9fe', color: '#8b5cf6', padding: '6px', borderRadius: '8px' }}>
                  <Users size={18} />
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginTop: '10px' }}>
                {kpis.total_passengers || 0} <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>khách</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                Đã phục vụ trên các đoàn tour
              </div>
            </div>

            {/* YÊU CẦU ĐỔI / HỦY VÉ */}
            <div 
              onClick={() => onNavigateToChangeRequests && onNavigateToChangeRequests()}
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                borderLeft: '5px solid #ea580c',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                cursor: onNavigateToChangeRequests ? 'pointer' : 'default'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Yêu Cầu Đổi / Hủy
                </span>
                <span style={{ background: '#fff7ed', color: '#ea580c', padding: '6px', borderRadius: '8px' }}>
                  <AlertTriangle size={18} />
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginTop: '10px' }}>
                {changeReqs.pending_change_requests || 0} <span style={{ fontSize: '14px', fontWeight: '600', color: '#ea580c' }}>chờ duyệt</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                Đã xử lý: <strong>{changeReqs.approved_change_requests || 0}</strong> đã duyệt
              </div>
            </div>

            {/* TIỀN HOÀN TRẢ */}
            <div style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              borderLeft: '5px solid #ef4444',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Đã Hoàn Lại Cho Khách
                </span>
                <span style={{ background: '#fee2e2', color: '#ef4444', padding: '6px', borderRadius: '8px' }}>
                  <TrendingUp size={18} />
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', marginTop: '10px' }}>
                {formatVND(kpis.refunded_amount || changeReqs.total_refund_approved)}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                Áp dụng theo quy định khấu trừ hủy tour
              </div>
            </div>
          </div>

          {/* 📈 2. KHU VỰC BIỂU ĐỒ DOANH THU & TOP TOUR BÁN CHẠY (2 CỘT) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '22px' }}>
            
            {/* CỘT 1: DIỄN BIẾN DOANH THU THEO NGÀY */}
            <div style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '22px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                    📈 Diễn Biến Doanh Thu Bán Vé
                  </h3>
                  <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Doanh thu thực thu và số lượng đơn hàng qua các mốc thời gian
                  </p>
                </div>
              </div>

              {timeline.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  Chưa có giao dịch phát sinh trong kỳ này.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {timeline.map((item, idx) => {
                    const maxRev = Math.max(...timeline.map(t => Number(t.revenue || 0)), 1);
                    const pct = Math.round((Number(item.revenue || 0) / maxRev) * 100);

                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                        <div style={{ width: '55px', fontWeight: '700', color: '#334155' }}>{item.date_label}</div>
                        <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '6px', height: '22px', overflow: 'hidden', position: 'relative' }}>
                          <div style={{
                            width: `${Math.max(pct, 6)}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                            borderRadius: '6px',
                            transition: 'width 0.5s ease'
                          }} />
                          <span style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '11px',
                            fontWeight: '700',
                            color: pct > 35 ? '#ffffff' : '#0f172a'
                          }}>
                            {formatVND(item.revenue)} ({item.order_count} đơn)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PHƯƠNG THỨC THANH TOÁN */}
              <div style={{ marginTop: '22px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#334155', marginBottom: '10px' }}>
                  💳 Tỷ Trọng Kênh Thanh Toán:
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {paymentMethods.map((pm, i) => (
                    <div key={i} style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      flex: 1,
                      minWidth: '140px'
                    }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                        {pm.method === 'VNPAY_QR' ? '📱 Chuyển Khoản QR (SePay)' : '💵 Tiền Mặt Tại Quầy'}
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                        {formatVND(pm.total_amount)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '700', marginTop: '2px' }}>
                        {pm.count} giao dịch thành công
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CỘT 2: TOP TOUR BÁN CHẠY NHẤT */}
            <div style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '22px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                🌟 Top Tour Bán Chạy Nhất
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>
                Xếp hạng các tuyến điểm thu hút đông đảo du khách nhất
              </p>

              {topTours.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  Chưa có dữ liệu đặt tour.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {topTours.map((t, idx) => (
                    <div key={t.tour_id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px',
                      borderRadius: '10px',
                      background: idx === 0 ? '#f0f9ff' : '#f8fafc',
                      border: idx === 0 ? '1px solid #bae6fd' : '1px solid #f1f5f9'
                    }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: idx === 0 ? '#0284c7' : '#e2e8f0',
                        color: idx === 0 ? '#fff' : '#475569',
                        fontSize: '11px',
                        fontWeight: '900',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {idx + 1}
                      </span>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.tour_name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'flex', gap: '8px' }}>
                          <span>👥 {t.passenger_count} khách</span>
                          <span>•</span>
                          <span>🛒 {t.order_count} đơn</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#16a34a' }}>
                          {formatVND(t.revenue)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 🚌 3. TIẾN ĐỘ LẤP ĐẦY GHẾ CÁC ĐỢT KHỞI HÀNH (TOUR OCCUPANCY RATE) */}
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '22px',
            marginBottom: '22px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                  🚌 Tình Hình Khởi Hành & Tỷ Lệ Lấp Đầy Ghế (Occupancy Rate)
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  Theo dõi số lượng chỗ trống, tỷ lệ lấp đầy để đôn đốc nhận khách hoặc chốt khóa dịch vụ
                </p>
              </div>
            </div>

            {departures.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                Không có đợt khởi hành nào trong kỳ.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px' }}>Mã Đợt</th>
                      <th style={{ padding: '10px 14px' }}>Tour & Tuyến Điểm</th>
                      <th style={{ padding: '10px 14px' }}>Ngày Khởi Hành</th>
                      <th style={{ padding: '10px 14px' }}>Thời Gian Còn Lại</th>
                      <th style={{ padding: '10px 14px' }}>Số Chỗ Đã Đặt</th>
                      <th style={{ padding: '10px 14px', minWidth: '180px' }}>Tỷ Lệ Lấp Đầy (%)</th>
                      <th style={{ padding: '10px 14px' }}>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departures.map(d => {
                      const occ = Number(d.occupancy_rate || 0);
                      const isClosed = d.status === 'Closed' || d.days_left <= 30;

                      return (
                        <tr key={d.departure_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0284c7' }}>
                            #{d.departure_id}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <strong style={{ color: '#0f172a' }}>{d.tour_name}</strong>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>📍 {d.destination}</div>
                          </td>
                          <td style={{ padding: '12px 14px', color: '#334155' }}>
                            {new Date(d.departure_date).toLocaleDateString('vi-VN')}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {d.days_left > 0 ? (
                              <span style={{ color: d.days_left <= 30 ? '#ea580c' : '#16a34a', fontWeight: '700' }}>
                                Còn {d.days_left} ngày
                              </span>
                            ) : (
                              <span style={{ color: '#64748b' }}>Đã khởi hành</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: '700' }}>
                            <span style={{ color: '#0f172a' }}>{d.booked_slots}</span>
                            <span style={{ color: '#94a3b8', fontWeight: '400' }}> / {d.max_slots} chỗ</span>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${Math.min(occ, 100)}%`,
                                  height: '100%',
                                  background: occ >= 80 ? '#16a34a' : occ >= 50 ? '#0284c7' : '#f59e0b',
                                  borderRadius: '6px'
                                }} />
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: '800', width: '38px', color: occ >= 80 ? '#16a34a' : '#0f172a' }}>
                                {occ}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            {isClosed ? (
                              <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '10px' }}>
                                🔒 Đã khóa sổ
                              </span>
                            ) : (
                              <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '10px' }}>
                                🟢 Đang mở bán
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 📋 4. DANH SÁCH ĐƠN HÀNG MỚI NHẤT TRONG KỲ */}
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '22px',
            marginBottom: '30px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                  📋 Đơn Hàng Mới Nhất Cần Xử Lý & Theo Dõi
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  Các đơn đặt tour phát sinh gần đây nhất từ khách hàng
                </p>
              </div>

              {onNavigateToOrders && (
                <button
                  onClick={onNavigateToOrders}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    color: '#0284c7',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  <span>Xem toàn bộ đơn hàng</span>
                  <ChevronRight size={16} />
                </button>
              )}
            </div>

            {recentBookings.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                Chưa có đơn hàng nào.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px' }}>Mã Đơn</th>
                      <th style={{ padding: '10px 14px' }}>Khách Hàng</th>
                      <th style={{ padding: '10px 14px' }}>Tour Đặt</th>
                      <th style={{ padding: '10px 14px' }}>Ngày Khởi Hành</th>
                      <th style={{ padding: '10px 14px' }}>Số Khách</th>
                      <th style={{ padding: '10px 14px' }}>Tổng Tiền</th>
                      <th style={{ padding: '10px 14px' }}>Thanh Toán</th>
                      <th style={{ padding: '10px 14px' }}>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map(b => (
                      <tr key={b.booking_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 14px', fontWeight: '800', color: '#0284c7' }}>
                          #{b.booking_id}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <strong style={{ color: '#0f172a' }}>{b.customer_name}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{b.customer_phone || b.customer_email}</div>
                        </td>
                        <td style={{ padding: '12px 14px', maxWidth: '220px' }}>
                          <span style={{ color: '#0f172a', fontWeight: '600', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {b.tour_name}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#475569' }}>
                          {b.departure_date ? new Date(b.departure_date).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f172a' }}>
                          👥 {b.num_people}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: '800', color: '#16a34a' }}>
                          {formatVND(b.total_amount)}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {b.payment_status === 'Paid' ? (
                            <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '10px' }}>
                              ✅ Đã trả
                            </span>
                          ) : b.payment_status === 'Refunded' ? (
                            <span style={{ background: '#fee2e2', color: '#ef4444', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '10px' }}>
                              ↩ Đã hoàn tiền
                            </span>
                          ) : (
                            <span style={{ background: '#fef3c7', color: '#d97706', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '10px' }}>
                              ⏳ Chờ thu
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: b.booking_status === 'Confirmed' ? '#0284c7' : b.booking_status === 'Cancelled' ? '#94a3b8' : '#334155'
                          }}>
                            {b.booking_status === 'Confirmed' ? 'Đã xác nhận' : b.booking_status === 'Cancelled' ? 'Đã hủy' : b.booking_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* 🖨️ CSS CHUYÊN DỤNG CHO IN ẤN BÁO CÁO A4 */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Ẩn các thành phần giao diện không liên quan */
          .staff-dashboard-container > *:not(#printable-report-wrapper) {
            display: none !important;
          }
          header, nav, aside, .sidebar, .navbar, .navbar-container {
            display: none !important;
          }
          /* Hiển thị container báo cáo in ấn */
          #printable-report-wrapper {
            position: static !important;
            left: 0 !important;
            top: 0 !important;
            display: block !important;
            width: 100% !important;
            z-index: 99999 !important;
          }
          #printable-report {
            width: 100% !important;
            min-height: auto !important;
            padding: 10mm 12mm !important;
            margin: 0 !important;
            background: #ffffff !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 👁️ MODAL XEM TRƯỚC BÁO CÁO A4 (INTERACTIVE REPORT PREVIEW MODAL)         */}
      {/* ========================================================================= */}
      {showPrintModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px 16px',
          overflowY: 'auto',
          backdropFilter: 'blur(5px)'
        }}>
          {/* Header Modal */}
          <div style={{
            width: '100%',
            maxWidth: '220mm',
            background: '#0f172a',
            color: '#ffffff',
            padding: '14px 22px',
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            borderBottom: '1px solid #334155'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={22} color="#38bdf8" />
              <div>
                <div style={{ fontWeight: '800', fontSize: '15px' }}>Xem Trước Mẫu Báo Cáo Doanh Nghiệp (Khổ A4 Chuẩn)</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Kỳ báo cáo: <span style={{ color: '#38bdf8', fontWeight: '600' }}>{getPeriodLabel()}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={handlePrint}
                title="Mở hộp thoại in trình duyệt"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ffffff',
                  color: '#0f172a',
                  border: 'none',
                  padding: '9px 15px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <Printer size={15} color="#0f172a" />
                <span>In Báo Cáo</span>
              </button>

              <button
                onClick={handleExportPDF}
                disabled={isExportingPdf}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <Download size={15} />
                <span>{isExportingPdf ? 'Đang xuất PDF...' : 'Tải File PDF'}</span>
              </button>

              <button
                onClick={() => setShowPrintModal(false)}
                title="Đóng bản xem trước"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '34px',
                  height: '34px',
                  background: 'rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Khung tờ giấy A4 màu trắng nổi bật */}
          <div style={{
            width: '100%',
            maxWidth: '220mm',
            background: '#ffffff',
            borderRadius: '0 0 12px 12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            padding: '16px 0',
            overflowX: 'auto',
            marginBottom: '40px'
          }}>
            {renderReportContent()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📄 MẪU BÁO CÁO ẨN ĐỂ XUẤT FILE PDF QUA HTML2PDF & IN QUA @MEDIA PRINT     */}
      {/* Không dùng display: 'none' để html2canvas tính đúng kích thước A4          */}
      {/* ========================================================================= */}
      <div 
        id="printable-report-wrapper"
        style={{
          position: 'fixed',
          top: 0,
          left: '-99999px',
          width: '210mm',
          zIndex: -999,
          pointerEvents: 'none',
          opacity: 1
        }}
      >
        <div ref={printableReportRef} id="printable-report">
          {renderReportContent()}
        </div>
      </div>

    </div>
  );
};

export default OfficeStaffDashboard;

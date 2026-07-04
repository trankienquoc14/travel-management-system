import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TourManagement from './TourManagement';
import TourForm from './TourForm';
import ServiceManagement from './ServiceManagement';
import ServiceForm from './ServiceForm';
import PartnerManagement from './PartnerManagement';
import PartnerForm from './PartnerForm';
import PartnerInventory from './PartnerInventory';
import StaffTourRequestManager from './StaffTourRequestManager';
import StaffTourDesigner from './StaffTourDesigner';
import StaffPendingTours from './StaffPendingTours'; // Thêm dòng này
import ManagerTourApproval from './ManagerTourApproval';
import StaffPaymentManagement from './StaffPaymentManagement'; // 👈 Thêm dòng này
// ... các import cũ của bạn

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ revenue: 0, activeTours: 0, pendingRequests: 0 });
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [editTourId, setEditTourId] = useState(null);
  const [editServiceData, setEditServiceData] = useState(null);
  const [editPartnerData, setEditPartnerData] = useState(null);
  const [designingRequest, setDesigningRequest] = useState(null);


  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchDashboardStats(token);

      // 🚀 ĐẶT TAB MẶC ĐỊNH THEO TỪNG ROLE (Dựa vào Use Case)
      if (parsedUser.role === 7 || parsedUser.role === 'Partner') {
        setActiveTab('partner_inventory'); // Đối tác vào thẳng Kho của họ
      } else if (parsedUser.role === 4) {
        setActiveTab('tour_requests'); // Nhân viên văn phòng vào thẳng Yêu cầu/Tư vấn
      } else {
        setActiveTab('overview'); // Admin và Quản lý Tour vào Tổng quan
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const fetchDashboardStats = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/api/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu thống kê:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (!user) return null;

  // 🚀 ĐỊNH NGHĨA QUYỀN TRUY CẬP TỪ SƠ ĐỒ USE CASE
  const isPartner = user.role === 7 || user.role === 'Partner';
  const isOfficeStaff = user.role === 4;
  const isTourManager = user.role === 3;
  const isAdmin = user.role === 1; // Admin hệ thống

  // Hàm render trang Overview (Chỉ dành cho Quản lý Tour và Admin theo Use Case: Xem báo cáo thống kê)
  const renderOverview = () => (
    <>
      <div className="page-header">
        <h2>Bảng điều khiển</h2>
        <p>Theo dõi các hoạt động tổng quan và tiến độ vận hành mới nhất.</p>
      </div>
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon bg-green-light"><svg width="24" height="24" fill="none" stroke="#10b981" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
          <div className="stat-info">
            <div className="stat-title">Tổng doanh thu</div>
            <div className="stat-value">{formatCurrency(stats.revenue)}</div>
            <div className="stat-trend positive">Dữ liệu thực từ Bookings</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-blue-light"><svg width="24" height="24" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
          <div className="stat-info">
            <div className="stat-title">Tour đang vận hành</div>
            <div className="stat-value">{stats.activeTours}</div>
            <div className="stat-trend">Sẵn sàng nhận khách</div>
          </div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('tour_requests')} style={{ cursor: 'pointer', border: '1px solid #fed7aa' }}>
          <div className="stat-icon bg-orange-light"><svg width="24" height="24" fill="none" stroke="#f97316" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg></div>
          <div className="stat-info">
            <div className="stat-title">Yêu cầu chờ xử lý</div>
            <div className="stat-value">{stats.pendingRequests}</div>
            <div className="stat-trend negative">Click để xem chi tiết</div>
          </div>
        </div>
      </div>
      <div className="welcome-card" style={{ marginTop: '30px' }}>
        <h4>Chào mừng trở lại công việc!</h4>
        <p>Hệ thống đã kết nối thành công với Cơ sở dữ liệu. Các con số trên đang phản ánh chính xác tình hình kinh doanh thực tế.</p>
      </div>
    </>
  );

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-logo"><h2>Travel<span>ERP</span></h2></div>
        <div className="sidebar-subtitle">MENU CHÍNH</div>
        <ul className="sidebar-menu">

          {/* ========================================================= */}
          {/* 1. MENU CHUNG (Admin được xem mọi thứ)                    */}
          {/* ========================================================= */}

          {/* Xem báo cáo thống kê (Dành cho Quản lý Tour và Admin) */}
          {(isTourManager || isAdmin) && (
            <li className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>📊 Tổng quan & Báo cáo</li>
          )}

          {/* ========================================================= */}
          {/* 2. NGHIỆP VỤ NHÂN VIÊN VĂN PHÒNG (Kèm Admin)              */}
          {/* Tư vấn khách hàng, Thiết kế tour riêng, Đặt tour...       */}
          {/* ========================================================= */}
          {(isOfficeStaff || isAdmin) && (
            <>
              <li className={activeTab === 'tour_requests' ? 'active' : ''} onClick={() => setActiveTab('tour_requests')}>
                🛎️ Tư vấn & Thiết kế Tour
              </li>
              <li className={activeTab === 'approved_tours' ? 'active' : ''} onClick={() => setActiveTab('approved_tours')}>
                📤 Tour đã thiết kế
              </li>

              {/* Nơi chèn các tính năng tương lai của NVVP theo Use Case */}
              <li className={activeTab === 'orders' ? 'active' : ''} onClick={() => alert("Chức năng đang phát triển theo Sơ đồ Use Case")}>
                🛒 Quản lý Đơn Đặt Tour
              </li>
              {/* SỬA DÒNG CŨ ĐANG BỊ ALERT THÀNH DÒNG NÀY: */}
              <li className={activeTab === 'payments' ? 'active' : ''} onClick={() => setActiveTab('payments')}>
                💳 Xác nhận Thanh toán
              </li>
            </>
          )}

          {/* ========================================================= */}
          {/* 3. NGHIỆP VỤ QUẢN LÝ TOUR (Kèm Admin)                     */}
          {/* Quản lý dịch vụ/tour, Phê duyệt thiết kế, Quản lý đối tác */}
          {/* ========================================================= */}
          {(isTourManager || isAdmin) && (
            <>
              <li className={activeTab === 'approve_quotes' ? 'active' : ''} onClick={() => setActiveTab('approve_quotes')}>
                📝 Phê duyệt Thiết kế
              </li>
              <li className={activeTab === 'tours' || activeTab === 'tour_form' ? 'active' : ''} onClick={() => setActiveTab('tours')}>
                🗺️ Quản lý Tour
              </li>
              <li className={activeTab === 'services' || activeTab === 'service_form' ? 'active' : ''} onClick={() => setActiveTab('services')}>
                🏨 Quản lý Dịch vụ
              </li>
              <li className={activeTab === "partners" || activeTab === "partner_form" ? "active" : ""} onClick={() => setActiveTab("partners")}>
                🤝 Quản lý Đối tác
              </li>
              <li className={activeTab === 'incidents' ? 'active' : ''} onClick={() => alert("Chức năng Xử lý sự cố đang phát triển")}>
                ⚠️ Xử lý sự cố Tour
              </li>
            </>
          )}

          {/* ========================================================= */}
          {/* 4. NGHIỆP VỤ ĐỐI TÁC                                      */}
          {/* Quản lý thông tin dịch vụ, Xử lý yêu cầu cung cấp DV      */}
          {/* ========================================================= */}
          {isPartner && (
            <>
              <li className={activeTab === 'partner_inventory' ? 'active' : ''} onClick={() => setActiveTab('partner_inventory')}>🏪 Kho Dịch vụ của tôi</li>
              <li className={activeTab === 'partner_requests' ? 'active' : ''} onClick={() => setActiveTab('partner_requests')}>📩 Xử lý Yêu cầu dịch vụ</li>
            </>
          )}

          {/* ========================================================= */}
          {/* 5. NGHIỆP VỤ QUẢN TRỊ VIÊN HỆ THỐNG                       */}
          {/* ========================================================= */}
          {isAdmin && (
            <li className={activeTab === 'users' ? 'active' : ''} onClick={() => alert("Chức năng Quản lý Người dùng đang phát triển")}>
              👥 Quản lý Người dùng
            </li>
          )}

        </ul>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="header-search"><input type="text" placeholder="Tìm kiếm mã booking, tên khách..." /></div>
          <div className="user-profile">
            <div className="avatar">{user.fullName.charAt(0)}</div>
            <div>
              <span className="user-name">{user.fullName}</span>
              <span className="user-role">
                {isAdmin ? 'Quản trị viên' : isTourManager ? 'Quản lý Tour' : isOfficeStaff ? 'Nhân viên Văn phòng' : 'Đối tác'}
              </span>
            </div>
            <button onClick={handleLogout} className="logout-btn">Đăng xuất</button>
          </div>
        </header>

        <div className="content-area">
          {/* Vùng chung */}
          {activeTab === 'overview' && (isTourManager || isAdmin) && renderOverview()}

          {/* Vùng Nhân viên văn phòng */}
          {activeTab === 'tour_requests' && (isOfficeStaff || isAdmin) && (
            <StaffTourRequestManager
              onStartDesign={(req) => {
                setDesigningRequest(req);      // Lưu data khách đang tư vấn dở
                setActiveTab('tour_designer'); // Chuyển thẳng sang trang Thiết kế
              }}
            />
          )}
          {/* MỚI: Vùng Nhân viên văn phòng */}
          {activeTab === 'approved_tours' && (isOfficeStaff || isAdmin) && (
            <StaffPendingTours
              onEditDesign={(req) => {
                // Đưa toàn bộ data của tour này vào state của phòng thiết kế
                setDesigningRequest(req);
                // Đẩy sang tab thiết kế để sửa
                setActiveTab('tour_designer');
              }}
            />
          )}

          {/* CHUẨN BỊ SẴN CHỖ ĐỂ TÍNH NỮA NHÉT PHÒNG THIẾT KẾ VÀO */}
          {activeTab === 'tour_designer' && (isOfficeStaff || isAdmin) && (
            <StaffTourDesigner
              requestData={designingRequest}
              onBack={() => setActiveTab('tour_requests')}
            />
          )}

          {/* Vùng Quản lý Tour */}
          {activeTab === 'services' && (isTourManager || isAdmin) && <ServiceManagement onAddNew={() => { setEditServiceData(null); setActiveTab('service_form'); }} onEdit={(data) => { setEditServiceData(data); setActiveTab('service_form'); }} />}
          {activeTab === 'service_form' && (isTourManager || isAdmin) && <ServiceForm editData={editServiceData} onBack={() => { setActiveTab('services'); setEditServiceData(null); }} />}
          {activeTab === "partners" && (isTourManager || isAdmin) && <PartnerManagement onAddNew={() => { setEditPartnerData(null); setActiveTab("partner_form"); }} onEdit={(data) => { setEditPartnerData(data); setActiveTab("partner_form"); }} />}
          {activeTab === "partner_form" && (isTourManager || isAdmin) && <PartnerForm editData={editPartnerData} onBack={() => { setEditPartnerData(null); setActiveTab("partners"); }} />}
          {activeTab === 'tours' && (isTourManager || isAdmin) && <TourManagement onAddNew={() => { setEditTourId(null); setActiveTab('tour_form'); }} onEdit={(id) => { setEditTourId(id); setActiveTab('tour_form'); }} />}
          {activeTab === 'tour_form' && (isTourManager || isAdmin) && <TourForm tourId={editTourId} onBack={() => { setActiveTab('tours'); setEditTourId(null); }} />}
          {activeTab === 'approve_quotes' && (isTourManager || isAdmin) && <ManagerTourApproval />} {/* THÊM DÒNG NÀY */}
          {activeTab === 'payments' && (isOfficeStaff || isAdmin) && <StaffPaymentManagement />}
          {/* Vùng đối tác */}
          {activeTab === 'partner_inventory' && isPartner && <PartnerInventory />}
          {activeTab === 'partner_requests' && isPartner && <div style={{ padding: '20px' }}><h2>Yêu cầu đặt dịch vụ từ TravelERP</h2></div>}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
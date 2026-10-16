import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const StaffNotificationBell = ({ onNavigate, onNavigateToServiceRequest }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const prevUnreadCountRef = useRef(0);
  const dropdownRef = useRef(null);

  // Fetch danh sách thông báo từ backend (theo đúng user_id và role)
  const fetchNotifications = async (isBackground = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!isBackground) setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/bookings/staff-notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const newNotifs = response.data.data || [];
        const newUnread = response.data.unreadCount || 0;

        // Nếu số thông báo chưa đọc tăng lên -> kích hoạt hiệu ứng rung chuông Realtime
        if (newUnread > prevUnreadCountRef.current && prevUnreadCountRef.current > 0) {
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 1200);
        }

        prevUnreadCountRef.current = newUnread;
        setNotifications(newNotifs);
        setUnreadCount(newUnread);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông báo quản trị:', error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // Thiết lập Realtime Polling (15 giây / lần)
  useEffect(() => {
    fetchNotifications();

    const intervalId = setInterval(() => {
      fetchNotifications(true);
    }, 15000);

    return () => clearInterval(intervalId);
  }, []);

  // Xử lý đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Đánh dấu 1 thông báo là đã đọc
  const handleMarkAsRead = async (notificationId, e) => {
    if (e) e.stopPropagation();
    const token = localStorage.getItem('token');
    try {
      await axios.put(`http://localhost:5000/api/bookings/staff-notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev =>
        prev.map(n => n.notification_id === notificationId ? { ...n, is_read: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      prevUnreadCountRef.current = Math.max(0, prevUnreadCountRef.current - 1);
    } catch (error) {
      console.error('Lỗi đánh dấu đã đọc:', error);
    }
  };

  // Đánh dấu tất cả là đã đọc (đúng tài khoản hiện tại)
  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem('token');
    try {
      await axios.put('http://localhost:5000/api/bookings/staff-notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      prevUnreadCountRef.current = 0;
    } catch (error) {
      console.error('Lỗi đánh dấu tất cả đã đọc:', error);
    }
  };

  // Xóa thông báo
  const handleDelete = async (notificationId, e) => {
    if (e) e.stopPropagation();
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/bookings/staff-notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
      fetchNotifications(true);
    } catch (error) {
      console.error('Lỗi xóa thông báo:', error);
    }
  };

  // Điều hướng chính xác theo công việc của từng Role & từng thông báo
  const handleActionClick = (notif) => {
    if (!notif.is_read) {
      handleMarkAsRead(notif.notification_id);
    }
    setIsOpen(false);

    // Xác định tab mục tiêu
    let targetTab = notif.action_url;
    if (!targetTab) {
      switch (notif.type) {
        case 'TOUR_CLOSED':
          targetTab = 'create_request';
          break;
        case 'GUIDE_ASSIGNED':
        case 'GUIDE_TOUR_UPCOMING':
          targetTab = 'guide_assigned';
          break;
        case 'DRIVER_ASSIGNED':
          targetTab = 'driver_assigned';
          break;
        case 'DRIVER_TRIP_UPCOMING':
          targetTab = 'driver_schedule';
          break;
        case 'PARTNER_SERVICE_REQUEST':
          targetTab = 'partner_requests';
          break;
        case 'HR_LEAVE_REQUEST':
          targetTab = 'hr_employees';
          break;
        case 'TOUR_PENDING_APPROVAL':
          targetTab = 'approve_quotes';
          break;
        case 'TOUR_INCIDENT':
        case 'ADMIN_INCIDENT':
          targetTab = 'incidents';
          break;
        case 'CHANGE_REQUEST_PENDING':
          targetTab = 'change_request';
          break;
        case 'BOOKING_NEW':
          targetTab = 'orders';
          break;
        default:
          targetTab = 'overview';
      }
    }

    if (onNavigate) {
      onNavigate(targetTab, notif);
    } else if (onNavigateToServiceRequest && targetTab === 'create_request') {
      onNavigateToServiceRequest(notif.departure_id, notif.tour_id);
    }
  };

  // Định dạng thời gian
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Vừa xong';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // Icon, màu sắc và tiêu đề hành động theo từng loại thông báo
  const getNotificationMeta = (type) => {
    switch (type) {
      case 'TOUR_CLOSED':
        return { icon: '🔒', badgeColor: '#ea580c', badgeBg: '#fff7ed', actionText: '🚀 Gửi yêu cầu NCC' };
      case 'GUIDE_ASSIGNED':
        return { icon: '🚩', badgeColor: '#0284c7', badgeBg: '#f0f9ff', actionText: '🚩 Xem tour phân công' };
      case 'GUIDE_TOUR_UPCOMING':
        return { icon: '⏰', badgeColor: '#d97706', badgeBg: '#fef3c7', actionText: '⏰ Xem lịch khởi hành' };
      case 'DRIVER_ASSIGNED':
        return { icon: '🚌', badgeColor: '#059669', badgeBg: '#ecfdf5', actionText: '🚌 Xem chuyến xe' };
      case 'DRIVER_TRIP_UPCOMING':
        return { icon: '⏰', badgeColor: '#d97706', badgeBg: '#fef3c7', actionText: '⏰ Xem lịch trình xe' };
      case 'PARTNER_SERVICE_REQUEST':
        return { icon: '🛎️', badgeColor: '#7c3aed', badgeBg: '#f5f3ff', actionText: '🛎️ Xử lý yêu cầu dịch vụ' };
      case 'HR_LEAVE_REQUEST':
        return { icon: '📝', badgeColor: '#2563eb', badgeBg: '#eff6ff', actionText: '📝 Xem xét phê duyệt' };
      case 'TOUR_PENDING_APPROVAL':
        return { icon: '📋', badgeColor: '#d97706', badgeBg: '#fffbeb', actionText: '📋 Duyệt tour mở bán' };
      case 'TOUR_INCIDENT':
      case 'ADMIN_INCIDENT':
        return { icon: '⚠️', badgeColor: '#dc2626', badgeBg: '#fef2f2', actionText: '⚠️ Xử lý sự cố' };
      case 'CHANGE_REQUEST_PENDING':
        return { icon: '🔄', badgeColor: '#ea580c', badgeBg: '#fff7ed', actionText: '🔄 Xử lý đổi/hủy vé' };
      case 'BOOKING_NEW':
        return { icon: '🛒', badgeColor: '#16a34a', badgeBg: '#f0fdf4', actionText: '🛒 Xem đơn hàng' };
      default:
        return { icon: '📢', badgeColor: '#0284c7', badgeBg: '#f0f9ff', actionText: '➔ Xem chi tiết' };
    }
  };

  // Lọc thông báo theo tab
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.is_read;
    return true;
  });

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* NÚT CHUÔNG THÔNG BÁO QUẢN TRỊ */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications(true);
        }}
        title="Thông báo công việc & điều hành"
        style={{
          position: 'relative',
          background: isOpen ? '#e0f2fe' : '#f8fafc',
          border: isOpen ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
          borderRadius: '12px',
          width: '42px',
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 3px rgba(2, 132, 199, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
          animation: isShaking ? 'bellShake 0.6s ease infinite' : 'none'
        }}
      >
        <span style={{ fontSize: '20px', lineHeight: 1 }}>🔔</span>

        {/* HUY HIỆU SỐ THÔNG BÁO CHƯA ĐỌC */}
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '800',
              padding: '2px 6px',
              borderRadius: '10px',
              minWidth: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)',
              border: '2px solid #ffffff'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN DANH SÁCH THÔNG BÁO */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '52px',
            right: 0,
            width: '430px',
            maxWidth: '92vw',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 40px -8px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(15, 23, 42, 0.08)',
            zIndex: 9999,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'dropdownFadeIn 0.2s ease-out'
          }}
        >
          {/* HEADER DROPDOWN */}
          <div
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🔔</span>
              <strong style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '-0.2px' }}>
                Thông Báo Nhiệm Vụ & Điều Hành
              </strong>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}
                >
                  {unreadCount} mới
                </span>
              )}
            </div>

            <button
              onClick={() => fetchNotifications(false)}
              title="Làm mới thông báo"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#e2e8f0',
                borderRadius: '8px',
                padding: '5px 8px',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🔄
            </button>
          </div>

          {/* BỘ LỌC TABS & NÚT ĐÁNH DẤU TẤT CẢ */}
          <div
            style={{
              padding: '10px 16px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setFilter('ALL')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: filter === 'ALL' ? '#0284c7' : '#e2e8f0',
                  color: filter === 'ALL' ? '#ffffff' : '#475569'
                }}
              >
                Tất cả ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('UNREAD')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: filter === 'UNREAD' ? '#ef4444' : '#e2e8f0',
                  color: filter === 'UNREAD' ? '#ffffff' : '#475569'
                }}
              >
                Chưa đọc ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0284c7',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '4px 6px'
                }}
                title="Đánh dấu tất cả thông báo là đã đọc"
              >
                ✓ Đọc hết
              </button>
            )}
          </div>

          {/* DANH SÁCH THÔNG BÁO (SCROLLABLE) */}
          <div
            style={{
              maxHeight: '440px',
              overflowY: 'auto',
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              background: '#ffffff'
            }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
                Đang tải thông báo...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                  {filter === 'UNREAD' ? 'Không có thông báo chưa đọc nào' : 'Chưa có thông báo nào'}
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Hệ thống sẽ tự động thông báo khi có phân công, nhiệm vụ hoặc sự kiện liên quan đến tài khoản của bạn.
                </div>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const meta = getNotificationMeta(notif.type);
                const isRead = notif.is_read;

                return (
                  <div
                    key={notif.notification_id}
                    onClick={() => handleActionClick(notif)}
                    style={{
                      background: isRead ? '#ffffff' : '#f0f9ff',
                      borderRadius: '12px',
                      padding: '14px',
                      border: isRead ? '1px solid #e2e8f0' : '1.5px solid #38bdf8',
                      boxShadow: isRead ? '0 1px 3px rgba(0,0,0,0.03)' : '0 4px 12px rgba(56, 189, 248, 0.12)',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                  >
                    {/* DÒNG TIÊU ĐỀ & THỜI GIAN */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: meta.badgeBg,
                            color: meta.badgeColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '15px'
                          }}
                        >
                          {meta.icon}
                        </span>
                        <div>
                          <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block', lineHeight: '1.3' }}>
                            {notif.title}
                          </strong>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {formatTimeAgo(notif.created_at)}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {!isRead && (
                          <span
                            title="Chưa đọc"
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#0284c7',
                              display: 'inline-block'
                            }}
                          />
                        )}
                        <button
                          onClick={(e) => handleDelete(notif.notification_id, e)}
                          title="Xóa thông báo"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#cbd5e1',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '2px 4px',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#cbd5e1')}
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* NỘI DUNG CHI TIẾT */}
                    <p style={{ margin: '6px 0 10px 0', fontSize: '13px', color: '#334155', lineHeight: '1.45' }}>
                      {notif.content}
                    </p>

                    {/* HỘP TÓM TẮT THÔNG TIN (NẾU CÓ NGÀY ĐI HOẶC SỐ KHÁCH) */}
                    {(notif.departure_date || notif.num_booked > 0) && (
                      <div
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '10px',
                          fontSize: '12px'
                        }}
                      >
                        {notif.departure_date ? (
                          <span style={{ color: '#0284c7', fontWeight: '600' }}>
                            📅 Khởi hành: {new Date(notif.departure_date).toLocaleDateString('vi-VN')}
                          </span>
                        ) : <span />}
                        {notif.num_booked > 0 && (
                          <span
                            style={{
                              background: '#e0f2fe',
                              color: '#0369a1',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px'
                            }}
                          >
                            👥 {notif.num_booked} khách
                          </span>
                        )}
                      </div>
                    )}

                    {/* NÚT HÀNH ĐỘNG NGỮ CẢNH */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActionClick(notif);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                      >
                        <span>{meta.actionText}</span>
                        <span style={{ fontSize: '10px' }}>➔</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* FOOTER DROPDOWN */}
          <div
            style={{
              padding: '10px 16px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#64748b'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              Cập nhật tự động (15s)
            </span>
            <span>Hệ thống VietTravel ERP</span>
          </div>
        </div>
      )}

      {/* CSS KEYFRAME ANIMATION CHO CHUÔNG RUNG */}
      <style>{`
        @keyframes bellShake {
          0% { transform: rotate(0); }
          15% { transform: rotate(15deg); }
          30% { transform: rotate(-15deg); }
          45% { transform: rotate(10deg); }
          60% { transform: rotate(-10deg); }
          75% { transform: rotate(5deg); }
          85% { transform: rotate(-5deg); }
          100% { transform: rotate(0); }
        }
        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default StaffNotificationBell;

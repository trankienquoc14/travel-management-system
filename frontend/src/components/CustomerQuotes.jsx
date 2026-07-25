import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../index.css';

const CustomerQuotes = () => {
    const [user, setUser] = useState(null);
    const [quotes, setQuotes] = useState([]);
    const [selectedQuote, setSelectedQuote] = useState(null);

    // Quản lý trạng thái đóng/mở ô nhập ghi chú và dữ liệu ghi chú
    const [showRevisionInput, setShowRevisionInput] = useState(false);
    const [revisionNote, setRevisionNote] = useState('');

    const navigate = useNavigate();

    // 1. LẤY THÔNG TIN USER KHI TRANG VỪA LOAD
    useEffect(() => {
        const storedUserStr = localStorage.getItem('user');
        if (storedUserStr) {
            const storedUser = JSON.parse(storedUserStr);
            setUser(storedUser);
            const customerId = storedUser.user_id || storedUser.id || storedUser.userId;
            fetchMyQuotes(customerId);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    // 2. HÀM LẤY DỮ LIỆU TỪ BACKEND (Backend đã LEFT JOIN lấy bản Quote mới nhất từ bảng custom_tour_quotes)
    const fetchMyQuotes = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/custom-tours/requests/customer/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setQuotes(response.data.data || []);
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách báo giá:', error);
            setQuotes([]);
        }
    };

    // 3. HÀM CẬP NHẬT TRẠNG THÁI KHÁCH HÀNG TƯƠNG TÁC
    const handleCustomerAction = async (newStatus, note = '') => {
        if (newStatus === 'Customer_Accepted') {
            if (!window.confirm("Bạn xác nhận đồng ý chốt tour này?")) return;
        } else if (newStatus === 'Customer_Revision') {
            if (!note) return;
        }

        try {
            const response = await axios.put(`http://localhost:5000/api/custom-tours/requests/${selectedQuote.request_id}/customer-action`, {
                status: newStatus,
                customer_note: note
            });

            if (response.data.success) {
                alert(newStatus === 'Customer_Accepted' ? '🎉 Đã chốt tour thành công!' : 'Đã gửi yêu cầu chỉnh sửa!');

                // Cập nhật lại UI ngay lập tức (Cập nhật vào approval_status của bản quote hiện tại)
                const updatedQuote = { ...selectedQuote, approval_status: newStatus };
                setSelectedQuote(updatedQuote);
                setQuotes(quotes.map(q => q.request_id === updatedQuote.request_id ? updatedQuote : q));
                setShowRevisionInput(false);
            }
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
            alert("Không thể cập nhật trạng thái. Vui lòng kiểm tra kết nối API.");
        }
    };
    // THÊM HÀM NÀY VÀO DƯỚI handleCustomerAction
    const handleBookCustomTour = () => {
        if (!selectedQuote) return;

        const price = selectedQuote.quoted_price || selectedQuote.quote_price;
        if (!window.confirm(`Xác nhận tiến hành đặt tour đi ${selectedQuote.destination} với chi phí ${formatMoney(price)} đ?`)) {
            return;
        }

        // ✅ THAY BẰNG LỆNH CHUYỂN HƯỚNG SANG BOOKING FORM:
        navigate('/booking-form', {
            state: {
                isCustomTour: true,
                quoteData: selectedQuote
            }
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const formatMoney = (amount) => Number(amount || 0).toLocaleString('vi-VN');
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('vi-VN');

    // HÀM RENDER HUY HIỆU TRẠNG THÁI (ĐỌC TỪ BẢNG QUOTES LÀ CHÍNH)
    const renderStatusForCustomer = (quote) => {
        // 1. Nếu có quote, xử lý theo approval_status
        if (quote.approval_status) {
            switch (quote.approval_status) {
                case 'Initial_Quoted':
                    return { text: 'Báo giá sơ bộ', color: '#0369a1', bg: '#e0f2fe', icon: '💰' };
                case 'Quote_Sent':
                    return { text: 'Đã có bản thiết kế', color: '#047857', bg: '#d1fae5', icon: '🎉' };
                case 'Customer_Revision':
                    return { text: 'Đang điều chỉnh', color: '#c2410c', bg: '#ffedd5', icon: '✍️' };
                case 'Customer_Accepted':
                    return { text: 'Đã chốt tour', color: '#15803d', bg: '#bbf7d0', icon: '✅' };
                default:
                    return { text: 'Chuyên viên đang xử lý', color: '#1d4ed8', bg: '#dbeafe', icon: '⚙️' };
            }
        }

        // 2. Fallback về status của requests
        switch (quote.status) {
            case 'Pending':
                return { text: 'Mới gửi yêu cầu', color: '#d97706', bg: '#fef3c7', icon: '📥' };
            case 'Designing':
                return { text: 'Đang thiết kế chi tiết', color: '#1d4ed8', bg: '#dbeafe', icon: '⚙️' };
            case 'Initial_Quoted':
                return { text: 'Đã báo giá sơ bộ', color: '#0369a1', bg: '#e0f2fe', icon: '💰' };
            case 'Completed':
                return { text: 'Đã chốt tour', color: '#15803d', bg: '#bbf7d0', icon: '✅' };
            default:
                return { text: 'Đang xử lý', color: '#1d4ed8', bg: '#dbeafe', icon: '⚙️' };
        }
    };

    // HÀM RENDER LỊCH TRÌNH TIMELINE HIỆN ĐẠI (Đọc từ itinerary của bảng Quotes)
    const renderModernItinerary = (itineraryData) => {
        if (!itineraryData) return <p style={{ color: '#94a3b8' }}>Chưa có chi tiết lịch trình.</p>;

        try {
            const parsedData = typeof itineraryData === 'string' ? JSON.parse(itineraryData) : itineraryData;

            if (parsedData.dragDropState && parsedData.dragDropState.itineraryDays) {
                const days = parsedData.dragDropState.itineraryDays;
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
                        {days.map((day) => (
                            <div key={day.dayIndex} style={{ position: 'relative', paddingLeft: '30px', borderLeft: '3px solid #cbd5e1' }}>
                                <div style={{ position: 'absolute', left: '-11px', top: '0', width: '20px', height: '20px', backgroundColor: '#3b82f6', borderRadius: '50%', border: '4px solid #fff', boxShadow: '0 0 0 1px #cbd5e1' }}></div>

                                <h4 style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    Ngày {day.dayIndex} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 'normal' }}>({day.dateString})</span>
                                </h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {day.slots.morning.length > 0 && (
                                        <div style={{ display: 'flex', background: '#f8fafc', padding: '12px 15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <span style={{ width: '80px', color: '#f59e0b', fontWeight: 'bold', fontSize: '14px' }}>🌅 Sáng</span>
                                            <span style={{ flex: 1, color: '#334155', fontSize: '15px' }}>{day.slots.morning.map(i => i.name).join(' ➔ ')}</span>
                                        </div>
                                    )}
                                    {day.slots.noon.length > 0 && (
                                        <div style={{ display: 'flex', background: '#f8fafc', padding: '12px 15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <span style={{ width: '80px', color: '#ef4444', fontWeight: 'bold', fontSize: '14px' }}>☀️ Trưa</span>
                                            <span style={{ flex: 1, color: '#334155', fontSize: '15px' }}>{day.slots.noon.map(i => i.name).join(' ➔ ')}</span>
                                        </div>
                                    )}
                                    {day.slots.evening.length > 0 && (
                                        <div style={{ display: 'flex', background: '#f8fafc', padding: '12px 15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <span style={{ width: '80px', color: '#8b5cf6', fontWeight: 'bold', fontSize: '14px' }}>🌙 Chiều/Tối</span>
                                            <span style={{ flex: 1, color: '#334155', fontSize: '15px' }}>{day.slots.evening.map(i => i.name).join(' ➔ ')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }
            return <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: '#334155', fontSize: '15px' }}>{parsedData.textVersion}</div>;
        } catch (e) {
            return <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: '#334155', fontSize: '15px' }}>{itineraryData}</div>;
        }
    };

    return (
        <div className="homepage-container" style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* NAV BAR */}
            <nav className="home-navbar" style={{ backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div className="home-logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
                    Travel<span className="text-primary">ERP</span>
                </div>
                <ul className="home-menu">
                    <li onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>Khám phá</li>
                    <li onClick={() => navigate('/my-bookings')} style={{ cursor: 'pointer' }}>Đơn hàng của tôi</li>
                    {user && (
                        <li className="active" onClick={() => navigate('/my-quotes')} style={{ textDecoration: 'none', color: 'inherit' }}>
                            Báo giá thiết kế
                        </li>
                    )}
                    <li><Link to="/build-tour" className="menu-item" style={{ textDecoration: 'none', color: 'inherit' }}>Tự thiết kế Tour</Link></li>
                </ul>
                <div className="home-user-actions">
                    <div className="user-info">
                        <div className="user-avatar">{user?.fullName?.charAt(0) || 'U'}</div>
                        <span>{user?.fullName}</span>
                    </div>
                    <button onClick={handleLogout} className="btn-outline">Đăng xuất</button>
                </div>
            </nav>

            {/* MAIN CONTENT */}
            <div style={{ flex: 1, padding: '40px 20px', backgroundColor: '#f4f7f6' }}>
                <div style={{ maxWidth: '1440px', width: '98%', margin: '0 auto', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
                    {/* CỘT TRÁI: DANH SÁCH YÊU CẦU */}
                    <div style={{ flex: '0 0 420px', backgroundColor: '#ffffff', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', position: 'sticky', top: '40px' }}>
                        <style>
                            {`
                                @keyframes slideRight {
                                    from { transform: translateX(0); }
                                    to { transform: translateX(4px); }
                                }
                                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                            `}
                        </style>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', gap: '15px' }}>
                            <button onClick={() => navigate('/home')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#ffffff', cursor: 'pointer', color: '#475569', transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.transform = 'translateY(0)' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                            </button>
                            <h3 style={{ margin: 0, fontSize: '24px', color: '#0f172a', fontWeight: '800', letterSpacing: '-0.5px' }}>Đơn thiết kế của tôi</h3>
                        </div>

                        {quotes.length === 0 ? (
                            <div style={{ padding: '60px 20px', borderRadius: '20px', textAlign: 'center', backgroundColor: '#f8fafc', color: '#64748b', border: '2px dashed #cbd5e1' }}>
                                <div style={{ fontSize: '50px', marginBottom: '15px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>🧳</div>
                                <div style={{ fontSize: '18px', fontWeight: '700', color: '#334155' }}>Chưa có chuyến đi nào</div>
                                <div style={{ fontSize: '14px', marginTop: '8px', lineHeight: '1.5' }}>Bạn chưa có yêu cầu thiết kế tour nào. Hãy bắt đầu trải nghiệm mới!</div>
                            </div>
                        ) : (
                            <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '8px', paddingBottom: '20px', flex: 1 }}>
                                {quotes.map((quote) => {
                                    const statusUI = renderStatusForCustomer(quote);
                                    const isSelected = selectedQuote?.request_id === quote.request_id;
                                    return (
                                        <div key={quote.request_id} onClick={() => { setSelectedQuote(quote); setShowRevisionInput(false); }}
                                            onMouseOver={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = '#cbd5e1'; } }}
                                            onMouseOut={(e) => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#f1f5f9'; } }}
                                            style={{
                                                padding: '24px', border: '2px solid', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                backgroundColor: isSelected ? '#ffffff' : '#f8fafc',
                                                borderColor: isSelected ? '#0ea5e9' : '#f1f5f9',
                                                boxShadow: isSelected ? '0 12px 24px -8px rgba(14, 165, 233, 0.25)' : 'none',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {isSelected && (
                                                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'linear-gradient(to bottom, #0ea5e9, #3b82f6)' }} />
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                <h4 style={{ margin: 0, color: '#0f172a', fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    📍 {quote.destination || 'Chưa cập nhật'}
                                                </h4>
                                                <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '12px', letterSpacing: '0.5px' }}>
                                                    #{quote.request_id}
                                                </span>
                                            </div>
                                            
                                            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                                    {formatDate(quote.departure_date)}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                                    {quote.people_count} khách
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px', color: statusUI.color, backgroundColor: statusUI.bg, padding: '6px 14px', borderRadius: '12px' }}>
                                                    <span style={{ fontSize: '14px' }}>{statusUI.icon}</span> {statusUI.text}
                                                </span>
                                                {isSelected && (
                                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'slideRight 1s infinite alternate' }}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* CỘT PHẢI: CHI TIẾT BÁO GIÁ */}
                    <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', minHeight: '600px' }}>
                        {selectedQuote ? (
                            <div style={{ width: '100%', animation: 'fadeIn 0.3s ease' }}>

                                {/* HEADER CHI TIẾT */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #f1f5f9', paddingBottom: '25px', marginBottom: '30px' }}>
                                    <div>
                                        <h2 style={{ margin: '0 0 15px 0', color: '#0f172a', fontSize: '28px', fontWeight: '800' }}>Hành trình khám phá {selectedQuote.destination}</h2>
                                        <div style={{ display: 'flex', gap: '25px', fontSize: '15px', color: '#475569', fontWeight: '500' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ padding: '6px', background: '#f1f5f9', borderRadius: '6px' }}>📅</div> {formatDate(selectedQuote.departure_date)} - {formatDate(selectedQuote.return_date)}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ padding: '6px', background: '#f1f5f9', borderRadius: '6px' }}>👥</div> {selectedQuote.people_count} Hành khách</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', background: '#f8fafc', padding: '15px 25px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '5px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Ngân sách ban đầu</div>
                                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#94a3b8', textDecoration: 'line-through' }}>{formatMoney(selectedQuote.budget)} đ</div>
                                    </div>
                                </div>

                                {/* CHÌA KHÓA LOGIC: KIỂM TRA TRẠNG THÁI CỦA BẢNG QUOTE (approval_status) */}
                                {selectedQuote.approval_status === 'Quote_Sent' || selectedQuote.approval_status === 'Customer_Accepted' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

                                        {/* BANNER THÀNH CÔNG VỚI GIÁ TRỊ TỪ BẢNG QUOTES */}
                                        <div style={{
                                            backgroundColor: selectedQuote.approval_status === 'Customer_Accepted' ? '#dcfce7' : '#f0fdf4',
                                            border: '2px solid #34d399',
                                            padding: '30px',
                                            borderRadius: '16px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '20px',
                                            boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.1)'
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ margin: '0 0 8px 0', color: '#065f46', fontSize: '22px', fontWeight: '800' }}>
                                                    {selectedQuote.approval_status === 'Customer_Accepted' ? 'TUYỆT VỜI! BẠN ĐÃ CHỐT TOUR NÀY.' : '✨ ĐÃ CÓ BẢN THIẾT KẾ & BÁO GIÁ MỚI!'}
                                                </h3>
                                                <span style={{ fontSize: '15px', color: '#047857', display: 'block' }}>
                                                    {selectedQuote.approval_status === 'Customer_Accepted'
                                                        ? 'Chúng tôi đang tiến hành thủ tục giữ chỗ và soạn hợp đồng. Hẹn gặp bạn sớm nhé!'
                                                        : 'Chúng tôi đã tối ưu lịch trình và chi phí tốt nhất cho bạn. Vui lòng xem chi tiết bên dưới.'}
                                                </span>
                                            </div>

                                            <div style={{
                                                textAlign: 'right', background: '#fff', padding: '15px 25px', borderRadius: '12px',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.05)', flexShrink: 0, minWidth: 'fit-content'
                                            }}>
                                                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold', marginBottom: '5px', whiteSpace: 'nowrap' }}>
                                                    CHI PHÍ TỐI ƯU CÒN LẠI
                                                </div>
                                                <div style={{ fontSize: '28px', color: '#059669', fontWeight: '800', whiteSpace: 'nowrap' }}>
                                                    {formatMoney(selectedQuote.quoted_price || selectedQuote.quote_price)} đ
                                                </div>
                                            </div>
                                        </div>

                                        {/* CHI TIẾT HÀNH TRÌNH TỪ BẢNG QUOTE */}
                                        <div style={{ marginTop: '10px' }}>
                                            <h3 style={{ fontSize: '20px', color: '#0f172a', paddingBottom: '15px', borderBottom: '1px solid #f1f5f9', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '24px' }}>🗺️</span> Chi tiết hành trình hành khách
                                            </h3>
                                            <div style={{ backgroundColor: '#fff', borderRadius: '12px' }}>
                                                {renderModernItinerary(selectedQuote.proposed_itinerary || selectedQuote.itinerary)}
                                            </div>
                                        </div>

                                    </div>
                                ) : selectedQuote.approval_status === 'Initial_Quoted' || selectedQuote.status === 'Initial_Quoted' ? (
                                    <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '30px', borderRadius: '12px', color: '#0369a1', display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                                        <div style={{ fontSize: '40px' }}>💰</div>
                                        <div style={{ flex: 1 }}>
                                            <strong style={{ display: 'block', marginBottom: '10px', fontSize: '20px' }}>Báo giá sơ bộ đã được gửi</strong>
                                            <span style={{ fontSize: '15px', lineHeight: '1.6', display: 'block', marginBottom: '15px' }}>Nhân viên đã xem xét yêu cầu của bạn và ước tính chi phí báo giá sơ bộ: <strong style={{ color: '#0284c7', fontSize: '18px' }}>{formatMoney(selectedQuote.quoted_price || selectedQuote.quote_price)} đ</strong>.</span>
                                            {selectedQuote.staff_note && (
                                                <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #0ea5e9', color: '#334155' }}>
                                                    <strong>Nhân viên nhắn nhủ:</strong><br/>
                                                    <span style={{ whiteSpace: 'pre-wrap' }}>{selectedQuote.staff_note}</span>
                                                </div>
                                            )}
                                            
                                            <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
                                                <button onClick={() => setShowRevisionInput(!showRevisionInput)} style={{ padding: '10px 20px', backgroundColor: '#fff', color: '#f97316', border: '2px solid #f97316', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                                                    {showRevisionInput ? 'ĐÓNG FORM' : 'YÊU CẦU ĐIỀU CHỈNH'}
                                                </button>
                                                <button onClick={() => handleCustomerAction('Initial_Accepted')} style={{ padding: '10px 25px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)' }}>
                                                    ĐỒNG Ý MỨC GIÁ NÀY
                                                </button>
                                            </div>
                                            <span style={{ fontSize: '13px', display: 'block', marginTop: '15px', fontStyle: 'italic', color: '#64748b' }}>*Nhân viên sẽ lên lịch trình chi tiết sau khi bạn đồng ý mức giá sơ bộ này.</span>
                                        </div>
                                    </div>
                                ) : selectedQuote.approval_status === 'Customer_Revision' ? (
                                    <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '30px', borderRadius: '12px', color: '#c2410c', display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                                        <div style={{ fontSize: '40px' }}>✍️</div>
                                        <div>
                                            <strong style={{ display: 'block', marginBottom: '10px', fontSize: '20px' }}>Đang điều chỉnh theo yêu cầu của bạn</strong>
                                            <span style={{ fontSize: '15px', lineHeight: '1.6', display: 'block' }}>Chuyên viên đang tiến hành tinh chỉnh lại lịch trình và giá cả dựa trên những góp ý của bạn. Phiên bản tối ưu nhất sẽ sớm được gửi lại tại đây!</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '30px', borderRadius: '12px', color: '#1d4ed8', display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                                        <div style={{ fontSize: '40px' }}>⏳</div>
                                        <div>
                                            <strong style={{ display: 'block', marginBottom: '10px', fontSize: '20px' }}>Đang thiết kế & Lên phương án giá</strong>
                                            <span style={{ fontSize: '15px', lineHeight: '1.6', display: 'block' }}>Hệ thống đã ghi nhận các yêu cầu sở thích của bạn. Chuyên viên của TravelERP đang tiến hành ghép nối các dịch vụ để có mức giá tốt nhất. Nút chốt tour sẽ hiện ra khi có kết quả!</span>
                                        </div>
                                    </div>
                                )}

                                {/* THANH HÀNH ĐỘNG CHỈ HIỆN KHI BẢN QUOTE ĐANG Ở TRẠNG THÁI 'Quote_Sent' */}
                                {selectedQuote.approval_status === 'Quote_Sent' && (
                                    <div style={{ marginTop: '30px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                                        <div style={{ color: '#475569', fontSize: '15px', fontWeight: '500' }}>
                                            Bạn có thể chọn đồng ý chốt phương án này hoặc gửi phản hồi yêu cầu điều chỉnh lại chi tiết hành trình.
                                        </div>
                                        <div style={{ display: 'flex', gap: '15px', flexShrink: 0 }}>
                                            <button onClick={() => setShowRevisionInput(!showRevisionInput)} style={{ padding: '14px 25px', backgroundColor: '#fff', color: '#f97316', border: '2px solid #f97316', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                                                {showRevisionInput ? 'ĐÓNG FORM GHI CHÚ' : 'YÊU CẦU SỬA ĐỔI'}
                                            </button>
                                            <button onClick={handleBookCustomTour} style={{ padding: '14px 30px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)', whiteSpace: 'nowrap' }}>
                                                ĐỒNG Ý & ĐẶT TOUR
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* FORM NHẬP YÊU CẦU ĐIỀU CHỈNH */}
                                {showRevisionInput && (
                                    <div style={{ marginTop: '20px', padding: '25px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '16px', animation: 'fadeIn 0.3s ease' }}>
                                        <h4 style={{ margin: '0 0 12px 0', color: '#c2410c', fontSize: '16px', fontWeight: '700' }}>✍️ Nhập thông tin bạn muốn thay đổi:</h4>
                                        <textarea
                                            value={revisionNote}
                                            onChange={(e) => setRevisionNote(e.target.value)}
                                            placeholder="Ví dụ: Mình muốn đổi sang khách sạn 4 sao gần biển, đổi nhà hàng ngày đầu, hoặc thêm điểm tham quan ngày 2..."
                                            style={{ width: '100%', boxSizing: 'border-box', minHeight: '120px', padding: '15px', borderRadius: '10px', border: '1px solid #fdba74', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', marginBottom: '15px', outline: 'none' }}
                                        />
                                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => setShowRevisionInput(false)} style={{ padding: '10px 20px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', color: '#64748b', fontWeight: '600' }}>Hủy bỏ</button>
                                            <button
                                                onClick={() => {
                                                    if (!revisionNote.trim()) {
                                                        alert("Vui lòng nhập nội dung chi tiết bạn muốn sửa đổi!");
                                                        return;
                                                    }
                                                    handleCustomerAction('Customer_Revision', revisionNote);
                                                }}
                                                style={{ padding: '10px 24px', backgroundColor: '#ea580c', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#fff', fontWeight: '600', boxShadow: '0 2px 4px rgba(234, 88, 12, 0.2)' }}
                                            >
                                                Gửi yêu cầu điều chỉnh
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                                <img src="https://cdn-icons-png.flaticon.com/512/7486/7486831.png" alt="Empty" style={{ width: '150px', opacity: 0.2, marginBottom: '20px' }} />
                                <h3 style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '22px' }}>Chưa chọn báo giá</h3>
                                <p style={{ fontSize: '15px' }}>Vui lòng chọn một chuyến đi ở danh sách bên trái để xem tiến trình thiết kế.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <footer className="home-footer" style={{ marginTop: 'auto' }}>
                <div className="footer-bottom"><p>© 2026 TravelERP System. Tự hào đồng hành cùng bạn.</p></div>
            </footer>
        </div>
    );
};

export default CustomerQuotes;
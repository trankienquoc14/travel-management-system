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
            const response = await axios.get(`http://localhost:5000/api/custom-tours/requests/customer/${userId}`);
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
        // 1. Ưu tiên đọc trạng thái từ bản thiết kế trong bảng custom_tour_quotes
        if (quote.approval_status) {
            switch (quote.approval_status) {
                case 'Quote_Sent':
                    return { text: 'Đã có báo giá mới', color: '#047857', bg: '#d1fae5', icon: '🎉' };
                case 'Customer_Revision':
                    return { text: 'Đang điều chỉnh', color: '#c2410c', bg: '#ffedd5', icon: '✍️' };
                case 'Customer_Accepted':
                    return { text: 'Đã chốt tour', color: '#15803d', bg: '#bbf7d0', icon: '✅' };
                default:
                    return { text: 'Chuyên viên đang thiết kế', color: '#1d4ed8', bg: '#dbeafe', icon: '⚙️' };
            }
        }

        // 2. Nếu chưa có bản thiết kế nào bên bảng Quotes -> Đọc trạng thái Macro bên bảng Request
        if (quote.status === 'Completed') return { text: 'Hoàn thành', color: '#15803d', bg: '#bbf7d0', icon: '✅' };
        if (quote.status === 'Processing') return { text: 'Đang tiếp nhận', color: '#1d4ed8', bg: '#dbeafe', icon: '⚙️' };

        return { text: 'Mới gửi yêu cầu', color: '#d97706', bg: '#fef3c7', icon: '📥' };
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
            <div style={{ flex: 1, padding: '40px 20px' }}>
                <div style={{ maxWidth: '1400px', width: '95%', margin: '0 auto', display: 'flex', gap: '30px', alignItems: 'flex-start' }}>

                    {/* CỘT TRÁI: DANH SÁCH YÊU CẦU */}
                    <div style={{ flex: '0 0 380px', backgroundColor: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px', gap: '15px' }}>
                            <button onClick={() => navigate('/home')} style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: '600', color: '#475569', transition: '0.2s' }}>⬅ Quay lại</button>
                            <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>Đơn của tôi</h3>
                        </div>

                        {quotes.length === 0 ? (
                            <div style={{ padding: '40px 20px', borderRadius: '12px', textAlign: 'center', backgroundColor: '#f8fafc', color: '#64748b', border: '2px dashed #cbd5e1' }}>
                                <div style={{ fontSize: '40px', opacity: 0.5, marginBottom: '10px' }}>🏜️</div>
                                Chưa có chuyến đi nào được thiết kế.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {quotes.map((quote) => {
                                    const statusUI = renderStatusForCustomer(quote);
                                    return (
                                        <div key={quote.request_id} onClick={() => { setSelectedQuote(quote); setShowRevisionInput(false); }}
                                            style={{
                                                padding: '20px', border: '2px solid', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease',
                                                backgroundColor: selectedQuote?.request_id === quote.request_id ? '#eff6ff' : 'white',
                                                borderColor: selectedQuote?.request_id === quote.request_id ? '#3b82f6' : '#e2e8f0',
                                                boxShadow: selectedQuote?.request_id === quote.request_id ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                                <h4 style={{ margin: 0, color: '#0f172a', fontSize: '16px' }}>📍 {quote.destination || 'Chưa cập nhật'}</h4>
                                                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>#{quote.request_id}</span>
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px', display: 'flex', gap: '10px' }}>
                                                <span>📅 {formatDate(quote.departure_date)}</span>
                                                <span>👥 {quote.people_count} khách</span>
                                            </div>
                                            <div>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '12px', color: statusUI.color, backgroundColor: statusUI.bg, padding: '4px 10px', borderRadius: '20px' }}>
                                                    <span>{statusUI.icon}</span> {statusUI.text}
                                                </span>
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
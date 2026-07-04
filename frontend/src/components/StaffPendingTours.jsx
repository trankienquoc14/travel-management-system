import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StaffPendingTours = ({ onEditDesign }) => {
    const [pendingTours, setPendingTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sentStatus, setSentStatus] = useState({});

    useEffect(() => {
        fetchPendingTours();
    }, []);

    const fetchPendingTours = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/custom-tours/requests', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                // CHUẨN HÓA BỘ LỌC:
                // Tour được hiển thị ở trang "Đã thiết kế" này nếu:
                // 1. Đã có bản thiết kế trong bảng custom_tour_quotes (tức là có approval_status hoặc có giá quoted_price > 0)
                // 2. HOẶC đang ở các bước làm việc với khách (Quote_Sent, Customer_Revision, Customer_Accepted)
                const filteredTours = res.data.data.filter((req) => {
                    if (req.status === 'Pending') return false; // Đơn mới nằm ở Inbox

                    return req.approval_status || req.quoted_price > 0 || ['Quote_Sent', 'Customer_Revision', 'Customer_Accepted'].includes(req.status);
                });

                const sortedTours = filteredTours.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setPendingTours(sortedTours);
            }
        } catch (error) {
            console.error('Lỗi tải danh sách tour:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendQuote = async (tour) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/custom-tours/requests/${tour.request_id}/send-notification`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSentStatus(prev => ({ ...prev, [tour.request_id]: true }));
            alert(`Đã gửi báo giá chính thức đến tài khoản của khách hàng ${tour.customer_name}!`);
        } catch (error) {
            console.error('Lỗi gửi báo giá:', error);
            alert('Lỗi khi gửi thông báo cho khách hàng.');
        }
    };

    const formatMoney = (amount) => Number(amount || 0).toLocaleString('vi-VN');

    // UI TRẠNG THÁI: Tách biệt rõ ràng giữa tiến trình với Khách và nội bộ
    const getStatusUI = (req) => {
        // 1. Ưu tiên hiển thị các trạng thái tương tác/duyệt từ BẢNG QUOTES (approval_status)
        if (req.approval_status) {
            switch (req.approval_status) {
                case 'Customer_Accepted':
                    return { bg: '#bbf7d0', color: '#166534', text: '🎉 KHÁCH ĐÃ CHỐT' };
                case 'Customer_Revision':
                    return { bg: '#ffedd5', color: '#c2410c', text: '✍️ KHÁCH YÊU CẦU SỬA' };
                case 'Quote_Sent':
                    return { bg: '#e0e7ff', color: '#4338ca', text: '🚀 ĐÃ GỬI CHO KHÁCH' };
                case 'Approved':
                    return { bg: '#dcfce7', color: '#15803d', text: '✅ QUẢN LÝ ĐÃ DUYỆT' };
                case 'Rejected':
                    return { bg: '#fee2e2', color: '#dc2626', text: '❌ QUẢN LÝ BẮT SỬA' };
                case 'Pending_Approval':  // 👈 CHÌA KHÓA Ở ĐÂY: Phải kiểm tra 'Pending_Approval'
                    return { bg: '#fef3c7', color: '#b45309', text: '⏳ CHỜ QUẢN LÝ DUYỆT' };
                case 'Pending':
                    return { bg: '#f1f5f9', color: '#475569', text: '📝 BẢN NHÁP (ĐANG SỬA)' };
                default:
                    break;
            }
        }

        // 2. Nếu chưa có bản Quote nào -> Đọc trạng thái từ bảng YÊU CẦU GỐC (status)
        if (req.status === 'Processing' || req.request_status === 'Processing') {
            return { bg: '#dbeafe', color: '#1d4ed8', text: '⚙️ ĐANG THIẾT KẾ' };
        }

        return { bg: '#fef9c3', color: '#d97706', text: '📥 MỚI TIẾP NHẬN' };
    };

    return (
        <div style={{ padding: '24px', fontFamily: "'Inter', sans-serif", backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 80px)' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '22px' }}>Tour đã thiết kế</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                        Theo dõi trạng thái phê duyệt từ Quản lý và phản hồi từ Khách hàng.
                    </p>
                </div>
                <div style={{ background: '#e0e7ff', color: '#4338ca', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '14px' }}>
                    Tổng cộng: {pendingTours.length} tour
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Đang tải dữ liệu...</div>
            ) : pendingTours.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <h3 style={{ color: '#475569', margin: '0 0 8px 0' }}>Chưa có bản thiết kế nào</h3>
                    <p style={{ color: '#94a3b8', margin: 0 }}>Bạn chưa có bản thiết kế nào đang trong quá trình theo dõi.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {pendingTours.map((tour) => {
                        const statusUI = getStatusUI(tour);
                        const isSentLocal = sentStatus[tour.request_id];

                        // LOGIC NÚT BẤM CHUẨN XÁC THEO APPROVAL_STATUS:
                        // Nhân viên chỉ được sửa khi: Quản lý từ chối (approval_status === 'Rejected') HOẶC Khách yêu cầu sửa (status === 'Customer_Revision') HOẶC đang làm nháp
                        const canEdit = tour.approval_status === 'Rejected' ||
                            tour.approval_status === 'Customer_Revision' ||
                            (!tour.approval_status && tour.quoted_price > 0);

                        // Được phép bấm gửi cho khách khi Quản lý ĐÃ DUYỆT (approval_status === 'Approved') và chưa gửi
                        const isApprovedReadyToSend = tour.approval_status === 'Approved' &&
                            !isSentLocal &&
                            tour.approval_status !== 'Quote_Sent' &&
                            tour.approval_status !== 'Customer_Accepted';

                        const isAlreadySentToCustomer = tour.status === 'Quote_Sent' || tour.status === 'Customer_Accepted' || isSentLocal;

                        return (
                            <div key={tour.request_id} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <span style={{ background: statusUI.bg, color: statusUI.color, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                                        {statusUI.text}
                                    </span>
                                    <span style={{ color: '#64748b', fontSize: '12px', fontWeight: '500' }}>
                                        Mã YC: #{tour.request_id}
                                    </span>
                                </div>

                                <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#0f172a' }}>
                                    {tour.destination}
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#475569', flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Khách hàng:</span> <strong style={{ color: '#1e293b' }}>{tour.customer_name}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Đoàn:</span> <strong style={{ color: '#1e293b' }}>{tour.people_count} khách</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Giá bán:</span> <strong style={{ color: '#2563eb' }}>{formatMoney(tour.quoted_price || 0)}đ</strong>
                                    </div>
                                </div>

                                {/* Ghi chú Quản lý bắt sửa (lấy từ manager_note của bảng quotes) */}
                                {tour.approval_status === 'Rejected' && tour.manager_note && (
                                    <div style={{ marginTop: '15px', padding: '10px', background: '#fef2f2', borderLeft: '3px solid #ef4444', borderRadius: '4px', fontSize: '12px', color: '#991b1b' }}>
                                        <strong>⚠️ Lời nhắn Quản lý:</strong><br />
                                        {tour.manager_note}
                                    </div>
                                )}

                                {/* Ghi chú Khách yêu cầu sửa (lấy từ staff_note hoặc note của khách) */}
                                {tour.status === 'Customer_Revision' && tour.staff_note && (
                                    <div style={{ marginTop: '15px', padding: '10px', background: '#fff7ed', borderLeft: '3px solid #f97316', borderRadius: '4px', fontSize: '12px', color: '#9a3412' }}>
                                        <strong>🔄 Khách yêu cầu:</strong><br />
                                        {tour.staff_note}
                                    </div>
                                )}

                                <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '16px 0' }} />

                                {/* LOGIC NÚT BẤM */}
                                {canEdit ? (
                                    <button onClick={() => onEditDesign(tour)} style={{ width: '100%', padding: '10px', background: '#f8fafc', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                                        Xem & Chỉnh sửa
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                        <button onClick={() => onEditDesign(tour)} style={{ flex: 1, padding: '10px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                                            Xem chi tiết
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => isApprovedReadyToSend && handleSendQuote(tour)}
                                            disabled={!isApprovedReadyToSend}
                                            style={{
                                                flex: 1.5, padding: '10px',
                                                backgroundColor: isApprovedReadyToSend ? '#10b981' : '#f1f5f9',
                                                color: isApprovedReadyToSend ? '#fff' : '#94a3b8',
                                                border: isApprovedReadyToSend ? 'none' : '1px solid #e2e8f0',
                                                borderRadius: '8px', fontWeight: '600',
                                                cursor: isApprovedReadyToSend ? 'pointer' : 'not-allowed', transition: 'all 0.2s'
                                            }}
                                        >
                                            {isAlreadySentToCustomer ? 'Đã gửi khách' : 'Gửi báo giá'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StaffPendingTours;
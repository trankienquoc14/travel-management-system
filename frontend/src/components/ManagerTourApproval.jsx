import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManagerApproveTours = () => {
    const [pendingTours, setPendingTours] = useState([]);
    const [loading, setLoading] = useState(true);

    // State cho Modal xem chi tiết và duyệt
    const [selectedTour, setSelectedTour] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

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
                // Chỉ lấy những tour đang chờ quản lý duyệt
                const filteredTours = res.data.data.filter(
                    (req) => req.approval_status === 'Pending_Approval'
                );
                setPendingTours(filteredTours);
            }
        } catch (error) {
            console.error('Lỗi tải danh sách tour chờ duyệt:', error);
        } finally {
            setLoading(false);
        }
    };

    // Hàm xử lý Phê duyệt
    const handleApprove = async (tourId) => {
        if (!window.confirm('Bạn có chắc chắn muốn phê duyệt bản thiết kế này?')) return;

        try {
            setActionLoading(true);
            const token = localStorage.getItem('token');

            // 🛑 LƯU Ý BE: Thay đổi endpoint cho phù hợp với API duyệt tour của bạn
            await axios.put(`http://localhost:5000/api/custom-tours/requests/${tourId}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert('✅ Đã phê duyệt tour thành công!');
            setSelectedTour(null);
            fetchPendingTours(); // Refresh lại danh sách
        } catch (error) {
            console.error('Lỗi khi duyệt tour:', error);
            alert('❌ Có lỗi xảy ra khi phê duyệt.');
        } finally {
            setActionLoading(false);
        }
    };

    // Hàm xử lý Yêu cầu chỉnh sửa
    const handleReject = async (tourId) => {
        if (!feedback.trim()) {
            alert('Vui lòng nhập lý do / yêu cầu chỉnh sửa cho nhân viên!');
            return;
        }

        try {
            setActionLoading(true);
            const token = localStorage.getItem('token');

            // 🛑 LƯU Ý BE: Thay đổi endpoint cho phù hợp với API từ chối/yêu cầu sửa
            await axios.put(`http://localhost:5000/api/custom-tours/requests/${tourId}/reject`,
                { note: feedback }, // Gửi kèm feedback cho nhân viên
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert('⚠️ Đã gửi yêu cầu chỉnh sửa lại cho nhân viên!');
            setSelectedTour(null);
            setFeedback('');
            fetchPendingTours(); // Refresh lại danh sách
        } catch (error) {
            console.error('Lỗi khi từ chối tour:', error);
            alert('❌ Có lỗi xảy ra khi gửi yêu cầu chỉnh sửa.');
        } finally {
            setActionLoading(false);
        }
    };

    const formatMoney = (amount) => Number(amount || 0).toLocaleString('vi-VN');

    return (
        <div style={{ padding: '24px', fontFamily: "'Inter', sans-serif", backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 80px)', position: 'relative' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '22px' }}>Phê duyệt thiết kế Tour</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                        Xem xét và đưa ra quyết định cho các bản thiết kế tour từ nhân viên sales.
                    </p>
                </div>
                <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '8px 16px', borderRadius: '8px', fontWeight: '600' }}>
                    Cần duyệt: {pendingTours.length} tour
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Đang tải dữ liệu...</div>
            ) : pendingTours.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎉</div>
                    <h3 style={{ color: '#475569', margin: '0 0 8px 0' }}>Tuyệt vời, không có tour nào tồn đọng!</h3>
                    <p style={{ color: '#94a3b8', margin: 0 }}>Tất cả các thiết kế tour đều đã được xử lý.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                    {pendingTours.map((tour) => (
                        <div key={tour.request_id} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                                    Đợi quản lý duyệt
                                </span>
                                <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                                    {new Date(tour.departure_date).toLocaleDateString('vi-VN')}
                                </span>
                            </div>

                            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1e293b' }}>
                                {tour.destination}
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#475569', flex: 1 }}>
                                <div>👤 Khách: <strong>{tour.customer_name}</strong></div>
                                <div>👥 Số lượng: <strong>{tour.people_count} người</strong></div>
                                <div>💰 Giá đề xuất: <strong style={{ color: '#16a34a' }}>{formatMoney(tour.quoted_price || 0)}đ</strong></div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '16px 0' }} />

                            <button
                                onClick={() => { setSelectedTour(tour); setFeedback(''); }}
                                style={{ width: '100%', padding: '10px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', gap: '8px' }}
                                onMouseOver={(e) => { e.target.style.background = '#334155'; }}
                                onMouseOut={(e) => { e.target.style.background = '#1e293b'; }}
                            >
                                Xem chi tiết & Duyệt
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL XEM CHI TIẾT & DUYỆT */}
            {/* MODAL XEM CHI TIẾT & DUYỆT */}
            {selectedTour && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '95%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                            Bản thiết kế tour: {selectedTour.destination}
                        </h3>

                        <div style={{ overflowY: 'auto', paddingRight: '8px', flex: 1 }}>
                            {/* THÔNG TIN CHUNG */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                                <div>
                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Tên khách hàng</p>
                                    <p style={{ margin: 0, fontWeight: '600' }}>{selectedTour.customer_name}</p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Ngày khởi hành</p>
                                    <p style={{ margin: 0, fontWeight: '600' }}>{new Date(selectedTour.departure_date).toLocaleDateString('vi-VN')}</p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Số lượng khách</p>
                                    <p style={{ margin: 0, fontWeight: '600' }}>{selectedTour.people_count} người</p>
                                </div>
                            </div>

                            {/* TÀI CHÍNH */}
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#1e293b' }}>💰 Phân tích tài chính</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px' }}>
                                <div>
                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Tổng chi phí gốc</p>
                                    <p style={{ margin: 0, fontWeight: '600', color: '#ef4444', fontSize: '16px' }}>
                                        {/* Chuyển thành base_cost khớp với Database mới thêm */}
                                        {formatMoney(selectedTour.base_cost || 0)} đ
                                    </p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Giá đề xuất bán</p>
                                    <p style={{ margin: 0, fontWeight: '600', color: '#16a34a', fontSize: '16px' }}>
                                        {formatMoney(selectedTour.quoted_price || 0)} đ
                                    </p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Lợi nhuận dự kiến</p>
                                    <p style={{ margin: 0, fontWeight: '600', color: '#3b82f6', fontSize: '16px' }}>
                                        {formatMoney((selectedTour.quoted_price || 0) - (selectedTour.base_cost || 0))} đ
                                    </p>
                                </div>
                            </div>

                            {/* LỊCH TRÌNH CHI TIẾT */}
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#1e293b' }}>🗺️ Lịch trình thiết kế chi tiết</h4>
                            <div style={{ marginBottom: '24px' }}>
                                {(() => {
                                    if (!selectedTour.proposed_itinerary) {
                                        return <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b' }}>Chưa có thông tin lịch trình chi tiết.</div>;
                                    }

                                    try {
                                        const parsedItinerary = JSON.parse(selectedTour.proposed_itinerary);

                                        // ƯU TIÊN SỬ DỤNG DỮ LIỆU CẤU TRÚC (dragDropState) ĐỂ RENDER UI ĐẸP
                                        if (parsedItinerary.dragDropState && parsedItinerary.dragDropState.itineraryDays) {
                                            const days = parsedItinerary.dragDropState.itineraryDays;
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    {days.map((day) => (
                                                        <div key={day.dayIndex} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                            {/* Header của Ngày */}
                                                            <div style={{ background: '#eff6ff', padding: '12px 16px', borderBottom: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontWeight: '700', color: '#1d4ed8', fontSize: '15px' }}>
                                                                    NGÀY {day.dayIndex}
                                                                </span>
                                                                <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '600', backgroundColor: '#dbeafe', padding: '4px 10px', borderRadius: '20px' }}>
                                                                    🗓️ {day.dateString}
                                                                </span>
                                                            </div>

                                                            {/* Nội dung các buổi trong ngày */}
                                                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                                                {/* Sáng */}
                                                                {day.slots.morning && day.slots.morning.length > 0 && (
                                                                    <div style={{ display: 'flex', gap: '12px' }}>
                                                                        <div style={{ width: '105px', flexShrink: 0, color: '#d97706', fontSize: '13px', fontWeight: '700', marginTop: '8px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                                                            <span style={{ fontSize: '16px', lineHeight: '1.2' }}>🌅</span>
                                                                            <span style={{ lineHeight: '1.3' }}>BUỔI SÁNG</span>
                                                                        </div>
                                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid #fde68a', paddingLeft: '16px' }}>
                                                                            {day.slots.morning.map((item, idx) => (
                                                                                <div key={idx} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', color: '#334155', border: '1px solid #f1f5f9' }}>
                                                                                    <strong>{item.name}</strong>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Trưa */}
                                                                {day.slots.noon && day.slots.noon.length > 0 && (
                                                                    <div style={{ display: 'flex', gap: '12px' }}>
                                                                        <div style={{ width: '105px', flexShrink: 0, color: '#ea580c', fontSize: '13px', fontWeight: '700', marginTop: '8px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                                                            <span style={{ fontSize: '16px', lineHeight: '1.2' }}>☀️</span>
                                                                            <span style={{ lineHeight: '1.3' }}>BUỔI TRƯA</span>
                                                                        </div>
                                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid #fdba74', paddingLeft: '16px' }}>
                                                                            {day.slots.noon.map((item, idx) => (
                                                                                <div key={idx} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', color: '#334155', border: '1px solid #f1f5f9' }}>
                                                                                    <strong>{item.name}</strong>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Chiều / Tối */}
                                                                {day.slots.evening && day.slots.evening.length > 0 && (
                                                                    <div style={{ display: 'flex', gap: '12px' }}>
                                                                        <div style={{ width: '105px', flexShrink: 0, color: '#4f46e5', fontSize: '13px', fontWeight: '700', marginTop: '8px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                                                            <span style={{ fontSize: '16px', lineHeight: '1.2' }}>🌙</span>
                                                                            <span style={{ lineHeight: '1.3' }}>BUỔI TỐI</span>
                                                                        </div>
                                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid #a5b4fc', paddingLeft: '16px' }}>
                                                                            {day.slots.evening.map((item, idx) => (
                                                                                <div key={idx} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', color: '#334155', border: '1px solid #f1f5f9' }}>
                                                                                    <strong>{item.name}</strong>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        }

                                        // FALLBACK: Trả về dạng text nếu không có cấu trúc dragDropState (đề phòng bug hoặc dữ liệu cũ)
                                        if (parsedItinerary.textVersion) {
                                            return (
                                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-line', fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
                                                    {parsedItinerary.textVersion}
                                                </div>
                                            );
                                        }

                                    } catch (e) {
                                        // FALLBACK TRƯỜNG HỢP XẤU NHẤT: Trả về text thuần nếu không phải JSON
                                        return (
                                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-line', fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
                                                {selectedTour.proposed_itinerary}
                                            </div>
                                        );
                                    }
                                })()}
                            </div>

                            {/* GHI CHÚ TỪ CHỐI */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                                    Ghi chú yêu cầu chỉnh sửa (Bắt buộc nếu chọn "Yêu cầu sửa")
                                </label>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Ví dụ: Giá vốn quá cao, thử đổi khách sạn sang Mường Thanh xem sao..."
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                                />
                            </div>
                        </div>

                        {/* BUTTONS */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
                            <button onClick={() => setSelectedTour(null)} disabled={actionLoading} style={{ padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                                Đóng
                            </button>
                            <button onClick={() => handleReject(selectedTour.request_id)} disabled={actionLoading} style={{ padding: '10px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                                Yêu cầu sửa
                            </button>
                            <button onClick={() => handleApprove(selectedTour.request_id)} disabled={actionLoading} style={{ padding: '10px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                                Phê duyệt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerApproveTours;
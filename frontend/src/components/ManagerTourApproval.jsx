import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManagerApproveTours = () => {
    // 1. Quản lý Tab
    const [activeTab, setActiveTab] = useState('custom'); // 'custom' hoặc 'fixed'

    // 2. Dữ liệu danh sách
    const [pendingTours, setPendingTours] = useState([]); // Tour Thiết Kế Riêng
    const [pendingFixedTours, setPendingFixedTours] = useState([]); // Tour Cố Định
    const [loading, setLoading] = useState(true);

    // 3. State cho Modal xem chi tiết
    const [selectedTour, setSelectedTour] = useState(null); // Dành cho Tour Riêng
    const [selectedFixedTour, setSelectedFixedTour] = useState(null); // Dành cho Tour Cố Định

    const [feedback, setFeedback] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    // FETCH DỮ LIỆU SONG SONG VÀ ÁP DỤNG BỘ LỌC CHUẨN
    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const [resCustom, resFixed] = await Promise.all([
                axios.get('http://localhost:5000/api/custom-tours/requests', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/staff/tours', { headers: { Authorization: `Bearer ${token}` } }) // Gọi API Staff để lấy tour Pending
            ]);

            // Lọc Tour Thiết Kế Riêng (Mở rộng điều kiện)
            if (resCustom.data.success) {
                const filteredCustom = resCustom.data.data.filter(
                    (req) => req.status === 'Pending_Approval' ||
                        req.approval_status === 'Pending_Approval' ||
                        req.status === 'Designed' ||
                        req.status === 'Pending'
                );
                setPendingTours(filteredCustom);
            }

            // Lọc Tour Cố Định
            if (resFixed.data.success) {
                const filteredFixed = resFixed.data.data.filter(t => t.status === 'Pending');
                setPendingFixedTours(filteredFixed);
            }
        } catch (error) {
            console.error('Lỗi tải danh sách tour chờ duyệt:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (amount) => Number(amount || 0).toLocaleString('vi-VN');

    // ==========================================================
    // CÁC HÀM XỬ LÝ TOUR THIẾT KẾ RIÊNG (GIỮ NGUYÊN CỦA BẠN)
    // ==========================================================
    const handleApprove = async (tourId) => {
        if (!window.confirm('Bạn có chắc chắn muốn phê duyệt bản thiết kế này?')) return;
        try {
            setActionLoading(true);
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/custom-tours/requests/${tourId}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('✅ Đã phê duyệt tour thành công!');
            setSelectedTour(null);
            fetchData();
        } catch (error) {
            alert('❌ Có lỗi xảy ra khi phê duyệt.');
        } finally { setActionLoading(false); }
    };

    const handleReject = async (tourId) => {
        if (!feedback.trim()) return alert('Vui lòng nhập lý do / yêu cầu chỉnh sửa cho nhân viên!');
        try {
            setActionLoading(true);
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/custom-tours/requests/${tourId}/reject`,
                { note: feedback },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('⚠️ Đã gửi yêu cầu chỉnh sửa lại cho nhân viên!');
            setSelectedTour(null);
            setFeedback('');
            fetchData();
        } catch (error) {
            alert('❌ Có lỗi xảy ra khi gửi yêu cầu chỉnh sửa.');
        } finally { setActionLoading(false); }
    };

    // ==========================================================
    // XỬ LÝ: TOUR CỐ ĐỊNH (FIXED)
    // ==========================================
    const handleViewFixedDetail = async (tourInfo) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/staff/tours/${tourInfo.tour_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                // 🚀 CHỐT CHẶN BẢO VỆ: Tự động bóc tách nếu Backend trả về Mảng (Array) thay vì Object
                let tourData = res.data.data;
                while (Array.isArray(tourData)) {
                    tourData = tourData[0]; // Lấy phần tử thực chất bên trong
                }

                // Nếu tourData hợp lệ, cập nhật vào State để render ra màn hình
                if (tourData) {
                    setSelectedFixedTour(tourData);
                    setFeedback('');
                }
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi tải chi tiết tour cố định!');
        }
    };

    const handleUpdateFixedStatus = async (id, status) => {
        const actionName = status === 'Active' ? 'PHÊ DUYỆT' : 'TỪ CHỐI';
        if (!window.confirm(`Bạn chắc chắn muốn ${actionName} tour này chứ?`)) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/tours/admin/status/${id}`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`✅ Đã ${status === 'Active' ? 'phê duyệt mở bán' : 'từ chối'} tour cố định thành công!`);
            setSelectedFixedTour(null);
            fetchData();
        } catch (error) { alert('Lỗi khi cập nhật trạng thái tour cố định!'); }
        finally { setActionLoading(false); }
    };

    return (
        <div style={{ padding: '24px', fontFamily: "'Inter', sans-serif", backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 80px)', position: 'relative' }}>

            {/* HEADER */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '22px' }}>Phê duyệt thiết kế Tour</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                        Xem xét và đưa ra quyết định cho các bản thiết kế tour từ nhân viên.
                    </p>
                </div>
                <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '8px 16px', borderRadius: '8px', fontWeight: '600' }}>
                    Cần duyệt: {pendingTours.length + pendingFixedTours.length} tour
                </div>
            </div>

            {/* THANH TAB CHUYỂN ĐỔI */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '24px' }}>
                <button onClick={() => setActiveTab('custom')} style={{ padding: '12px 24px', borderRadius: '10px', border: activeTab === 'custom' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: activeTab === 'custom' ? '#eff6ff' : '#fff', color: activeTab === 'custom' ? '#1d4ed8' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                    🛎️ Yêu Cầu Thiết Kế Riêng ({pendingTours.length})
                </button>
                <button onClick={() => setActiveTab('fixed')} style={{ padding: '12px 24px', borderRadius: '10px', border: activeTab === 'fixed' ? '2px solid #10b981' : '1px solid #cbd5e1', background: activeTab === 'fixed' ? '#ecfdf5' : '#fff', color: activeTab === 'fixed' ? '#047857' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                    🗺️ Sản Phẩm Tour Cố Định ({pendingFixedTours.length})
                </button>
            </div>

            {/* DANH SÁCH TOUR */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Đang tải dữ liệu...</div>
            ) : (activeTab === 'custom' && pendingTours.length === 0) || (activeTab === 'fixed' && pendingFixedTours.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎉</div>
                    <h3 style={{ color: '#475569', margin: '0 0 8px 0' }}>Tuyệt vời, không có tour nào tồn đọng!</h3>
                    <p style={{ color: '#94a3b8', margin: 0 }}>Tất cả các thiết kế tour trong mục này đều đã được xử lý.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>

                    {/* RENDER TOUR RIÊNG (GIỮ NGUYÊN CỦA BẠN) */}
                    {activeTab === 'custom' && pendingTours.map((tour) => (
                        <div key={tour.request_id} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>Đợi quản lý duyệt</span>
                                <span style={{ color: '#94a3b8', fontSize: '12px' }}>{new Date(tour.departure_date).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1e293b' }}>{tour.destination}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#475569', flex: 1 }}>
                                <div>👤 Khách: <strong>{tour.customer_name || 'Khách vãng lai'}</strong></div>
                                <div>👥 Số lượng: <strong>{tour.people_count} người</strong></div>
                                <div>💰 Giá đề xuất: <strong style={{ color: '#16a34a' }}>{formatMoney(tour.quoted_price || 0)}đ</strong></div>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '16px 0' }} />
                            <button onClick={() => { setSelectedTour(tour); setFeedback(''); }} style={{ width: '100%', padding: '10px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                Xem chi tiết & Duyệt
                            </button>
                        </div>
                    ))}

                    {/* RENDER TOUR CỐ ĐỊNH */}
                    {activeTab === 'fixed' && pendingFixedTours.map((tour) => (
                        <div key={tour.tour_id} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>Sản phẩm mới</span>
                                <span style={{ color: '#94a3b8', fontSize: '12px' }}>Mã: #{tour.tour_id}</span>
                            </div>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1e293b' }}>{tour.tour_name}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#475569', flex: 1 }}>
                                <div>📍 Tuyến đường: <strong>{tour.destination}</strong></div>
                                <div>⏱️ Thời gian: <strong>{tour.duration_days} Ngày</strong></div>
                                <div>💰 Giá bán dự kiến: <strong style={{ color: '#ea580c' }}>{formatMoney(tour.base_price || 0)}đ</strong></div>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '16px 0' }} />
                            <button onClick={() => handleViewFixedDetail(tour)} style={{ width: '100%', padding: '10px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                Xem chi tiết & Duyệt
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL XEM CHI TIẾT & DUYỆT TOUR RIÊNG (CỦA BẠN GIỮ NGUYÊN) */}
            {/* ========================================================= */}
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
                                    <p style={{ margin: 0, fontWeight: '600' }}>{selectedTour.customer_name || 'Khách vãng lai'}</p>
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
                                    <p style={{ margin: 0, fontWeight: '600', color: '#ef4444', fontSize: '16px' }}>{formatMoney(selectedTour.base_cost || 0)} đ</p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Giá đề xuất bán</p>
                                    <p style={{ margin: 0, fontWeight: '600', color: '#16a34a', fontSize: '16px' }}>{formatMoney(selectedTour.quoted_price || 0)} đ</p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Lợi nhuận dự kiến</p>
                                    <p style={{ margin: 0, fontWeight: '600', color: '#3b82f6', fontSize: '16px' }}>{formatMoney((selectedTour.quoted_price || 0) - (selectedTour.base_cost || 0))} đ</p>
                                </div>
                            </div>

                            {/* LỊCH TRÌNH CHI TIẾT */}
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#1e293b' }}>🗺️ Lịch trình thiết kế chi tiết</h4>
                            <div style={{ marginBottom: '24px' }}>
                                {(() => {
                                    if (!selectedTour.proposed_itinerary) return <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b' }}>Chưa có thông tin lịch trình chi tiết.</div>;
                                    try {
                                        const parsedItinerary = JSON.parse(selectedTour.proposed_itinerary);
                                        if (parsedItinerary.dragDropState && parsedItinerary.dragDropState.itineraryDays) {
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    {/* DỊCH VỤ CỐ ĐỊNH (KHÁCH SẠN & XE) CHO TOUR RIÊNG */}
                                                    {parsedItinerary.dragDropState.fixedServices && (
                                                        <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                                                            <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '8px' }}>🏨 Dịch vụ Lưu trú</strong>
                                                                {parsedItinerary.dragDropState.fixedServices.accommodation?.length > 0 ?
                                                                    parsedItinerary.dragDropState.fixedServices.accommodation.map(a => <div key={a.id} style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{a.name}</div>)
                                                                    : <span style={{ fontSize: '13px', color: '#94a3b8' }}>Chưa chọn khách sạn</span>
                                                                }
                                                            </div>
                                                            <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '8px' }}>✈️ Phương tiện Di chuyển</strong>
                                                                {parsedItinerary.dragDropState.fixedServices.transport?.length > 0 ?
                                                                    parsedItinerary.dragDropState.fixedServices.transport.map(t => <div key={t.id} style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{t.name}</div>)
                                                                    : <span style={{ fontSize: '13px', color: '#94a3b8' }}>Chưa chọn phương tiện</span>
                                                                }
                                                            </div>
                                                        </div>
                                                    )}

                                                    {parsedItinerary.dragDropState.itineraryDays.map((day) => (
                                                        <div key={day.dayIndex} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                            <div style={{ background: '#eff6ff', padding: '12px 16px', borderBottom: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontWeight: '700', color: '#1d4ed8', fontSize: '15px' }}>NGÀY {day.dayIndex}</span>
                                                                <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '600', backgroundColor: '#dbeafe', padding: '4px 10px', borderRadius: '20px' }}>🗓️ {day.dateString}</span>
                                                            </div>
                                                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                                {['morning', 'noon', 'evening'].map(slot => {
                                                                    if (!day.slots[slot] || day.slots[slot].length === 0) return null;
                                                                    const slotConfig = {
                                                                        morning: { icon: '🌅', name: 'BUỔI SÁNG', color: '#d97706', border: '#fde68a' },
                                                                        noon: { icon: '☀️', name: 'BUỔI TRƯA', color: '#ea580c', border: '#fdba74' },
                                                                        evening: { icon: '🌙', name: 'BUỔI TỐI', color: '#4f46e5', border: '#a5b4fc' }
                                                                    }[slot];
                                                                    return (
                                                                        <div key={slot} style={{ display: 'flex', gap: '12px' }}>
                                                                            <div style={{ width: '105px', flexShrink: 0, color: slotConfig.color, fontSize: '13px', fontWeight: '700', marginTop: '8px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                                                                <span style={{ fontSize: '16px' }}>{slotConfig.icon}</span> <span>{slotConfig.name}</span>
                                                                            </div>
                                                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: `3px solid ${slotConfig.border}`, paddingLeft: '16px' }}>
                                                                                {day.slots[slot].map((item, idx) => (
                                                                                    <div key={idx} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', color: '#334155', border: '1px solid #f1f5f9' }}>
                                                                                        <strong>{item.name}</strong>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        }
                                        if (parsedItinerary.textVersion) return <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-line', fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>{parsedItinerary.textVersion}</div>;
                                    } catch (e) {
                                        return <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-line', fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>{selectedTour.proposed_itinerary}</div>;
                                    }
                                })()}
                            </div>

                            {/* GHI CHÚ TỪ CHỐI */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ display: 'block', margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>Ghi chú yêu cầu chỉnh sửa (Bắt buộc nếu chọn "Yêu cầu sửa")</label>
                                <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Ví dụ: Giá vốn quá cao..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                            </div>
                        </div>

                        {/* BUTTONS */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
                            <button onClick={() => setSelectedTour(null)} disabled={actionLoading} style={{ padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Đóng</button>
                            <button onClick={() => handleReject(selectedTour.request_id)} disabled={actionLoading} style={{ padding: '10px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Yêu cầu sửa</button>
                            <button onClick={() => handleApprove(selectedTour.request_id)} disabled={actionLoading} style={{ padding: '10px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Phê duyệt</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL XEM CHI TIẾT & DUYỆT TOUR CỐ ĐỊNH (MỚI THÊM)        */}
            {/* ========================================================= */}
            {selectedFixedTour && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '95%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', color: '#047857' }}>
                            Thẩm định Sản phẩm: {selectedFixedTour.tour_name}
                        </h3>
                        <div style={{ overflowY: 'auto', paddingRight: '8px', flex: 1 }}>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                                <div><p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Tuyến đường</p><p style={{ margin: 0, fontWeight: '600' }}>{selectedFixedTour.destination}</p></div>
                                <div><p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Thời gian</p><p style={{ margin: 0, fontWeight: '600' }}>{selectedFixedTour.duration_days} Ngày</p></div>
                            </div>

                            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#1e293b' }}>💰 Cơ cấu giá bán</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px' }}>
                                <div><p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Chi phí dịch vụ gốc</p><p style={{ margin: 0, fontWeight: '600', color: '#ef4444', fontSize: '16px' }}>{formatMoney(selectedFixedTour.base_cost)} đ</p></div>
                                <div><p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Lợi nhuận (Markup)</p><p style={{ margin: 0, fontWeight: '600', color: '#3b82f6', fontSize: '16px' }}>{selectedFixedTour.markup_percent}%</p></div>
                                <div><p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Giá bán ra thị trường</p><p style={{ margin: 0, fontWeight: '600', color: '#ea580c', fontSize: '16px' }}>{formatMoney(selectedFixedTour.base_price)} đ</p></div>
                            </div>

                            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#1e293b' }}>🗺️ Lịch trình chi tiết</h4>
                            <div style={{ marginBottom: '24px' }}>
                                {(() => {
                                    if (!selectedFixedTour.design_data) return <span style={{ color: '#64748b' }}>Chưa có chi tiết lịch trình.</span>;
                                    try {
                                        const parsedDesign = typeof selectedFixedTour.design_data === 'string' ? JSON.parse(selectedFixedTour.design_data) : selectedFixedTour.design_data;

                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                {/* DỊCH VỤ CỐ ĐỊNH (KHÁCH SẠN & XE) CHO TOUR CỐ ĐỊNH */}
                                                {parsedDesign.fixedServices && (
                                                    <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                                                        <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                            <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '8px' }}>🏨 Dịch vụ Lưu trú</strong>
                                                            {parsedDesign.fixedServices.accommodation?.length > 0 ?
                                                                parsedDesign.fixedServices.accommodation.map(a => <div key={a.id} style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{a.name}</div>)
                                                                : <span style={{ fontSize: '13px', color: '#94a3b8' }}>Chưa chọn khách sạn</span>
                                                            }
                                                        </div>
                                                        <div style={{ flex: 1, background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                            <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '8px' }}>✈️ Phương tiện Di chuyển</strong>
                                                            {parsedDesign.fixedServices.transport?.length > 0 ?
                                                                parsedDesign.fixedServices.transport.map(t => <div key={t.id} style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>{t.name}</div>)
                                                                : <span style={{ fontSize: '13px', color: '#94a3b8' }}>Chưa chọn phương tiện</span>
                                                            }
                                                        </div>
                                                    </div>
                                                )}

                                                {parsedDesign.itineraryDays.map((day) => (
                                                    <div key={day.dayIndex} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                        <div style={{ background: '#ecfdf5', padding: '12px 16px', borderBottom: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: '700', color: '#047857', fontSize: '15px' }}>NGÀY {day.dayIndex}</span>
                                                            <span style={{ fontSize: '13px', color: '#059669', fontWeight: '600', backgroundColor: '#d1fae5', padding: '4px 10px', borderRadius: '20px' }}>🗓️ {day.dateString || `Ngày ${day.dayIndex}`}</span>
                                                        </div>
                                                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                            {['morning', 'noon', 'evening'].map(slot => {
                                                                if (!day.slots[slot] || day.slots[slot].length === 0) return null;
                                                                const slotConfig = {
                                                                    morning: { icon: '🌅', name: 'BUỔI SÁNG', color: '#d97706', border: '#fde68a' },
                                                                    noon: { icon: '☀️', name: 'BUỔI TRƯA', color: '#ea580c', border: '#fdba74' },
                                                                    evening: { icon: '🌙', name: 'BUỔI TỐI', color: '#4f46e5', border: '#a5b4fc' }
                                                                }[slot];
                                                                return (
                                                                    <div key={slot} style={{ display: 'flex', gap: '12px' }}>
                                                                        <div style={{ width: '105px', flexShrink: 0, color: slotConfig.color, fontSize: '13px', fontWeight: '700', marginTop: '8px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                                                            <span style={{ fontSize: '16px' }}>{slotConfig.icon}</span> <span>{slotConfig.name}</span>
                                                                        </div>
                                                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: `3px solid ${slotConfig.border}`, paddingLeft: '16px' }}>
                                                                            {day.slots[slot].map((item, idx) => (
                                                                                <div key={idx} style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', color: '#334155', border: '1px solid #f1f5f9' }}>
                                                                                    <strong>{item.name}</strong>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    } catch (e) { return <span>Lỗi hiển thị lịch trình.</span>; }
                                })()}
                            </div>
                        </div>

                        {/* BUTTONS */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
                            <button onClick={() => setSelectedFixedTour(null)} disabled={actionLoading} style={{ padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Đóng</button>
                            <button onClick={() => handleUpdateFixedStatus(selectedFixedTour.tour_id, 'Rejected')} disabled={actionLoading} style={{ padding: '10px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>❌ Từ chối</button>
                            <button onClick={() => handleUpdateFixedStatus(selectedFixedTour.tour_id, 'Active')} disabled={actionLoading} style={{ padding: '10px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>✅ Phê duyệt & Mở Bán</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ManagerApproveTours;
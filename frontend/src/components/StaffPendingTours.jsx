import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StaffPendingTours = ({ onEditDesign, onEditFixedDesign }) => {
    // 1. Quản lý Tab
    const [activeTab, setActiveTab] = useState('custom'); // 'custom' hoặc 'fixed'

    // 2. Dữ liệu danh sách
    const [pendingTours, setPendingTours] = useState([]); // Tour thiết kế riêng
    const [fixedTours, setFixedTours] = useState([]); // Tour cố định
    const [loading, setLoading] = useState(true);
    const [sentStatus, setSentStatus] = useState({});

    // 3. State cho Modal xem chi tiết Tour Cố Định
    const [viewingFixedTour, setViewingFixedTour] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Gọi song song 2 API lấy dữ liệu
            const [resCustom, resFixed] = await Promise.all([
                axios.get('http://localhost:5000/api/custom-tours/requests', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/staff/tours', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            // Xử lý Tour Thiết kế riêng
            if (resCustom.data.success) {
                const filteredCustom = resCustom.data.data.filter((req) => {
                    if (req.status === 'Pending') return false; 
                    return req.approval_status || req.quoted_price > 0 || ['Quote_Sent', 'Customer_Revision', 'Customer_Accepted'].includes(req.status);
                });
                setPendingTours(filteredCustom);

                const statusMap = {};
                filteredCustom.forEach(tour => {
                    if (tour.status === 'Quote_Sent' || tour.status === 'Customer_Revision' || tour.status === 'Customer_Accepted') {
                        statusMap[tour.request_id] = true;
                    }
                });
                setSentStatus(statusMap);
            }

            // Xử lý Tour Cố định
            if (resFixed.data.success) {
                setFixedTours(resFixed.data.data);
            }
        } catch (error) {
            console.error('Lỗi tải danh sách:', error);
        } finally {
            setLoading(false);
        }
    };

    // Hàm gọi API lấy chi tiết Tour Cố Định để bung Modal
    const handleViewFixedDetail = async (tourInfo) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/staff/tours/${tourInfo.tour_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                // CHỐT CHẶN: Đề phòng backend trả về Array thay vì Object
                let tourData = res.data.data;
                while (Array.isArray(tourData)) {
                    tourData = tourData[0];
                }
                if (tourData) {
                    setViewingFixedTour(tourData);
                }
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi tải chi tiết tour cố định!');
        }
    };

    // Hàm gửi báo giá cho khách (Tour thiết kế riêng)
    const handleSendQuote = async (tour) => {
        if (!window.confirm(`Bạn muốn gửi báo giá ${Number(tour.quoted_price).toLocaleString('vi-VN')}đ cho khách hàng ${tour.customer_name}?`)) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`http://localhost:5000/api/custom-tours/requests/${tour.request_id}/send-quote`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                alert('Đã gửi báo giá cho khách hàng thành công!');
                setSentStatus(prev => ({ ...prev, [tour.request_id]: true }));
                fetchData(); 
            }
        } catch (error) {
            alert('Có lỗi xảy ra khi gửi báo giá.');
        }
    };

    const formatMoney = (amount) => Number(amount || 0).toLocaleString('vi-VN');

    return (
        <div style={{ padding: '24px', fontFamily: "'Inter', sans-serif", backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 80px)' }}>
            
            {/* HEADER */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '22px' }}>Tiến độ Công việc</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                        Theo dõi trạng thái các bản thiết kế và sản phẩm tour của bạn.
                    </p>
                </div>
                <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '8px 16px', borderRadius: '8px', fontWeight: '600' }}>
                    Tổng hồ sơ: {pendingTours.length + fixedTours.length}
                </div>
            </div>

            {/* THANH TAB CHUYỂN ĐỔI */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '24px' }}>
                <button 
                    onClick={() => setActiveTab('custom')} 
                    style={{ padding: '12px 24px', borderRadius: '10px', border: activeTab === 'custom' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: activeTab === 'custom' ? '#eff6ff' : '#fff', color: activeTab === 'custom' ? '#1d4ed8' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    🛎️ Hồ sơ Thiết Kế Riêng ({pendingTours.length})
                </button>
                <button 
                    onClick={() => setActiveTab('fixed')} 
                    style={{ padding: '12px 24px', borderRadius: '10px', border: activeTab === 'fixed' ? '2px solid #10b981' : '1px solid #cbd5e1', background: activeTab === 'fixed' ? '#ecfdf5' : '#fff', color: activeTab === 'fixed' ? '#047857' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    🗺️ Sản phẩm Tour Cố Định ({fixedTours.length})
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Đang tải dữ liệu...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                    
                    {/* ======================================================== */}
                    {/* TAB 1: TOUR THIẾT KẾ RIÊNG */}
                    {/* ======================================================== */}
                    {activeTab === 'custom' && pendingTours.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                            Không có hồ sơ tour thiết kế riêng nào đang xử lý.
                        </div>
                    )}
                    {activeTab === 'custom' && pendingTours.map((tour) => {
                        const isManagerRejected = tour.approval_status === 'Rejected';
                        const isManagerApproved = tour.approval_status === 'Approved';
                        const isPendingApproval = tour.approval_status === 'Pending_Approval';
                        const isAlreadySentToCustomer = sentStatus[tour.request_id] || ['Quote_Sent', 'Customer_Revision', 'Customer_Accepted'].includes(tour.status);
                        const isApprovedReadyToSend = isManagerApproved && !isAlreadySentToCustomer;

                        return (
                            <div key={tour.request_id} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: isManagerRejected ? '1px solid #fca5a5' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <span style={{ 
                                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                                        backgroundColor: isManagerRejected ? '#fee2e2' : isPendingApproval ? '#fef3c7' : isAlreadySentToCustomer ? '#dcfce7' : '#e0e7ff',
                                        color: isManagerRejected ? '#dc2626' : isPendingApproval ? '#d97706' : isAlreadySentToCustomer ? '#16a34a' : '#4f46e5'
                                    }}>
                                        {isManagerRejected ? '❌ Sếp yêu cầu sửa' : isPendingApproval ? '⏳ Đang chờ sếp duyệt' : isAlreadySentToCustomer ? '✅ Đã báo giá khách' : '✨ Đã duyệt - Chờ gửi khách'}
                                    </span>
                                    <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500' }}>#{tour.request_id}</span>
                                </div>
                                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1e293b' }}>{tour.destination}</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#475569', flex: 1 }}>
                                    <div>👤 Khách: <strong>{tour.customer_name || 'Khách vãng lai'}</strong></div>
                                    <div>⏱️ Lịch: <strong>{new Date(tour.departure_date).toLocaleDateString('vi-VN')}</strong></div>
                                    <div>💰 Báo giá: <strong style={{ color: '#059669' }}>{formatMoney(tour.quoted_price)}đ</strong></div>
                                </div>
                                
                                {isManagerRejected && tour.manager_note && (
                                    <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '4px', fontSize: '13px', color: '#991b1b' }}>
                                        <strong>Sếp nhắn: </strong> {tour.manager_note}
                                    </div>
                                )}
                                
                                <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '16px 0' }} />
                                
                                {!isAlreadySentToCustomer && (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            onClick={() => onEditDesign && onEditDesign(tour)}
                                            style={{ flex: 1, padding: '10px', backgroundColor: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                                        >
                                            {isManagerRejected ? 'Sửa lại thiết kế' : 'Xem chi tiết'}
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => isApprovedReadyToSend && handleSendQuote(tour)}
                                            disabled={!isApprovedReadyToSend}
                                            style={{ flex: 1.5, padding: '10px', backgroundColor: isApprovedReadyToSend ? '#10b981' : '#f1f5f9', color: isApprovedReadyToSend ? '#fff' : '#94a3b8', border: isApprovedReadyToSend ? 'none' : '1px solid #e2e8f0', borderRadius: '8px', fontWeight: '600', cursor: isApprovedReadyToSend ? 'pointer' : 'not-allowed' }}
                                        >
                                            Gửi báo giá
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}


                    {/* ======================================================== */}
                    {/* TAB 2: TOUR CỐ ĐỊNH */}
                    {/* ======================================================== */}
                    {activeTab === 'fixed' && fixedTours.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                            Bạn chưa có sản phẩm tour cố định nào.
                        </div>
                    )}
                    {activeTab === 'fixed' && fixedTours.map((tour) => {
                        const isPending = tour.status === 'Pending';
                        const isActive = tour.status === 'Active';
                        const isRejected = tour.status === 'Rejected';

                        return (
                            <div key={tour.tour_id} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: isRejected ? '1px solid #fca5a5' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <span style={{ 
                                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                                        backgroundColor: isRejected ? '#fee2e2' : isActive ? '#dcfce7' : '#fef3c7',
                                        color: isRejected ? '#dc2626' : isActive ? '#16a34a' : '#d97706'
                                    }}>
                                        {isRejected ? '❌ Bị từ chối' : isActive ? '✅ Đang mở bán' : '⏳ Đang chờ duyệt'}
                                    </span>
                                    <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500' }}>#{tour.tour_id}</span>
                                </div>
                                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1e293b' }}>{tour.tour_name}</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', color: '#475569', flex: 1 }}>
                                    <div>📍 Tuyến: <strong>{tour.destination}</strong></div>
                                    <div>⏱️ Thời gian: <strong>{tour.duration_days} Ngày</strong></div>
                                    <div>💰 Giá công bố: <strong style={{ color: '#ea580c' }}>{formatMoney(tour.base_price)}đ</strong></div>
                                </div>
                                
                                <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '16px 0' }} />
                                
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {/* NÚT BẤM SẼ GỌI MODAL XEM CHI TIẾT */}
                                    <button 
                                        onClick={() => handleViewFixedDetail(tour)}
                                        style={{ width: '100%', padding: '10px', backgroundColor: isRejected ? '#fef2f2' : '#f8fafc', color: isRejected ? '#dc2626' : '#334155', border: isRejected ? '1px solid #fca5a5' : '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        {isRejected ? '❌ Xem lỗi & Chỉnh sửa' : '🔍 Xem chi tiết'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL XEM CHI TIẾT & SỬA TOUR CỐ ĐỊNH (NGAY TẠI TRANG NÀY) */}
            {/* ========================================================= */}
            {viewingFixedTour && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '95%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', color: '#047857' }}>
                            Chi tiết Sản phẩm: {viewingFixedTour.tour_name}
                        </h3>
                        
                        <div style={{ overflowY: 'auto', paddingRight: '8px', flex: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                                <div><p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Tuyến đường</p><p style={{ margin: 0, fontWeight: '600' }}>{viewingFixedTour.destination}</p></div>
                                <div><p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Thời gian</p><p style={{ margin: 0, fontWeight: '600' }}>{viewingFixedTour.duration_days} Ngày</p></div>
                            </div>

                            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#1e293b' }}>💰 Cơ cấu giá bán</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px' }}>
                                <div><p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Chi phí dịch vụ gốc</p><p style={{ margin: 0, fontWeight: '600', color: '#ef4444', fontSize: '16px' }}>{formatMoney(viewingFixedTour.base_cost)} đ</p></div>
                                <div><p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Lợi nhuận (Markup)</p><p style={{ margin: 0, fontWeight: '600', color: '#3b82f6', fontSize: '16px' }}>{viewingFixedTour.markup_percent}%</p></div>
                                <div><p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Giá bán công bố</p><p style={{ margin: 0, fontWeight: '600', color: '#ea580c', fontSize: '16px' }}>{formatMoney(viewingFixedTour.base_price)} đ</p></div>
                            </div>

                            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#1e293b' }}>🗺️ Lịch trình chi tiết</h4>
                            <div style={{ marginBottom: '24px' }}>
                                {(() => {
                                    if (!viewingFixedTour.design_data) return <span style={{ color: '#64748b' }}>Chưa có chi tiết lịch trình.</span>;
                                    try {
                                        const parsedDesign = typeof viewingFixedTour.design_data === 'string' ? JSON.parse(viewingFixedTour.design_data) : viewingFixedTour.design_data;
                                        
                                        return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                {/* KHÁCH SẠN VÀ XE */}
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

                                                {/* TIMELINE CÁC BUỔI */}
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

                        {/* BUTTONS XỬ LÝ TRONG MODAL */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
                            <button 
                                onClick={() => setViewingFixedTour(null)} 
                                style={{ padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                            >
                                Đóng
                            </button>
                            
                            {/* CHỈ CHO PHÉP SỬA KHI TOUR ĐANG PENDING HOẶC BỊ TỪ CHỐI */}
                            {(viewingFixedTour.status === 'Pending' || viewingFixedTour.status === 'Rejected') && (
                                <button 
                                    onClick={() => {
                                        setViewingFixedTour(null); // Đóng modal trước
                                        if (onEditFixedDesign) {
                                            onEditFixedDesign(viewingFixedTour);
                                        } else {
                                            alert('Vui lòng thêm hàm onEditFixedDesign ở component cha (Dashboard) để chuyển trang!');
                                        }
                                    }} 
                                    style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)' }}
                                >
                                    ✏️ Chỉnh sửa bản thiết kế
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default StaffPendingTours;
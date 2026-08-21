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
        if (!window.confirm(`Bạn muốn gửi bản thiết kế và giá chính thức ${Number(tour.quoted_price).toLocaleString('vi-VN')}đ cho khách hàng ${tour.customer_name}?`)) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`http://localhost:5000/api/custom-tours/quotes/${tour.quote_id}/send-to-customer`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                alert('Đã gửi bản thiết kế và giá chính thức cho khách hàng thành công!');
                setSentStatus(prev => ({ ...prev, [tour.request_id]: true }));
                fetchData(); 
            }
        } catch (error) {
            alert('Có lỗi xảy ra khi gửi báo giá.');
        }
    };

    const formatMoney = (amount) => Number(amount || 0).toLocaleString('vi-VN');

    const [filterStatus, setFilterStatus] = useState('Tất cả');

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

            {/* THANH TAB CHUYỂN ĐỔI & BỘ LỌC */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button 
                        onClick={() => { setActiveTab('custom'); setFilterStatus('Tất cả'); }} 
                        style={{ padding: '12px 24px', borderRadius: '10px', border: activeTab === 'custom' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: activeTab === 'custom' ? '#eff6ff' : '#fff', color: activeTab === 'custom' ? '#1d4ed8' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        🛎️ Hồ sơ Thiết Kế Riêng ({pendingTours.length})
                    </button>
                    <button 
                        onClick={() => { setActiveTab('fixed'); setFilterStatus('Tất cả'); }} 
                        style={{ padding: '12px 24px', borderRadius: '10px', border: activeTab === 'fixed' ? '2px solid #10b981' : '1px solid #cbd5e1', background: activeTab === 'fixed' ? '#ecfdf5' : '#fff', color: activeTab === 'fixed' ? '#047857' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                        🗺️ Sản phẩm Tour Cố Định ({fixedTours.length})
                    </button>
                </div>

                <div style={{ width: '250px' }}>
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', background: '#fff', cursor: 'pointer', fontWeight: '500', color: '#334155' }}
                    >
                        <option value="Tất cả">Tất cả trạng thái</option>
                        <option value="Chờ duyệt">⏳ Đang chờ duyệt</option>
                        <option value="Từ chối">❌ Bị từ chối / Cần sửa</option>
                        <option value="Đã duyệt">✨ Đã duyệt / Mở bán</option>
                        {activeTab === 'custom' && <option value="Đã gửi khách">✅ Đã gửi khách</option>}
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Đang tải dữ liệu...</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                    
                    {/* ======================================================== */}
                    {/* TAB 1: TOUR THIẾT KẾ RIÊNG */}
                    {/* ======================================================== */}
                    {activeTab === 'custom' && pendingTours.filter(tour => {
                        if (filterStatus === 'Tất cả') return true;
                        
                        const isManagerRejected = tour.approval_status === 'Rejected';
                        const isManagerApproved = tour.approval_status === 'Approved';
                        const isPendingApproval = tour.approval_status === 'Pending_Approval';
                        const isAlreadySentToCustomer = sentStatus[tour.request_id] || ['Quote_Sent', 'Customer_Revision', 'Customer_Accepted'].includes(tour.status);

                        if (filterStatus === 'Từ chối') return isManagerRejected;
                        if (filterStatus === 'Chờ duyệt') return isPendingApproval;
                        if (filterStatus === 'Đã duyệt') return isManagerApproved && !isAlreadySentToCustomer;
                        if (filterStatus === 'Đã gửi khách') return isAlreadySentToCustomer;
                        return true;
                    }).map((tour) => {
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
                                            Gửi thiết kế & Giá chính thức
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}


                    {/* ======================================================== */}
                    {/* TAB 2: TOUR CỐ ĐỊNH */}
                    {/* ======================================================== */}
                    {activeTab === 'fixed' && fixedTours.filter(tour => {
                        if (filterStatus === 'Tất cả') return true;
                        
                        const isPending = tour.status === 'Pending';
                        const isActive = tour.status === 'Active';
                        const isRejected = tour.status === 'Rejected';

                        if (filterStatus === 'Từ chối') return isRejected;
                        if (filterStatus === 'Chờ duyệt') return isPending;
                        if (filterStatus === 'Đã duyệt') return isActive;
                        if (filterStatus === 'Đã gửi khách') return false; // Không áp dụng cho tab này
                        
                        return true;
                    }).map((tour) => {
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
                                
                                {isRejected && tour.rejection_reason && (
                                    <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', color: '#991b1b' }}>
                                        <strong>Lý do từ chối:</strong> {tour.rejection_reason}
                                    </div>
                                )}
                                
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
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '95%', maxWidth: '1200px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', color: '#047857' }}>
                            Chi tiết Sản phẩm: {viewingFixedTour.tour_name}
                        </h3>
                        
                        
                        <div style={{ overflowY: 'auto', paddingRight: '8px', flex: 1 }}>
                            {viewingFixedTour.image_url && (
                                <div style={{ marginBottom: '16px' }}>
                                    <img src={viewingFixedTour.image_url.startsWith('/') ? 'http://localhost:5002' + viewingFixedTour.image_url : viewingFixedTour.image_url} alt="Cover" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                                <div><p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Tuyến đường</p><p style={{ margin: 0, fontWeight: '600' }}>{viewingFixedTour.destination}</p></div>
                                <div><p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Thời gian</p><p style={{ margin: 0, fontWeight: '600' }}>{viewingFixedTour.duration_days} Ngày</p></div>
                            </div>

                            
                            {(() => {
                                if (!viewingFixedTour.design_data) return <span style={{ color: '#64748b' }}>Chưa có chi tiết lịch trình.</span>;
                                try {
                                    const parsedDesign = typeof viewingFixedTour.design_data === 'string' ? JSON.parse(viewingFixedTour.design_data) : viewingFixedTour.design_data;
                                    const { days, costConfig, computed, dayImages } = parsedDesign;
                                    if (!days || !costConfig || !computed) return <span style={{ color: '#64748b' }}>Dữ liệu thiết kế không đầy đủ.</span>;
                                    
                                    const formatMoney = (val) => new Intl.NumberFormat('vi-VN').format(Math.round(val || 0));

                                    return (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', alignItems: 'start', marginBottom: '24px' }}>
                                            {/* CỘT TRÁI: LỊCH TRÌNH CHI TIẾT */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1e293b' }}>🗺️ Lịch trình chi tiết</h4>
                                                {days.map((day) => (
                                                    <div key={day.dayIndex} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                        <div style={{ background: '#ecfdf5', padding: '12px 16px', borderBottom: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: '700', color: '#047857', fontSize: '15px' }}>NGÀY {day.dayIndex} {day.route_title ? " - " + day.route_title : ''}</span>
                                                        </div>
                                                        
                                                        <div style={{ padding: '16px', display: 'flex', gap: '16px' }}>
                                                            {dayImages && dayImages[day.dayIndex] && (
                                                                <div style={{ flexShrink: 0 }}>
                                                                    <img src={dayImages[day.dayIndex].startsWith('/') ? 'http://localhost:5002' + dayImages[day.dayIndex] : dayImages[day.dayIndex]} alt="Ngày" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                                                                </div>
                                                            )}
                                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                {/* Bảng hoạt động */}
                                                                <div style={{ background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                                                    {day.activities && day.activities.length > 0 ? day.activities.map((act, idx) => (
                                                                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 100px', gap: '12px', padding: '10px 12px', borderBottom: idx !== day.activities.length - 1 ? '1px solid #e2e8f0' : 'none', alignItems: 'center' }}>
                                                                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>{act.type}</span>
                                                                            <strong style={{ fontSize: '13px', color: '#334155' }}>{act.name}</strong>
                                                                            <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '600', textAlign: 'right' }}>{act.price ? formatMoney(act.price) + ' đ' : '-'}</span>
                                                                        </div>
                                                                    )) : <div style={{ padding: '10px', fontSize: '13px', color: '#94a3b8' }}>Chưa có hoạt động</div>}
                                                                </div>

                                                                {/* Khách sạn đặc biệt của ngày */}
                                                                {day.accommodation && day.accommodation.name && (
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 100px', gap: '12px', background: '#eff6ff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #bfdbfe', alignItems: 'center', marginTop: '4px' }}>
                                                                        <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 'bold' }}>Lưu trú</span>
                                                                        <strong style={{ fontSize: '13px', color: '#1e3a8a' }}>{day.accommodation.name}</strong>
                                                                        <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '600', textAlign: 'right' }}>{day.accommodation.price ? formatMoney(day.accommodation.price) + ' đ' : '-'}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* CỘT PHẢI: BẢNG KÊ TÀI CHÍNH */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1e293b' }}>📊 Bảng kê Tài chính</h4>
                                                
                                                {/* Block Phương tiện */}
                                                
                                                                {/* Block Phương tiện CHI TIẾT */}
                                                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                                    <strong style={{ fontSize: '14px', color: '#1e293b', display: 'block', marginBottom: '12px' }}>🚗 Phương tiện di chuyển chính: {costConfig.selectedTransport ? costConfig.selectedTransport.name : 'Chưa chọn'}</strong>
                                                                    
                                                                    {costConfig.transportTimes && (
                                                                        <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid #cbd5e1', paddingTop: '16px' }}>
                                                                            <div style={{ flex: 1 }}>
                                                                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Chuyến đi (Ngày đầu)</div>
                                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                                                    <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>{costConfig.transportTimes.startD || '00:00'} <span style={{fontSize:'12px', color:'#94a3b8'}}>🕒</span></div>
                                                                                    <div style={{ flex: 1, height: '1px', background: '#cbd5e1', position: 'relative' }}><div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div><div style={{ position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div></div>
                                                                                    <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>{costConfig.transportTimes.endD || '00:00'} <span style={{fontSize:'12px', color:'#94a3b8'}}>🕒</span></div>
                                                                                </div>
                                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#475569' }}>
                                                                                    <span>Điểm xuất phát</span>
                                                                                    <span>Điểm đến</span>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <div style={{ width: '1px', background: '#e2e8f0' }}></div>

                                                                            <div style={{ flex: 1 }}>
                                                                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Chuyến về (Ngày {computed.totalDays})</div>
                                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                                                    <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>{costConfig.transportTimes.startR || '00:00'} <span style={{fontSize:'12px', color:'#94a3b8'}}>🕒</span></div>
                                                                                    <div style={{ flex: 1, height: '1px', background: '#cbd5e1', position: 'relative' }}><div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div><div style={{ position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div></div>
                                                                                    <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>{costConfig.transportTimes.endR || '00:00'} <span style={{fontSize:'12px', color:'#94a3b8'}}>🕒</span></div>
                                                                                </div>
                                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#475569' }}>
                                                                                    <span>Điểm kết thúc</span>
                                                                                    <span>Điểm về</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                    

                                                {/* Block Định phí */}
                                                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>🔒 Định phí (Cố định toàn tour)</strong>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Tiền xe nguyên chuyến:</span> <strong>{formatMoney(computed.autoFixedTransport)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Tiền Hướng dẫn viên:</span> <strong>{formatMoney(costConfig.fixed?.guidePerDay * computed.totalDays)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Phí cố định khác:</span> <strong>{formatMoney(costConfig.fixed?.otherFixed)} đ</strong>
                                                    </div>
                                                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>Chia đều cho {costConfig.minimumPax} khách</span>
                                                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{formatMoney((computed.autoFixedTransport + (costConfig.fixed?.guidePerDay * computed.totalDays) + costConfig.fixed?.otherFixed) / costConfig.minimumPax)} đ / khách</strong>
                                                    </div>
                                                </div>

                                                {/* Block Biến phí */}
                                                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>👤 Biến phí (Chi phí / 1 khách)</strong>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Tiền Lưu trú:</span> <strong>{formatMoney(computed.autoAccommodationCost)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Ăn Sáng ({computed.totalMeals?.breakfast} bữa):</span> <strong>{formatMoney(computed.totalMeals?.breakfast * costConfig.variable?.breakfast)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Ăn Trưa ({computed.totalMeals?.lunch} bữa):</span> <strong>{formatMoney(computed.totalMeals?.lunch * costConfig.variable?.lunch)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Ăn Tối ({computed.totalMeals?.dinner} bữa):</span> <strong>{formatMoney(computed.totalMeals?.dinner * costConfig.variable?.dinner)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Vé tham quan:</span> <strong>{formatMoney(computed.autoTicketsCost)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Vé xe cá nhân:</span> <strong>{formatMoney(computed.autoVariableTransport)} đ</strong>
                                                    </div>
                                                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>Tổng Biến Phí:</strong>
                                                        <strong style={{ fontSize: '14px', color: '#ef4444' }}>{formatMoney(computed.autoAccommodationCost + (computed.totalMeals?.breakfast * costConfig.variable?.breakfast) + (computed.totalMeals?.lunch * costConfig.variable?.lunch) + (computed.totalMeals?.dinner * costConfig.variable?.dinner) + computed.autoTicketsCost + computed.autoVariableTransport)} đ</strong>
                                                    </div>
                                                </div>

                                                {/* Block Lợi nhuận & Chốt giá */}
                                                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #86efac', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                    <strong style={{ fontSize: '13px', color: '#166534', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>💰 Tổng kết Giá Tour</strong>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#166534' }}>
                                                        <span>Giá vốn (Net Cost):</span> <strong>{formatMoney(computed.netCost)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#166534' }}>
                                                        <span>Lợi nhuận mong muốn:</span> <strong>{costConfig.margin}%</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#166534' }}>
                                                        <span>Phụ thu phòng đơn:</span> <strong>{formatMoney(costConfig.variable?.singleSupplement)} đ</strong>
                                                    </div>
                                                    <div style={{ borderTop: '2px solid #bbf7d0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <strong style={{ fontSize: '16px', color: '#15803d' }}>GIÁ BÁN CÔNG BỐ:</strong>
                                                        <strong style={{ fontSize: '20px', color: '#15803d', background: '#dcfce7', padding: '4px 8px', borderRadius: '6px' }}>{formatMoney(computed.sellingPrice)} đ</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } catch (e) { return <span>Lỗi hiển thị lịch trình.</span>; }
                            })()}
                        </div>

                        {viewingFixedTour.status === 'Rejected' && viewingFixedTour.rejection_reason && (
                            <div style={{ margin: '12px 0', padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', color: '#991b1b' }}>
                                <strong>⚠️ Quản lý yêu cầu chỉnh sửa:</strong><br/>
                                <span style={{ whiteSpace: 'pre-line' }}>{viewingFixedTour.rejection_reason}</span>
                            </div>
                        )}

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
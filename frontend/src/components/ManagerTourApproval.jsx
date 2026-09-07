import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManagerApproveTours = () => {
    // 1. Quản lý Tab
    const [activeTab, setActiveTab] = useState('custom'); // 'custom' hoặc 'fixed'

    // 2. Dữ liệu danh sách
    const [allCustomTours, setAllCustomTours] = useState([]); // Tất cả Tour Thiết Kế Riêng
    const [allFixedTours, setAllFixedTours] = useState([]); // Tất cả Tour Cố Định
    const [loading, setLoading] = useState(true);
    const [destinations, setDestinations] = useState([]);
    const [statusFilter, setStatusFilter] = useState('Pending'); // 'Pending', 'Approved', 'Rejected', 'Completed', 'All'

    const getDestString = (tour) => {
        try {
            const dd = typeof tour.design_data === 'string' ? JSON.parse(tour.design_data) : tour.design_data;
            if (!dd || !dd.days) return tour.destination;
            const startOriginId = dd.days[0]?.start_destination_id;
            const rawIds = [...new Set(dd.days.map(d => d.end_destination_id).filter(Boolean))];
            const ids = rawIds.filter(id => String(id) !== String(startOriginId));
            const names = ids.map(id => {
                const dest = destinations.find(x => String(x.destination_id) === String(id));
                return dest ? dest.destination_name : '';
            }).filter(Boolean);
            return names.length > 0 ? names.join(' - ') : tour.destination;
        } catch(e) {
            return tour.destination;
        }
    };

    // Dữ liệu hiển thị sau khi lọc
    const pendingTours = allCustomTours.filter(req => {
        if (statusFilter === 'All') return true;
        if (statusFilter === 'Pending') return req.status === 'Pending_Manager_Approval' || req.approval_status === 'Pending_Approval';
        if (statusFilter === 'Approved') return req.approval_status === 'Customer_Review' || req.approval_status === 'Customer_Accepted';
        if (statusFilter === 'Completed') return req.status === 'Completed';
        if (statusFilter === 'Rejected') return req.approval_status === 'Manager_Rejected' || req.status === 'Rejected';
        return false;
    });

    const pendingFixedTours = allFixedTours.filter(t => {
        if (statusFilter === 'All') return true;
        if (statusFilter === 'Pending') return t.status === 'Pending';
        if (statusFilter === 'Approved') return t.status === 'Approved' || t.status === 'Active';
        if (statusFilter === 'Completed') return t.status === 'Active';
        if (statusFilter === 'Rejected') return t.status === 'Rejected';
        return false;
    });

    // Tính tổng số tour thực sự đang cần duyệt cho Header
    const actualPendingCustomCount = allCustomTours.filter(req => req.status === 'Pending_Manager_Approval' || req.approval_status === 'Pending_Approval').length;
    const actualPendingFixedCount = allFixedTours.filter(t => t.status === 'Pending').length;

    // 3. State cho Modal xem chi tiết
    const [selectedTour, setSelectedTour] = useState(null); // Dành cho Tour Riêng
    const [selectedFixedTour, setSelectedFixedTour] = useState(null); // Dành cho Tour Cố Định

    const [feedback, setFeedback] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    // FETCH DỮ LIỆU SONG SONG VÀ ÁP DỤNG BỘ LỌC CHUẨN
    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            const [resCustom, resFixed, resDest] = await Promise.all([
                axios.get('http://localhost:5000/api/custom-tours/requests', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/staff/tours', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/destinations', { headers: { Authorization: `Bearer ${token}` } }) // Gọi API Staff để lấy tour Pending
            ]);

            // Lưu toàn bộ dữ liệu thay vì chỉ lọc Pending
            if (resCustom.data.success) {
                setAllCustomTours(resCustom.data.data);
            }

            // Lưu toàn bộ Tour Cố Định
            if (resFixed.data.success) {
                setAllFixedTours(resFixed.data.data);
            }
            if (resDest && resDest.data.success) {
                setDestinations(resDest.data.data);
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
    const handleApprove = async (quoteId) => {
        if (!window.confirm('Bạn có chắc chắn muốn phê duyệt bản thiết kế này?')) return;
        try {
            setActionLoading(true);
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/custom-tours/quotes/${quoteId}/manager-review`, {
                action: 'approve'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('✅ Đã phê duyệt tour thành công!');
            setSelectedTour(null);
            fetchData();
        } catch (error) {
            alert('❌ Có lỗi xảy ra khi phê duyệt.');
        } finally { setActionLoading(false); }
    };

    const handleReject = async (quoteId) => {
        if (!feedback.trim()) return alert('Vui lòng nhập lý do / yêu cầu chỉnh sửa cho nhân viên!');
        try {
            setActionLoading(true);
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/custom-tours/quotes/${quoteId}/manager-review`, {
                action: 'reject',
                manager_note: feedback
            }, { headers: { Authorization: `Bearer ${token}` } });
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
                    setIsRejecting(false);
                }
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi tải chi tiết tour cố định!');
        }
    };

    const handleUpdateFixedStatus = async (id, status) => {
        const actionName = status === 'Approved' ? 'PHÊ DUYỆT' : 'TỪ CHỐI';
        if (status === 'Rejected' && !feedback.trim()) {
            return alert('Vui lòng nhập lý do từ chối để nhân viên biết và chỉnh sửa!');
        }
        if (!window.confirm(`Bạn chắc chắn muốn ${actionName} tour này chứ?`)) return;
        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/tours/admin/status/${id}`, { status, rejection_reason: feedback }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`✅ Đã ${status === 'Approved' ? 'phê duyệt bản thiết kế' : 'từ chối'} tour cố định thành công!`);
            setSelectedFixedTour(null);
            setFeedback('');
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
                    Cần duyệt: {actualPendingCustomCount + actualPendingFixedCount} tour
                </div>
            </div>

            {/* THANH TAB CHUYỂN ĐỔI VÀ BỘ LỌC */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={() => setActiveTab('custom')} style={{ padding: '12px 24px', borderRadius: '10px', border: activeTab === 'custom' ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: activeTab === 'custom' ? '#eff6ff' : '#fff', color: activeTab === 'custom' ? '#1d4ed8' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                        🛎️ Yêu Cầu Thiết Kế Riêng ({pendingTours.length})
                    </button>
                    <button onClick={() => setActiveTab('fixed')} style={{ padding: '12px 24px', borderRadius: '10px', border: activeTab === 'fixed' ? '2px solid #10b981' : '1px solid #cbd5e1', background: activeTab === 'fixed' ? '#ecfdf5' : '#fff', color: activeTab === 'fixed' ? '#047857' : '#64748b', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                        🗺️ Sản Phẩm Tour Cố Định ({pendingFixedTours.length})
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '6px 14px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', transition: 'all 0.2s', position: 'relative' }}>
                    <span style={{ marginRight: '8px', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ verticalAlign: 'middle', marginRight: '4px', position: 'relative', top: '-1px' }}>
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                        </svg>
                        Lọc:
                    </span>
                    <select 
                        value={statusFilter} 
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{ 
                            border: 'none', outline: 'none', background: 'transparent', 
                            fontSize: '15px', fontWeight: '700', color: '#0f172a', 
                            cursor: 'pointer', appearance: 'none', paddingRight: '24px',
                            fontFamily: 'inherit'
                        }}
                    >
                        <option value="Pending">⏳ Cần duyệt</option>
                        <option value="Approved">✅ Đã phê duyệt</option>
                        <option value="Rejected">❌ Đã từ chối</option>
                        <option value="Completed">🏁 Đã hoàn thành</option>
                        <option value="All">Tất cả</option>
                    </select>
                    {/* Mũi tên Custom cho Select */}
                    <svg width="12" height="12" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
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
                                {tour.status === 'Pending_Manager_Approval' || tour.approval_status === 'Pending_Approval' ? (
                                    <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>Đợi quản lý duyệt</span>
                                ) : tour.status === 'Completed' ? (
                                    <span style={{ background: '#dcfce3', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>Đã hoàn thành</span>
                                ) : tour.approval_status === 'Manager_Rejected' || tour.status === 'Rejected' ? (
                                    <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>Đã từ chối</span>
                                ) : (
                                    <span style={{ background: '#dbeafe', color: '#2563eb', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>Đã phê duyệt</span>
                                )}
                                <span style={{ color: '#94a3b8', fontSize: '12px' }}>{new Date(tour.departure_date).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1e293b' }}>{tour.destination}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#475569', flex: 1 }}>
                                <div>👤 Khách: <strong>{tour.customer_name || 'Khách vãng lai'}</strong></div>
                                <div>👥 Số lượng: <strong>{tour.people_count} người</strong></div>
                                <div>💰 Giá đề xuất: <strong style={{ color: '#16a34a' }}>{formatMoney(tour.quoted_price || 0)}đ</strong></div>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '16px 0' }} />
                            <button onClick={() => { setSelectedTour(tour); setFeedback(''); setIsRejecting(false); }} style={{ width: '100%', padding: '10px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                {(tour.status === 'Pending_Manager_Approval' || tour.approval_status === 'Pending_Approval') ? 'Xem chi tiết & Duyệt' : 'Xem chi tiết'}
                            </button>
                        </div>
                    ))}

                    {/* RENDER TOUR CỐ ĐỊNH */}
                    {activeTab === 'fixed' && pendingFixedTours.map((tour) => (
                        <div key={tour.tour_id} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                {tour.status === 'Pending' ? (
                                    <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>Đợi duyệt</span>
                                ) : tour.status === 'Rejected' ? (
                                    <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>Đã từ chối</span>
                                ) : (
                                    <span style={{ background: '#dcfce3', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{tour.status === 'Active' ? 'Đã mở bán' : 'Đã duyệt'}</span>
                                )}
                                <span style={{ color: '#94a3b8', fontSize: '12px' }}>Mã: #{tour.tour_id}</span>
                            </div>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#1e293b' }}>{tour.tour_name}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#475569', flex: 1 }}>
                                <div>📍 Điểm đến: <strong>{getDestString(tour)}</strong></div>
                                <div>⏱️ Thời gian: <strong>{tour.duration_days} Ngày {Math.max(0, tour.duration_days - 1)} Đêm</strong></div>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontSize: '13px', color: '#64748b' }}>📝 {tour.description || 'Chưa có mô tả'}</div>
                                <div>💰 Giá bán dự kiến: <strong style={{ color: '#ea580c' }}>{formatMoney(tour.base_price || 0)}đ</strong></div>
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '16px 0' }} />
                            <button onClick={() => handleViewFixedDetail(tour)} style={{ width: '100%', padding: '10px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                {tour.status === 'Pending' ? 'Xem chi tiết & Duyệt' : 'Xem chi tiết'}
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
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '95%', maxWidth: '1200px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                            Bản thiết kế tour: {selectedTour.destination}
                        </h3>
                        
                        <div style={{ overflowY: 'auto', paddingRight: '8px', flex: 1 }}>
                            {(() => {
                                let prefs = {};
                                if (typeof selectedTour.preferences === 'string') {
                                    try { prefs = JSON.parse(selectedTour.preferences); } catch(e){}
                                } else if (typeof selectedTour.preferences === 'object') {
                                    prefs = selectedTour.preferences || {};
                                }
                                
                                const hotelReq = prefs.hotelName || prefs.accommodation || '';
                                const transportReq = prefs.transportName || prefs.transport || '';
                                const noteReq = prefs.notes || prefs.note || '';
                                const budget = selectedTour.budget || 0;

                                let parsedItinerary = null;
                                try {
                                    parsedItinerary = typeof selectedTour.proposed_itinerary === 'string' 
                                        ? JSON.parse(selectedTour.proposed_itinerary) 
                                        : selectedTour.proposed_itinerary;
                                } catch(e){}

                                if (!parsedItinerary || !parsedItinerary.costConfig) return <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Không có dữ liệu thiết kế hợp lệ.</div>;

                                const costConfig = parsedItinerary.costConfig;
                                const pA = prefs.participantBreakdown?.adults || selectedTour.people_count || costConfig.minimumPax || 1;
                                const pC = prefs.participantBreakdown?.children || 0;
                                const pT = prefs.participantBreakdown?.toddlers || 0;
                                const pI = prefs.participantBreakdown?.infants || 0;
    
                                const sC = costConfig.ageMultiplier?.child || { percent: 0, fixed_surcharge: 0 };
                                const sT = costConfig.ageMultiplier?.toddler || { percent: 0, fixed_surcharge: 0 };
                                const sI = costConfig.ageMultiplier?.infant || { percent: 0, fixed_surcharge: 0 };
    
                                const prA = selectedTour.quoted_price || 0;
                                const prC = (prA * (sC.percent || 0) / 100) + Number(sC.fixed_surcharge || 0);
                                const prT = (prA * (sT.percent || 0) / 100) + Number(sT.fixed_surcharge || 0);
                                const prI = (prA * (sI.percent || 0) / 100) + Number(sI.fixed_surcharge || 0);
    
                                const totalA = pA * prA;
                                const totalC = pC * prC;
                                const totalT = pT * prT;
                                const totalI = pI * prI;
                                const grandTotalRevenue = totalA + totalC + totalT + totalI;
                                
                                const costA = selectedTour.base_cost || 0;
                                const costC = costA * (sC.percent || 0) / 100;
                                const costT = costA * (sT.percent || 0) / 100;
                                const costI = costA * (sI.percent || 0) / 100;
                                const grandTotalCost = (pA * costA) + (pC * costC) + (pT * costT) + (pI * costI);
                                const grandTotalProfit = grandTotalRevenue - grandTotalCost;

                                // Helper computations
                                const days = parsedItinerary.days || [];
                                const totalDays = days.length || 1;
                                let autoAccommodationCost = 0;
                                let autoTicketsCost = 0;
                                let includedBreakfast = 0;
                                let includedLunch = 0;
                                let includedDinner = 0;
                                
                                days.forEach(day => {
                                    if (day.accommodation && day.accommodation.price) autoAccommodationCost += Number(day.accommodation.price);
                                    if (day.meals?.breakfast === true || day.meals?.breakfast === 'external') includedBreakfast++;
                                    if (day.meals?.lunch === true || day.meals?.lunch === 'external') includedLunch++;
                                    if (day.meals?.dinner === true || day.meals?.dinner === 'external') includedDinner++;
                                });

                                const accommodationPerPax = autoAccommodationCost / 2;
                                const fixedTransport = Number(costConfig.fixed?.transport || 0);
                                const variableTickets = Number(costConfig.variable?.tickets || 0);
                                
                                const countBreakfast = costConfig.variable?.countBreakfast !== undefined ? Number(costConfig.variable.countBreakfast) : includedBreakfast;
                                const countLunch = costConfig.variable?.countLunch !== undefined ? Number(costConfig.variable.countLunch) : includedLunch;
                                const countDinner = costConfig.variable?.countDinner !== undefined ? Number(costConfig.variable.countDinner) : includedDinner;

                                const getDestName = (id) => {
                                    if (!id) return 'Chưa rõ';
                                    const dest = destinations.find(x => String(x.destination_id) === String(id));
                                    return dest ? dest.destination_name : 'Chưa rõ';
                                };
                                const firstDay = days[0] || {};
                                const lastDay = days[days.length - 1] || {};
                                const startDay1 = getDestName(firstDay.start_destination_id);
                                const endDay1 = getDestName(firstDay.end_destination_id);
                                const startLastDay = getDestName(lastDay.start_destination_id);
                                const endLastDay = getDestName(lastDay.end_destination_id);

                                return (
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                                        {/* CỘT TRÁI: YÊU CẦU & LỊCH TRÌNH */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            
                                            {/* THÔNG TIN CHUNG */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
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
                                                    <div>
                                                        <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Ngân sách dự kiến</p>
                                                        <p style={{ margin: 0, fontWeight: '600', color: '#ea580c' }}>{formatMoney(budget)} đ</p>
                                                    </div>
                                                </div>
                                                
                                                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px' }}>
                                                    <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Yêu cầu từ khách hàng:</p>
                                                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#334155' }}>
                                                        {hotelReq && <li><strong>Khách sạn:</strong> {hotelReq}</li>}
                                                        {transportReq && <li><strong>Di chuyển:</strong> {transportReq}</li>}
                                                        {noteReq && <li><strong>Ghi chú thêm:</strong> {noteReq}</li>}
                                                        {!hotelReq && !transportReq && !noteReq && <li style={{ color: '#94a3b8' }}>Không có yêu cầu đặc biệt</li>}
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* LỊCH TRÌNH CHI TIẾT */}
                                            <h4 style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#1e293b' }}>🗺️ Lịch trình thiết kế chi tiết</h4>
                                            
                                            {parsedItinerary.tourName && (
                                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                                                    <strong style={{ fontSize: '16px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>📌 {parsedItinerary.tourName}</strong>
                                                    {parsedItinerary.tourDescription && <p style={{ fontSize: '13px', color: '#475569', margin: 0, whiteSpace: 'pre-line' }}>{parsedItinerary.tourDescription}</p>}
                                                </div>
                                            )}

                                            {days.map((day) => {
                                                const userUploadedImg = parsedItinerary.dayImages?.[day.dayIndex];
                                                const dayDest = destinations.find(d => String(d.destination_id) === String(day.end_destination_id || day.start_destination_id));
                                                const defaultImg = 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                                                
                                                const imageUrl = userUploadedImg 
                                                    ? (userUploadedImg.startsWith('/') ? `http://localhost:5000${userUploadedImg}` : userUploadedImg)
                                                    : (dayDest?.image_url ? (dayDest.image_url.startsWith('/') ? `http://localhost:5002${dayDest.image_url}` : dayDest.image_url) : defaultImg);
                                                
                                                return (
                                                    <div key={day.dayIndex} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                                        <div style={{ height: '140px', width: '100%', position: 'relative' }}>
                                                            <img src={imageUrl} alt={`Ngày ${day.dayIndex}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', padding: '20px 16px 12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                                <span style={{ fontWeight: '700', color: '#fff', fontSize: '15px' }}>NGÀY {day.dayIndex} {day.route_title ? `- ${day.route_title}` : ''}</span>
                                                            </div>
                                                        </div>
                                                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                            {Array.isArray(day.activities) && day.activities.length > 0 && (
                                                                <div>
                                                                <strong style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', display: 'block' }}>🎯 Điểm tham quan / Hoạt động:</strong>
                                                                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#334155' }}>
                                                                    {day.activities.map((act, i) => <li key={i}>{act?.name} {act?.notes ? `(${act.notes})` : ''}</li>)}
                                                                </ul>
                                                                </div>
                                                            )}
                                                            {day.accommodation && day.accommodation.name && (
                                                                <div>
                                                                    <strong style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px', display: 'block' }}>🏨 Lưu trú:</strong>
                                                                    <div style={{ fontSize: '14px', color: '#334155' }}>{day.accommodation.name}</div>
                                                                </div>
                                                            )}
                                                            {day.meals && (
                                                                <div>
                                                                    <strong style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px', display: 'block' }}>🍽️ Bữa ăn:</strong>
                                                                    <div style={{ fontSize: '14px', color: '#334155' }}>
                                                                        {[
                                                                            day.meals.breakfast ? (day.meals.breakfast === 'external' ? 'Sáng (Tự túc)' : 'Sáng') : null,
                                                                            day.meals.lunch ? (day.meals.lunch === 'external' ? 'Trưa (Tự túc)' : 'Trưa') : null,
                                                                            day.meals.dinner ? (day.meals.dinner === 'external' ? 'Tối (Tự túc)' : 'Tối') : null
                                                                        ].filter(Boolean).join(', ')}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {parsedItinerary.staffNote && (
                                                <div style={{ background: '#fefce8', padding: '16px', borderRadius: '8px', border: '1px dashed #eab308', marginTop: '8px' }}>
                                                    <strong style={{ fontSize: '14px', color: '#a16207', display: 'block', marginBottom: '8px' }}>Ghi chú từ Nhân viên thiết kế:</strong>
                                                    <div style={{ fontSize: '14px', color: '#854d0e', whiteSpace: 'pre-line' }}>{parsedItinerary.staffNote}</div>
                                                </div>
                                            )}
                                        </div>

                                        {/* CỘT PHẢI: BẢNG KÊ TÀI CHÍNH */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1e293b' }}>📊 Bảng kê Tài chính</h4>
                                            
                                            {/* Block Phương tiện */}
                                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                <strong style={{ fontSize: '14px', color: '#1e293b', display: 'block', marginBottom: '12px' }}>🚗 Phương tiện di chuyển chính: {costConfig.selectedTransport ? (costConfig.selectedTransport.service_name || costConfig.selectedTransport.name) : 'Chưa chọn'}</strong>
                                                
                                                {costConfig.transportTimes && (
                                                    <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid #cbd5e1', paddingTop: '16px' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Chuyến đi (Ngày đầu)</div>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                                <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>{costConfig.transportTimes.startD || '00:00'} <span style={{fontSize:'12px', color:'#94a3b8'}}>🕒</span></div>
                                                                <div style={{ flex: 1, height: '1px', background: '#cbd5e1', position: 'relative' }}><div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div><div style={{ position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div></div>
                                                                <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>{costConfig.transportTimes.endD || '00:00'} <span style={{fontSize:'12px', color:'#94a3b8'}}>🕒</span></div>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                                                                <span>{startDay1}</span>
                                                                <span>{endDay1}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div style={{ width: '1px', background: '#e2e8f0' }}></div>

                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Chuyến về (Ngày {totalDays})</div>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                                <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>{costConfig.transportTimes.startR || '00:00'} <span style={{fontSize:'12px', color:'#94a3b8'}}>🕒</span></div>
                                                                <div style={{ flex: 1, height: '1px', background: '#cbd5e1', position: 'relative' }}><div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div><div style={{ position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div></div>
                                                                <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>{costConfig.transportTimes.endR || '00:00'} <span style={{fontSize:'12px', color:'#94a3b8'}}>🕒</span></div>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                                                                <span>{startLastDay}</span>
                                                                <span>{endLastDay}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Block Định phí */}
                                            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>🔒 Định phí (Cố định toàn tour)</strong>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
                                                    <span>Tiền xe nguyên chuyến:</span> <strong>{formatMoney(fixedTransport)} đ</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
                                                    <span>Tiền Hướng dẫn viên:</span> <strong>{formatMoney((costConfig.fixed?.guidePerDay || 0) * totalDays)} đ</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#475569' }}>
                                                    <span>Phí cố định khác:</span> <strong>{formatMoney(costConfig.fixed?.otherFixed)} đ</strong>
                                                </div>
                                                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>Chia đều cho {pA} khách (Nhóm lớn nhất)</span>
                                                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{formatMoney((fixedTransport + ((costConfig.fixed?.guidePerDay || 0) * totalDays) + Number(costConfig.fixed?.otherFixed || 0)) / Math.max(1, pA))} đ / khách</strong>
                                                </div>
                                            </div>

                                            {/* Block Biến phí */}
                                            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>👤 Biến phí (Chi phí / 1 khách)</strong>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
                                                    <span>Tiền Lưu trú (Chia 2):</span> <strong>{formatMoney(accommodationPerPax)} đ</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px', color: '#475569' }}>
                                                    <span>Ăn Sáng ({countBreakfast} bữa):</span> <strong>{formatMoney(countBreakfast * (costConfig.variable?.breakfast || 0))} đ</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px', color: '#475569' }}>
                                                    <span>Ăn Trưa ({countLunch} bữa):</span> <strong>{formatMoney(countLunch * (costConfig.variable?.lunch || 0))} đ</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
                                                    <span>Ăn Tối ({countDinner} bữa):</span> <strong>{formatMoney(countDinner * (costConfig.variable?.dinner || 0))} đ</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
                                                    <span>Vé tham quan, khác:</span> <strong>{formatMoney(variableTickets)} đ</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#475569' }}>
                                                    <span>Bảo hiểm & Phụ phí:</span> <strong>{formatMoney(costConfig.variable?.insurance)} đ</strong>
                                                </div>
                                                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>Tổng biến phí</span>
                                                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{formatMoney(accommodationPerPax + (countBreakfast * (costConfig.variable?.breakfast || 0)) + (countLunch * (costConfig.variable?.lunch || 0)) + (countDinner * (costConfig.variable?.dinner || 0)) + variableTickets + Number(costConfig.variable?.insurance || 0))} đ / khách</strong>
                                                </div>
                                            </div>

                                            {/* Tổng kết Giá */}
                                            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#475569' }}>
                                                    <span>Giá vốn cơ bản / khách</span> <strong>{formatMoney(costA)} đ</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#475569' }}>
                                                    <span>Biên lợi nhuận</span> <strong style={{ color: '#8b5cf6' }}>{costConfig.margin}%</strong>
                                                </div>
                                                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: 'bold' }}>Giá Đề Xuất Bán</span>
                                                    <strong style={{ fontSize: '18px', color: '#16a34a' }}>{formatMoney(prA)} đ</strong>
                                                </div>
                                            </div>

                                            {/* Phân tích tài chính toàn đoàn */}
                                            <h4 style={{ margin: '16px 0 8px 0', fontSize: '16px', color: '#1e293b' }}>💰 Phân tích theo nhóm khách</h4>
                                            
                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '15px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                                                <thead>
                                                    <tr style={{ background: '#f1f5f9', color: '#475569' }}>
                                                        <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>Loại</th>
                                                        <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1' }}>SL</th>
                                                        <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1', textAlign: 'right' }}>Giá bán</th>
                                                        <th style={{ padding: '10px', borderBottom: '2px solid #cbd5e1', textAlign: 'right' }}>Tổng thu</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pA > 0 && <tr>
                                                        <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Người lớn</td>
                                                        <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{pA}</td>
                                                        <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#16a34a' }}>{formatMoney(prA)}</td>
                                                        <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '600' }}>{formatMoney(totalA)}</td>
                                                    </tr>}
                                                    {pC > 0 && <tr>
                                                        <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Trẻ em</td>
                                                        <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{pC}</td>
                                                        <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#16a34a' }}>{formatMoney(prC)}</td>
                                                        <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '600' }}>{formatMoney(totalC)}</td>
                                                    </tr>}
                                                    {pT > 0 && <tr>
                                                        <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Trẻ nhỏ</td>
                                                        <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{pT}</td>
                                                        <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#16a34a' }}>{formatMoney(prT)}</td>
                                                        <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '600' }}>{formatMoney(totalT)}</td>
                                                    </tr>}
                                                    {pI > 0 && <tr>
                                                        <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>Em bé</td>
                                                        <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0' }}>{pI}</td>
                                                        <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#16a34a' }}>{formatMoney(prI)}</td>
                                                        <td style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '600' }}>{formatMoney(totalI)}</td>
                                                    </tr>}
                                                </tbody>
                                            </table>
                                            
                                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Tổng Vốn (Toàn đoàn)</p>
                                                    <p style={{ margin: 0, fontWeight: '600', color: '#ef4444', fontSize: '16px' }}>{formatMoney(grandTotalCost)} đ</p>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px' }}>Tổng Thu (Dự kiến)</p>
                                                    <p style={{ margin: 0, fontWeight: '600', color: '#16a34a', fontSize: '16px' }}>{formatMoney(grandTotalRevenue)} đ</p>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '12px' }}>
                                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Lợi nhuận dự kiến</p>
                                                    <p style={{ margin: 0, fontWeight: '700', color: '#3b82f6', fontSize: '18px' }}>{formatMoney(grandTotalProfit)} đ</p>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                            {/* GHI CHÚ TỪ CHỐI */}
                            {isRejecting && (
                                <div style={{ marginBottom: '12px', background: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                                    <label style={{ display: 'block', margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>Ghi chú yêu cầu chỉnh sửa (Bắt buộc):</label>
                                    <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Ví dụ: Giá vốn quá cao..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px', fontFamily: 'inherit', boxSizing: 'border-box' }} autoFocus />
                                </div>
                            )}

                        {/* BUTTONS */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
                            {!isRejecting ? (
                                <>
                                    <button onClick={() => { setSelectedTour(null); setIsRejecting(false); }} disabled={actionLoading} style={{ padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Đóng</button>
                                    {(selectedTour.status === 'Pending_Manager_Approval' || selectedTour.approval_status === 'Pending_Approval') && (
                                        <>
                                            <button onClick={() => setIsRejecting(true)} disabled={actionLoading} style={{ padding: '10px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Yêu cầu sửa</button>
                                            <button onClick={() => handleApprove(selectedTour.quote_id)} disabled={actionLoading} style={{ padding: '10px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Phê duyệt</button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                        <button onClick={() => handleReject(selectedTour.quote_id)} disabled={actionLoading} style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>Xác nhận Gửi yêu cầu</button>
                                        <button onClick={() => setIsRejecting(false)} style={{ padding: '8px 16px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>Hủy</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL XEM CHI TIẾT & DUYỆT TOUR CỐ ĐỊNH (MỚI THÊM)        */}
            {/* ========================================================= */}
            {selectedFixedTour && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '95%', maxWidth: '1200px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', color: '#047857' }}>
                            Thẩm định Sản phẩm: {selectedFixedTour.tour_name}
                        </h3>
                        
                        <div style={{ overflowY: 'auto', paddingRight: '8px', flex: 1 }}>
                            {selectedFixedTour.image_url && (
                                <div style={{ marginBottom: '16px' }}>
                                    <img src={selectedFixedTour.image_url.startsWith('/') ? 'http://localhost:5002' + selectedFixedTour.image_url : selectedFixedTour.image_url} alt="Cover" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div>
                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>📍 Điểm đến</p>
                                    <p style={{ margin: 0, fontWeight: '600', color: '#0f172a' }}>{getDestString(selectedFixedTour)}</p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '13px', fontWeight: 'bold' }}>⏱️ Thời gian</p>
                                    <p style={{ margin: 0, fontWeight: '600', color: '#0f172a' }}>{selectedFixedTour.duration_days} Ngày {Math.max(0, selectedFixedTour.duration_days - 1)} Đêm</p>
                                </div>
                            </div>

                            
                            {(() => {
                                if (!selectedFixedTour.design_data) return <span style={{ color: '#64748b' }}>Chưa có chi tiết lịch trình.</span>;
                                try {
                                    let parsedDesign = typeof selectedFixedTour.design_data === 'string' ? JSON.parse(selectedFixedTour.design_data) : selectedFixedTour.design_data;
                                    
                                    // Fallback / normalization for legacy design format
                                    if ((!parsedDesign.days || !parsedDesign.costConfig || !parsedDesign.computed) && parsedDesign.itineraryDays) {
                                        const days = parsedDesign.itineraryDays.map((d, idx) => {
                                            const activities = [];
                                            if (d.slots) {
                                                ['morning', 'noon', 'evening'].forEach(slotKey => {
                                                    if (Array.isArray(d.slots[slotKey])) {
                                                        d.slots[slotKey].forEach(act => {
                                                            activities.push({
                                                                type: 'Tham quan',
                                                                name: act.name,
                                                                price: Number(act.price || 0)
                                                            });
                                                        });
                                                    }
                                                });
                                            }
                                            return {
                                                dayIndex: d.dayIndex || idx + 1,
                                                route_title: d.dateString || `Ngày ${d.dayIndex || idx + 1}`,
                                                activities: activities,
                                                accommodation: parsedDesign.fixedServices?.accommodation?.[0] ? {
                                                    name: parsedDesign.fixedServices.accommodation[0].name,
                                                    price: parsedDesign.fixedServices.accommodation[0].price
                                                } : null,
                                                meals: { breakfast: true, lunch: true, dinner: true }
                                            };
                                        });

                                        const transport = parsedDesign.fixedServices?.transport?.[0];
                                        parsedDesign = {
                                            days,
                                            costConfig: {
                                                minimumPax: 15, margin: 18,
                                                selectedTransport: transport ? { name: transport.name, price: transport.price } : null,
                                                transportTimes: { startD: '07:00', endD: '11:30', startR: '13:00', endR: '18:00' },
                                                fixed: { guidePerDay: 500000 },
                                                variable: { breakfast: 100000, lunch: 150000, dinner: 200000 }
                                            },
                                            computed: {
                                                netCost: Number(selectedFixedTour.base_cost || 3500000),
                                                sellingPrice: Number(selectedFixedTour.base_price || 4200000),
                                                totalDays: days.length,
                                                totalNights: Math.max(1, days.length - 1)
                                            },
                                            dayImages: parsedDesign.dayImages || {}
                                        };
                                    }

                                    const { days, costConfig, computed, dayImages, categories, highlights } = parsedDesign;
                                    if (!days || !costConfig || !computed) return <span style={{ color: '#64748b' }}>Dữ liệu thiết kế không đầy đủ.</span>;
                                    
                                    let autoAccommodationCost = 0;
                                    days.forEach(day => {
                                        if (day.accommodation && day.accommodation.price) autoAccommodationCost += Number(day.accommodation.price);
                                    });
                                    const accommodationPerPax = autoAccommodationCost / 2;
                                    const fixedTransport = Number(costConfig.fixed?.transport || 0);
                                    const variableTransport = Number(costConfig.variable?.transportTicket || 0);
                                    const formatMoney = (val) => new Intl.NumberFormat('vi-VN').format(Math.round(val || 0));
                                    
                                    const getDestName = (id) => {
                                        if (!id) return 'Chưa rõ';
                                        const dest = destinations.find(x => String(x.destination_id) === String(id));
                                        return dest ? dest.destination_name : 'Chưa rõ';
                                    };
                                    const firstDay = days[0] || {};
                                    const lastDay = days[days.length - 1] || {};
                                    const startDay1 = getDestName(firstDay.start_destination_id);
                                    const endDay1 = getDestName(firstDay.end_destination_id);
                                    const startLastDay = getDestName(lastDay.start_destination_id);
                                    const endLastDay = getDestName(lastDay.end_destination_id);

                                    return (
                                        <>
                                            {/* Thêm phần Phân loại & Điểm nhấn */}
                                            {(categories?.length > 0 || highlights) && (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <div>
                                                        <p style={{ margin: '0 0 8px 0', color: '#047857', fontSize: '14px', fontWeight: 'bold' }}>🏷️ Phân loại / Chủ đề</p>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                            {categories && categories.length > 0 ? categories.map(c => <span key={c} style={{ background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '16px', fontSize: '13px', fontWeight: '600', border: '1px solid #a7f3d0' }}>{c}</span>) : <span style={{fontSize: '13px', color: '#64748b'}}>Chưa phân loại</span>}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p style={{ margin: '0 0 8px 0', color: '#ea580c', fontSize: '14px', fontWeight: 'bold' }}>✨ Điểm nhấn Tour</p>
                                                        <p style={{ margin: 0, fontSize: '13px', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{highlights || <span style={{color: '#64748b'}}>Không có điểm nhấn nổi bật</span>}</p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div style={{ marginBottom: '24px', background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                <p style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '14px', fontWeight: 'bold' }}>📝 Mô tả tổng quan</p>
                                                <p style={{ margin: 0, fontWeight: '500', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{selectedFixedTour.description || <span style={{color: '#94a3b8', fontStyle: 'italic'}}>Chưa có mô tả</span>}</p>
                                            </div>

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
                                                                    <strong style={{ fontSize: '14px', color: '#1e293b', display: 'block', marginBottom: '12px' }}>🚗 Phương tiện di chuyển chính: {costConfig.selectedTransport ? (costConfig.selectedTransport.service_name || costConfig.selectedTransport.name) : 'Chưa chọn'}</strong>
                                                                    
                                                                    {costConfig.transportTimes && (
                                                                        <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid #cbd5e1', paddingTop: '16px' }}>
                                                                            <div style={{ flex: 1 }}>
                                                                                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>Chuyến đi (Ngày đầu)</div>
                                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                                                                    <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>{costConfig.transportTimes.startD || '00:00'} <span style={{fontSize:'12px', color:'#94a3b8'}}>🕒</span></div>
                                                                                    <div style={{ flex: 1, height: '1px', background: '#cbd5e1', position: 'relative' }}><div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div><div style={{ position: 'absolute', left: '-4px', top: '-4px', width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1' }}></div></div>
                                                                                    <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px' }}>{costConfig.transportTimes.endD || '00:00'} <span style={{fontSize:'12px', color:'#94a3b8'}}>🕒</span></div>
                                                                                </div>
                                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                                                                                    <span>{startDay1}</span>
                                                                                    <span>{endDay1}</span>
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
                                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                                                                                    <span>{startLastDay}</span>
                                                                                    <span>{endLastDay}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                    

                                                {/* Block Định phí */}
                                                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>🔒 Định phí (Cố định toàn tour)</strong>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Tiền xe nguyên chuyến:</span> <strong>{formatMoney(fixedTransport)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Tiền Hướng dẫn viên:</span> <strong>{formatMoney(costConfig.fixed?.guidePerDay * computed.totalDays)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Phí cố định khác:</span> <strong>{formatMoney(costConfig.fixed?.otherFixed)} đ</strong>
                                                    </div>
                                                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>Chia đều cho {costConfig.minimumPax} khách</span>
                                                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{formatMoney((fixedTransport + (costConfig.fixed?.guidePerDay * computed.totalDays) + Number(costConfig.fixed?.otherFixed || 0)) / costConfig.minimumPax)} đ / khách</strong>
                                                    </div>
                                                </div>

                                                {/* Block Biến phí */}
                                                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                    <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>👤 Biến phí (Chi phí / 1 khách)</strong>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
                                                        <span>Tiền Lưu trú (Chia 2):</span> <strong>{formatMoney(accommodationPerPax)} đ</strong>
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
                                                        <span>Vé xe cá nhân:</span> <strong>{formatMoney(variableTransport)} đ</strong>
                                                    </div>
                                                    <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>Tổng Biến Phí:</strong>
                                                        <strong style={{ fontSize: '14px', color: '#ef4444' }}>{formatMoney(accommodationPerPax + (computed.totalMeals?.breakfast * costConfig.variable?.breakfast) + (computed.totalMeals?.lunch * costConfig.variable?.lunch) + (computed.totalMeals?.dinner * costConfig.variable?.dinner) + computed.autoTicketsCost + variableTransport + Number(costConfig.variable?.insurance || 0))} đ</strong>
                                                    </div>
                                                </div>

                                                {/* Block Chính sách giá trẻ em (Manager) */}
                                                {costConfig.ageMultiplier && (
                                                    <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                        <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>👶 Chính sách giá Trẻ em</strong>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                            {[
                                                                { key: 'child', label: 'Trẻ em (5 - 11 tuổi)' },
                                                                { key: 'toddler', label: 'Trẻ nhỏ (2 - 4 tuổi)' },
                                                                { key: 'infant', label: 'Em bé (< 2 tuổi)' }
                                                            ].map(group => {
                                                                const setting = costConfig.ageMultiplier[group.key] || { percent: 100, fixed_surcharge: 0 };
                                                                const p = computed.sellingPrice || 0;
                                                                const cal = (p * (setting.percent / 100)) + Number(setting.fixed_surcharge);
                                                                return (
                                                                    <div key={group.key} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                                                                        <strong style={{ display: 'block', fontSize: '13px', color: '#334155', marginBottom: '8px' }}>{group.label}</strong>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', color: '#475569' }}>
                                                                            <span>Tỷ lệ %:</span>
                                                                            <strong>{setting.percent}%</strong>
                                                                        </div>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: '#475569' }}>
                                                                            <span>Phụ thu:</span>
                                                                            <strong>{formatMoney(setting.fixed_surcharge)} đ</strong>
                                                                        </div>
                                                                        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                            <span style={{ fontSize: '12px', color: '#0f172a', fontWeight: '500' }}>Giá bán:</span>
                                                                            <strong style={{ fontSize: '14px', color: '#0ea5e9' }}>{formatMoney(cal)} đ</strong>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Block Lợi nhuận & Chốt giá */}
                                                <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: '12px', border: '1px solid #86efac', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                                    <strong style={{ fontSize: '13px', color: '#166534', display: 'block', marginBottom: '12px', textTransform: 'uppercase' }}>💰 Tổng kết Giá Tour</strong>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#166534' }}>
                                                        <span>Giá vốn (Net Cost):</span> <strong>{formatMoney(computed.netCost)} đ</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#166534' }}>
                                                        <span>Lợi nhuận mong muốn:</span> <strong>{Math.round(Number(costConfig.margin || 0) * 10) / 10}%</strong>
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

                                        </>
                                    );
                                } catch (e) { return <span>Lỗi hiển thị lịch trình.</span>; }
                            })()}
                        </div>

                        {isRejecting && (
                            <div style={{ marginBottom: '12px', background: '#fef2f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                                <label style={{ display: 'block', margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>Ghi chú / Lý do từ chối (Bắt buộc):</label>
                                <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Ví dụ: Lịch trình chưa hợp lý, cần sửa lại..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px', fontFamily: 'inherit', boxSizing: 'border-box' }} autoFocus />
                            </div>
                        )}

                        {/* BUTTONS */}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
                            {!isRejecting ? (
                                <>
                                    <button onClick={() => { setSelectedFixedTour(null); setIsRejecting(false); }} disabled={actionLoading} style={{ padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Đóng</button>
                                    {selectedFixedTour.status === 'Pending' && (
                                        <>
                                            <button onClick={() => setIsRejecting(true)} disabled={actionLoading} style={{ padding: '10px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>❌ Từ chối</button>
                                            <button onClick={() => handleUpdateFixedStatus(selectedFixedTour.tour_id, 'Approved')} disabled={actionLoading} style={{ padding: '10px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>✅ Phê duyệt Thiết kế</button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setIsRejecting(false)} disabled={actionLoading} style={{ padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Hủy</button>
                                    <button onClick={() => handleUpdateFixedStatus(selectedFixedTour.tour_id, 'Rejected')} disabled={actionLoading} style={{ padding: '10px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Xác nhận Từ chối</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ManagerApproveTours;
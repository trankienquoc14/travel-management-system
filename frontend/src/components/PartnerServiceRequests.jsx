import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PartnerServiceRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterTime, setFilterTime] = useState('ALL');
    const [sortBy, setSortBy] = useState('NEWEST');
    const [currentPage, setCurrentPage] = useState(1);
    
    // Modals
    const [detailModal, setDetailModal] = useState(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/service-requests/partner/my-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setRequests(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`http://localhost:5000/api/service-requests/partner/${id}/accept`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setDetailModal(null);
                fetchRequests();
            }
        } catch (err) {
            console.error(err);
            alert('Lỗi: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return alert('Vui lòng nhập lý do từ chối');
        
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`http://localhost:5000/api/service-requests/partner/${detailModal.request_id}/reject`, { reason: rejectReason }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setRejectModalOpen(false);
                setRejectReason('');
                setDetailModal(null);
                fetchRequests();
            }
        } catch (err) {
            console.error(err);
            alert('Lỗi: ' + (err.response?.data?.message || err.message));
        }
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilterType('ALL');
        setFilterStatus('ALL');
        setFilterTime('ALL');
        setSortBy('NEWEST');
        setCurrentPage(1);
    };

    // Derived states (Stats & Filtering)
    const stats = {
        pending: requests.filter(r => r.status === 'Pending').length,
        accepted: requests.filter(r => r.status === 'Accepted').length,
        rejected: requests.filter(r => r.status === 'Rejected').length,
        total: requests.length
    };

    let filtered = requests.filter(req => {
        // Search
        const term = searchTerm.toLowerCase();
        if (term && !req.group_code.toLowerCase().includes(term) && !req.tour_name.toLowerCase().includes(term)) return false;
        
        // Type
        if (filterType !== 'ALL' && req.request_type !== filterType) return false;
        
        // Status
        if (filterStatus !== 'ALL' && req.status !== filterStatus) return false;
        
        // Time
        if (filterTime !== 'ALL') {
            const created = new Date(req.group_created_at);
            const now = new Date();
            const diffDays = (now - created) / (1000 * 60 * 60 * 24);
            if (filterTime === 'TODAY' && diffDays > 1) return false;
            if (filterTime === '7DAYS' && diffDays > 7) return false;
            if (filterTime === '30DAYS' && diffDays > 30) return false;
        }
        
        return true;
    });

    // Sorting
    filtered.sort((a, b) => {
        if (sortBy === 'NEWEST') return new Date(b.group_created_at) - new Date(a.group_created_at);
        if (sortBy === 'OLDEST') return new Date(a.group_created_at) - new Date(b.group_created_at);
        if (sortBy === 'DEP_ASC') return new Date(a.departure_date) - new Date(b.departure_date);
        if (sortBy === 'DEP_DESC') return new Date(b.departure_date) - new Date(a.departure_date);
        return 0;
    });

    // Priority for Pending / Newest
    if (sortBy === 'NEWEST') {
        filtered.sort((a, b) => (a.status === 'Pending' ? -1 : 1) - (b.status === 'Pending' ? -1 : 1));
    }

    // Pagination
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '20px' }}>Yêu Cầu Cung Cấp Dịch Vụ</h2>

            {/* Statistics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>🟡 Chờ xử lý</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '8px' }}>{stats.pending}</div>
                </div>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#166534', fontSize: '13px', fontWeight: '600' }}>🟢 Đã nhận</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '8px' }}>{stats.accepted}</div>
                </div>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#991b1b', fontSize: '13px', fontWeight: '600' }}>🔴 Từ chối</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '8px' }}>{stats.rejected}</div>
                </div>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#0369a1', fontSize: '13px', fontWeight: '600' }}>📋 Tổng</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginTop: '8px' }}>{stats.total}</div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input 
                    type="text" 
                    placeholder="🔍 Tìm mã yêu cầu hoặc tên tour..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ flex: '1 1 250px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
                
                <select value={filterType} onChange={e => setFilterType(e.target.value)} style={filterSelectStyle}>
                    <option value="ALL">Loại YC: Tất cả</option>
                    <option value="INITIAL">Yêu cầu chính</option>
                    <option value="SUPPLEMENT">Yêu cầu bổ sung</option>
                </select>
                
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={filterSelectStyle}>
                    <option value="ALL">Trạng thái: Tất cả</option>
                    <option value="Pending">Chờ xử lý</option>
                    <option value="Accepted">Đã chấp nhận</option>
                    <option value="Rejected">Đã từ chối</option>
                </select>
                
                <select value={filterTime} onChange={e => setFilterTime(e.target.value)} style={filterSelectStyle}>
                    <option value="ALL">Thời gian: Tất cả</option>
                    <option value="TODAY">Hôm nay</option>
                    <option value="7DAYS">7 ngày gần đây</option>
                    <option value="30DAYS">30 ngày gần đây</option>
                </select>

                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={filterSelectStyle}>
                    <option value="NEWEST">Sắp xếp: Mới nhất</option>
                    <option value="OLDEST">Cũ nhất</option>
                    <option value="DEP_ASC">Khởi hành gần nhất</option>
                    <option value="DEP_DESC">Khởi hành xa nhất</option>
                </select>
                
                <button onClick={resetFilters} style={{ padding: '10px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', color: '#475569', fontWeight: '500' }}>
                    Đặt lại
                </button>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto', marginBottom: '24px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                            <th style={{ padding: '12px 8px', fontWeight: '600' }}>Mã YC</th>
                            <th style={{ padding: '12px 8px', fontWeight: '600' }}>Loại</th>
                            <th style={{ padding: '12px 8px', fontWeight: '600' }}>Tour</th>
                            <th style={{ padding: '12px 8px', fontWeight: '600' }}>Khởi hành</th>
                            <th style={{ padding: '12px 8px', fontWeight: '600' }}>Ngày tạo</th>
                            <th style={{ padding: '12px 8px', fontWeight: '600' }}>Dịch vụ</th>
                            <th style={{ padding: '12px 8px', fontWeight: '600' }}>Trạng thái</th>
                            <th style={{ padding: '12px 8px', fontWeight: '600' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>Đang tải dữ liệu...</td></tr> : 
                        paginated.length === 0 ? <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>Không tìm thấy yêu cầu nào phù hợp.</td></tr> :
                        paginated.map(req => {
                            const content = req.request_content;
                            const isNew = req.status === 'Pending';
                            
                            return (
                                <tr key={req.request_id} style={{ borderBottom: '1px solid #e2e8f0', background: isNew ? '#fefce8' : '#fff' }}>
                                    <td style={{ padding: '12px 8px', fontWeight: '600', color: '#0f172a' }}>
                                        {req.group_code}
                                        {isNew && <span style={{ marginLeft: '8px', background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '12px', fontSize: '10px' }}>🆕 Mới</span>}
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>
                                        {req.request_type === 'INITIAL' ? (
                                            <span style={{ color: '#0369a1', fontWeight: '500' }}>🔵 Chính</span>
                                        ) : (
                                            <div>
                                                <span style={{ color: '#d97706', fontWeight: '500' }}>🟠 Bổ sung</span>
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>Gốc: {req.parent_code}</div>
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px 8px', maxWidth: '180px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={req.tour_name}>
                                        {req.tour_name}
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>{new Date(req.departure_date).toLocaleDateString('vi-VN')}</td>
                                    <td style={{ padding: '12px 8px', color: '#475569' }}>
                                        <div>{new Date(req.group_created_at).toLocaleDateString('vi-VN')}</div><div style={{fontSize: '11px'}}>{new Date(req.group_created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>
                                        {req.service_type === 'HOTEL' ? (
                                            <div>
                                                <strong>🏨 Hotel</strong>
                                                <div style={{ color: '#475569', fontSize: '12px' }}>{content?.isGrouped ? `${content.items.length} hạng mục` : `${content?.rooms || req.quantity} phòng`}</div>
                                            </div>
                                        ) : (
                                            <div>
                                                <strong>🍽 Nhà hàng</strong>
                                                <div style={{ color: '#475569', fontSize: '12px' }}>{content?.isGrouped ? `${content.items.length} bữa ăn · ${req.quantity} suất` : `Bữa ${content?.mealType?.toLowerCase()} · ${req.quantity} suất`}</div>
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>
                                        <span style={{ 
                                            background: req.status === 'Accepted' ? '#dcfce7' : req.status === 'Rejected' ? '#fee2e2' : '#fef9c3', 
                                            color: req.status === 'Accepted' ? '#166534' : req.status === 'Rejected' ? '#991b1b' : '#854d0e', 
                                            padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' 
                                        }}>
                                            {req.status === 'Pending' ? '🟡 Chờ xử lý' : req.status === 'Accepted' ? '🟢 Đã nhận' : '🔴 Đã từ chối'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 8px' }}>
                                        <button 
                                            onClick={() => setDetailModal(req)}
                                            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', color: '#0369a1', fontWeight: '600' }}
                                        >
                                            Xem
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', alignItems: 'center' }}>
                    <button 
                        disabled={currentPage === 1} 
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        style={{ padding: '6px 12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: '#475569' }}
                    >← Trước</button>
                    
                    {[...Array(totalPages)].map((_, i) => (
                        <button 
                            key={i} 
                            onClick={() => setCurrentPage(i + 1)}
                            style={{ 
                                padding: '6px 12px', 
                                background: currentPage === i + 1 ? '#0369a1' : '#fff', 
                                color: currentPage === i + 1 ? '#fff' : '#475569', 
                                border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' 
                            }}
                        >{i + 1}</button>
                    ))}

                    <button 
                        disabled={currentPage === totalPages} 
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        style={{ padding: '6px 12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: '#475569' }}
                    >Sau →</button>
                </div>
            )}

            
            {/* Detail Modal */}
            {detailModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '12px', width: '500px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        
                        {/* 1. HEADER */}
                        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{detailModal.group_code}</h3>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    {detailModal.request_type === 'INITIAL' ? (
                                        <span style={{ color: '#0369a1', fontWeight: '600', fontSize: '13px' }}>🔵 Yêu cầu chính</span>
                                    ) : (
                                        <span style={{ color: '#d97706', fontWeight: '600', fontSize: '13px' }}>🟠 Yêu cầu bổ sung</span>
                                    )}
                                    <span style={{ 
                                        background: detailModal.status === 'Accepted' ? '#dcfce7' : detailModal.status === 'Rejected' ? '#fee2e2' : '#fef9c3', 
                                        color: detailModal.status === 'Accepted' ? '#166534' : detailModal.status === 'Rejected' ? '#991b1b' : '#854d0e', 
                                        padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' 
                                    }}>
                                        {detailModal.status === 'Pending' ? '🟡 Chờ xử lý' : detailModal.status === 'Accepted' ? '🟢 Đã chấp nhận' : '🔴 Đã từ chối'}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
                        </div>
                        
                        {/* 2. THÔNG TIN TOUR */}
                        <div style={{ padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Tour</div>
                                <div style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>{detailModal.tour_name}</div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Khởi hành</div>
                                    <div style={{ fontWeight: '600', color: '#334155' }}>{new Date(detailModal.departure_date).toLocaleDateString('vi-VN')}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Ngày tạo</div>
                                    <div style={{ fontWeight: '600', color: '#334155' }}>{new Date(detailModal.group_created_at).toLocaleDateString('vi-VN')} · {new Date(detailModal.group_created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
                                </div>
                            </div>
                        </div>

                        {/* 3. YÊU CẦU DỊCH VỤ */}
                        <div style={{ padding: '24px' }}>
                            {detailModal.request_type === 'SUPPLEMENT' && (
                                <div style={{ marginBottom: '20px', padding: '12px', background: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '4px' }}>
                                    <div style={{ fontSize: '12px', color: '#b45309', fontWeight: '600', marginBottom: '4px' }}>YÊU CẦU GỐC</div>
                                    <div style={{ fontWeight: '700', color: '#92400e' }}>{detailModal.parent_code}</div>
                                </div>
                            )}

                            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '800', color: detailModal.service_type === 'HOTEL' ? '#0369a1' : '#b45309', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {detailModal.service_type === 'HOTEL' ? '🏨 KHÁCH SẠN' : '🍽 NHÀ HÀNG'}
                            </h4>
                            
                            <div style={{ display: 'grid', gap: '16px', fontSize: '14px' }}>
                                <div>
                                    <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Nhà cung cấp</div>
                                    <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>{detailModal.partner_name}</div>
                                </div>
                                
                                {detailModal.service_type === 'HOTEL' ? (
                                    detailModal.request_content?.isGrouped ? (
                                        <div style={{ display: 'grid', gap: '12px' }}>
                                            {detailModal.request_content.items.map((item, idx) => (
                                                <div key={idx} style={{ padding: '12px', background: '#f1f5f9', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                                        <div><div style={{color: '#64748b', fontSize: '12px'}}>Check-in</div><div style={{fontWeight: '600', color: '#334155'}}>{item.checkIn ? new Date(item.checkIn).toLocaleDateString('vi-VN') : ''}</div></div>
                                                        <div><div style={{color: '#64748b', fontSize: '12px'}}>Check-out</div><div style={{fontWeight: '600', color: '#334155'}}>{item.checkOut ? new Date(item.checkOut).toLocaleDateString('vi-VN') : ''}</div></div>
                                                        <div><div style={{color: '#64748b', fontSize: '12px'}}>{detailModal.request_type === 'SUPPLEMENT' ? 'Phòng (bổ sung)' : 'Số phòng'}</div><div style={{fontWeight: '700', color: '#0369a1'}}>{detailModal.quantity}</div></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                        <div>
                                            <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Hạng phòng</div>
                                            <div style={{ fontWeight: '600', color: '#334155' }}>{detailModal.request_content?.serviceName || 'Theo thỏa thuận'}</div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div>
                                                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Check-in</div>
                                                <div style={{ fontWeight: '600', color: '#334155' }}>{detailModal.request_content?.checkIn ? new Date(detailModal.request_content.checkIn).toLocaleDateString('vi-VN') : ''}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Check-out</div>
                                                <div style={{ fontWeight: '600', color: '#334155' }}>{detailModal.request_content?.checkOut ? new Date(detailModal.request_content.checkOut).toLocaleDateString('vi-VN') : ''}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>{detailModal.request_type === 'SUPPLEMENT' ? 'Số lượng bổ sung' : 'Số lượng'}</div>
                                            <div style={{ fontWeight: '700', color: '#0369a1', fontSize: '16px' }}>{detailModal.request_content?.rooms || detailModal.quantity} phòng</div>
                                        </div>
                                    </>
                                    )
                                ) : (
                                    detailModal.request_content?.isGrouped ? (
                                        <div style={{ display: 'grid', gap: '12px' }}>
                                            {detailModal.request_content.items.map((item, idx) => (
                                                <div key={idx} style={{ padding: '12px', background: '#f1f5f9', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                                        <div><div style={{color: '#64748b', fontSize: '12px'}}>Bữa</div><div style={{fontWeight: '600', color: '#334155'}}>{item.mealType}</div></div>
                                                        <div><div style={{color: '#64748b', fontSize: '12px'}}>Ngày ăn</div><div style={{fontWeight: '600', color: '#334155'}}>{item.date ? new Date(item.date).toLocaleDateString('vi-VN') : ''}</div></div>
                                                        <div><div style={{color: '#64748b', fontSize: '12px'}}>{detailModal.request_type === 'SUPPLEMENT' ? 'Suất (bổ sung)' : 'Số suất'}</div><div style={{fontWeight: '700', color: '#b45309'}}>{detailModal.quantity}</div></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                        <div>
                                            <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Dịch vụ</div>
                                            <div style={{ fontWeight: '600', color: '#334155' }}>{detailModal.request_content?.serviceName || 'Theo thỏa thuận'}</div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div>
                                                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Bữa</div>
                                                <div style={{ fontWeight: '600', color: '#334155' }}>{detailModal.request_content?.mealType}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Ngày ăn</div>
                                                <div style={{ fontWeight: '600', color: '#334155' }}>{detailModal.request_content?.date ? new Date(detailModal.request_content.date).toLocaleDateString('vi-VN') : ''}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>{detailModal.request_type === 'SUPPLEMENT' ? 'Số suất bổ sung' : 'Số suất'}</div>
                                            <div style={{ fontWeight: '700', color: '#b45309', fontSize: '16px' }}>{detailModal.quantity} suất</div>
                                        </div>
                                    </>
                                    )
                                )}
                            </div>

                            {detailModal.status === 'Rejected' && detailModal.response_note && (
                                <div style={{ marginTop: '24px', padding: '16px', background: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '4px', color: '#991b1b' }}>
                                    <div style={{ fontSize: '12px', fontWeight: '700', marginBottom: '4px', textTransform: 'uppercase' }}>Lý do từ chối</div>
                                    <div style={{ fontWeight: '500' }}>{detailModal.response_note}</div>
                                </div>
                            )}
                            
                            {detailModal.status === 'Accepted' && detailModal.responded_at && (
                                <div style={{ marginTop: '24px', padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#166534', fontSize: '13px', textAlign: 'center' }}>
                                    Đã xác nhận vào lúc: <strong>{new Date(detailModal.responded_at).toLocaleDateString('vi-VN')} {new Date(detailModal.responded_at).toLocaleTimeString('vi-VN')}</strong>
                                </div>
                            )}
                        </div>

                        {detailModal.status === 'Pending' && (
                            <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: '12px' }}>
                                <button 
                                    onClick={() => setRejectModalOpen(true)}
                                    style={{ flex: 1, padding: '14px', background: '#fff', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.background = '#fef2f2'}
                                    onMouseOut={e => e.currentTarget.style.background = '#fff'}
                                >
                                    Từ chối
                                </button>
                                <button 
                                    onClick={() => {
                                        if (window.confirm(`Bạn có chắc chắn muốn xác nhận cung cấp dịch vụ này?\n\nTour: ${detailModal.tour_name}\nDịch vụ: ${detailModal.partner_name}\nSố lượng: ${detailModal.quantity}`)) {
                                            handleAccept(detailModal.request_id);
                                        }
                                    }}
                                    style={{ flex: 1, padding: '14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}
                                >
                                    ✓ Chấp nhận cung cấp
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '12px', width: '450px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>Từ chối yêu cầu dịch vụ</h3>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#475569' }}>Lý do từ chối <span style={{color: '#ef4444'}}>*</span></label>
                            <select 
                                value={rejectReason === 'Không còn phòng' || rejectReason === 'Không đủ số lượng' || rejectReason === 'Không phục vụ ngày này' || rejectReason === 'Giá không phù hợp' || rejectReason === '' ? rejectReason : 'Khác'}
                                onChange={e => {
                                    if (e.target.value !== 'Khác') setRejectReason(e.target.value);
                                    else setRejectReason(' ');
                                }}
                                style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '14px', backgroundColor: '#f8fafc' }}
                            >
                                <option value="">-- Chọn lý do --</option>
                                <option value="Không còn phòng">Không còn phòng</option>
                                <option value="Không đủ số lượng">Không đủ số lượng</option>
                                <option value="Không phục vụ ngày này">Không phục vụ ngày này</option>
                                <option value="Giá không phù hợp">Giá không phù hợp</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>
                        
                        {(rejectReason !== 'Không còn phòng' && rejectReason !== 'Không đủ số lượng' && rejectReason !== 'Không phục vụ ngày này' && rejectReason !== 'Giá không phù hợp' && rejectReason !== '') && (
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#475569' }}>Nhập lý do cụ thể <span style={{color: '#ef4444'}}>*</span></label>
                                <textarea 
                                    value={rejectReason.trim()}
                                    onChange={e => setRejectReason(e.target.value)}
                                    rows={3}
                                    placeholder="Xin nhập chi tiết..."
                                    style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', fontSize: '14px' }}
                                ></textarea>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <button onClick={() => { setRejectModalOpen(false); setRejectReason(''); }} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Hủy</button>
                            <button onClick={handleReject} style={{ padding: '10px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)' }}>Xác nhận từ chối</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

const filterSelectStyle = {
    padding: '10px 14px', 
    borderRadius: '8px', 
    border: '1px solid #cbd5e1', 
    outline: 'none',
    backgroundColor: '#fff',
    minWidth: '150px'
};

export default PartnerServiceRequests;

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ServiceRequestList = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupDetails, setGroupDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [viewedRequests, setViewedRequests] = useState([]);

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterCreatedFrom, setFilterCreatedFrom] = useState('');
    const [filterCreatedTo, setFilterCreatedTo] = useState('');
    const [sortBy, setSortBy] = useState('DEFAULT');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        const stored = localStorage.getItem('viewedRequests');
        if (stored) {
            try {
                setViewedRequests(JSON.parse(stored));
            } catch (e) {}
        }
        fetchGroups().then((loadedGroups) => {
            const openId = localStorage.getItem('openServiceRequestId');
            if (openId && loadedGroups) {
                const g = loadedGroups.find(x => x.id.toString() === openId.toString());
                if (g) {
                    handleOpenDetail(g);
                }
                localStorage.removeItem('openServiceRequestId');
            }
        });
    }, []);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/service-requests/groups', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setGroups(res.data.data);
                return res.data.data;
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
        return null;
    };

    const handleOpenDetail = async (group) => {
        setSelectedGroup(group);
        setLoadingDetails(true);
        
        // Mark as viewed
        if (!viewedRequests.includes(group.id)) {
            const updated = [...viewedRequests, group.id];
            setViewedRequests(updated);
            localStorage.setItem('viewedRequests', JSON.stringify(updated));
        }

        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/service-requests/groups/${group.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setGroupDetails(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const closeModal = () => {
        setSelectedGroup(null);
        setGroupDetails(null);
    };

    const getStatusBadge = (status) => {
        const badgeStyle = { display: 'inline-block', whiteSpace: 'nowrap', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' };
        const s = status ? status.toUpperCase() : '';
        if (s === 'PROCESSING') return <span style={{ background: '#e0f2fe', color: '#0369a1', ...badgeStyle }}>🔄 Đang xử lý</span>;
        if (s === 'PENDING') return <span style={{ background: '#fef9c3', color: '#854d0e', ...badgeStyle }}>🟡 Chờ xử lý</span>;
        if (s === 'ACCEPTED' || s === 'COMPLETED') return <span style={{ background: '#dcfce7', color: '#166534', ...badgeStyle }}>🟢 Hoàn tất</span>;
        if (s === 'REJECTED') return <span style={{ background: '#fee2e2', color: '#991b1b', ...badgeStyle }}>🔴 Đã từ chối</span>;
        return <span style={{ background: '#f1f5f9', color: '#475569', ...badgeStyle }}>{status}</span>;
    };

    // Filters
    let filtered = groups.filter(g => {
        const term = searchTerm.toLowerCase();
        if (term && !g.code.toLowerCase().includes(term) && !g.tour_name.toLowerCase().includes(term)) return false;
        
        if (filterType !== 'ALL' && g.request_type !== filterType) return false;
        if (filterStatus !== 'ALL') {
            const s = g.status ? g.status.toUpperCase() : '';
            if (filterStatus === 'PENDING' && s !== 'PROCESSING' && s !== 'PENDING') return false;
            if (filterStatus === 'ACCEPTED' && s !== 'ACCEPTED' && s !== 'COMPLETED') return false;
            if (filterStatus === 'REJECTED' && s !== 'REJECTED') return false;
        }
        
        if (filterCreatedFrom || filterCreatedTo) {
            const gDate = new Date(g.created_at).toISOString().split('T')[0];
            if (filterCreatedFrom && gDate < filterCreatedFrom) return false;
            if (filterCreatedTo && gDate > filterCreatedTo) return false;
        }
        
        return true;
    });

    // Sorting
    filtered.sort((a, b) => {
        if (sortBy === 'DEFAULT' || sortBy === 'NEWEST') {
            // Priority: Unviewed Pending/Processing -> Viewed -> Older
            const isUnviewedA = !viewedRequests.includes(a.id);
            const isUnviewedB = !viewedRequests.includes(b.id);
            
            if (sortBy === 'DEFAULT') {
                if (isUnviewedA && !isUnviewedB) return -1;
                if (!isUnviewedA && isUnviewedB) return 1;
            }
            return new Date(b.created_at) - new Date(a.created_at);
        }
        if (sortBy === 'OLDEST') return new Date(a.created_at) - new Date(b.created_at);
        if (sortBy === 'DEP_ASC') return new Date(a.departure_date) - new Date(b.departure_date);
        if (sortBy === 'DEP_DESC') return new Date(b.departure_date) - new Date(a.departure_date);
        return 0;
    });

    // Stats
    const stats = {
        total: groups.length,
        processing: groups.filter(g => g.status === 'PROCESSING' || g.status === 'PENDING').length,
        completed: groups.filter(g => g.status === 'COMPLETED' || g.status === 'ACCEPTED').length,
        supplement: groups.filter(g => g.request_type === 'SUPPLEMENT').length
    };

    // Pagination
    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const resetFilters = () => {
        setSearchTerm('');
        setFilterType('ALL');
        setFilterStatus('ALL');
        setFilterCreatedFrom('');
        setFilterCreatedTo('');
        setSortBy('DEFAULT');
        setCurrentPage(1);
    };

    return (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '24px' }}>Danh sách Yêu cầu Dịch vụ</h2>

            {/* Thống kê */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>📋 Tổng yêu cầu</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginTop: '8px' }}>{stats.total}</div>
                </div>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#0369a1', fontSize: '13px', fontWeight: '600' }}>🔄 Đang/Chờ xử lý</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginTop: '8px' }}>{stats.processing}</div>
                </div>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#166534', fontSize: '13px', fontWeight: '600' }}>🟢 Đã hoàn tất</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginTop: '8px' }}>{stats.completed}</div>
                </div>
                <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#d97706', fontSize: '13px', fontWeight: '600' }}>🟠 Bổ sung</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginTop: '8px' }}>{stats.supplement}</div>
                </div>
            </div>

            {/* Bộ lọc */}
            <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
                    <label style={filterLabelStyle}>Tìm kiếm</label>
                    <input 
                        type="text" 
                        placeholder="🔍 Tìm mã YC hoặc tên Tour..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', width: '100%' }}
                    />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={filterLabelStyle}>Trạng thái</label>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={filterSelectStyle}>
                        <option value="ALL">Tất cả</option>
                        <option value="PENDING">Đang/Chờ xử lý</option>
                        <option value="ACCEPTED">Đã hoàn tất</option>
                        <option value="REJECTED">Đã từ chối</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={filterLabelStyle}>Loại YC</label>
                    <select value={filterType} onChange={e => setFilterType(e.target.value)} style={filterSelectStyle}>
                        <option value="ALL">Tất cả</option>
                        <option value="INITIAL">Yêu cầu chính</option>
                        <option value="SUPPLEMENT">Yêu cầu bổ sung</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={filterLabelStyle}>Ngày tạo từ</label>
                    <input type="date" value={filterCreatedFrom} onChange={e => setFilterCreatedFrom(e.target.value)} style={filterSelectStyle} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={filterLabelStyle}>Ngày tạo đến</label>
                    <input type="date" value={filterCreatedTo} onChange={e => setFilterCreatedTo(e.target.value)} style={filterSelectStyle} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={filterLabelStyle}>Sắp xếp</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={filterSelectStyle}>
                        <option value="DEFAULT">Mặc định</option>
                        <option value="NEWEST">Mới nhất → Cũ nhất</option>
                        <option value="OLDEST">Cũ nhất → Mới nhất</option>
                        <option value="DEP_ASC">Khởi hành gần nhất</option>
                        <option value="DEP_DESC">Khởi hành xa nhất</option>
                    </select>
                </div>

                <button onClick={resetFilters} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#475569', fontWeight: '500', fontSize: '13px', height: '35px' }}>
                    Xóa lọc
                </button>
            </div>

            {/* Bảng dữ liệu */}
            <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', overflowX: 'auto', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                            <th style={{ padding: '12px', fontWeight: '600' }}>Mã YC</th>
                            <th style={{ padding: '12px', fontWeight: '600' }}>Tour</th>
                            <th style={{ padding: '12px', fontWeight: '600' }}>Khởi hành</th>
                            <th style={{ padding: '12px', fontWeight: '600' }}>Ngày tạo</th>
                            <th style={{ padding: '12px', fontWeight: '600' }}>Loại</th>
                            <th style={{ padding: '12px', fontWeight: '600' }}>Tiến độ phản hồi</th>
                            <th style={{ padding: '12px', fontWeight: '600' }}>Trạng thái</th>
                            <th style={{ padding: '12px', fontWeight: '600' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>Đang tải...</td></tr> : 
                        paginated.length === 0 ? <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>Không có dữ liệu.</td></tr> :
                        paginated.map(g => {
                            const isNew = !viewedRequests.includes(g.id);
                            
                            // Warning sắp khởi hành
                            const depDate = new Date(g.departure_date);
                            const diffDays = (depDate - new Date()) / (1000 * 60 * 60 * 24);
                            const showWarning = (g.status === 'PROCESSING' || g.status === 'PENDING') && diffDays <= 7 && diffDays >= 0;

                            return (
                                <tr key={g.id} style={{ borderBottom: '1px solid #e2e8f0', background: isNew ? '#fefce8' : '#fff', transition: 'background 0.2s' }}>
                                    <td style={{ padding: '12px', fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap' }}>
                                        {g.code}
                                        {isNew && <span style={{ marginLeft: '8px', background: '#ef4444', color: '#fff', padding: '2px 6px', borderRadius: '12px', fontSize: '10px', display: 'inline-block' }}>🆕 Mới</span>}
                                    </td>
                                    
                                    <td style={{ padding: '12px', maxWidth: '200px' }}>
                                        <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', title: g.tour_name }}>
                                            {g.tour_name}
                                        </div>
                                    </td>
                                    
                                    <td style={{ padding: '12px', color: '#475569', fontWeight: '500', whiteSpace: 'nowrap' }}>
                                        {new Date(g.departure_date).toLocaleDateString('vi-VN')}
                                        {showWarning && <div style={{ fontSize: '11px', color: '#d97706', fontWeight: 'bold', marginTop: '4px' }}>⚠ Sắp khởi hành</div>}
                                    </td>

                                    <td style={{ padding: '12px', color: '#475569', whiteSpace: 'nowrap' }}>
                                        <div>{new Date(g.created_at).toLocaleDateString('vi-VN')}</div>
                                        <div style={{ fontSize: '11px' }}>{new Date(g.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
                                    </td>
                                    
                                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                                        {g.request_type === 'INITIAL' ? (
                                            <span style={{ color: '#0369a1', fontWeight: '600' }}>🔵 Yêu cầu chính</span>
                                        ) : (
                                            <div>
                                                <span style={{ color: '#d97706', fontWeight: '600' }}>🟣 Yêu cầu bổ sung</span>
                                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Gốc: {g.parent_code}</div>
                                            </div>
                                        )}
                                    </td>
                                    
                                    <td style={{ padding: '12px', minWidth: '150px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                                            {g.accepted_count > 0 && <div style={{ color: '#166534', fontWeight: '500' }}>🟢 {g.accepted_count}/{g.request_count} chấp nhận</div>}
                                            {g.pending_count > 0 && <div style={{ color: '#b45309', fontWeight: '500' }}>🟡 {g.pending_count} chờ xử lý</div>}
                                            {g.rejected_count > 0 && <div style={{ color: '#991b1b', fontWeight: '500' }}>🔴 {g.rejected_count} từ chối</div>}
                                            {g.request_count === 0 && <div style={{ color: '#64748b' }}>Chưa có phiếu</div>}
                                        </div>
                                    </td>
                                    
                                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                                        {getStatusBadge(g.status)}
                                    </td>
                                    
                                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                                        <button 
                                            onClick={() => handleOpenDetail(g)}
                                            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 16px', borderRadius: '6px', cursor: 'pointer', color: '#0369a1', fontWeight: '600', fontSize: '12px' }}
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

            {/* Phân trang */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                        Hiển thị {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} trong {filtered.length} yêu cầu.
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} style={{ ...filterSelectStyle, minWidth: 'auto', padding: '6px' }}>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={pageBtnStyle(currentPage === 1)}>← Trước</button>
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={pageBtnStyle(currentPage === totalPages)}>Sau →</button>
                    </div>
                </div>
            )}

            {/* Chi tiết Modal */}
            {selectedGroup && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: '12px', width: '900px', maxWidth: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{groupDetails ? groupDetails.code : 'Đang tải...'}</h3>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    {groupDetails?.request_type === 'INITIAL' ? (
                                        <span style={{ color: '#0369a1', fontWeight: '600', fontSize: '13px' }}>🔵 Yêu cầu chính</span>
                                    ) : (
                                        <span style={{ color: '#d97706', fontWeight: '600', fontSize: '13px' }}>🟣 Yêu cầu bổ sung</span>
                                    )}
                                    {getStatusBadge(groupDetails?.status)}
                                </div>
                            </div>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
                        </div>
                        
                        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
                            {loadingDetails ? <p style={{ textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu...</p> : groupDetails && (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px', background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ gridColumn: 'span 3' }}>
                                            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Tour</div>
                                            <div style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>{groupDetails.tour_name}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Khởi hành</div>
                                            <div style={{ fontWeight: '600', color: '#334155' }}>{new Date(groupDetails.departure_date).toLocaleDateString('vi-VN')}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Số khách</div>
                                            <div style={{ fontWeight: '600', color: '#334155' }}>{groupDetails.passenger_count}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Ngày tạo</div>
                                            <div style={{ fontWeight: '600', color: '#334155' }}>{new Date(groupDetails.created_at).toLocaleDateString('vi-VN')} {new Date(groupDetails.created_at).toLocaleTimeString('vi-VN')}</div>
                                        </div>
                                    </div>

                                    <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Danh sách Phiếu ({groupDetails.requests?.length || 0})
                                    </h4>
                                    
                                    <div style={{ display: 'grid', gap: '16px' }}>
                                        {groupDetails.requests?.map((req, idx) => (
                                            <div key={idx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px dashed #e2e8f0' }}>
                                                    <div style={{ fontWeight: '700', color: req.service_type === 'HOTEL' ? '#0369a1' : '#b45309', fontSize: '15px' }}>
                                                        {req.service_type === 'HOTEL' ? '🏨 Khách sạn' : '🍽 Nhà hàng'} · {req.partner_name}
                                                    </div>
                                                    <span style={{ 
                                                        background: req.status === 'Accepted' ? '#dcfce7' : req.status === 'Rejected' ? '#fee2e2' : '#fef9c3', 
                                                        color: req.status === 'Accepted' ? '#166534' : req.status === 'Rejected' ? '#991b1b' : '#854d0e', 
                                                        padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' 
                                                    }}>
                                                        {req.status === 'Pending' ? '🟡 Chờ đối tác' : req.status === 'Accepted' ? '🟢 Đã nhận' : '🔴 Bị từ chối'}
                                                    </span>
                                                </div>
                                                
                                                <div style={{ fontSize: '13px', color: '#334155', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                    {req.service_type === 'HOTEL' ? (
                                                        req.request_content?.isGrouped ? (
                                                            <>
                                                                <div style={{ gridColumn: 'span 2' }}>
                                                                    {req.request_content.items.map((it, i) => (
                                                                        <div key={i} style={{ padding: '6px 0', display: 'flex', justifyContent: 'space-between', borderBottom: i < req.request_content.items.length - 1 ? '1px dashed #e2e8f0' : 'none' }}>
                                                                            <span style={{ color: '#64748b' }}>{it.checkIn ? new Date(it.checkIn).toLocaleDateString('vi-VN') : ''} - {it.checkOut ? new Date(it.checkOut).toLocaleDateString('vi-VN') : ''}</span>
                                                                            <strong style={{color: '#0369a1', fontSize: '14px'}}>{req.quantity} phòng</strong>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                            <div><span style={{ color: '#64748b' }}>Hạng phòng:</span> <strong style={{color: '#0f172a'}}>{req.request_content?.serviceName || 'Theo thỏa thuận'}</strong></div>
                                                            <div><span style={{ color: '#64748b' }}>Số phòng:</span> <strong style={{color: '#0369a1', fontSize: '14px'}}>{req.request_content?.rooms || req.quantity}</strong></div>
                                                            <div><span style={{ color: '#64748b' }}>Check-in:</span> <strong style={{color: '#0f172a'}}>{req.request_content?.checkIn ? new Date(req.request_content.checkIn).toLocaleDateString('vi-VN') : ''}</strong></div>
                                                            <div><span style={{ color: '#64748b' }}>Check-out:</span> <strong style={{color: '#0f172a'}}>{req.request_content?.checkOut ? new Date(req.request_content.checkOut).toLocaleDateString('vi-VN') : ''}</strong></div>
                                                        </>
                                                        )
                                                    ) : (
                                                        req.request_content?.isGrouped ? (
                                                            <>
                                                                <div style={{ gridColumn: 'span 2' }}>
                                                                    {req.request_content.items.map((it, i) => (
                                                                        <div key={i} style={{ padding: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
                                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                                <strong style={{color: '#0f172a', width: '40px'}}>{it.mealType}</strong> 
                                                                                <span style={{color: '#64748b'}}>{it.date ? new Date(it.date).toLocaleDateString('vi-VN') : ''}</span>
                                                                            </div>
                                                                            <strong style={{color: '#b45309', fontSize: '14px'}}>{req.quantity} suất</strong>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                            <div><span style={{ color: '#64748b' }}>Dịch vụ:</span> <strong style={{color: '#0f172a'}}>{req.request_content?.serviceName || 'Theo thỏa thuận'}</strong></div>
                                                            <div><span style={{ color: '#64748b' }}>Số suất:</span> <strong style={{color: '#b45309', fontSize: '14px'}}>{req.quantity}</strong></div>
                                                            <div><span style={{ color: '#64748b' }}>Bữa:</span> <strong style={{color: '#0f172a'}}>{req.request_content?.mealType}</strong></div>
                                                            <div><span style={{ color: '#64748b' }}>Ngày ăn:</span> <strong style={{color: '#0f172a'}}>{req.request_content?.date ? new Date(req.request_content.date).toLocaleDateString('vi-VN') : ''}</strong></div>
                                                        </>
                                                        )
                                                    )}
                                                </div>
                                                
                                                {req.status === 'Rejected' && req.response_note && (
                                                    <div style={{ marginTop: '16px', padding: '12px', background: '#fef2f2', borderLeft: '3px solid #ef4444', borderRadius: '4px', color: '#991b1b', fontSize: '13px' }}>
                                                        <div style={{ fontWeight: '700', marginBottom: '2px' }}>Lý do từ chối:</div>
                                                        {req.response_note}
                                                    </div>
                                                )}
                                                {req.status === 'Accepted' && req.responded_at && (
                                                    <div style={{ marginTop: '16px', padding: '8px', background: '#f0fdf4', borderRadius: '4px', color: '#166534', fontSize: '12px', textAlign: 'center' }}>
                                                        Đã xác nhận vào lúc: <strong>{new Date(req.responded_at).toLocaleDateString('vi-VN')} {new Date(req.responded_at).toLocaleTimeString('vi-VN')}</strong>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const filterLabelStyle = {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b'
};

const filterSelectStyle = {
    padding: '8px 12px', 
    borderRadius: '6px', 
    border: '1px solid #cbd5e1', 
    outline: 'none',
    backgroundColor: '#fff',
    fontSize: '13px',
    color: '#334155',
    minWidth: '130px',
    height: '35px'
};

const pageBtnStyle = (disabled) => ({
    padding: '6px 12px',
    background: '#fff',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled ? '#94a3b8' : '#475569',
    fontSize: '13px',
    fontWeight: '500'
});

export default ServiceRequestList;

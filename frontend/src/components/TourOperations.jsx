import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const TourOperations = () => {
    const [departures, setDepartures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDep, setSelectedDep] = useState(null);
    const [actionNote, setActionNote] = useState('');

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterProvince, setFilterProvince] = useState('ALL');
    const [filterMonth, setFilterMonth] = useState('UPCOMING');
    const [filterBooking, setFilterBooking] = useState('Open');
    const [filterOp, setFilterOp] = useState('ALL');
    const [filterMilestone, setFilterMilestone] = useState('ALL');
    const [onlyNeedsReview, setOnlyNeedsReview] = useState(false);

    useEffect(() => {
        fetchDepartures();
    }, []);

    const fetchDepartures = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/tours/operations/departures', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setDepartures(res.data.data);
            }
        } catch (error) {
            console.error('Lỗi tải danh sách vận hành:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action) => {
        if (!selectedDep) return;
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : {};

            const payload = {
                action: action,
                note: actionNote,
                user_id: user.id || null,
                user_name: user.full_name || 'System'
            };

            const res = await axios.post(`http://localhost:5000/api/tours/operations/departures/${selectedDep.departure_id}/decision`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setActionNote('');
                setSelectedDep(null);
                fetchDepartures(); 
            }
        } catch (error) {
            console.error('Lỗi ghi nhận quyết định:', error);
            alert('Có lỗi xảy ra khi lưu quyết định.');
        }
    };

    const formatDate = (d) => {
        if (!d) return 'N/A';
        return new Date(d).toLocaleDateString('vi-VN');
    };

    const isNeedsReview = (dep) => {
        if (dep.days_until <= 0) return false;
        if (dep.days_until <= 14 && dep.days_until > 7 && dep.operational_status === 'Pending' && dep.status === 'Open') return true;
        if (dep.days_until <= 7 && dep.days_until > 0 && dep.status === 'Open') return true;
        return false;
    };

    const processedDepartures = useMemo(() => {
        return departures.map(dep => {
            const minPax = Math.min(dep.min_pax || 0, dep.max_slots || Infinity);
            const currentPax = dep.current_pax || 0;
            
            let milestoneLabel = 'Khởi hành';
            let milestoneValue = 'DEPARTED';
            let milestoneDesc = 'Đã khởi hành';

            if (dep.days_until > 21) { 
                milestoneLabel = 'T-21'; 
                milestoneValue = 'PRE_T21'; 
                milestoneDesc = `Còn ${dep.days_until} ngày`;
            } else if (dep.days_until <= 21 && dep.days_until > 14) { 
                milestoneLabel = 'T-21'; 
                milestoneValue = 'T21'; 
                milestoneDesc = `Còn ${dep.days_until} ngày`;
            } else if (dep.days_until <= 14 && dep.days_until > 7) { 
                milestoneLabel = 'T-14'; 
                milestoneValue = 'T14'; 
                milestoneDesc = 'Cần xem xét';
            } else if (dep.days_until <= 7 && dep.days_until > 0) { 
                milestoneLabel = 'T-7'; 
                milestoneValue = 'T7'; 
                milestoneDesc = 'Đóng booking';
            }

            let opStatus = dep.operational_status;
            if (dep.days_until <= 0 && opStatus === 'Pending') opStatus = 'Confirmed';

            return {
                ...dep,
                ui_min_pax: minPax,
                milestoneLabel,
                milestoneValue,
                milestoneDesc,
                ui_op_status: opStatus,
                needs_review: isNeedsReview(dep)
            };
        });
    }, [departures]);

    const kpi = useMemo(() => {
        return {
            total: processedDepartures.length,
            open: processedDepartures.filter(d => d.status === 'Open').length,
            review: processedDepartures.filter(d => d.needs_review).length,
            confirmed: processedDepartures.filter(d => d.ui_op_status === 'Confirmed').length,
            closed: processedDepartures.filter(d => d.status === 'Closed' || d.ui_op_status === 'Cancelled').length
        };
    }, [processedDepartures]);

    const uniqueProvinces = useMemo(() => {
        const dests = processedDepartures.map(d => d.destination).filter(Boolean);
        return [...new Set(dests)].sort();
    }, [processedDepartures]);

    const filteredDepartures = useMemo(() => {
        return processedDepartures.filter(dep => {
            if (onlyNeedsReview && !dep.needs_review) return false;
            
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                if (!dep.tour_name?.toLowerCase().includes(term) && !String(dep.departure_id).includes(term)) {
                    return false;
                }
            }
            if (filterProvince !== 'ALL') {
                if (dep.destination !== filterProvince) return false;
            }
            if (filterMonth === 'UPCOMING') {
                const depDate = new Date(dep.departure_date);
                const now = new Date();
                const isCurrentMonth = depDate.getMonth() === now.getMonth() && depDate.getFullYear() === now.getFullYear();
                const isFuture = dep.days_until >= 0;
                if (!isCurrentMonth && !isFuture) return false;
            } else if (filterMonth !== 'ALL') {
                const m = new Date(dep.departure_date).getMonth() + 1;
                if (m.toString() !== filterMonth) return false;
            }
            if (filterBooking !== 'ALL') {
                if (dep.status !== filterBooking) return false;
            }
            if (filterOp !== 'ALL') {
                if (dep.ui_op_status !== filterOp) return false;
            }
            if (filterMilestone !== 'ALL') {
                if (dep.milestoneValue !== filterMilestone) return false;
            }
            return true;
        });
    }, [processedDepartures, searchTerm, filterMonth, filterProvince, filterBooking, filterOp, filterMilestone, onlyNeedsReview]);

    const reviewDepartures = filteredDepartures.filter(d => d.needs_review);

    const renderBadge = (type, val) => {
        let bg = '#f1f5f9', color = '#475569', label = val;
        
        if (type === 'booking') {
            if (val === 'Open') { bg = '#dcfce7'; color = '#166534'; label = '🟢 Đang mở bán'; }
            if (val === 'Closed') { bg = '#fee2e2'; color = '#991b1b'; label = '🔴 Đã đóng'; }
        } else if (type === 'op') {
            if (val === 'Pending') { bg = '#f1f5f9'; color = '#475569'; label = '⚪ Chưa xem xét'; }
            if (val === 'Reviewing') { bg = '#ffedd5'; color = '#c2410c'; label = '🟠 Cần xem xét'; }
            if (val === 'Confirmed') { bg = '#e0f2fe'; color = '#075985'; label = '🔵 Đã xác nhận'; }
            if (val === 'Cancelled') { bg = '#fee2e2'; color = '#991b1b'; label = '🔴 Đã hủy/đóng'; }
        }

        return (
            <span style={{
                display: 'inline-block', padding: '2px 6px', borderRadius: '8px',
                fontSize: '11px', fontWeight: '500', backgroundColor: bg, color: color,
                whiteSpace: 'nowrap', border: `1px solid ${bg === '#f1f5f9' ? '#e2e8f0' : 'transparent'}`
            }}>
                {label}
            </span>
        );
    };

    const renderTimeline = (dep) => {
        const steps = [
            { id: 'T21', label: 'T-21', desc: 'Chuẩn bị' },
            { id: 'T14', label: 'T-14', desc: 'Xem xét' },
            { id: 'T7', label: 'T-7', desc: 'Đóng booking' },
            { id: 'DEP', label: 'Khởi hành', desc: 'Chạy tour' }
        ];

        let activeIdx = 0;
        if (dep.days_until <= 0) activeIdx = 3;
        else if (dep.days_until <= 7) activeIdx = 2;
        else if (dep.days_until <= 14) activeIdx = 1;
        else if (dep.days_until <= 21) activeIdx = 0;
        else activeIdx = -1;

        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '12px', left: '10%', right: '10%', height: '2px', background: '#e2e8f0', zIndex: 0 }}></div>
                <div style={{ position: 'absolute', top: '12px', left: '10%', right: `${100 - ((Math.max(0, activeIdx)/3)*80 + 10)}%`, height: '2px', background: '#0194f3', zIndex: 1, transition: 'all 0.3s' }}></div>
                
                {steps.map((s, i) => {
                    const isActive = i <= activeIdx;
                    const isCurrent = i === activeIdx;
                    return (
                        <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, width: '80px' }}>
                            <div style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                background: isActive ? '#0194f3' : '#fff',
                                border: `2px solid ${isActive ? '#0194f3' : '#cbd5e1'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: isActive ? '#fff' : 'transparent',
                                fontSize: '12px', fontWeight: 'bold'
                            }}>
                                {isActive && '✓'}
                            </div>
                            <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: isCurrent ? '700' : '500', color: isCurrent ? '#0f172a' : '#64748b', whiteSpace: 'nowrap' }}>{s.label}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{s.desc}</div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilterProvince('ALL');
        setFilterMonth('UPCOMING');
        setFilterBooking('Open');
        setFilterOp('ALL');
        setFilterMilestone('ALL');
        setOnlyNeedsReview(false);
    };

    return (
        <div className="ops-container" style={{ padding: '24px', maxWidth: '100%', margin: '0 auto', fontFamily: 'Inter, sans-serif', color: '#334155', background: '#f7f9fc', minHeight: '100vh' }}>
            <style>{`
                .ops-kpi-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; flex: 1; min-width: 140px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
                .ops-kpi-val { font-size: 24px; font-weight: 700; margin-top: 8px; }
                .ops-kpi-title { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
                
                .ops-filter-select, .ops-filter-input { padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 13px; outline: none; background: #fff; }
                .ops-filter-select:focus, .ops-filter-input:focus { border-color: #0194f3; }
                
                .ops-table-container { width: 100%; overflow-x: auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
                .ops-table { width: 100%; min-width: 850px; table-layout: fixed; border-collapse: collapse; }
                
                /* Column Widths (total 100%) */
                .col-tour { width: 33%; }
                .col-date { width: 11%; }
                .col-pax { width: 11%; }
                .col-status-book { width: 14%; }
                .col-status-op { width: 14%; }
                .col-milestone { width: 10%; }
                .col-action { width: 7%; }

                .ops-table th { background: #f8fafc; padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
                .ops-table td { padding: 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
                .ops-table tr:last-child td { border-bottom: none; }
                .ops-table tr:hover { background: #f8fafc; }
                
                /* Tour name truncate up to 2 lines */
                .tour-name-text { font-weight: 600; color: #0f172a; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.4; }
                
                .ops-btn-compact { padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; background: #e0f2fe; color: #0369a1; }
                .ops-btn-compact:hover { background: #bae6fd; }
            `}</style>

            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>⚙️ Vận hành Tour</h2>
                <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Quản lý vòng đời vận hành của các đợt khởi hành</p>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <div className="ops-kpi-card">
                    <div className="ops-kpi-title">📅 Tổng tour</div>
                    <div className="ops-kpi-val" style={{ color: '#0f172a' }}>{kpi.total}</div>
                </div>
                <div className="ops-kpi-card">
                    <div className="ops-kpi-title">🟢 Đang bán</div>
                    <div className="ops-kpi-val" style={{ color: '#166534' }}>{kpi.open}</div>
                </div>
                <div className="ops-kpi-card" style={{ border: '1px solid #fcd34d', background: '#fffbeb' }}>
                    <div className="ops-kpi-title" style={{ color: '#b45309' }}>⚠️ Cần xem xét</div>
                    <div className="ops-kpi-val" style={{ color: '#d97706' }}>{kpi.review}</div>
                </div>
                <div className="ops-kpi-card">
                    <div className="ops-kpi-title">✓ Vận hành</div>
                    <div className="ops-kpi-val" style={{ color: '#0369a1' }}>{kpi.confirmed}</div>
                </div>
                <div className="ops-kpi-card">
                    <div className="ops-kpi-title">🔴 Đã đóng</div>
                    <div className="ops-kpi-val" style={{ color: '#991b1b' }}>{kpi.closed}</div>
                </div>
            </div>

            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input 
                        type="text" 
                        placeholder="🔎 Tìm kiếm tên tour..." 
                        className="ops-filter-input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ flex: '1 1 200px' }}
                    />
                    <select className="ops-filter-select" value={filterProvince} onChange={e => setFilterProvince(e.target.value)}>
                        <option value="ALL">Tỉnh thành: Tất cả</option>
                        {uniqueProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select className="ops-filter-select" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                        <option value="UPCOMING">Tháng này & sắp đến</option>
                        <option value="ALL">Tháng: Tất cả</option>
                        {[...Array(12).keys()].map(i => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}
                    </select>
                    <select className="ops-filter-select" value={filterBooking} onChange={e => setFilterBooking(e.target.value)}>
                        <option value="ALL">Bán: Tất cả</option>
                        <option value="Open">Đang mở bán</option>
                        <option value="Closed">Đã đóng booking</option>
                    </select>
                    <select className="ops-filter-select" value={filterOp} onChange={e => {
                        const val = e.target.value;
                        setFilterOp(val);
                        if (val === 'Cancelled' && filterBooking === 'Open') {
                            setFilterBooking('ALL');
                        }
                    }}>
                        <option value="ALL">Vận hành: Tất cả</option>
                        <option value="Pending">Chưa xem xét</option>
                        <option value="Reviewing">Đang xem xét</option>
                        <option value="Confirmed">Đã xác nhận vận hành</option>
                        <option value="Cancelled">Đã đóng / Hủy</option>
                    </select>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', color: '#b45309', background: '#fffbeb', padding: '8px 12px', borderRadius: '8px' }}>
                        <input type="checkbox" checked={onlyNeedsReview} onChange={e => setOnlyNeedsReview(e.target.checked)} />
                        ⚠️ Chỉ tour cần xử lý
                    </label>
                    <button onClick={resetFilters} style={{ padding: '8px 12px', background: 'transparent', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer', fontWeight: '500', textDecoration: 'underline' }}>
                        Đặt lại
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Đang tải dữ liệu...</div>
            ) : (
                <>
                    {reviewDepartures.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0, fontSize: '16px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    ⚠️ Tour cần xử lý
                                </h3>
                                <span style={{ fontSize: '13px', color: '#64748b' }}>Các đợt đang chờ quyết định hoặc sắp đến hạn</span>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {reviewDepartures.map(dep => (
                                    <div key={dep.departure_id} style={{ background: '#fff', border: '1px solid #fcd34d', borderLeft: '4px solid #f59e0b', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{dep.tour_name}</div>
                                            <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#475569' }}>
                                                <span>📅 {formatDate(dep.departure_date)}</span>
                                                <span>👥 {dep.current_pax}/{dep.max_slots}</span>
                                                <span style={{ color: '#dc2626', fontWeight: '600' }}>⏱ {dep.milestoneLabel}: {dep.milestoneDesc}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedDep(dep)} className="ops-btn-compact">
                                            Xem
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a' }}>📋 Tất cả đợt khởi hành</h3>
                        <div className="ops-table-container">
                            <table className="ops-table">
                                <thead>
                                    <tr>
                                        <th className="col-tour">Tour</th>
                                        <th className="col-date">Khởi hành</th>
                                        <th className="col-pax">Khách</th>
                                        <th className="col-status-book">Trạng thái bán</th>
                                        <th className="col-status-op">Trạng thái vận hành</th>
                                        <th className="col-milestone">Mốc</th>
                                        <th className="col-action" style={{ textAlign: 'right' }}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDepartures.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>Không tìm thấy dữ liệu phù hợp với bộ lọc.</td>
                                        </tr>
                                    ) : (
                                        filteredDepartures.map(dep => (
                                            <tr key={dep.departure_id}>
                                                <td>
                                                    <div className="tour-name-text" title={dep.tour_name}>
                                                        {dep.tour_name}
                                                    </div>
                                                </td>
                                                <td style={{ color: '#334155', fontWeight: '500' }}>{formatDate(dep.departure_date)}</td>
                                                <td>
                                                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{dep.current_pax}/{dep.max_slots}</div>
                                                    <div style={{ fontSize: '11px', color: dep.current_pax >= dep.ui_min_pax ? '#10b981' : '#f59e0b', marginTop: '2px', fontWeight: '500' }}>
                                                        {dep.current_pax >= dep.ui_min_pax ? '✓ Đạt' : '⚠️ Chưa đạt'}
                                                    </div>
                                                </td>
                                                <td>{renderBadge('booking', dep.status)}</td>
                                                <td>{renderBadge('op', dep.ui_op_status)}</td>
                                                <td>
                                                    <div style={{ fontWeight: '600', fontSize: '12px', color: dep.days_until <= 14 && dep.days_until > 0 ? '#dc2626' : '#475569' }}>
                                                        {dep.milestoneLabel}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                                        {dep.milestoneDesc}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button onClick={() => setSelectedDep(dep)} className="ops-btn-compact">
                                                        Xem
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* MODAL CHI TIẾT */}
            {selectedDep && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
                }}>
                    <div style={{
                        background: '#fff', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto',
                        borderRadius: '16px', padding: '32px', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <button 
                            onClick={() => { setSelectedDep(null); setActionNote(''); }}
                            style={{ position: 'absolute', top: '24px', right: '24px', background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: '#475569', fontWeight: 'bold' }}
                        >✕</button>

                        <h2 style={{ margin: '0 0 24px 0', fontSize: '18px', color: '#0f172a', paddingRight: '40px', lineHeight: '1.4' }}>
                            {selectedDep.tour_name}
                        </h2>
                        
                        {renderTimeline(selectedDep)}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', fontWeight: '600' }}>Thông tin khách</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                    <span>Khách hiện tại:</span> <strong style={{ color: '#0f172a' }}>{selectedDep.current_pax} / {selectedDep.max_slots}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                    <span>Yêu cầu tối thiểu:</span> 
                                    <strong style={{ color: selectedDep.current_pax >= selectedDep.ui_min_pax ? '#10b981' : '#f59e0b' }}>
                                        {selectedDep.ui_min_pax} {selectedDep.current_pax >= selectedDep.ui_min_pax ? '(Đạt)' : '(Chưa đạt)'}
                                    </strong>
                                </div>
                            </div>
                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', fontWeight: '600' }}>Trạng thái</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                    <span>Bán:</span> {renderBadge('booking', selectedDep.status)}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                    <span>Vận hành:</span> {renderBadge('op', selectedDep.ui_op_status)}
                                </div>
                            </div>
                        </div>

                        {selectedDep.days_until <= 14 && selectedDep.days_until > 7 && selectedDep.status === 'Open' && selectedDep.ui_op_status === 'Pending' && (
                            <div style={{ marginBottom: '24px', border: '1px solid #fcd34d', background: '#fffbeb', padding: '20px', borderRadius: '12px' }}>
                                <h4 style={{ margin: '0 0 12px 0', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                                    ⚠️ Đã đến hạn xem xét vận hành (T-14)
                                </h4>
                                <input 
                                    type="text" 
                                    placeholder="Nhập ghi chú quyết định..." 
                                    value={actionNote} 
                                    onChange={e => setActionNote(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '16px', outline: 'none', fontSize: '13px' }}
                                />
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    {selectedDep.current_pax >= selectedDep.ui_min_pax ? (
                                        <button onClick={() => handleAction('Xác nhận vận hành')} style={{ flex: 1, padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>✓ Xác nhận vận hành</button>
                                    ) : (
                                        <button onClick={() => handleAction('Tiếp tục vận hành')} style={{ flex: 1, padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>⏳ Tiếp tục vận hành</button>
                                    )}
                                    <button onClick={() => handleAction('Đóng tour')} style={{ flex: 1, padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>✖ Đóng / Hủy tour</button>
                                </div>
                            </div>
                        )}

                        {selectedDep.days_until <= 7 && selectedDep.days_until > 0 && selectedDep.status === 'Open' && (
                            <div style={{ marginBottom: '24px', border: '1px solid #fca5a5', background: '#fef2f2', padding: '20px', borderRadius: '12px' }}>
                                <h4 style={{ margin: '0 0 12px 0', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                                    🚨 Đã đến hạn đóng booking (T-7)
                                </h4>
                                <p style={{ fontSize: '13px', color: '#7f1d1d', marginBottom: '16px', lineHeight: '1.5' }}>
                                    Đã đến hạn chốt số khách cuối cùng ({selectedDep.current_pax} khách). 
                                    Sau khi đóng, không thể nhận thêm booking mới. Nếu số khách tăng so với dự kiến trước đó, hãy chuyển sang Yêu cầu Dịch vụ để bổ sung.
                                </p>
                                <input 
                                    type="text" 
                                    placeholder="Ghi chú đóng tour..." 
                                    value={actionNote} 
                                    onChange={e => setActionNote(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', marginBottom: '16px', outline: 'none', fontSize: '13px' }}
                                />
                                <button onClick={() => handleAction('Đóng booking')} style={{ width: '100%', padding: '12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                                    🔒 Đóng Booking
                                </button>
                            </div>
                        )}

                        <div>
                            <h4 style={{ margin: '0 0 12px 0', color: '#0f172a', fontSize: '15px' }}>🕒 Lịch sử quyết định</h4>
                            {(!selectedDep.decision_history || selectedDep.decision_history.length === 0) ? (
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                                    Chưa có ghi nhận quyết định nào.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {selectedDep.decision_history.map((h, i) => (
                                        <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                                                <div style={{ color: '#64748b' }}>{new Date(h.timestamp).toLocaleString('vi-VN')}</div>
                                                <div style={{ fontWeight: '600', color: '#0f172a' }}>{h.user_name}</div>
                                            </div>
                                            <div style={{ color: '#0f172a', fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>
                                                Thao tác: <span style={{ color: '#0194f3' }}>{h.action}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#475569' }}>
                                                <span>Khách: <strong>{h.pax_at_time}</strong></span>
                                                {h.note && <span>Ghi chú: <strong style={{ fontStyle: 'italic' }}>{h.note}</strong></span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TourOperations;

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const PartnerServiceSummary = () => {
    const [summaries, setSummaries] = useState([]);
    const [partnerType, setPartnerType] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/service-requests/partner/my-summary', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setSummaries(res.data.data);
                setPartnerType(res.data.partnerType);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const processedData = useMemo(() => {
        return summaries.map(s => {
            let accepted = 0;
            let pending = 0;
            let hotelBreakdownAccepted = {};
            let hotelBreakdownPending = {};

            s.requests.forEach(req => {
                const qty = req.quantity || 0;
                
                if (partnerType === 'RESTAURANT') {
                    if (req.status === 'Accepted') accepted += qty;
                    else if (req.status === 'Pending') pending += qty;
                } else if (partnerType === 'HOTEL') {
                    // For hotel, a request usually maps to ONE room type (because we split them).
                    // Or if grouped, we check the first item's service_name.
                    // Actually, the quantity applies to the request.
                    // Wait, if a request has multiple rooms, how is quantity handled?
                    // In our system, we grouped by partner AND service_type. If multiple room types, they are separate requests!
                    // So one request = one room type.
                    const roomName = req.items?.[0]?.service_name || 'Phòng';
                    if (req.status === 'Accepted') {
                        hotelBreakdownAccepted[roomName] = (hotelBreakdownAccepted[roomName] || 0) + qty;
                        accepted += qty; // just for filtering
                    } else if (req.status === 'Pending') {
                        hotelBreakdownPending[roomName] = (hotelBreakdownPending[roomName] || 0) + qty;
                        pending += qty;
                    }
                }
            });

            return {
                ...s,
                accepted,
                pending,
                total: accepted + pending,
                hotelBreakdownAccepted,
                hotelBreakdownPending
            };
        });
    }, [summaries, partnerType]);

    const filteredData = useMemo(() => {
        return processedData.filter(s => {
            if (searchTerm && !s.tour_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            if (filterStatus === 'PENDING' && s.pending === 0) return false;
            if (filterStatus === 'ACCEPTED' && s.accepted === 0) return false;
            return true;
        });
    }, [processedData, searchTerm, filterStatus]);

    const renderHotelBreakdown = (breakdown) => {
        const keys = Object.keys(breakdown);
        if (keys.length === 0) return '0';
        return keys.map(k => `${k}: ${breakdown[k]}`).join(' | ');
    };
    
    const renderTotalBreakdown = (b1, b2) => {
        const res = {};
        Object.keys(b1).forEach(k => res[k] = (res[k] || 0) + b1[k]);
        Object.keys(b2).forEach(k => res[k] = (res[k] || 0) + b2[k]);
        const keys = Object.keys(res);
        if (keys.length === 0) return '0';
        return keys.map(k => `${k}: ${res[k]}`).join(' | ');
    };

    const getDetailTable = (item) => {
        if (partnerType === 'RESTAURANT') {
            const mealMap = {};
            item.requests.forEach(req => {
                const qty = req.quantity || 0;
                req.items?.forEach(i => {
                    const k = `${i.date}_${i.mealType}`;
                    if (!mealMap[k]) mealMap[k] = { date: i.date, meal: i.mealType, acc: 0, pen: 0 };
                    if (req.status === 'Accepted') mealMap[k].acc += qty;
                    else if (req.status === 'Pending') mealMap[k].pen += qty;
                });
            });
            const rows = Object.values(mealMap).sort((a,b) => new Date(a.date) - new Date(b.date));
            return (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', fontWeight: '600' }}>Ngày</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600' }}>Bữa</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Đã xác nhận</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Đang chờ</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Tổng</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '12px 16px' }}>{new Date(r.date).toLocaleDateString('vi-VN')}</td>
                                <td style={{ padding: '12px 16px', fontWeight: '600' }}>{r.meal}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', color: '#16a34a', fontWeight: '700' }}>{r.acc}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', color: '#d97706', fontWeight: '700' }}>{r.pen}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '800' }}>{r.acc + r.pen}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        } else {
            const roomMap = {};
            item.requests.forEach(req => {
                const qty = req.quantity || 0;
                const roomName = req.items?.[0]?.service_name || 'Phòng';
                if (!roomMap[roomName]) roomMap[roomName] = { room: roomName, acc: 0, pen: 0 };
                if (req.status === 'Accepted') roomMap[roomName].acc += qty;
                else if (req.status === 'Pending') roomMap[roomName].pen += qty;
            });
            const rows = Object.values(roomMap);
            return (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', fontWeight: '600' }}>Hạng phòng</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Đã xác nhận</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Đang chờ</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Tổng</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '12px 16px', fontWeight: '600' }}>{r.room}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', color: '#16a34a', fontWeight: '700' }}>{r.acc}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', color: '#d97706', fontWeight: '700' }}>{r.pen}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '800' }}>{r.acc + r.pen}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }
    };

    return (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#0284c7' }}>📊</span> Tổng hợp cung cấp dịch vụ
                </h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Theo dõi tổng nhu cầu dịch vụ đã được xác nhận theo từng lịch khởi hành.</p>
            </div>

            {!selectedItem ? (
                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1', minWidth: '250px' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>Tìm kiếm tour</div>
                            <input 
                                type="text"
                                placeholder="🔍 Tìm tên tour..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                            />
                        </div>
                        <div style={{ minWidth: '200px' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>Trạng thái nhu cầu</div>
                            <select 
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', background: '#fff' }}
                            >
                                <option value="ALL">Tất cả</option>
                                <option value="PENDING">Đang có yêu cầu chờ xử lý</option>
                                <option value="ACCEPTED">Đã có xác nhận</option>
                            </select>
                        </div>
                    </div>
                    
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu tổng hợp...</div>
                    ) : filteredData.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Không có dữ liệu tổng hợp nào phù hợp.</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', minWidth: '900px' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                                    <tr>
                                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Tour</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', whiteSpace: 'nowrap' }}>Khởi hành</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Nhà cung cấp</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Đã xác nhận</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Đang chờ</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Tổng dự kiến</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.map((item) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                                            <td style={{ padding: '16px', color: '#0f172a', fontWeight: '600' }}>{item.tour_name}</td>
                                            <td style={{ padding: '16px', color: '#475569', whiteSpace: 'nowrap' }}>{new Date(item.departure_date).toLocaleDateString('vi-VN')}</td>
                                            <td style={{ padding: '16px', color: '#0369a1', fontWeight: '600' }}>{item.partner_name}</td>
                                            <td style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#16a34a' }}>
                                                {partnerType === 'HOTEL' ? renderHotelBreakdown(item.hotelBreakdownAccepted) : `${item.accepted} suất`}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: '#d97706' }}>
                                                {partnerType === 'HOTEL' ? renderHotelBreakdown(item.hotelBreakdownPending) : `${item.pending} suất`}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center', fontWeight: '800', color: '#0f172a', background: '#f1f5f9' }}>
                                                {partnerType === 'HOTEL' ? renderTotalBreakdown(item.hotelBreakdownAccepted, item.hotelBreakdownPending) : `${item.total} suất`}
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => setSelectedItem(item)}
                                                    style={{ background: '#fff', color: '#0284c7', border: '1px solid #0284c7', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                                                >
                                                    Xem
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <button 
                        onClick={() => setSelectedItem(null)} 
                        style={{ background: 'none', border: 'none', color: '#475569', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}
                    >
                        ← Quay lại tổng hợp
                    </button>
                    
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase' }}>
                                {selectedItem.tour_name}
                            </h3>
                            <div style={{ display: 'flex', gap: '24px' }}>
                                <div style={{ color: '#475569', fontSize: '14px' }}>Khởi hành: <strong style={{ color: '#0f172a' }}>{new Date(selectedItem.departure_date).toLocaleDateString('vi-VN')}</strong></div>
                                <div style={{ color: '#475569', fontSize: '14px' }}>Nhà cung cấp: <strong style={{ color: '#0369a1' }}>{selectedItem.partner_name}</strong></div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                                <div style={{ color: '#166534', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Đã xác nhận</div>
                                <div style={{ color: '#16a34a', fontSize: '16px', fontWeight: '800' }}>
                                    {partnerType === 'HOTEL' ? renderHotelBreakdown(selectedItem.hotelBreakdownAccepted) : `${selectedItem.accepted} suất`}
                                </div>
                            </div>
                            <div style={{ background: '#fffbeb', border: '1px solid #fef08a', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                                <div style={{ color: '#854d0e', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Đang chờ</div>
                                <div style={{ color: '#d97706', fontSize: '16px', fontWeight: '800' }}>
                                    {partnerType === 'HOTEL' ? renderHotelBreakdown(selectedItem.hotelBreakdownPending) : `${selectedItem.pending} suất`}
                                </div>
                            </div>
                            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                                <div style={{ color: '#334155', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Tổng dự kiến</div>
                                <div style={{ color: '#0f172a', fontSize: '16px', fontWeight: '800' }}>
                                    {partnerType === 'HOTEL' ? renderTotalBreakdown(selectedItem.hotelBreakdownAccepted, selectedItem.hotelBreakdownPending) : `${selectedItem.total} suất`}
                                </div>
                            </div>
                        </div>

                        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>CHI TIẾT</h4>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
                            {getDetailTable(selectedItem)}
                        </div>

                        <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>LỊCH SỬ CÁC PHIẾU YÊU CẦU</h4>
                        <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                                    <tr>
                                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Mã YC</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Ngày gửi</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Loại</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Số lượng</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedItem.requests.map((hist, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>{hist.code}</td>
                                            <td style={{ padding: '12px 16px', color: '#475569' }}>
                                                {new Date(hist.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                {hist.request_type === 'INITIAL' ? (
                                                    <span style={{ color: '#2563eb', fontWeight: '600' }}>Chính</span>
                                                ) : (
                                                    <span style={{ color: '#ea580c', fontWeight: '600' }}>Bổ sung</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', color: hist.request_type === 'INITIAL' ? '#0f172a' : '#ea580c' }}>
                                                {hist.request_type === 'INITIAL' ? hist.quantity : `+${hist.quantity}`}
                                                {partnerType === 'HOTEL' && <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '400' }}>{hist.items?.[0]?.service_name}</div>}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                {hist.status === 'Accepted' ? (
                                                    <span style={{ display: 'inline-block', padding: '4px 8px', background: '#dcfce7', color: '#166534', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>Đã nhận</span>
                                                ) : (
                                                    <span style={{ display: 'inline-block', padding: '4px 8px', background: '#fef3c7', color: '#b45309', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>Chờ xử lý</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default PartnerServiceSummary;

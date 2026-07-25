import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StaffTourRequestManager = ({ onStartDesign }) => {
    const [requests, setRequests] = useState([]);
    const [selectedReq, setSelectedReq] = useState(null);
    const [tempMarkup, setTempMarkup] = useState(20);
    const [customPrice, setCustomPrice] = useState(null);
    const [consultationNote, setConsultationNote] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/custom-tours/requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) setRequests(res.data.data);
        } catch (error) { console.error('Lỗi tải dữ liệu', error); }
    };

    const handleSelect = (req) => {
        setSelectedReq(req);
        setTempMarkup(req.markup_percent || 20);
        setCustomPrice(null);
        setConsultationNote(req.staff_note || '');
    };

    const formatMoney = (amount) => Number(amount).toLocaleString('vi-VN');

    const totalCost = (selectedReq?.preferences?.hotelPrice || 0) +
        (selectedReq?.preferences?.transportPrice || 0) +
        (selectedReq?.preferences?.selectedPlaces?.reduce((sum, p) => sum + Number(p.price), 0) || 0);

    const suggestedPrice = customPrice !== null ? customPrice : Math.round(totalCost * (1 + Number(tempMarkup) / 100));
    const budgetDiff = (selectedReq?.budget || 0) - suggestedPrice;

    const handleMarkupChange = (e) => {
        setTempMarkup(e.target.value);
        setCustomPrice(null);
    };

    const handlePriceChange = (e) => {
        const val = Number(e.target.value);
        setCustomPrice(val);
        if (totalCost > 0) {
            setTempMarkup((((val / totalCost) - 1) * 100).toFixed(1));
        }
    };

    // Tích hợp API mới: Gửi Báo Giá Sơ Bộ
    const handleSendInitialQuote = async () => {
        if (!selectedReq) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/custom-tours/requests/${selectedReq.request_id}/initial-quote`, {
                quote_price: suggestedPrice,
                note: consultationNote
            }, { headers: { Authorization: `Bearer ${token}` } });

            alert('✅ Đã gửi báo giá sơ bộ cho khách hàng!');
            fetchRequests();
            setSelectedReq({ ...selectedReq, status: 'Initial_Quoted' });
        } catch (error) {
            console.error(error);
            alert('Lỗi gửi báo giá sơ bộ!');
        }
    };

    // Tích hợp API mới: Chuyển sang Trạng thái Thiết kế
    const handleStartDesign = async () => {
        if (!selectedReq) return;
        try {
            const token = localStorage.getItem('token');
            // Gửi API update trạng thái sang Designing
            await axios.put(`http://localhost:5000/api/custom-tours/requests/${selectedReq.request_id}/start-design`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Gọi prop để chuyển view (Vào màn hình thiết kế kéo thả)
            if (onStartDesign) {
                onStartDesign({ ...selectedReq, markup_percent: tempMarkup, staff_note: consultationNote, quote_price: suggestedPrice, base_cost: totalCost });
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi khi vào phòng thiết kế!');
        }
    };

    const handleSendToCustomer = async () => {
        try {
            if (!selectedReq.quote_id) {
                alert('Không tìm thấy ID báo giá!');
                return;
            }
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/custom-tours/quotes/${selectedReq.quote_id}/send-to-customer`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Đã gửi bản thiết kế cho khách hàng!');
            fetchRequests();
            setSelectedReq({ ...selectedReq, status: 'Sent_To_Customer' });
        } catch (error) {
            console.error('Lỗi khi gửi cho khách:', error);
            alert('Có lỗi xảy ra khi gửi cho khách hàng');
        }
    };

    const getStatusUI = (req) => {
        switch (req.status) {
            case 'Pending': return { bg: '#dcfce7', color: '#16a34a', text: 'MỚI YÊU CẦU' };
            case 'Initial_Quoted': return { bg: '#e0e7ff', color: '#4338ca', text: 'ĐÃ BÁO GIÁ' };
            case 'Initial_Accepted': return { bg: '#dcfce7', color: '#15803d', text: 'KHÁCH CHỐT GIÁ' };
            case 'Designing': return { bg: '#fef3c7', color: '#d97706', text: 'ĐANG THIẾT KẾ' };
            case 'Pending_Manager_Approval': return { bg: '#fef08a', color: '#854d0e', text: 'CHỜ QUẢN LÝ DUYỆT' };
            case 'Manager_Rejected': return { bg: '#fee2e2', color: '#dc2626', text: 'QUẢN LÝ TỪ CHỐI' };
            case 'Manager_Approved': return { bg: '#dbeafe', color: '#2563eb', text: 'QUẢN LÝ ĐÃ DUYỆT' };
            case 'Sent_To_Customer': return { bg: '#e0e7ff', color: '#4f46e5', text: 'ĐÃ GỬI KHÁCH' };
            case 'Customer_Revision': return { bg: '#fee2e2', color: '#dc2626', text: 'KHÁCH YÊU CẦU SỬA' };
            case 'Customer_Accepted': return { bg: '#dcfce7', color: '#15803d', text: 'KHÁCH ĐÃ CHỐT' };
            case 'Completed': return { bg: '#dcfce7', color: '#16a34a', text: 'ĐÃ TẠO TOUR' };
            case 'Canceled': return { bg: '#f3f4f6', color: '#9ca3af', text: 'ĐÃ HỦY' };
            default: return { bg: '#f1f5f9', color: '#64748b', text: req.status };
        }
    };

    return (
        <div style={{ display: 'flex', gap: '20px', fontFamily: "'Inter', sans-serif", backgroundColor: '#f1f5f9', padding: '20px', minHeight: '100vh' }}>

            <div style={{ flex: '0 0 350px', background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'calc(100vh - 40px)', overflowY: 'auto' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Inbox Yêu cầu</span>
                    <span style={{ background: '#e2e8f0', padding: '4px 10px', borderRadius: '20px', fontSize: '14px' }}>{requests.length}</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {requests.map(req => {
                        const statusUI = getStatusUI(req);
                        return (
                            <div
                                key={req.request_id}
                                onClick={() => handleSelect(req)}
                                style={{
                                    padding: '16px', border: '1px solid', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                                    backgroundColor: selectedReq?.request_id === req.request_id ? '#eff6ff' : '#fff',
                                    borderColor: selectedReq?.request_id === req.request_id ? '#3b82f6' : '#e2e8f0'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <strong style={{ fontSize: '15px', color: '#1e293b' }}>{req.customer_name}</strong>
                                    <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', backgroundColor: statusUI.bg, color: statusUI.color }}>
                                        {statusUI.text}
                                    </span>
                                </div>
                                <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span>📍 {req.destination}</span>
                                    <span>📅 {new Date(req.departure_date).toLocaleDateString('vi-VN')} ({req.people_count} khách)</span>
                                    <span style={{ color: '#059669', fontWeight: '600' }}>💰 KH báo: {formatMoney(req.budget)}đ</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 40px)', overflowY: 'auto' }}>
                {selectedReq ? (
                    <>
                        {/* THÔNG TIN CHUNG */}
                        <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px', marginBottom: '15px' }}>
                                <div>
                                    <h2 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '22px' }}>Đơn yêu cầu: {selectedReq.destination}</h2>
                                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                                        Khách hàng: <strong style={{ color: '#334155' }}>{selectedReq.customer_name}</strong> | SĐT: <strong>{selectedReq.customer_phone}</strong>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>Ngân sách khách báo</div>
                                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>{formatMoney(selectedReq.budget)}đ <span style={{ fontSize: '14px' }}>/người</span></div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', fontSize: '14px', color: '#334155', marginTop: '20px' }}>
                                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Khởi hành</p>
                                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>{new Date(selectedReq.departure_date).toLocaleDateString('vi-VN')}</strong>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kết thúc (Dự kiến)</p>
                                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>{new Date(selectedReq.return_date).toLocaleDateString('vi-VN')}</strong>
                                </div>
                                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Khách hàng</p>
                                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>{selectedReq.people_count} người</strong> 
                                    <div style={{ fontSize: '12px', marginTop: '4px', color: '#475569' }}>
                                        NL: {selectedReq.preferences?.participantBreakdown?.adults || 0} | TE: {selectedReq.preferences?.participantBreakdown?.children || 0}
                                    </div>
                                </div>
                            </div>
                            {selectedReq.preferences?.note && (
                                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '4px', fontSize: '14px', color: '#92400e' }}>
                                    <strong>Ghi chú đặc biệt từ khách:</strong><br />
                                    {selectedReq.preferences.note}
                                </div>
                            )}

                            {/* BÓC TÁCH DỊCH VỤ */}
                            <div style={{ marginTop: '25px' }}>
                                <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '20px' }}>📦</span> BÓC TÁCH CHI TIẾT DỊCH VỤ (Khách chọn)
                                </h4>
                                <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left', tableLayout: 'fixed' }}>
                                        <thead style={{ background: '#f8fafc' }}>
                                            <tr>
                                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', width: '25%' }}>Loại hình</th>
                                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', width: '45%' }}>Chi tiết Khách chọn</th>
                                                <th style={{ padding: '12px 16px', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0', width: '30%', textAlign: 'right' }}>Dự toán (đ)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '12px 16px', color: '#64748b', fontWeight: '500' }}>Đón khách</td>
                                                <td style={{ padding: '12px 16px', color: '#334155', wordBreak: 'break-word' }}>{selectedReq.preferences?.pickup_location || 'Tự túc'}</td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#94a3b8' }}>-</td>
                                            </tr>
                                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '12px 16px', color: '#64748b', fontWeight: '500' }}>Phương tiện</td>
                                                <td style={{ padding: '12px 16px', color: '#334155' }}>
                                                    <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={selectedReq.preferences?.transportName || 'Không chọn'}>
                                                        {selectedReq.preferences?.transportName || 'Không chọn'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#334155' }}>{formatMoney(selectedReq.preferences?.transportPrice || 0)}</td>
                                            </tr>
                                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '12px 16px', color: '#64748b', fontWeight: '500' }}>Lưu trú</td>
                                                <td style={{ padding: '12px 16px', color: '#334155' }}>
                                                    <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: '500', display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={selectedReq.preferences?.hotelName || 'Không chọn'}>
                                                        {selectedReq.preferences?.hotelName || 'Không chọn'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600', color: '#334155' }}>{formatMoney(selectedReq.preferences?.hotelPrice || 0)}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '12px 16px', color: '#64748b', fontWeight: '500', verticalAlign: 'top' }}>Điểm tham quan</td>
                                                <td colSpan={2} style={{ padding: '12px 16px' }}>
                                                    {selectedReq.preferences?.selectedPlaces?.length > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {selectedReq.preferences.selectedPlaces.map((place, idx) => (
                                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', gap: '10px' }}>
                                                                    <span style={{ color: '#334155', fontWeight: '500', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', flex: 1, wordBreak: 'break-word' }}>
                                                                        <span style={{ color: '#10b981', flexShrink: 0 }}>✔</span> {place.name}
                                                                    </span>
                                                                    <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '13px', whiteSpace: 'nowrap' }}>{formatMoney(place.price || 0)} đ</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa chọn</span>}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* MÁY TÍNH VÀ GHI CHÚ */}
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '25px' }}>
                            <div style={{ flex: '1 1 300px', background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0" }}>
                                <h3 style={{ marginBottom: "20px", color: "#0f172a", fontSize: "16px", fontWeight: "700", display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '20px' }}>🧮</span> Giá tạm tính (Sơ bộ)
                                </h3>
                                
                                <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: '#475569', fontSize: '14px' }}>Thử Margin lợi nhuận (%)</label>
                                <input
                                    type="number"
                                    min="0" max="100"
                                    step="0.1"
                                    value={tempMarkup}
                                    onChange={handleMarkupChange}
                                    style={{ width: "100%", boxSizing: 'border-box', padding: "12px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "18px", fontWeight: "700", color: '#1e293b', outline: 'none', transition: 'border-color 0.2s' }}
                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                />

                                <div style={{ marginTop: '20px', background: "#f8fafc", borderRadius: "8px", padding: "16px", border: "1px solid #e2e8f0", display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
                                        <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Tổng Cost gốc dự kiến:</span>
                                        <b style={{ color: "#dc2626", fontSize: '15px' }}>{formatMoney(totalCost)} đ</b>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: '1px dashed #cbd5e1', paddingTop: '12px', alignItems: 'center' }}>
                                        <span style={{ color: '#334155', fontSize: '14px', fontWeight: '700' }}>Giá Báo Khách:</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <input 
                                                type="number" 
                                                value={suggestedPrice} 
                                                onChange={handlePriceChange}
                                                style={{ width: "130px", boxSizing: 'border-box', padding: "8px 12px", borderRadius: "6px", border: "1px solid #93c5fd", fontSize: "16px", fontWeight: "700", color: "#1d4ed8", textAlign: 'right', outline: 'none', backgroundColor: '#eff6ff' }}
                                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                                onBlur={(e) => e.target.style.borderColor = '#93c5fd'}
                                            />
                                            <b style={{ color: "#1d4ed8", fontSize: "16px" }}>đ</b>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '16px', padding: "12px", borderRadius: "8px", textAlign: 'center', fontSize: '14px', background: budgetDiff >= 0 ? "#f0fdf4" : "#fef2f2", color: budgetDiff >= 0 ? "#16a34a" : "#dc2626", fontWeight: "600", border: budgetDiff >= 0 ? "1px solid #bbf7d0" : "1px solid #fecaca" }}>
                                    {budgetDiff >= 0 ? `✅ Trong ngân sách (Dư ${formatMoney(budgetDiff)}đ)` : `⚠️ Vượt ngân sách ${formatMoney(Math.abs(budgetDiff))}đ`}
                                </div>
                            </div>

                            <div style={{ flex: '1.5 1 400px', background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)", border: "1px solid #e2e8f0", display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ margin: "0 0 16px 0", color: "#0f172a", fontSize: "16px", fontWeight: "700", display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '20px' }}>📞</span> Nội dung gửi cho Khách
                                </h3>
                                <textarea
                                    rows="7"
                                    value={consultationNote}
                                    onChange={(e) => setConsultationNote(e.target.value)}
                                    placeholder="Điền lời chào, thông tin báo giá sơ bộ, và xin ý kiến khách..."
                                    style={{ flex: 1, width: "100%", boxSizing: 'border-box', padding: "16px", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "none", fontSize: "14px", lineHeight: '1.6', fontFamily: 'inherit', marginBottom: '20px', outline: 'none', transition: 'border-color 0.2s', color: '#334155', backgroundColor: '#f8fafc' }}
                                    onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.backgroundColor = '#fff'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#cbd5e1'; e.target.style.backgroundColor = '#f8fafc'; }}
                                />
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button 
                                        onClick={handleSendInitialQuote} 
                                        disabled={selectedReq.status !== 'Pending'}
                                        style={{ padding: "14px 24px", background: selectedReq.status !== 'Pending' ? "#94a3b8" : "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "15px", cursor: selectedReq.status !== 'Pending' ? 'not-allowed' : 'pointer', transition: 'all 0.2s', boxShadow: selectedReq.status === 'Pending' ? '0 4px 6px -1px rgba(59, 130, 246, 0.3)' : 'none' }}
                                        onMouseOver={(e) => { if(selectedReq.status === 'Pending') e.target.style.transform = 'translateY(-2px)' }}
                                        onMouseOut={(e) => { if(selectedReq.status === 'Pending') e.target.style.transform = 'translateY(0)' }}
                                    >
                                        📤 Gửi Báo Giá Sơ Bộ
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* WORKFLOW ACTIONS */}
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: '10px', gap: '15px' }}>
                            {selectedReq.status === 'Manager_Approved' && (
                                <button
                                    onClick={handleSendToCustomer}
                                    style={{ padding: "16px 32px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "16px", cursor: "pointer", boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)' }}
                                >
                                    🚀 Gửi Bản Thiết Kế Cho Khách
                                </button>
                            )}
                            <button
                                onClick={handleStartDesign}
                                style={{ padding: "16px 32px", background: "#10b981", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "16px", cursor: "pointer", boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}
                            >
                                🛠️ Vào Phòng Thiết Kế Chi Tiết ➔
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '12px', color: '#94a3b8' }}>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>📋</div>
                        <p style={{ fontSize: '16px' }}>Vui lòng chọn một yêu cầu bên trái để xem chi tiết</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffTourRequestManager;

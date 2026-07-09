import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 🚀 BƯỚC 1: Thêm prop onStartDesign để kết nối với Dashboard
const StaffTourRequestManager = ({ onStartDesign }) => {
    const [requests, setRequests] = useState([]);
    const [selectedReq, setSelectedReq] = useState(null);

    // 🚀 BƯỚC 2: Tách state để phục vụ riêng cho việc Tính nháp và Ghi chú
    const [tempMarkup, setTempMarkup] = useState(20);
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
        // Load lại markup và ghi chú cũ nếu đã từng lưu nháp
        setTempMarkup(req.markup_percent || 20);
        setConsultationNote(req.staff_note || '');
    };

    // 🚀 BƯỚC 3: Hàm này giờ chỉ lưu Ghi chú và Giá nháp (Không gửi duyệt)
    const handleSaveNote = async () => {
        if (!selectedReq) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/custom-tours/requests/${selectedReq.request_id}/quote`, {
                quoted_price: suggestedPrice || 0,
                markup_percent: tempMarkup || 20,
                // Chèn thêm 2 dòng này để Backend MySQL không báo lỗi thiếu dữ liệu
                proposed_itinerary: selectedReq.proposed_itinerary || 'Đang chờ thiết kế...',
                staff_note: consultationNote || ''
            }, { headers: { Authorization: `Bearer ${token}` } });

            alert('💾 Đã lưu lại ghi chú tư vấn thành công!');
            fetchRequests(); // Load lại data mới nhất từ Database
        } catch (error) {
            console.error("Lỗi chi tiết:", error);
            alert('Lỗi khi lưu ghi chú. Vui lòng kiểm tra Terminal Backend!');
        }
    };

    const formatMoney = (amount) => Number(amount).toLocaleString('vi-VN');

    const totalCost =
        (selectedReq?.preferences?.hotelPrice || 0) +
        (selectedReq?.preferences?.transportPrice || 0) +
        (selectedReq?.preferences?.selectedPlaces?.reduce((sum, p) => sum + Number(p.price), 0) || 0);

    // Tính giá dự kiến dựa trên tempMarkup
    const suggestedPrice = Math.round(
        totalCost * (1 + Number(tempMarkup) / 100)
    );

    const budgetDiff = (selectedReq?.budget || 0) - suggestedPrice;
    // Hàm xử lý UI cho các trạng thái Tour
    const getStatusUI = (req) => {
        switch (req.status) {
            case 'Pending':
                return {
                    bg: '#dcfce7',
                    color: '#16a34a',
                    text: 'MỚI'
                };

            case 'Processing':
                return {
                    bg: '#fef3c7',
                    color: '#d97706',
                    text: 'ĐANG THIẾT KẾ'
                };

            case 'Completed':
                return {
                    bg: '#dbeafe',
                    color: '#2563eb',
                    text: 'ĐÃ HOÀN THÀNH'
                };

            case 'Cancelled':
                return {
                    bg: '#fee2e2',
                    color: '#dc2626',
                    text: 'ĐÃ HỦY'
                };

            default:
                return {
                    bg: '#f1f5f9',
                    color: '#64748b',
                    text: 'KHÔNG XÁC ĐỊNH'
                };
        }
    };

    return (
        <div style={{ display: 'flex', gap: '20px', fontFamily: "'Inter', sans-serif", backgroundColor: '#f1f5f9', padding: '20px', minHeight: '100vh' }}>

            {/* ================= CỘT TRÁI: DANH SÁCH YÊU CẦU (Giữ nguyên của bạn) ================= */}
            <div style={{ flex: '0 0 350px', background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'calc(100vh - 40px)', overflowY: 'auto' }}>
                <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Inbox Yêu cầu</span>
                    <span style={{ background: '#e2e8f0', padding: '4px 10px', borderRadius: '20px', fontSize: '14px' }}>{requests.length}</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {requests.map(req => (
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

                                {/* Gọi hàm để lấy màu và text tương ứng */}
                                {(() => {
                                    const statusUI = getStatusUI(req);
                                    return (
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: '700',
                                            backgroundColor: statusUI.bg,
                                            color: statusUI.color
                                        }}>
                                            {statusUI.text}
                                        </span>
                                    );
                                })()}
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span>📍 {req.destination}</span>
                                <span>📅 {new Date(req.departure_date).toLocaleDateString('vi-VN')} ({req.people_count} khách)</span>
                                <span style={{ color: '#059669', fontWeight: '600' }}>💰 Budget: {formatMoney(req.budget)}đ</span>
                            </div>
                        </div>
                    ))}
                    {requests.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>Không có yêu cầu nào.</p>}
                </div>
            </div>

            {/* ================= CỘT PHẢI: CHI TIẾT & BÓC TÁCH CHI PHÍ ================= */}
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 40px)', overflowY: 'auto' }}>
                {selectedReq ? (
                    <>
                        {/* THÔNG TIN CHUNG KHÁCH HÀNG (Giữ nguyên) */}
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

                            <div style={{ display: 'flex', gap: '40px', fontSize: '14px', color: '#334155' }}>
                                <div>
                                    <p style={{ margin: '5px 0', color: '#64748b' }}>Thời gian đi:</p>
                                    <strong>{new Date(selectedReq.departure_date).toLocaleDateString('vi-VN')} - {new Date(selectedReq.return_date).toLocaleDateString('vi-VN')}</strong>
                                </div>
                                <div>
                                    <p style={{ margin: '5px 0', color: '#64748b' }}>Số lượng khách:</p>
                                    <strong>{selectedReq.people_count} người</strong> (NL: {selectedReq.preferences?.participantBreakdown?.adults || 0} | TE: {selectedReq.preferences?.participantBreakdown?.children || 0})
                                </div>
                            </div>
                        </div>

                        {/* BÓC TÁCH CHI TIẾT DỊCH VỤ (Giữ nguyên của bạn) */}
                        <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                ⚙️ Bóc tách Dịch vụ & Chi phí tạm tính
                            </h3>

                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                                        <th style={{ padding: '12px', color: '#475569', width: '20%' }}>Hạng mục</th>
                                        <th style={{ padding: '12px', color: '#475569', width: '50%' }}>Sự lựa chọn của khách</th>
                                        <th style={{ padding: '12px', color: '#475569', width: '30%', textAlign: 'right' }}>Đơn giá Cost (Tham khảo)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '15px 12px', fontWeight: '600', color: '#334155' }}>🏨 Lưu trú</td>
                                        <td style={{ padding: '15px 12px' }}>
                                            {selectedReq.preferences?.hotelName !== 'Không chọn' && selectedReq.preferences?.hotelName !== undefined ? (
                                                <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 8px', borderRadius: '6px', fontWeight: '500' }}>
                                                    {selectedReq.preferences.hotelName}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Công ty tự sắp xếp (Linh hoạt)</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '15px 12px', textAlign: 'right', color: '#ef4444', fontWeight: '600' }}>
                                            {formatMoney(selectedReq.preferences?.hotelPrice || 0)} đ
                                        </td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '15px 12px', fontWeight: '600', color: '#334155' }}>🚌 Di chuyển</td>
                                        <td style={{ padding: '15px 12px' }}>
                                            {selectedReq.preferences?.transportName !== 'Không chọn' && selectedReq.preferences?.transportName !== undefined ? (
                                                <span style={{ background: '#f0fdf4', color: '#15803d', padding: '4px 8px', borderRadius: '6px', fontWeight: '500' }}>
                                                    {selectedReq.preferences.transportName}
                                                </span>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Công ty tự sắp xếp (Linh hoạt)</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '15px 12px', textAlign: 'right', color: '#ef4444', fontWeight: '600' }}>
                                            {formatMoney(selectedReq.preferences?.transportPrice || 0)} đ
                                        </td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                        <td style={{ padding: '15px 12px', fontWeight: '600', color: '#334155', verticalAlign: 'top' }}>🎟️ Tham quan</td>
                                        <td style={{ padding: '15px 12px' }}>
                                            {selectedReq.preferences?.selectedPlaces?.length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {selectedReq.preferences.selectedPlaces.map((place, idx) => (
                                                        <span key={idx} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontSize: '13px' }}>
                                                            {place.name} ({place.price > 0 ? `${formatMoney(place.price)}đ` : 'Miễn phí'})
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Không có lựa chọn</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '15px 12px', textAlign: 'right', color: '#ef4444', fontWeight: '600', verticalAlign: 'top' }}>
                                            {formatMoney(selectedReq.preferences?.selectedPlaces?.reduce((sum, p) => sum + p.price, 0) || 0)} đ
                                        </td>
                                    </tr>
                                    <tr style={{ backgroundColor: '#fdf2f8', borderTop: '2px solid #fbcfe8' }}>
                                        <td colSpan="2" style={{ padding: '15px 12px', fontWeight: '700', color: '#9d174d', textAlign: 'right', fontSize: '15px' }}>
                                            Tổng chi phí gốc tạm tính (Tổng Cost):
                                        </td>
                                        <td style={{ padding: '15px 12px', textAlign: 'right', color: '#db2777', fontWeight: '800', fontSize: '16px' }}>
                                            {formatMoney(totalCost)} đ
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {selectedReq.preferences?.note && (
                                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '4px', fontSize: '14px', color: '#92400e' }}>
                                    <strong>Ghi chú đặc biệt từ khách:</strong><br />
                                    {selectedReq.preferences.note}
                                </div>
                            )}
                        </div>

                        {/* 🚀 BƯỚC 4: THAY THẾ FORM BÁO GIÁ BẰNG "MÁY TÍNH NHÁP" & "SỔ TAY TƯ VẤN" */}
                        <div style={{ display: 'flex', gap: '20px' }}>
                            {/* BÊN TRÁI: MÁY TÍNH NHÁP */}
                            <div style={{ flex: 1, background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,.1)", border: "1px solid #e2e8f0" }}>
                                <h3 style={{ marginBottom: "20px", color: "#0f172a", fontSize: "16px", fontWeight: "700" }}>🧮 Giá tạm tính</h3>

                                <label style={{ display: "block", fontWeight: 600, marginBottom: 8, color: '#475569', fontSize: '14px' }}>Thử Margin lợi nhuận (%)</label>
                                <input
                                    type="number"
                                    min="0" max="100"
                                    value={tempMarkup}
                                    onChange={(e) => setTempMarkup(e.target.value)}
                                    style={{ width: "100%", padding: "10px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "18px", fontWeight: "700", color: '#1e293b', outline: 'none' }}
                                />

                                <div style={{ marginTop: '20px', background: "#f8fafc", borderRadius: "8px", padding: "15px", border: "1px solid #e2e8f0", display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ color: '#64748b', fontSize: '13px' }}>Tổng Cost gốc:</span>
                                        <b style={{ color: "#dc2626", fontSize: '14px' }}>{formatMoney(totalCost)} đ</b>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                                        <span style={{ color: '#334155', fontSize: '14px', fontWeight: '600' }}>Giá báo dự kiến:</span>
                                        <b style={{ color: "#2563eb", fontSize: "18px" }}>{formatMoney(suggestedPrice)} đ</b>
                                    </div>
                                </div>

                                <div style={{ marginTop: '10px', padding: "10px", borderRadius: "8px", textAlign: 'center', fontSize: '13px', background: budgetDiff >= 0 ? "#dcfce7" : "#fee2e2", color: budgetDiff >= 0 ? "#15803d" : "#b91c1c", fontWeight: "600", border: budgetDiff >= 0 ? "1px solid #bbedc5" : "1px solid #fecaca" }}>
                                    {budgetDiff >= 0 ? `Trong ngân sách (Dư ${formatMoney(budgetDiff)}đ)` : `Vượt ngân sách ${formatMoney(Math.abs(budgetDiff))}đ`}
                                </div>
                            </div>

                            {/* BÊN PHẢI: SỔ TAY GHI CHÚ */}
                            <div style={{ flex: 1.5, background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,.1)", border: "1px solid #e2e8f0", display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ margin: "0 0 15px 0", color: "#0f172a", fontSize: "16px", fontWeight: "700" }}>📞 Nhật ký tư vấn</h3>
                                <textarea
                                    rows="6"
                                    value={consultationNote}
                                    onChange={(e) => setConsultationNote(e.target.value)}
                                    placeholder="Ghi lại trao đổi với khách. VD: Khách đồng ý nâng lên 5 sao, chờ gửi lịch trình..."
                                    style={{ flex: 1, width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "none", fontSize: "14px", lineHeight: '1.5', fontFamily: 'inherit', marginBottom: '15px' }}
                                />
                                <button onClick={handleSaveNote} style={{ padding: "10px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "14px", cursor: "pointer", transition: 'all 0.2s' }} onMouseOver={(e) => e.target.style.background = '#e2e8f0'} onMouseOut={(e) => e.target.style.background = '#f1f5f9'}>
                                    💾 Lưu nháp ghi chú
                                </button>
                            </div>
                        </div>

                        {/* 🚀 NÚT CHUYỂN SANG PHÒNG THIẾT KẾ ĐỂ CHỐT KẾT QUẢ */}
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: '10px' }}>
                            <button
                                onClick={() => onStartDesign && onStartDesign({ ...selectedReq, markup_percent: tempMarkup, staff_note: consultationNote })}
                                style={{ padding: "16px 32px", background: "#10b981", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "16px", cursor: "pointer", boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}
                            >
                                🛠️ Chuyển sang thiết kế & Chốt Báo Giá ➔
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '12px', color: '#94a3b8' }}>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>📋</div>
                        <p style={{ fontSize: '16px' }}>Vui lòng chọn một yêu cầu bên trái để xem chi tiết và tư vấn</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffTourRequestManager;
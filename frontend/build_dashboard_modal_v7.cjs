const fs = require('fs');
const path = require('path');

const correctJSXStaff = `
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
                                                                        <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: '600', textAlign: 'right' }}>{day.accommodation.price ? formatMoney(Number(day.accommodation.price)/2) + ' đ' : '-'}</span>
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
                                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                    <strong style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>🚗 Phương tiện di chuyển</strong>
                                                    {costConfig.selectedTransport ? (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{costConfig.selectedTransport.name}</span>
                                                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#0ea5e9' }}>{formatMoney(costConfig.selectedTransport.price)} đ</span>
                                                        </div>
                                                    ) : <span style={{ fontSize: '13px', color: '#94a3b8' }}>Chưa chọn phương tiện</span>}
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
                                } catch (e) {
                                    return <div style={{ padding: '16px', color: '#ef4444' }}>Lỗi khi tải dữ liệu thiết kế: {e.message}</div>;
                                }
                            })()}
                        </div>
`;

function fixStaffPending() {
    const fPath = path.join(__dirname, 'src', 'components', 'StaffPendingTours.jsx');
    let content = fs.readFileSync(fPath, 'utf8');

    const regex = /<div style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr\s+1fr',\s*gap:\s*'16px',\s*marginBottom:\s*'24px'.*?<\/div>[\s\S]*?(?=\{viewingFixedTour\.status\s*===\s*'Rejected')/m;
    
    if (regex.test(content)) {
        content = content.replace(regex, correctJSXStaff);
        fs.writeFileSync(fPath, content, 'utf8');
        console.log("Completely fixed StaffPendingTours.jsx");
    } else {
        console.log("Failed to match StaffPendingTours.jsx");
    }
}

function fixManagerTourApproval() {
    const fPath = path.join(__dirname, 'src', 'components', 'ManagerTourApproval.jsx');
    let content = fs.readFileSync(fPath, 'utf8');

    // Similar for ManagerTourApproval, replacing from `<div grid...>` to `{isRejecting &&`
    // but the variable is `selectedFixedTour` instead of `viewingFixedTour`
    const regex = /<div style=\{\{\s*display:\s*'grid',\s*gridTemplateColumns:\s*'1fr\s+1fr',\s*gap:\s*'16px',\s*marginBottom:\s*'24px'.*?<\/div>[\s\S]*?(?=\{isRejecting\s*&&\s*\()/m;
    
    let managerJSX = correctJSXStaff.replace(/viewingFixedTour/g, 'selectedFixedTour');

    if (regex.test(content)) {
        content = content.replace(regex, managerJSX);
        fs.writeFileSync(fPath, content, 'utf8');
        console.log("Completely fixed ManagerTourApproval.jsx");
    } else {
        console.log("Failed to match ManagerTourApproval.jsx");
    }
}

fixStaffPending();
fixManagerTourApproval();

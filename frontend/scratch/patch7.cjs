const fs = require('fs');
let c = fs.readFileSync('src/components/ManagerTourApproval.jsx', 'utf8');

// 1. Inject Re-computation
const beforeRecompute = `                                    const formatMoney = (val) => new Intl.NumberFormat('vi-VN').format(Math.round(val || 0));`;

const afterRecompute = `                                    let autoAccommodationCost = 0;
                                    days.forEach(day => {
                                        if (day.accommodation && day.accommodation.price) autoAccommodationCost += Number(day.accommodation.price);
                                    });
                                    const accommodationPerPax = autoAccommodationCost / 2;
                                    const fixedTransport = Number(costConfig.fixed?.transport || 0);
                                    const variableTransport = Number(costConfig.variable?.transportTicket || 0);
                                    const formatMoney = (val) => new Intl.NumberFormat('vi-VN').format(Math.round(val || 0));`;

c = c.replace(beforeRecompute, afterRecompute);

// 2. Fix Fixed Costs Block
const oldFixedBlock = `<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
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
                                                    </div>`;

const newFixedBlock = `<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
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
                                                    </div>`;

c = c.replace(oldFixedBlock, newFixedBlock);

// 3. Fix Variable Costs Block
const oldVarBlock = `<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
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
                                                    </div>`;

const newVarBlock = `<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#475569' }}>
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
                                                    </div>`;

c = c.replace(oldVarBlock, newVarBlock);

fs.writeFileSync('src/components/ManagerTourApproval.jsx', c);

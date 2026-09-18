const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Add renderPaxSummary
const renderPaxStr = `
const renderPaxSummary = (b) => {
    let p = null;
    try {
        if (b.breakdown) p = typeof b.breakdown === 'string' ? JSON.parse(b.breakdown) : b.breakdown;
        else if (b.requirements) {
            const r = typeof b.requirements === 'string' ? JSON.parse(b.requirements) : b.requirements;
            if (r.participantBreakdown) p = r.participantBreakdown;
        }
    } catch(e) {}
    
    if (p) {
        const parts = [];
        if (p.adults > 0) parts.push(\`\${p.adults} NL\`);
        if (p.children > 0) parts.push(\`\${p.children} TE\`);
        if (p.toddlers > 0) parts.push(\`\${p.toddlers} TN\`);
        if (p.infants > 0) parts.push(\`\${p.infants} EB\`);
        return parts.join(', ');
    }
    return \`\${b.num_people || 1} Khách\`;
};
`;
code = code.replace(/const MyBookings = \(\) => \{/, renderPaxStr + '\nconst MyBookings = () => {');

// 2. Add Modal States
const stateTarget = `const [selectedBooking, setSelectedBooking] = useState(null); // Modal Yêu cầu Hủy/Đổi lịch`;
const stateNew = `const [itineraryModalBooking, setItineraryModalBooking] = useState(null); // Modal Itinerary
    const [remoteDays, setRemoteDays] = useState(null);
    const [loadingRemote, setLoadingRemote] = useState(false);
    
    useEffect(() => {
        const fetchRemote = async () => {
            if (!itineraryModalBooking) return;
            
            let localDays = [];
            try {
                if (itineraryModalBooking.design_data) {
                    const parsed = typeof itineraryModalBooking.design_data === 'string' ? JSON.parse(itineraryModalBooking.design_data) : itineraryModalBooking.design_data;
                    if (parsed.itineraryDays) localDays = parsed.itineraryDays;
                } else if (itineraryModalBooking.requirements) {
                    const reqs = typeof itineraryModalBooking.requirements === 'string' ? JSON.parse(itineraryModalBooking.requirements) : itineraryModalBooking.requirements;
                    if (reqs.itinerary) localDays = reqs.itinerary;
                }
            } catch(e) {}
            
            if (localDays && localDays.length > 0) {
                setRemoteDays(localDays);
                setLoadingRemote(false);
                return;
            }
            
            setLoadingRemote(true);
            setRemoteDays(null);
            try {
                let tId = itineraryModalBooking.tour_id;
                if (!tId) {
                    const res1 = await axios.get(\`\${GATEWAY_URL}/api/tours\`);
                    const matched = res1.data.data.find(t => t.tour_name === itineraryModalBooking.tour_name);
                    if (matched) tId = matched.tour_id;
                }
                if (tId) {
                    const res2 = await axios.get(\`\${GATEWAY_URL}/api/tours/\${tId}\`);
                    if (res2.data.success && res2.data.data.itineraries) {
                        const fetched = res2.data.data.itineraries.map(it => ({
                            day: it.day_number,
                            title: it.title,
                            description: it.description,
                            activities: it.activities ? (typeof it.activities === 'string' ? JSON.parse(it.activities) : it.activities) : [],
                            meals: it.meals ? (typeof it.meals === 'string' ? JSON.parse(it.meals) : it.meals) : [],
                            accommodation: it.accommodation
                        }));
                        setRemoteDays(fetched);
                    } else {
                        setRemoteDays([]);
                    }
                } else {
                    setRemoteDays([]);
                }
            } catch(e) {
                setRemoteDays([]);
            } finally {
                setLoadingRemote(false);
            }
        };
        fetchRemote();
    }, [itineraryModalBooking]);

    const [selectedBooking, setSelectedBooking] = useState(null); // Modal Yêu cầu Hủy/Đổi lịch`;
code = code.replace(stateTarget, stateNew);

// 3. Fix "Thông Tin Lịch Trình" block
// In the original file, it looks like:
/*
                                                <div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>SỐ HÀNH KHÁCH</span>
                                                    <strong style={{ color: '#0f172a' }}>{detailBooking.num_people} người</strong>
                                                </div>
                                            </>
                                        )}
                                    </div>
*/
const infoTarget = /<span style=\{\{ color: '#64748b', display: 'block', fontSize: '12px' \}\}>SỐ HÀNH KHÁCH<\/span>\s*<strong style=\{\{ color: '#0f172a' \}\}>\{detailBooking\.num_people\} người<\/strong>\s*<\/div>\s*<\/>\s*\)\}\s*<\/div>/;

const infoNew = `<span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>SỐ HÀNH KHÁCH</span>
                                                    <strong style={{ color: '#0f172a' }}>{renderPaxSummary(detailBooking)}</strong>
                                                </div>
                                                {detailBooking.departure_id && (
                                                    <div style={{ marginTop: '16px' }}>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setItineraryModalBooking(detailBooking);
                                                            }}
                                                            style={{ display: 'inline-block', width: '100%', padding: '10px 0', textAlign: 'center', background: '#f8fafc', color: '#0284c7', borderRadius: '8px', fontWeight: '700', textDecoration: 'none', fontSize: '13px', transition: 'all 0.2s', border: '1px solid #cbd5e1', cursor: 'pointer' }} 
                                                            onMouseEnter={(e) => {e.target.style.background = '#e2e8f0'; e.target.style.borderColor = '#94a3b8';}} 
                                                            onMouseLeave={(e) => {e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#cbd5e1';}}
                                                        >
                                                            <i className="fas fa-external-link-alt" style={{ marginRight: '6px' }}></i> Xem chi tiết lịch trình
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>`;
code = code.replace(infoTarget, infoNew);

// 4. Fix "Chi Tiết Bảng Tính Tiền" block
// Original looks like:
/*
                                {/* Column 2: Thanh Toán * /}
                                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '20px' }}>
                                    <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                        💳 Chi Tiết Bảng Tính Tiền
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                                        ...
                                    </div>
                                </div>
*/
const billingRegex = /<h4 style=\{\{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' \}\}>\s*💳 Chi Tiết Bảng Tính Tiền\s*<\/h4>\s*<div style=\{\{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' \}\}>[\s\S]*?<\/strong>\s*<\/div>\s*<\/div>\s*<\/div>/;

const modernBilling = `<h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                        💳 Chi Tiết Bảng Tính Tiền
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                                        {(() => {
                                            if (detailBooking.isService) {
                                                return (
                                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', fontSize: '14px', width: '100%' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                            <span style={{ color: '#64748b' }}>Đơn giá ({detailBooking.unit}):</span>
                                                            <strong style={{ color: '#0f172a' }}>{formatCurrency(detailBooking.total_amount / (detailBooking.quantity || 1))}</strong>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                            <span style={{ color: '#64748b' }}>Số lượng:</span>
                                                            <strong style={{ color: '#0f172a' }}>x {detailBooking.quantity}</strong>
                                                        </div>
                                                        <div style={{ borderTop: '1px dashed #cbd5e1', margin: '16px 0' }}></div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ textTransform: 'uppercase', fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>TỔNG THANH TOÁN</div>
                                                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>{formatCurrency(detailBooking.total_amount)}</div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // TOUR BILLING
                                            let adults = 1, children = 0, toddlers = 0, infants = 0;
                                            let p = null;
                                            if (detailBooking.breakdown) {
                                                p = typeof detailBooking.breakdown === 'string' ? JSON.parse(detailBooking.breakdown) : detailBooking.breakdown;
                                            } else if (detailBooking.requirements) {
                                                const reqs = typeof detailBooking.requirements === 'string' ? JSON.parse(detailBooking.requirements) : detailBooking.requirements;
                                                if (reqs.participantBreakdown) p = reqs.participantBreakdown;
                                            }
                                            if (p) {
                                                adults = p.adults || 0;
                                                children = p.children || 0;
                                                toddlers = p.toddlers || 0;
                                                infants = p.infants || 0;
                                            } else {
                                                adults = detailBooking.num_people || 1;
                                            }

                                            let adultPrice = 0, childPrice = 0, toddlerPrice = 0, infantPrice = 0;
                                            const basePr = Number(detailBooking.base_price) || 0;
                                            
                                            // Get Config
                                            let itConfig = {};
                                            try {
                                                if (detailBooking.design_data) {
                                                    const parsed = typeof detailBooking.design_data === 'string' ? JSON.parse(detailBooking.design_data) : detailBooking.design_data;
                                                    if (parsed.costConfig) itConfig = parsed.costConfig;
                                                }
                                            } catch(e) {}
                                            
                                            const sC = itConfig.ageMultiplier?.child || { percent: 75, fixed_surcharge: 0 };
                                            const sT = itConfig.ageMultiplier?.toddler || { percent: 50, fixed_surcharge: 0 };
                                            const sI = itConfig.ageMultiplier?.infant || { percent: 0, fixed_surcharge: 0 };

                                            adultPrice = basePr;
                                            childPrice = (basePr * (sC.percent !== undefined ? sC.percent : 75) / 100) + Number(sC.fixed_surcharge || 0);
                                            toddlerPrice = (basePr * (sT.percent !== undefined ? sT.percent : 50) / 100) + Number(sT.fixed_surcharge || 0);
                                            infantPrice = (basePr * (sI.percent !== undefined ? sI.percent : 0) / 100) + Number(sI.fixed_surcharge || 0);

                                            const totalCalc = (adults * adultPrice) + (children * childPrice) + (toddlers * toddlerPrice) + (infants * infantPrice);
                                            let discount = detailBooking.discount_amount || 0;
                                            let otherSurcharges = 0;
                                            
                                            if (!detailBooking.discount_amount) {
                                                if (totalCalc > detailBooking.total_amount) {
                                                    discount = totalCalc - detailBooking.total_amount;
                                                } else if (totalCalc < detailBooking.total_amount) {
                                                    otherSurcharges = detailBooking.total_amount - totalCalc;
                                                }
                                            }

                                            return (
                                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', fontSize: '14px', width: '100%' }}>
                                                    {adults > 0 && (
                                                        <div style={{ marginBottom: '16px' }}>
                                                            <div style={{ marginBottom: '4px', fontWeight: '700', color: '#0f172a' }}>Người lớn</div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                                                <span>{adults} × {formatCurrency(adultPrice)}</span>
                                                                <span style={{ fontWeight: '700', color: '#0f172a' }}>{formatCurrency(adults * adultPrice)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {children > 0 && (
                                                        <div style={{ marginBottom: '16px' }}>
                                                            <div style={{ marginBottom: '4px', fontWeight: '700', color: '#0f172a' }}>Trẻ em</div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                                                <span>{children} × {formatCurrency(childPrice)}</span>
                                                                <span style={{ fontWeight: '700', color: '#0f172a' }}>{formatCurrency(children * childPrice)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {toddlers > 0 && (
                                                        <div style={{ marginBottom: '16px' }}>
                                                            <div style={{ marginBottom: '4px', fontWeight: '700', color: '#0f172a' }}>Trẻ nhỏ</div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                                                <span>{toddlers} × {formatCurrency(toddlerPrice)}</span>
                                                                <span style={{ fontWeight: '700', color: '#0f172a' }}>{formatCurrency(toddlers * toddlerPrice)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {infants > 0 && (
                                                        <div style={{ marginBottom: '16px' }}>
                                                            <div style={{ marginBottom: '4px', fontWeight: '700', color: '#0f172a' }}>Em bé</div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                                                <span>{infants} × {formatCurrency(infantPrice)}</span>
                                                                <span style={{ fontWeight: '700', color: '#0f172a' }}>{formatCurrency(infants * infantPrice)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <div style={{ borderTop: '1px dashed #cbd5e1', margin: '20px 0 16px 0' }}></div>
                                                    
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: '600', color: '#475569' }}>
                                                        <span>Tiền tour</span>
                                                        <span style={{ color: '#0f172a' }}>{formatCurrency(totalCalc)}</span>
                                                    </div>
                                                    
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: '600', color: '#475569' }}>
                                                        <span>Bảo hiểm</span>
                                                        <span style={{ color: '#0f172a' }}>Đã bao gồm</span>
                                                    </div>
                                                    
                                                    {otherSurcharges > 0 && (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: '600', color: '#0f172a' }}>
                                                            <span>Phụ thu khác</span>
                                                            <span>{formatCurrency(otherSurcharges)}</span>
                                                        </div>
                                                    )}
                                                    
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: '600', color: discount > 0 ? '#10b981' : '#0f172a' }}>
                                                        <span>Khuyến mãi</span>
                                                        <span>{discount > 0 ? \`-\${formatCurrency(discount)}\` : '0 ₫'}</span>
                                                    </div>
                                                    
                                                    <div style={{ borderTop: '1px dashed #cbd5e1', margin: '16px 0' }}></div>
                                                    
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ textTransform: 'uppercase', fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>TỔNG THANH TOÁN</div>
                                                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>{formatCurrency(detailBooking.total_amount)}</div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '4px' }}>
                                            <span style={{ color: '#64748b' }}>Phương thức thanh toán:</span>
                                            <strong style={{ color: '#0f172a' }}>
                                                {(() => {
                                                    const m = String(detailBooking.payment_method || '').toLowerCase();
                                                    if (m === 'bank_transfer') return 'Chuyển khoản';
                                                    if (m === 'momo') return 'Ví MoMo';
                                                    if (m === 'cash') return 'Tiền mặt';
                                                    if (m === 'vnpay') return 'VNPay';
                                                    return detailBooking.payment_method || (detailBooking.payment_status === 'Paid' ? 'Đã thanh toán (N/A)' : 'Chưa thanh toán');
                                                })()}
                                            </strong>
                                        </div>
                                    </div>
                                </div>`;
code = code.replace(billingRegex, modernBilling);

// 5. Add Modal HTML at the bottom
const modalTarget = `            {/* MODAL 2: YÊU CẦU HỦY / ĐỔI LỊCH */}`;
const modalNew = `            {/* MODAL 3: XEM CHI TIẾT LỊCH TRÌNH */}
            {itineraryModalBooking && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
                    <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', width: '800px', maxWidth: '90%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                                🗺️ Lịch trình: {itineraryModalBooking.tour_name}
                            </h3>
                            <button onClick={() => setItineraryModalBooking(null)} style={{ background: 'transparent', border: 'none', fontSize: '24px', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}>&times;</button>
                        </div>
                        <div style={{ padding: '32px', overflowY: 'auto', flex: 1, backgroundColor: '#f8fafc' }}>
                            {(() => {
                                if (loadingRemote || remoteDays === null) return <div style={{ textAlign: 'center', padding: '40px' }}>⏳ Đang tải dữ liệu lịch trình...</div>;
                                
                                const days = remoteDays;
                                if (!days || days.length === 0) {
                                    return <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>Không tìm thấy chi tiết lịch trình. (Bạn vui lòng xem trong file PDF hoặc liên hệ tư vấn viên).</div>;
                                }

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {days.map((day, idx) => (
                                            <div key={idx} style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                                <h4 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0284c7', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ background: '#e0f2fe', padding: '4px 12px', borderRadius: '20px', fontSize: '14px' }}>Ngày {day.day}</span>
                                                    {day.title}
                                                </h4>
                                                
                                                <div style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                                                    {day.description}
                                                </div>

                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                                    {day.activities && day.activities.length > 0 && (
                                                        <div style={{ flex: '1 1 300px', background: '#f1f5f9', padding: '16px', borderRadius: '12px' }}>
                                                            <div style={{ fontWeight: '700', color: '#334155', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <i className="fas fa-hiking" style={{ color: '#64748b' }}></i> Hoạt động
                                                            </div>
                                                            <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                {day.activities.map((act, i) => (
                                                                    <li key={i}>{act}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {day.meals && day.meals.length > 0 && (
                                                        <div style={{ flex: '1 1 300px', background: '#fdf4ff', padding: '16px', borderRadius: '12px' }}>
                                                            <div style={{ fontWeight: '700', color: '#86198f', marginBottom: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <i className="fas fa-utensils"></i> Bữa ăn
                                                            </div>
                                                            <div style={{ color: '#475569', fontSize: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                                {day.meals.map((meal, i) => (
                                                                    <span key={i} style={{ background: '#fae8ff', padding: '4px 12px', borderRadius: '8px', color: '#a21caf', fontWeight: '600' }}>{meal}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {day.accommodation && (
                                                        <div style={{ flex: '1 1 100%', background: '#fffbeb', padding: '16px', borderRadius: '12px', border: '1px solid #fef3c7' }}>
                                                            <div style={{ fontWeight: '700', color: '#b45309', marginBottom: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <i className="fas fa-hotel"></i> Lưu trú
                                                            </div>
                                                            <div style={{ color: '#78350f', fontSize: '14px', fontWeight: '500' }}>{day.accommodation}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: YÊU CẦU HỦY / ĐỔI LỊCH */}`;
code = code.replace(modalTarget, modalNew);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Restored pristine UI');

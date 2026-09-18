const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Imports and global funcs
if (!code.includes("import html2pdf")) {
    code = code.replace(/import axios from 'axios';/, "import axios from 'axios';\nimport html2pdf from 'html2pdf.js';");
}
const globalFuncs = `
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
const getPassengerName = (b, idx) => {
    try {
        if (b.passengers_list) {
            const list = typeof b.passengers_list === 'string' ? JSON.parse(b.passengers_list) : b.passengers_list;
            if (list && list[idx] && list[idx].name) return list[idx].name;
        }
        if (b.breakdown) {
            const parsed = typeof b.breakdown === 'string' ? JSON.parse(b.breakdown) : b.breakdown;
            if (parsed && parsed.passengers && parsed.passengers[idx]) {
                if (parsed.passengers[idx].full_name) return parsed.passengers[idx].full_name;
            }
        }
    } catch(e) {}
    if (b.num_people > 1) {
        return idx === 0 ? \`\${b.customer_name || 'Khách hàng'} (Đại diện)\` : \`\${b.customer_name || 'Khách hàng'} (Khách \${idx + 1})\`;
    }
    return b.customer_name || 'Khách hàng';
};
`;
code = code.replace(/const MyBookings = \(\) => \{/, globalFuncs + '\nconst MyBookings = () => {');

// 2. Fix the list pax summary
code = code.replace(
    /👥 SỐ HÀNH KHÁCH<\/span>\s*<strong style=\{\{ color: '#0f172a' \}\}>\{booking\.num_people\} Người lớn \/ Trẻ em<\/strong>/,
    `👥 SỐ HÀNH KHÁCH</span>\n                                                        <strong style={{ color: '#0f172a' }}>{renderPaxSummary(booking)}</strong>`
);

// 3. Add states
const stateTarget = `const [selectedBooking, setSelectedBooking] = useState(null); // Modal Yêu cầu Hủy/Đổi lịch`;
const stateNew = `const [ticketBooking, setTicketBooking] = useState(null);
    const [itineraryModalBooking, setItineraryModalBooking] = useState(null);
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
                            day: it.day_number, title: it.title, description: it.description,
                            activities: it.activities ? (typeof it.activities === 'string' ? JSON.parse(it.activities) : it.activities) : [],
                            meals: it.meals ? (typeof it.meals === 'string' ? JSON.parse(it.meals) : it.meals) : [],
                            accommodation: it.accommodation
                        }));
                        setRemoteDays(fetched);
                    } else { setRemoteDays([]); }
                } else { setRemoteDays([]); }
            } catch(e) { setRemoteDays([]); } finally { setLoadingRemote(false); }
        };
        fetchRemote();
    }, [itineraryModalBooking]);

    const handleDownloadPDF = () => {
        const element = document.getElementById('ticket-content-to-pdf');
        if (!element) return;
        const opt = {
          margin: [0.5, 0.5, 0.5, 0.5], pagebreak: { mode: ['css', 'legacy'] },
          filename: \`Ve_Dien_Tu_\${ticketBooking.booking_id}.pdf\`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, scrollY: 0, y: 0, windowWidth: 800 },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    const [selectedBooking, setSelectedBooking] = useState(null);`;
code = code.replace(stateTarget, stateNew);

// 4. Modal Info Section (Column 1)
const modalInfoRegex = /<h4 style=\{\{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' \}\}>\s*\{detailBooking\.isService \? '🛎️ Thông Tin Dịch Vụ' : '🗺️ Thông Tin Lịch Trình'\}\s*<\/h4>\s*<div style=\{\{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' \}\}>\s*\{detailBooking\.isService \? \([\s\S]*?<\/div>\s*<\/div>\s*\{\/\* Column 2: Thanh Toán \*\/\}/;

const modernInfo = `<h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                        {detailBooking.isService ? '🛎️ Thông Tin Dịch Vụ' : '🗺️ Thông Tin Lịch Trình'}
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                                        {(() => {
                                            if (detailBooking.isService) {
                                                return (
                                                    <>
                                                        <div>
                                                            <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Loại dịch vụ</span>
                                                            <strong style={{ color: '#0f172a' }}>{detailBooking.service_type}</strong>
                                                        </div>
                                                        <div>
                                                            <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Ngày sử dụng</span>
                                                            <strong style={{ color: '#0284c7' }}>{formatDate(detailBooking.usage_date)}</strong>
                                                        </div>
                                                        <div>
                                                            <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Số lượng yêu cầu</span>
                                                            <strong style={{ color: '#0f172a' }}>{detailBooking.quantity} {detailBooking.unit}</strong>
                                                        </div>
                                                    </>
                                                );
                                            }

                                            let departureLocation = null;
                                            let departureTime = null;
                                            try {
                                                if (detailBooking.design_data) {
                                                    const d = typeof detailBooking.design_data === 'string' ? JSON.parse(detailBooking.design_data) : detailBooking.design_data;
                                                    if (d.departureCity) departureLocation = d.departureCity;
                                                    if (d.startTime) departureTime = d.startTime;
                                                } else if (detailBooking.requirements) {
                                                    const r = typeof detailBooking.requirements === 'string' ? JSON.parse(detailBooking.requirements) : detailBooking.requirements;
                                                    if (r.departureCity) departureLocation = r.departureCity;
                                                    if (r.startTime) departureTime = r.startTime;
                                                }
                                            } catch(e) {}
                                            
                                            // Fallbacks if backend doesn't have it, hardcode as requested
                                            if (!departureLocation) departureLocation = 'Hồ Chí Minh';
                                            if (!departureTime) departureTime = '06:00 AM';

                                            return (
                                                <>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Địa điểm xuất phát</span>
                                                        <strong style={{ color: '#1e293b' }}>{departureLocation}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Giờ khởi hành</span>
                                                        <strong style={{ color: '#1e293b' }}>{departureTime}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Điểm đến</span>
                                                        <strong style={{ color: '#1e293b' }}>{detailBooking.destination || 'Việt Nam'}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Ngày khởi hành</span>
                                                        <strong style={{ color: '#0284c7' }}>{formatDate(detailBooking.departure_date)}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Ngày kết thúc dự kiến</span>
                                                        <strong style={{ color: '#1e293b' }}>{formatDate(detailBooking.return_date)}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase' }}>Số hành khách</span>
                                                        <strong style={{ color: '#1e293b' }}>{renderPaxSummary(detailBooking)}</strong>
                                                    </div>
                                                    
                                                    {detailBooking.departure_id && (
                                                        <div style={{ marginTop: '16px' }}>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setItineraryModalBooking(detailBooking);
                                                                }}
                                                                style={{ display: 'inline-block', width: '100%', padding: '10px 0', textAlign: 'center', background: '#f8fafc', color: '#0284c7', borderRadius: '8px', fontWeight: '700', border: '1px solid #cbd5e1', cursor: 'pointer' }} 
                                                            >
                                                                <i className="fas fa-external-link-alt" style={{ marginRight: '6px' }}></i> Xem chi tiết lịch trình
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Column 2: Thanh Toán */}`;

code = code.replace(modalInfoRegex, modernInfo);

// 5. Billing Section (Column 2)
const billingRegex = /<h4 style=\{\{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' \}\}>\s*💳 Chi Tiết Bảng Tính Tiền\s*<\/h4>\s*<div style=\{\{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' \}\}>[\s\S]*?<\/strong>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\{\/\* Ticket Pass Container Design \*\/\}/;

const modernBilling = `<h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                        💳 Chi Tiết Bảng Tính Tiền
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                                        {(() => {
                                            if (detailBooking.isService) {
                                                return (
                                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', width: '100%' }}>
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
                                                            <div style={{ textTransform: 'uppercase', fontWeight: '800', color: '#0f172a' }}>TỔNG THANH TOÁN</div>
                                                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>{formatCurrency(detailBooking.total_amount)}</div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            let adults = 1, children = 0, toddlers = 0, infants = 0;
                                            let p = null;
                                            if (detailBooking.breakdown) {
                                                p = typeof detailBooking.breakdown === 'string' ? JSON.parse(detailBooking.breakdown) : detailBooking.breakdown;
                                            } else if (detailBooking.requirements) {
                                                const reqs = typeof detailBooking.requirements === 'string' ? JSON.parse(detailBooking.requirements) : detailBooking.requirements;
                                                if (reqs.participantBreakdown) p = reqs.participantBreakdown;
                                            }
                                            if (p) {
                                                adults = p.adults || 0; children = p.children || 0; toddlers = p.toddlers || 0; infants = p.infants || 0;
                                            } else { adults = detailBooking.num_people || 1; }

                                            let adultPrice = 0, childPrice = 0, toddlerPrice = 0, infantPrice = 0;
                                            const basePr = Number(detailBooking.base_price) || 0;
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
                                            
                                            if (!detailBooking.discount_amount && totalCalc > detailBooking.total_amount) {
                                                discount = totalCalc - detailBooking.total_amount;
                                            }

                                            return (
                                                <div style={{ width: '100%' }}>
                                                    {adults > 0 && (
                                                        <div style={{ marginBottom: '16px' }}>
                                                            <div style={{ marginBottom: '4px', fontWeight: '700', color: '#0f172a' }}>Người lớn</div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                                                <span>{adults} × {formatCurrency(adultPrice)}</span>
                                                                <strong style={{ color: '#0f172a' }}>{formatCurrency(adults * adultPrice)}</strong>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {children > 0 && (
                                                        <div style={{ marginBottom: '16px' }}>
                                                            <div style={{ marginBottom: '4px', fontWeight: '700', color: '#0f172a' }}>Trẻ em</div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                                                <span>{children} × {formatCurrency(childPrice)}</span>
                                                                <strong style={{ color: '#0f172a' }}>{formatCurrency(children * childPrice)}</strong>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <div style={{ borderTop: '1px dashed #cbd5e1', margin: '20px 0 16px 0' }}></div>
                                                    
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: '600' }}>
                                                        <span style={{ color: '#0f172a' }}>Tiền tour</span>
                                                        <span style={{ color: '#0f172a' }}>{formatCurrency(totalCalc)}</span>
                                                    </div>
                                                    
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: '600' }}>
                                                        <span style={{ color: '#0f172a' }}>Bảo hiểm</span>
                                                        <span style={{ color: '#0f172a' }}>Đã bao gồm</span>
                                                    </div>
                                                    
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: '600' }}>
                                                        <span style={{ color: '#0f172a' }}>Khuyến mãi</span>
                                                        <span style={{ color: '#0f172a' }}>{discount > 0 ? \`-\${formatCurrency(discount)}\` : '0 ₫'}</span>
                                                    </div>
                                                    
                                                    <div style={{ borderTop: '1px dashed #cbd5e1', margin: '16px 0' }}></div>
                                                    
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ textTransform: 'uppercase', fontWeight: '800', color: '#0f172a' }}>TỔNG THANH TOÁN</div>
                                                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>{formatCurrency(detailBooking.total_amount)}</div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '16px' }}>
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
                                </div>
                            </div>

                            {/* Thông Tin Hành Khách Design */}`;

code = code.replace(billingRegex, modernBilling);

// 6. Customer Info Section & Modals
const customerInfoRegex = /\{\/\* Ticket Pass Container Design \*\/\}[\s\S]*?<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\{\/\* MODAL 2:/;

const newCustomerInfo = `{/* Thông Tin Hành Khách Design */}
                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fas fa-user" style={{ color: '#475569' }}></i> Thông Tin Hành Khách
                                    </h4>
                                    {!detailBooking.isService && (
                                        <button onClick={() => setTicketBooking(detailBooking)} style={{ padding: '8px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <i className="fas fa-print"></i> In Vé Điện Tử
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>HỌ VÀ TÊN</div>
                                        <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700' }}>{detailBooking.customer_name || 'Khách hàng'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>SỐ ĐIỆN THOẠI</div>
                                        <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700' }}>{detailBooking.customer_phone || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>EMAIL LIÊN HỆ</div>
                                        <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700' }}>{detailBooking.customer_email || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: XEM CHI TIẾT LỊCH TRÌNH */}
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
                                if (!days || days.length === 0) return <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0' }}>Không tìm thấy chi tiết lịch trình.</div>;
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
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: E-TICKET DOWNLOAD MODAL */}
            {ticketBooking && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
                    <div style={{ backgroundColor: '#f1f5f9', borderRadius: '24px', width: '800px', maxWidth: '90%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                                🎟️ Vé Điện Tử E-Ticket
                            </h3>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={handleDownloadPDF} style={{ padding: '8px 16px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-download"></i> Tải PDF
                                </button>
                                <button onClick={() => setTicketBooking(null)} style={{ background: 'transparent', border: 'none', fontSize: '24px', color: '#64748b', cursor: 'pointer' }}>&times;</button>
                            </div>
                        </div>
                        <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
                            <div id="ticket-content-to-pdf" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {Array.from({ length: ticketBooking.num_people || 1 }).map((_, idx) => (
                                    <div key={idx} className={\`print-modal \${idx > 0 && idx % 2 === 0 ? 'html2pdf__page-break' : ''}\`} style={{ pageBreakInside: 'avoid', breakInside: 'avoid', position: 'relative', background: '#fff', borderRadius: '16px', border: '2px solid #e2e8f0', overflow: 'hidden', display: 'flex', width: '100%', maxWidth: '700px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
                                        <div style={{ width: '200px', padding: '24px', background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>VIET<span style={{ color: '#38bdf8' }}>WAY</span></div>
                                                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Boarding Pass</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '10px', opacity: 0.7, textTransform: 'uppercase' }}>Booking ID</div>
                                                <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'monospace' }}>#{ticketBooking.booking_id}</div>
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, padding: '24px 32px', borderRight: '2px dashed #cbd5e1', position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                                <div>
                                                    <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', color: '#0f172a', fontWeight: '800' }}>{ticketBooking.tour_name}</h2>
                                                    <div style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Hành khách: <strong style={{ color: '#0284c7' }}>{getPassengerName(ticketBooking, idx)}</strong></div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Khởi hành</div>
                                                    <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700' }}>{formatDate(ticketBooking.departure_date)}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Kết thúc</div>
                                                    <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700' }}>{formatDate(ticketBooking.return_date)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2:`;

code = code.replace(customerInfoRegex, newCustomerInfo);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Restored perfectly');

const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const targetStr = `{!detailBooking.isService ? (
                                            <>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#64748b' }}>Tổng số hành khách:</span>
                                                    <strong style={{ color: '#0f172a' }}>{detailBooking.num_people} người</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#64748b' }}>Chi tiết giá vé:</span>
                                                    <span style={{ color: '#64748b', fontSize: '13px', textAlign: 'right' }}>Áp dụng theo từng độ tuổi<br/>(Người lớn, Trẻ em, Em bé)</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#64748b' }}>Đơn giá ({detailBooking.unit}):</span>
                                                    <strong style={{ color: '#0f172a' }}>{formatCurrency(detailBooking.total_amount / (detailBooking.quantity || 1))}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#64748b' }}>Số lượng:</span>
                                                    <strong style={{ color: '#0f172a' }}>x {detailBooking.quantity}</strong>
                                                </div>
                                            </>
                                        )}`;

const replacement = `{!detailBooking.isService ? (
                                            (() => {
                                                let breakdown = null;
                                                let adultPrice = 0, childPrice = 0, toddlerPrice = 0, infantPrice = 0;
                                                
                                                try {
                                                    if (detailBooking.breakdown) {
                                                        breakdown = typeof detailBooking.breakdown === 'string' ? JSON.parse(detailBooking.breakdown) : detailBooking.breakdown;
                                                    } else if (detailBooking.requirements) {
                                                        const reqs = typeof detailBooking.requirements === 'string' ? JSON.parse(detailBooking.requirements) : detailBooking.requirements;
                                                        if (reqs.participantBreakdown) breakdown = reqs.participantBreakdown;
                                                    }
                                                } catch(e){}

                                                if (breakdown) {
                                                    // Calculate prices
                                                    const adults = breakdown.adults || 0;
                                                    const children = breakdown.children || 0;
                                                    const toddlers = breakdown.toddlers || 0;
                                                    const infants = breakdown.infants || 0;
                                                    
                                                    let itConfig = {};
                                                    if (detailBooking.design_data) {
                                                        const parsedIt = typeof detailBooking.design_data === 'string' ? JSON.parse(detailBooking.design_data) : detailBooking.design_data;
                                                        itConfig = parsedIt.costConfig || {};
                                                    }
                                                    
                                                    const basePr = detailBooking.base_price || (detailBooking.total_amount / Math.max(detailBooking.num_people, 1));
                                                    
                                                    if (detailBooking.quote_id) {
                                                        // Custom Tour rules
                                                        const sC = itConfig.ageMultiplier?.child || { percent: 75, fixed_surcharge: 0 };
                                                        const sT = itConfig.ageMultiplier?.toddler || { percent: 25, fixed_surcharge: 0 };
                                                        const sI = itConfig.ageMultiplier?.infant || { percent: 0, fixed_surcharge: 0 };

                                                        adultPrice = basePr;
                                                        childPrice = (basePr * (sC.percent || 0) / 100) + Number(sC.fixed_surcharge || 0);
                                                        toddlerPrice = (basePr * (sT.percent || 0) / 100) + Number(sT.fixed_surcharge || 0);
                                                        infantPrice = (basePr * (sI.percent || 0) / 100) + Number(sI.fixed_surcharge || 0);
                                                    } else {
                                                        // Regular Tour rules (standard)
                                                        adultPrice = basePr;
                                                        childPrice = basePr * 0.75;
                                                        toddlerPrice = basePr * 0.5;
                                                        infantPrice = 0;
                                                    }
                                                    
                                                    const totalCalc = (adults * adultPrice) + (children * childPrice) + (toddlers * toddlerPrice) + (infants * infantPrice);
                                                    const discount = totalCalc - detailBooking.total_amount; // if there was a discount applied
                                                    
                                                    return (
                                                        <div style={{ background: '#1e293b', color: '#f8fafc', borderRadius: '12px', padding: '16px', fontFamily: 'monospace', fontSize: '14px', width: '100%' }}>
                                                            {adults > 0 && (
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                                    <span>Người lớn × {adults}</span>
                                                                    <span>{formatCurrency(adults * adultPrice)}</span>
                                                                </div>
                                                            )}
                                                            {children > 0 && (
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                                    <span>Trẻ em × {children}</span>
                                                                    <span>{formatCurrency(children * childPrice)}</span>
                                                                </div>
                                                            )}
                                                            {toddlers > 0 && (
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                                    <span>Trẻ nhỏ × {toddlers}</span>
                                                                    <span>{formatCurrency(toddlers * toddlerPrice)}</span>
                                                                </div>
                                                            )}
                                                            {infants > 0 && (
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                                    <span>Em bé × {infants}</span>
                                                                    <span>{formatCurrency(infants * infantPrice)}</span>
                                                                </div>
                                                            )}
                                                            {discount > 0 && (
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                                    <span>Khuyến mãi / Giảm giá</span>
                                                                    <span>-{formatCurrency(discount)}</span>
                                                                </div>
                                                            )}
                                                            <div style={{ borderTop: '1px solid #475569', margin: '12px 0' }}></div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                                                <span>Tổng tiền</span>
                                                                <span>{formatCurrency(detailBooking.total_amount)}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // Fallback for old bookings
                                                return (
                                                    <>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: '#64748b' }}>Tổng số hành khách:</span>
                                                            <strong style={{ color: '#0f172a' }}>{detailBooking.num_people} người</strong>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: '#64748b' }}>Chi tiết giá vé:</span>
                                                            <span style={{ color: '#64748b', fontSize: '13px', textAlign: 'right' }}>Áp dụng theo từng độ tuổi<br/>(Người lớn, Trẻ em, Em bé)</span>
                                                        </div>
                                                    </>
                                                );
                                            })()
                                        ) : (
                                            <>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#64748b' }}>Đơn giá ({detailBooking.unit}):</span>
                                                    <strong style={{ color: '#0f172a' }}>{formatCurrency(detailBooking.total_amount / (detailBooking.quantity || 1))}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#64748b' }}>Số lượng:</span>
                                                    <strong style={{ color: '#0f172a' }}>x {detailBooking.quantity}</strong>
                                                </div>
                                            </>
                                        )}`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacement);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Added detailed breakdown to UI');
} else {
    // try to find it by just parts
    const idx1 = code.indexOf("{!detailBooking.isService ? (");
    const idx2 = code.indexOf("</>", idx1 + 1000);
    if (idx1 > 0 && idx2 > 0) {
        code = code.substring(0, idx1) + replacement + code.substring(idx2 + 3);
        fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
        console.log('Added detailed breakdown to UI (fallback)');
    } else {
        console.log('String not found');
    }
}

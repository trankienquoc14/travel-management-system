const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const headerStr = '💳 Chi Tiết Bảng Tính Tiền';
const headerIdx = code.indexOf(headerStr);

if (headerIdx !== -1) {
    const startStr = `<div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>`;
    const startIdx = code.indexOf(startStr, headerIdx);
    
    const endStr = `TỔNG TIỀN THANH TOÁN:</span>
                                            <strong style={{ fontSize: '20px', color: '#059669', fontWeight: '800', whiteSpace: 'nowrap', textAlign: 'right' }}>{formatCurrency(detailBooking.total_amount)}</strong>
                                        </div>
                                    </div>`;
    
    const endIdx = code.indexOf(endStr, startIdx);
    
    if (startIdx !== -1 && endIdx !== -1) {
        const replacement = `<div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                                        {(() => {
                                            const getPaymentMethod = () => {
                                                const m = String(detailBooking.payment_method || '').toLowerCase();
                                                if (m === 'bank_transfer') return 'Chuyển khoản';
                                                if (m === 'momo') return 'Ví MoMo';
                                                if (m === 'cash') return 'Tiền mặt';
                                                if (m === 'vnpay') return 'VNPay';
                                                return detailBooking.payment_method || (detailBooking.payment_status === 'Paid' ? 'Đã thanh toán (N/A)' : 'Chưa thanh toán');
                                            };
                                            const pmText = getPaymentMethod();

                                            if (detailBooking.isService) {
                                                return (
                                                    <div style={{ background: '#222', color: '#f8fafc', borderRadius: '12px', padding: '20px', fontFamily: '"Courier New", Courier, monospace', fontSize: '14px', width: '100%', letterSpacing: '0.5px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                            <span>Đơn giá ({detailBooking.unit})</span>
                                                            <strong style={{ color: '#fff' }}>{formatCurrency(detailBooking.total_amount / (detailBooking.quantity || 1))}</strong>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                            <span>Số lượng</span>
                                                            <strong style={{ color: '#fff' }}>x {detailBooking.quantity}</strong>
                                                        </div>
                                                        
                                                        <div style={{ borderTop: '1px dashed #4a4a4a', margin: '16px 0' }}></div>
                                                        
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: '10px' }}>
                                                            <div style={{ textTransform: 'uppercase', fontWeight: 'bold', fontSize: '15px', whiteSpace: 'nowrap' }}>TỔNG THANH TOÁN</div>
                                                            <div style={{ fontSize: '18px', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'right' }}>{formatCurrency(detailBooking.total_amount)}</div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // TOURS
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
                                                    const sC = itConfig.ageMultiplier?.child || { percent: 75, fixed_surcharge: 0 };
                                                    const sT = itConfig.ageMultiplier?.toddler || { percent: 25, fixed_surcharge: 0 };
                                                    const sI = itConfig.ageMultiplier?.infant || { percent: 0, fixed_surcharge: 0 };

                                                    adultPrice = basePr;
                                                    childPrice = (basePr * (sC.percent || 0) / 100) + Number(sC.fixed_surcharge || 0);
                                                    toddlerPrice = (basePr * (sT.percent || 0) / 100) + Number(sT.fixed_surcharge || 0);
                                                    infantPrice = (basePr * (sI.percent || 0) / 100) + Number(sI.fixed_surcharge || 0);
                                                } else {
                                                    adultPrice = basePr;
                                                    childPrice = basePr * 0.75;
                                                    toddlerPrice = basePr * 0.5;
                                                    infantPrice = 0;
                                                }
                                                
                                                const totalCalc = (adults * adultPrice) + (children * childPrice) + (toddlers * toddlerPrice) + (infants * infantPrice);
                                                const discount = totalCalc - detailBooking.total_amount;
                                                
                                                return (
                                                    <div style={{ background: '#222', color: '#f8fafc', borderRadius: '12px', padding: '20px', fontFamily: '"Courier New", Courier, monospace', fontSize: '14px', width: '100%', letterSpacing: '0.5px' }}>
                                                        {adults > 0 && (
                                                            <div style={{ marginBottom: '16px' }}>
                                                                <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>Người lớn</div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                                                                    <span>{adults} × {formatCurrency(adultPrice)}</span>
                                                                    <span style={{ fontWeight: 'bold', color: '#fff' }}>{formatCurrency(adults * adultPrice)}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {children > 0 && (
                                                            <div style={{ marginBottom: '16px' }}>
                                                                <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>Trẻ em</div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                                                                    <span>{children} × {formatCurrency(childPrice)}</span>
                                                                    <span style={{ fontWeight: 'bold', color: '#fff' }}>{formatCurrency(children * childPrice)}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {toddlers > 0 && (
                                                            <div style={{ marginBottom: '16px' }}>
                                                                <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>Trẻ nhỏ</div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                                                                    <span>{toddlers} × {formatCurrency(toddlerPrice)}</span>
                                                                    <span style={{ fontWeight: 'bold', color: '#fff' }}>{formatCurrency(toddlers * toddlerPrice)}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {infants > 0 && (
                                                            <div style={{ marginBottom: '16px' }}>
                                                                <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>Em bé</div>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                                                                    <span>{infants} × {formatCurrency(infantPrice)}</span>
                                                                    <span style={{ fontWeight: 'bold', color: '#fff' }}>{formatCurrency(infants * infantPrice)}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        <div style={{ borderTop: '1px dashed #4a4a4a', margin: '20px 0 16px 0' }}></div>
                                                        
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 'bold' }}>
                                                            <span>Tiền tour</span>
                                                            <span style={{ color: '#fff' }}>{formatCurrency(totalCalc)}</span>
                                                        </div>
                                                        
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 'bold' }}>
                                                            <span>Bảo hiểm</span>
                                                            <span style={{ color: '#fff' }}>Đã bao gồm (Free)</span>
                                                        </div>
                                                        
                                                        {discount > 0 && (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: '#10b981', fontWeight: 'bold' }}>
                                                                <span>Khuyến mãi</span>
                                                                <span>-{formatCurrency(discount)}</span>
                                                            </div>
                                                        )}
                                                        
                                                        <div style={{ borderTop: '1px dashed #4a4a4a', margin: '16px 0' }}></div>
                                                        
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: '10px' }}>
                                                            <div style={{ textTransform: 'uppercase', fontWeight: 'bold', fontSize: '15px', whiteSpace: 'nowrap' }}>TỔNG THANH TOÁN</div>
                                                            <div style={{ fontSize: '18px', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'right', color: '#fff' }}>{formatCurrency(detailBooking.total_amount)}</div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Fallback for old tours
                                            return (
                                                <div style={{ background: '#222', color: '#f8fafc', borderRadius: '12px', padding: '20px', fontFamily: '"Courier New", Courier, monospace', fontSize: '14px', width: '100%', letterSpacing: '0.5px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                        <span>Tổng hành khách</span>
                                                        <strong style={{ color: '#fff' }}>{detailBooking.num_people} người</strong>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                        <span>Bảo hiểm</span>
                                                        <strong style={{ color: '#fff' }}>Đã bao gồm</strong>
                                                    </div>
                                                    
                                                    <div style={{ borderTop: '1px dashed #4a4a4a', margin: '16px 0' }}></div>
                                                    
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: '10px' }}>
                                                        <div style={{ textTransform: 'uppercase', fontWeight: 'bold', fontSize: '15px', whiteSpace: 'nowrap' }}>TỔNG THANH TOÁN</div>
                                                        <div style={{ fontSize: '18px', fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'right', color: '#fff' }}>{formatCurrency(detailBooking.total_amount)}</div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', marginTop: '4px' }}>
                                            <span style={{ color: '#64748b' }}>Phương thức thanh toán:</span>
                                            <strong style={{ color: '#0f172a' }}>
                                                {pmText}
                                            </strong>
                                        </div>
                                    </div>`;

        code = code.substring(0, startIdx) + replacement + code.substring(endIdx + endStr.length);
        fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
        console.log('Successfully reverted to DARK MODE receipt precisely!');
    } else {
        console.log('Could not find startIdx or endIdx!');
    }
} else {
    console.log('Could not find header!');
}

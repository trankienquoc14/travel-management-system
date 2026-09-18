const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Remove duplicate button and fix SỐ HÀNH KHÁCH
const viewTourRegex = /<strong style=\{\{ color: '#0f172a' \}\}>\{renderPaxSummary\(detailBooking\)\}<\/strong>\s*<\/div>\s*\{\/\* View Tour Button \*\/\}\s*\{detailBooking\.departure_id && \([\s\S]*?<\/div>\s*\)\}\s*\{\/\* View Tour Button \*\/\}\s*\{detailBooking\.departure_id && \([\s\S]*?<\/div>\s*\)\}\s*<\/>\s*\)\}/;

const fixedButtons = `<strong style={{ color: '#0f172a' }}>{renderPaxSummary(detailBooking)}</strong>
                                                </div>
                                                
                                                {/* View Tour Button */}
                                                {!detailBooking.isService && (
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
                                        )}`;

if(code.match(viewTourRegex)) {
    code = code.replace(viewTourRegex, fixedButtons);
    console.log('Fixed buttons');
} else {
    console.log('Failed to fix buttons');
}

// 2. Fix the Billing Section
const billingRegex = /<div style=\{\{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' \}\}>[\s\S]*?<\/strong>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\{\/\* Ticket Pass Container Design \*\/\}/;

const modernBilling = `<div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
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
                                </div>
                            </div>
                            
                            {/* Ticket Pass Container Design */}`;

if (code.match(billingRegex)) {
    code = code.replace(billingRegex, modernBilling);
    console.log('Fixed billing');
} else {
    console.log('Failed to fix billing');
}

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');

const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const oldCode = `                                                if (detailBooking.quote_id) {
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
                                                }`;

const newCode = `                                                const sC = itConfig.ageMultiplier?.child || { percent: 75, fixed_surcharge: 0 };
                                                const sT = itConfig.ageMultiplier?.toddler || { percent: 50, fixed_surcharge: 0 };
                                                const sI = itConfig.ageMultiplier?.infant || { percent: 0, fixed_surcharge: 0 };

                                                adultPrice = basePr;
                                                childPrice = (basePr * (sC.percent !== undefined ? sC.percent : 75) / 100) + Number(sC.fixed_surcharge || 0);
                                                toddlerPrice = (basePr * (sT.percent !== undefined ? sT.percent : 50) / 100) + Number(sT.fixed_surcharge || 0);
                                                infantPrice = (basePr * (sI.percent !== undefined ? sI.percent : 0) / 100) + Number(sI.fixed_surcharge || 0);`;

code = code.replace(oldCode, newCode);

// Fix the discount row to use detailBooking.discount_amount or fallback to mathematically correct difference, but we will ONLY show discount row if it's > 0, OR if user wants to see it always, we show 0
const oldDiscountCode = `                                                const totalCalc = (adults * adultPrice) + (children * childPrice) + (toddlers * toddlerPrice) + (infants * infantPrice);
                                                const discount = totalCalc - detailBooking.total_amount;`;

const newDiscountCode = `                                                const totalCalc = (adults * adultPrice) + (children * childPrice) + (toddlers * toddlerPrice) + (infants * infantPrice);
                                                let discount = detailBooking.discount_amount || 0;
                                                let otherSurcharges = 0;
                                                if (!detailBooking.discount_amount) {
                                                    // Math fallback for older bookings without explicit discount_amount
                                                    if (totalCalc > detailBooking.total_amount) {
                                                        discount = totalCalc - detailBooking.total_amount;
                                                    } else if (totalCalc < detailBooking.total_amount) {
                                                        otherSurcharges = detailBooking.total_amount - totalCalc;
                                                    }
                                                }`;

code = code.replace(oldDiscountCode, newDiscountCode);

// Add Other Surcharges row if applicable
const oldRows = `                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 'bold' }}>
                                                            <span>Bảo hiểm</span>
                                                            <span style={{ color: '#0f172a' }}>Đã bao gồm</span>
                                                        </div>
                                                        
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: discount > 0 ? '#10b981' : '#0f172a', fontWeight: 'bold' }}>
                                                            <span>Khuyến mãi</span>
                                                            <span>{discount > 0 ? \`-\${formatCurrency(discount)}\` : '0 ₫'}</span>
                                                        </div>`;

const newRows = `                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 'bold' }}>
                                                            <span>Bảo hiểm</span>
                                                            <span style={{ color: '#0f172a' }}>Đã bao gồm</span>
                                                        </div>
                                                        
                                                        {otherSurcharges > 0 && (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                                                                <span>Phụ thu khác (vd: Phòng đơn)</span>
                                                                <span>{formatCurrency(otherSurcharges)}</span>
                                                            </div>
                                                        )}
                                                        
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: discount > 0 ? '#10b981' : '#0f172a', fontWeight: 'bold' }}>
                                                            <span>Khuyến mãi</span>
                                                            <span>{discount > 0 ? \`-\${formatCurrency(discount)}\` : '0 ₫'}</span>
                                                        </div>`;

code = code.replace(oldRows, newRows);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Fixed discount calculation');

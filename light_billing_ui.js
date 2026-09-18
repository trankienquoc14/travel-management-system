const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const targetStr = `<div style={{ background: '#222', color: '#f8fafc', borderRadius: '12px', padding: '20px', fontFamily: '"Courier New", Courier, monospace', fontSize: '14px', width: '100%', letterSpacing: '0.5px' }}>
                                                            {adults > 0 && (
                                                                <div style={{ marginBottom: '16px' }}>
                                                                    <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>Người lớn</div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                                                                        <span>{adults} × {formatCurrency(adultPrice)}</span>
                                                                        <span style={{ fontWeight: 'bold' }}>{formatCurrency(adults * adultPrice)}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {children > 0 && (
                                                                <div style={{ marginBottom: '16px' }}>
                                                                    <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>Trẻ em</div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                                                                        <span>{children} × {formatCurrency(childPrice)}</span>
                                                                        <span style={{ fontWeight: 'bold' }}>{formatCurrency(children * childPrice)}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {toddlers > 0 && (
                                                                <div style={{ marginBottom: '16px' }}>
                                                                    <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>Trẻ nhỏ</div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                                                                        <span>{toddlers} × {formatCurrency(toddlerPrice)}</span>
                                                                        <span style={{ fontWeight: 'bold' }}>{formatCurrency(toddlers * toddlerPrice)}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {infants > 0 && (
                                                                <div style={{ marginBottom: '16px' }}>
                                                                    <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>Em bé</div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e2e8f0' }}>
                                                                        <span>{infants} × {formatCurrency(infantPrice)}</span>
                                                                        <span style={{ fontWeight: 'bold' }}>{formatCurrency(infants * infantPrice)}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            <div style={{ borderTop: '1px solid #4a4a4a', margin: '20px 0 16px 0' }}></div>
                                                            
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 'bold' }}>
                                                                <span>Tiền tour</span>
                                                                <span>{formatCurrency(totalCalc)}</span>
                                                            </div>
                                                            
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: 'bold' }}>
                                                                <span>Bảo hiểm</span>
                                                                <span>Đã bao gồm</span>
                                                            </div>
                                                            
                                                            {discount > 0 && (
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: '#10b981', fontWeight: 'bold' }}>
                                                                    <span>Khuyến mãi</span>
                                                                    <span>-{formatCurrency(discount)}</span>
                                                                </div>
                                                            )}
                                                            
                                                            <div style={{ borderTop: '1px solid #4a4a4a', margin: '16px 0' }}></div>
                                                            
                                                            <div style={{ marginBottom: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>TỔNG THANH TOÁN</div>
                                                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatCurrency(detailBooking.total_amount)}</div>
                                                        </div>`;

const replacement = `<div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#334155', borderRadius: '12px', padding: '20px', fontSize: '14px', width: '100%' }}>
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
                                                                <span style={{ color: '#10b981' }}>Đã bao gồm (Free)</span>
                                                            </div>
                                                            
                                                            {discount > 0 && (
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontWeight: '600', color: '#475569' }}>
                                                                    <span>Khuyến mãi</span>
                                                                    <span style={{ color: '#ef4444' }}>-{formatCurrency(discount)}</span>
                                                                </div>
                                                            )}
                                                            
                                                            <div style={{ borderTop: '1px dashed #cbd5e1', margin: '16px 0' }}></div>
                                                            
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div style={{ textTransform: 'uppercase', fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>TỔNG THANH TOÁN</div>
                                                                <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>{formatCurrency(detailBooking.total_amount)}</div>
                                                            </div>
                                                        </div>`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacement);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Successfully changed billing UI to light modern theme.');
} else {
    // fallback extraction
    const startIdx = code.indexOf("<div style={{ background: '#222'");
    const endIdx = code.indexOf("</div>", startIdx + 4000);
    if (startIdx > 0 && endIdx > 0) {
        code = code.substring(0, startIdx) + replacement + code.substring(endIdx + 6);
        fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
        console.log('Successfully changed billing UI to light modern theme (fallback).');
    } else {
        console.log('Could not find the target string block to replace.');
    }
}

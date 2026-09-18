const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// I will extract the exact chunk to replace by string search
const startStr = "<div style={{ background: '#1e293b', color: '#f8fafc', borderRadius: '12px', padding: '16px', fontFamily: 'monospace', fontSize: '14px', width: '100%' }}>";
const endStr = "</div>\n                                                    );";

const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf(endStr, startIdx);

if (startIdx > 0 && endIdx > 0) {
    const replacement = `<div style={{ background: '#222', color: '#f8fafc', borderRadius: '12px', padding: '20px', fontFamily: '"Courier New", Courier, monospace', fontSize: '14px', width: '100%', letterSpacing: '0.5px' }}>
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
                                                        `;
    
    code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Successfully updated the billing UI to match the screenshot.');
} else {
    console.log('Could not find the target string block to replace.');
}

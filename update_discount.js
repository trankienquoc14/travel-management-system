const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// Replace "Đã bao gồm (Free)" with "Đã bao gồm"
code = code.replace(/Đã bao gồm \(Free\)/g, 'Đã bao gồm');

// Replace the discount block for tours
const oldDiscountBlock = `{discount > 0 && (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: '#10b981', fontWeight: 'bold' }}>
                                                                <span>Khuyến mãi</span>
                                                                <span>-{formatCurrency(discount)}</span>
                                                            </div>
                                                        )}`;

const newDiscountBlock = `<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: discount > 0 ? '#10b981' : '#0f172a', fontWeight: 'bold' }}>
                                                            <span>Khuyến mãi</span>
                                                            <span>{discount > 0 ? \`-\${formatCurrency(discount)}\` : '0 ₫'}</span>
                                                        </div>`;

code = code.replace(oldDiscountBlock, newDiscountBlock);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Updated discount and insurance successfully');

const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /\{children > 0 && \([\s\S]*?<\/div>\s*\)\}\s*<div style=\{\{ borderTop: '1px dashed #cbd5e1', margin: '20px 0 16px 0' \}\}>/;

const newStr = `{children > 0 && (
                                                        <div style={{ marginBottom: '16px' }}>
                                                            <div style={{ marginBottom: '4px', fontWeight: '700', color: '#0f172a' }}>Trẻ em</div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                                                <span>{children} × {formatCurrency(childPrice)}</span>
                                                                <strong style={{ color: '#0f172a' }}>{formatCurrency(children * childPrice)}</strong>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {toddlers > 0 && (
                                                        <div style={{ marginBottom: '16px' }}>
                                                            <div style={{ marginBottom: '4px', fontWeight: '700', color: '#0f172a' }}>Trẻ nhỏ</div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                                                <span>{toddlers} × {formatCurrency(toddlerPrice)}</span>
                                                                <strong style={{ color: '#0f172a' }}>{formatCurrency(toddlers * toddlerPrice)}</strong>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {infants > 0 && (
                                                        <div style={{ marginBottom: '16px' }}>
                                                            <div style={{ marginBottom: '4px', fontWeight: '700', color: '#0f172a' }}>Em bé</div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                                                                <span>{infants} × {formatCurrency(infantPrice)}</span>
                                                                <strong style={{ color: '#0f172a' }}>{formatCurrency(infants * infantPrice)}</strong>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <div style={{ borderTop: '1px dashed #cbd5e1', margin: '20px 0 16px 0' }}>`;

if (code.match(regex)) {
    code = code.replace(regex, newStr);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Added toddlers and infants');
} else {
    console.log('Regex failed');
}

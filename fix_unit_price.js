const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const targetRegex = /<div style=\{\{ display: 'flex', justifyContent: 'space-between' \}\}>\s*<span style=\{\{ color: '#64748b' \}\}>Đơn giá \{detailBooking\.isService \? `\(\$\{detailBooking\.unit\}\)` : '1 hành khách'\}:<\/span>\s*<strong style=\{\{ color: '#0f172a' \}\}>\{formatCurrency\(detailBooking\.isService \? \(detailBooking\.total_amount \/ \(detailBooking\.quantity \|\| 1\)\) : detailBooking\.price_per_person\)\}<\/strong>\s*<\/div>\s*<div style=\{\{ display: 'flex', justifyContent: 'space-between' \}\}>\s*<span style=\{\{ color: '#64748b' \}\}>Số lượng:<\/span>\s*<strong style=\{\{ color: '#0f172a' \}\}>x \{detailBooking\.isService \? detailBooking\.quantity : detailBooking\.num_people\}<\/strong>\s*<\/div>/;

const replacement = `
                                        {detailBooking.isService ? (
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
                                        ) : (
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
                                        )}
`;

if (code.match(targetRegex)) {
    code = code.replace(targetRegex, replacement);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Fixed unit price issue in UI');
} else {
    console.log('Regex did not match');
}

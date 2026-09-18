const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const replacement = `<div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>ĐỊA ĐIỂM XUẤT PHÁT</span>
                                                    <strong style={{ color: '#0f172a' }}>{getDepartureLocation(detailBooking)}</strong>
                                                </div>
                                                <div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>GIỜ KHỞI HÀNH</span>
                                                    <strong style={{ color: '#0f172a' }}>{getDepartureTime(detailBooking)}</strong>
                                                </div>
                                                <div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>ĐIỂM ĐẾN</span>`;

code = code.replace(/<div>\s*<span style=\{\{ color: '#64748b', display: 'block', fontSize: '12px' \}\}>ĐIỂM ĐẾN<\/span>/, replacement);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Done inject');
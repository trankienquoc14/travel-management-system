const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /{detailBooking\.tour_id && \([\s\S]*?<a href=\{`\/tours\/\$\{detailBooking\.tour_id\}`\}[\s\S]*?<\/a>\s*<\/div>\s*\)}/;

const replacement = `{detailBooking.departure_id && (
                                                    <div style={{ marginTop: '16px' }}>
                                                        <button 
                                                            onClick={(e) => {
                                                                if (detailBooking.tour_id) {
                                                                    window.open(\`/tours/\${detailBooking.tour_id}\`, '_blank');
                                                                } else {
                                                                    alert('Vui lòng quay lại cửa sổ Terminal (dòng lệnh) đang chạy server, bấm Ctrl+C để tắt đi và chạy lại lệnh npm start để Backend cập nhật code mới nhất nhé!');
                                                                }
                                                            }}
                                                            style={{ display: 'inline-block', width: '100%', padding: '10px 0', textAlign: 'center', background: '#f8fafc', color: '#0284c7', borderRadius: '8px', fontWeight: '700', textDecoration: 'none', fontSize: '13px', transition: 'all 0.2s', border: '1px solid #cbd5e1', cursor: 'pointer' }} 
                                                            onMouseEnter={(e) => {e.target.style.background = '#e2e8f0'; e.target.style.borderColor = '#94a3b8';}} 
                                                            onMouseLeave={(e) => {e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#cbd5e1';}}
                                                        >
                                                            <i className="fas fa-external-link-alt" style={{ marginRight: '6px' }}></i> Xem chi tiết lịch trình
                                                        </button>
                                                    </div>
                                                )}`;

code = code.replace(regex, replacement);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Button replaced successfully');

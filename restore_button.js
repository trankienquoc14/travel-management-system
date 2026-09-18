const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /(<strong style=\{\{ color: '#0f172a' \}\}>\{renderPaxSummary\(detailBooking\)\}<\/strong>\s*<\/div>\s*<\/>\s*\)\})/;

const newCode = `<strong style={{ color: '#0f172a' }}>{renderPaxSummary(detailBooking)}</strong>
                                                </div>
                                                
                                                {/* View Tour Button */}
                                                {detailBooking.departure_id && (
                                                    <div style={{ marginTop: '16px' }}>
                                                        <button 
                                                            onClick={async (e) => {
                                                                if (detailBooking.tour_id) {
                                                                    window.open(\`/tour/\${detailBooking.tour_id}\`, '_blank');
                                                                    return;
                                                                }
                                                                
                                                                try {
                                                                    const response = await axios.get(\`\${GATEWAY_URL}/api/tours\`);
                                                                    const tours = response.data.data;
                                                                    const matchedTour = tours.find(t => t.tour_name === detailBooking.tour_name);
                                                                    if (matchedTour) {
                                                                        window.open(\`/tour/\${matchedTour.tour_id}\`, '_blank');
                                                                    } else {
                                                                        alert('Tour này là tour thiết kế riêng hoặc đã bị ẩn. Vui lòng khởi động lại Backend (Terminal) để hệ thống đồng bộ link truy cập ẩn nhé!');
                                                                    }
                                                                } catch(err) {
                                                                    alert('Lỗi kết nối. Vui lòng khởi động lại Backend!');
                                                                }
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

code = code.replace(regex, newCode);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Regex matched:', code.includes('Xem chi tiết lịch trình'));

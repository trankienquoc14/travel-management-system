const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const targetStr = `                                                <div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>SỐ HÀNH KHÁCH</span>
                                                    <strong style={{ color: '#0f172a' }}>{renderPaxSummary(detailBooking)}</strong>
                                                </div>`;

const newStr = `                                                <div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px' }}>SỐ HÀNH KHÁCH</span>
                                                    <strong style={{ color: '#0f172a' }}>{renderPaxSummary(detailBooking)}</strong>
                                                </div>
                                                
                                                {/* View Tour Button */}
                                                {detailBooking.tour_id && (
                                                    <div style={{ marginTop: '8px' }}>
                                                        <a href={\`/tours/\${detailBooking.tour_id}\`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', width: '100%', padding: '10px 0', textAlign: 'center', background: '#f1f5f9', color: '#0284c7', borderRadius: '8px', fontWeight: '600', textDecoration: 'none', fontSize: '13px', transition: 'all 0.2s', border: '1px solid #e2e8f0' }} onMouseEnter={(e) => {e.target.style.background = '#e2e8f0'; e.target.style.borderColor = '#cbd5e1';}} onMouseLeave={(e) => {e.target.style.background = '#f1f5f9'; e.target.style.borderColor = '#e2e8f0';}}>
                                                            <i className="fas fa-external-link-alt" style={{ marginRight: '6px' }}></i> Xem chi tiết lịch trình
                                                        </a>
                                                    </div>
                                                )}`;

code = code.replace(targetStr, newStr);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Added button properly');

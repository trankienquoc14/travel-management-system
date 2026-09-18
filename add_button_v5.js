const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const targetStr = "<strong style={{ color: '#0f172a' }}>{renderPaxSummary(detailBooking)}</strong>\\n                                                </div>";

const replacement = \`<strong style={{ color: '#0f172a' }}>{renderPaxSummary(detailBooking)}</strong>
                                                </div>
                                                
                                                {/* View Tour Button */}
                                                {detailBooking.tour_id && (
                                                    <div style={{ marginTop: '16px' }}>
                                                        <a href={\\\`/tours/\${detailBooking.tour_id}\\\`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', width: '100%', padding: '10px 0', textAlign: 'center', background: '#f8fafc', color: '#0284c7', borderRadius: '8px', fontWeight: '700', textDecoration: 'none', fontSize: '13px', transition: 'all 0.2s', border: '1px solid #cbd5e1' }} onMouseEnter={(e) => {e.target.style.background = '#e2e8f0'; e.target.style.borderColor = '#94a3b8';}} onMouseLeave={(e) => {e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#cbd5e1';}}>
                                                            <i className="fas fa-external-link-alt" style={{ marginRight: '6px' }}></i> Xem chi tiết lịch trình
                                                        </a>
                                                    </div>
                                                )}\`;

code = code.replace("<strong style={{ color: '#0f172a' }}>{renderPaxSummary(detailBooking)}</strong>\n                                                </div>", replacement);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Regex replacement successful:', code.includes('Xem chi tiết lịch trình'));

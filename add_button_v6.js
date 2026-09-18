const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const t = "<strong style={{ color: '#0f172a' }}>{renderPaxSummary(detailBooking)}</strong>\\r\\n                                                </div>";
const t2 = "<strong style={{ color: '#0f172a' }}>{renderPaxSummary(detailBooking)}</strong>\\n                                                </div>";

const r = `<strong style={{ color: '#0f172a' }}>{renderPaxSummary(detailBooking)}</strong>
                                                </div>
                                                
                                                {/* View Tour Button */}
                                                {detailBooking.tour_id && (
                                                    <div style={{ marginTop: '16px' }}>
                                                        <a href={\`/tours/\${detailBooking.tour_id}\`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', width: '100%', padding: '10px 0', textAlign: 'center', background: '#f8fafc', color: '#0284c7', borderRadius: '8px', fontWeight: '700', textDecoration: 'none', fontSize: '13px', transition: 'all 0.2s', border: '1px solid #cbd5e1' }} onMouseEnter={(e) => {e.target.style.background = '#e2e8f0'; e.target.style.borderColor = '#94a3b8';}} onMouseLeave={(e) => {e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#cbd5e1';}}>
                                                            <i className="fas fa-external-link-alt" style={{ marginRight: '6px' }}></i> Xem chi tiết lịch trình
                                                        </a>
                                                    </div>
                                                )}`;

if (code.includes(t)) {
    code = code.replace(t, r);
} else if (code.includes(t2)) {
    code = code.replace(t2, r);
} else {
    // try replacing by just the inner
    const i1 = "<strong style={{ color: '#0f172a' }}>{renderPaxSummary(detailBooking)}</strong>";
    const i2 = `<strong style={{ color: '#0f172a' }}>{renderPaxSummary(detailBooking)}</strong>
                                                </div>
                                                
                                                {/* View Tour Button */}
                                                {detailBooking.tour_id && (
                                                    <div style={{ marginTop: '16px' }}>
                                                        <a href={\`/tours/\${detailBooking.tour_id}\`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', width: '100%', padding: '10px 0', textAlign: 'center', background: '#f8fafc', color: '#0284c7', borderRadius: '8px', fontWeight: '700', textDecoration: 'none', fontSize: '13px', transition: 'all 0.2s', border: '1px solid #cbd5e1' }} onMouseEnter={(e) => {e.target.style.background = '#e2e8f0'; e.target.style.borderColor = '#94a3b8';}} onMouseLeave={(e) => {e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#cbd5e1';}}>
                                                            <i className="fas fa-external-link-alt" style={{ marginRight: '6px' }}></i> Xem chi tiết lịch trình
                                                        </a>
                                                    </div>
                                                )}
                                                <div style={{display: 'none'}}>`;
    code = code.replace(i1, i2);
}

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Done', code.includes('Xem chi tiết lịch trình'));

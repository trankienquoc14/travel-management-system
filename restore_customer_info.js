const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const oldTicketContainerRegex = /\{\/\* Ticket Pass Container Design \*\/\}[\s\S]*?<\/button>\s*<\/div>/;

const newCustomerInfo = `{/* Thông Tin Hành Khách Design */}
                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px', marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fas fa-user" style={{ color: '#475569' }}></i> Thông Tin Hành Khách
                                    </h4>
                                    {!detailBooking.isService && (
                                        <button onClick={() => setTicketBooking(detailBooking)} style={{ padding: '8px 16px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <i className="fas fa-print"></i> In Vé Điện Tử
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>HỌ VÀ TÊN</div>
                                        <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700' }}>{detailBooking.customer_name || 'Khách hàng'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>SỐ ĐIỆN THOẠI</div>
                                        <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700' }}>{detailBooking.customer_phone || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>EMAIL LIÊN HỆ</div>
                                        <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700' }}>{detailBooking.customer_email || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>`;

if (code.match(oldTicketContainerRegex)) {
    code = code.replace(oldTicketContainerRegex, newCustomerInfo);
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Restored customer info design');
} else {
    console.log('Regex failed');
}

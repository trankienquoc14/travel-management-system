const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

const regex = /\{\/\* Thông Tin Hành Khách Design \*\/\}\s*<div style=\{\{ background: 'linear-gradient\(135deg, #f8fafc 0%, #e2e8f0 100%\)', borderRadius: '20px', padding: '20px', border: '1px dashed #94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' \}\}>[\s\S]*?<\/button>\s*<\/div>/;

const newStr = `{/* Thông Tin Hành Khách Design */}
                            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <h4 style={{ margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                                    <span style={{ fontSize: '20px', color: '#312e81' }}>👤</span> Thông Tin Hành Khách
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>HỌ VÀ TÊN</div>
                                        <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>{detailBooking.customer_name || 'Khách hàng'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>SỐ ĐIỆN THOẠI</div>
                                        <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>{detailBooking.customer_phone || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>EMAIL LIÊN HỆ</div>
                                        <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '600' }}>{detailBooking.customer_email || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>`;

if (code.match(regex)) {
    code = code.replace(regex, newStr);
    
    // Add "In vé điện tử" button to footer
    const footerRegex = /<button onClick=\{\(\) => setDetailBooking\(null\)\} style=\{\{ padding: '10px 24px', background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' \}\}>\s*Đóng cửa sổ\s*<\/button>/;
    
    const newFooterStr = `{!detailBooking.isService && (
                                <button onClick={() => setTicketBooking(detailBooking)} style={{ padding: '10px 24px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-print"></i> In Vé Điện Tử
                                </button>
                            )}
                            <button onClick={() => setDetailBooking(null)} style={{ padding: '10px 24px', background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                                Đóng cửa sổ
                            </button>`;
                            
    code = code.replace(footerRegex, newFooterStr);
    
    fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
    console.log('Fixed passenger info');
} else {
    console.log('Regex failed');
}

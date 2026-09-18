const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Update html2canvas opt
const optRegex = /html2canvas:\s*\{\s*scale:\s*2,\s*useCORS:\s*true\s*\}/;
code = code.replace(optRegex, "html2canvas:  { scale: 2, useCORS: true, scrollY: 0, y: 0 }");

// 2. Wrap the map in a display: block wrapper
const ticketWrapperRegex = /<div id="ticket-content-to-pdf" style=\{\{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', alignItems: 'center' \}\}>([\s\S]*?)<\/div>\s*\{\/\* Actions/;

const innerTicket = `<div id="ticket-content-to-pdf" style={{ display: 'block', width: '100%' }}>
                            {Array.from({ length: ticketBooking.num_people || 1 }).map((_, idx) => {
                                const names = ticketBooking.passengers_list ? ticketBooking.passengers_list.split('||') : [];
                                const passengerName = names[idx] || (idx === 0 ? ticketBooking.customer_name : \`Khách \${idx + 1}\`);
                                return (
                                <div key={idx} style={{ pageBreakInside: 'avoid', breakInside: 'avoid', marginBottom: '24px' }}>
                                    <div className="print-modal" style={{ position: 'relative', background: '#fff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '800px', margin: '0 auto', border: '1px dashed #cbd5e1', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
                                        {/* Ticket Header */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed #e2e8f0', paddingBottom: '24px', marginBottom: '24px' }}>
                                            <div>
                                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0194f3', textTransform: 'uppercase', letterSpacing: '2px' }}>
                                                    {ticketBooking.quote_id ? 'VÉ TOUR THIẾT KẾ' : 'VÉ TOUR TRỌN GÓI'}
                                                </div>
                                                <div style={{ fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '1px' }}>#{ticketBooking.booking_id}{ticketBooking.num_people > 1 ? \`-\${idx + 1}\` : ''}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>NGÀY ĐẶT VÉ</div>
                                                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{new Date(ticketBooking.booking_date).toLocaleDateString('vi-VN')}</div>
                                            </div>
                                        </div>

                                        {/* Ticket Body */}
                                        <div style={{ display: 'flex', gap: '32px' }}>
                                            {/* Left: Info */}
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                <div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>TÊN HÀNH KHÁCH</span>
                                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{passengerName}</div>
                                                </div>
                                                <div>
                                                    <span style={{ color: '#64748b', display: 'block', fontSize: '12px', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>TÊN TOUR</span>
                                                    <strong style={{ color: '#0f172a', fontSize: '16px', lineHeight: '1.4', display: 'block' }}>{ticketBooking.tour_name}</strong>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '16px' }}>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', fontWeight: '600' }}>KHỞI HÀNH</span>
                                                        <strong style={{ color: '#0f172a', fontSize: '15px' }}>{new Date(ticketBooking.departure_date).toLocaleDateString('vi-VN')}</strong>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#64748b', display: 'block', fontSize: '12px', fontWeight: '600' }}>SỐ NGÀY</span>
                                                        <strong style={{ color: '#0f172a', fontSize: '15px' }}>{ticketBooking.duration}</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: QR */}
                                            <div style={{ width: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', borderLeft: '2px dashed #e2e8f0', paddingLeft: '32px' }}>
                                                <div style={{ padding: '8px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                                                    <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=TRAVELVN-TICKET-\${ticketBooking.booking_id}\${ticketBooking.num_people > 1 ? \`-\${idx + 1}\` : ''}&t=\${Date.now()}\`} alt="QR Code" style={{ width: '140px', height: '140px', display: 'block' }} crossOrigin="anonymous" />
                                                </div>
                                                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textAlign: 'center' }}>QUÉT MÃ ĐỂ<br/>KIỂM TRA</span>
                                            </div>
                                        </div>

                                        {/* Cutout Circles */}
                                        <div style={{ position: 'absolute', left: '-16px', top: '50%', width: '32px', height: '32px', background: 'rgba(0,0,0,0.4)', borderRadius: '50%', transform: 'translateY(-50%)' }}></div>
                                        <div style={{ position: 'absolute', right: '-16px', top: '50%', width: '32px', height: '32px', background: 'rgba(0,0,0,0.4)', borderRadius: '50%', transform: 'translateY(-50%)' }}></div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                        {/* Actions`;

code = code.replace(ticketWrapperRegex, innerTicket);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('Applied ultimate PDF fix on top of correct layout');
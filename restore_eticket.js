const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/MyBookings.jsx', 'utf8');

// 1. Add html2pdf import
if (!code.includes("import html2pdf")) {
    code = code.replace(/import axios from 'axios';/, "import axios from 'axios';\nimport html2pdf from 'html2pdf.js';");
}

// 2. Add ticket modal state
const stateTarget = `const [selectedBooking, setSelectedBooking] = useState(null); // Modal Yêu cầu Hủy/Đổi lịch`;
const stateNew = `const [ticketBooking, setTicketBooking] = useState(null); // Modal E-Ticket
    const handleDownloadPDF = () => {
        const element = document.getElementById('ticket-content-to-pdf');
        if (!element) return;
        const opt = {
          margin: [0.5, 0.5, 0.5, 0.5],
          pagebreak:    { mode: ['css', 'legacy'] },
          filename:     \`Ve_Dien_Tu_\${ticketBooking.booking_id}.pdf\`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, scrollY: 0, y: 0, windowWidth: 800 },
          jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };
    
    const getPassengerName = (b, idx) => {
        try {
            if (b.passengers_list) {
                const list = typeof b.passengers_list === 'string' ? JSON.parse(b.passengers_list) : b.passengers_list;
                if (list && list[idx] && list[idx].name) return list[idx].name;
            }
            if (b.breakdown) {
                const parsed = typeof b.breakdown === 'string' ? JSON.parse(b.breakdown) : b.breakdown;
                if (parsed && parsed.passengers && parsed.passengers[idx]) {
                    if (parsed.passengers[idx].full_name) return parsed.passengers[idx].full_name;
                }
            }
        } catch(e) {}
        if (b.num_people > 1) {
            return idx === 0 ? \`\${b.customer_name || 'Khách hàng'} (Đại diện)\` : \`\${b.customer_name || 'Khách hàng'} (Khách \${idx + 1})\`;
        }
        return b.customer_name || 'Khách hàng';
    };

    const [selectedBooking, setSelectedBooking] = useState(null); // Modal Yêu cầu Hủy/Đổi lịch`;
code = code.replace(stateTarget, stateNew);

// 3. Update E-Ticket print button to open modal
const printBtnTarget = /<button onClick=\{\(\) => window\.print\(\)\} style=\{\{ padding: '10px 18px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' \}\}>\s*🖨️ In Vé Điện Tử\s*<\/button>/;
const printBtnNew = `<button onClick={() => setTicketBooking(detailBooking)} style={{ padding: '10px 18px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                                    🖨️ In Vé Điện Tử
                                </button>`;
code = code.replace(printBtnTarget, printBtnNew);

// 4. Add the E-Ticket Modal HTML
const modalTarget = `            {/* MODAL 2: YÊU CẦU HỦY / ĐỔI LỊCH */}`;
const modalNew = `            {/* MODAL 4: E-TICKET DOWNLOAD MODAL */}
            {ticketBooking && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
                    <div style={{ backgroundColor: '#f1f5f9', borderRadius: '24px', width: '800px', maxWidth: '90%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                                🎟️ Vé Điện Tử E-Ticket
                            </h3>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={handleDownloadPDF} style={{ padding: '8px 16px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <i className="fas fa-download"></i> Tải PDF
                                </button>
                                <button onClick={() => setTicketBooking(null)} style={{ background: 'transparent', border: 'none', fontSize: '24px', color: '#64748b', cursor: 'pointer' }}>&times;</button>
                            </div>
                        </div>
                        <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
                            <div id="ticket-content-to-pdf" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {Array.from({ length: ticketBooking.num_people || 1 }).map((_, idx) => (
                                    <div key={idx} className={\`print-modal \${idx > 0 && idx % 2 === 0 ? 'html2pdf__page-break' : ''}\`} style={{ pageBreakInside: 'avoid', breakInside: 'avoid', position: 'relative', background: '#fff', borderRadius: '16px', border: '2px solid #e2e8f0', overflow: 'hidden', display: 'flex', width: '100%', maxWidth: '700px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
                                        <div style={{ width: '200px', padding: '24px', background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>VIET<span style={{ color: '#38bdf8' }}>WAY</span></div>
                                                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Boarding Pass</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '10px', opacity: 0.7, textTransform: 'uppercase' }}>Booking ID</div>
                                                <div style={{ fontSize: '18px', fontWeight: '700', fontFamily: 'monospace' }}>#{ticketBooking.booking_id}</div>
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, padding: '24px 32px', borderRight: '2px dashed #cbd5e1', position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                                <div>
                                                    <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', color: '#0f172a', fontWeight: '800' }}>{ticketBooking.tour_name}</h2>
                                                    <div style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Hành khách: <strong style={{ color: '#0284c7' }}>{getPassengerName(ticketBooking, idx)}</strong></div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Khởi hành</div>
                                                    <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700' }}>{formatDate(ticketBooking.departure_date)}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Kết thúc</div>
                                                    <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '700' }}>{formatDate(ticketBooking.return_date)}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ width: '120px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                                            <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BK\${ticketBooking.booking_id}-P\${idx}\`} alt="QR Code" style={{ width: '80px', height: '80px', marginBottom: '10px' }} />
                                            <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', fontWeight: '600' }}>Quét để<br/>check-in</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: YÊU CẦU HỦY / ĐỔI LỊCH */}`;
code = code.replace(modalTarget, modalNew);

fs.writeFileSync('frontend/src/components/MyBookings.jsx', code, 'utf8');
console.log('E-Ticket modal restored');

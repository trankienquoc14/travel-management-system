const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/Dashboard.jsx', 'utf8');

const newStates = `const [isRequestGroupOpen, setIsRequestGroupOpen] = useState(true);
  const [isTourGroupOpen, setIsTourGroupOpen] = useState(true);
  const [isBookingGroupOpen, setIsBookingGroupOpen] = useState(true);`;

code = code.replace(
  'const [isSalesGroupOpen, setIsSalesGroupOpen] = useState(true);',
  newStates
);

const regex = /\/\*\s*2\. THIẾT KẾ TOUR & BÁN HÀNG \(Nhân viên VP & Admin\)\s*\*\/[\s\S]*?(?=\{\/\*\s*={10,}\s*\*\/}\s*\{\/\*\s*3\. VẬN HÀNH & NGUỒN LỰC TOUR \(Quản lý Tour & Admin\))/;

const newBlock = `/* 2. QUẢN LÝ YÊU CẦU & QUẢN LÝ TOUR & ĐẶT TOUR (Nhân viên VP & Admin) */
              {/* ========================================================= */}
              {(isOfficeStaff || isAdmin) && (
                <>
                  {/* QUẢN LÝ YÊU CẦU */}
                  <li 
                    onClick={() => setIsRequestGroupOpen(!isRequestGroupOpen)}
                    style={{ 
                      cursor: 'pointer', 
                      background: '#f8fafc', 
                      padding: '10px 14px', 
                      fontSize: '12px', 
                      fontWeight: '800', 
                      color: '#1e293b', 
                      textTransform: 'uppercase', 
                      display: 'flex', 
                      justify: 'space-between', 
                      alignItems: 'center',
                      borderRadius: '8px',
                      marginTop: '12px',
                      marginBottom: '4px',
                      borderLeft: '4px solid #f59e0b'
                    }}
                  >
                    <span>📦 QUẢN LÝ YÊU CẦU</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>{isRequestGroupOpen ? '▲' : '▼'}</span>
                  </li>
                  {isRequestGroupOpen && (
                    <>
                      <li className={activeTab === 'tour_requests_pending' ? 'active' : ''} onClick={() => setActiveTab('tour_requests_pending')}>
                        ⏳ Yêu cầu chờ báo giá
                      </li>
                      <li className={activeTab === 'tour_requests_revision' ? 'active' : ''} onClick={() => setActiveTab('tour_requests_revision')}>
                        ✏️ Yêu cầu cần chỉnh sửa
                      </li>
                      <li className={activeTab === 'tour_requests' ? 'active' : ''} onClick={() => setActiveTab('tour_requests')}>
                        🛎️ Thiết kế tour theo yêu cầu
                      </li>
                    </>
                  )}

                  {/* QUẢN LÝ TOUR */}
                  <li 
                    onClick={() => setIsTourGroupOpen(!isTourGroupOpen)}
                    style={{ 
                      cursor: 'pointer', 
                      background: '#f8fafc', 
                      padding: '10px 14px', 
                      fontSize: '12px', 
                      fontWeight: '800', 
                      color: '#1e293b', 
                      textTransform: 'uppercase', 
                      display: 'flex', 
                      justify: 'space-between', 
                      alignItems: 'center',
                      borderRadius: '8px',
                      marginTop: '12px',
                      marginBottom: '4px',
                      borderLeft: '4px solid #10b981'
                    }}
                  >
                    <span>🏷️ QUẢN LÝ TOUR</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>{isTourGroupOpen ? '▲' : '▼'}</span>
                  </li>
                  {isTourGroupOpen && (
                    <>
                      <li className={activeTab === 'fixed_tours' ? 'active' : ''} onClick={() => setActiveTab('fixed_tours')}>
                        ➕ Tạo tour cố định mới
                      </li>
                      <li className={activeTab === 'approved_tours' ? 'active' : ''} onClick={() => setActiveTab('approved_tours')}>
                        📋 Tour đã thiết kế
                      </li>
                    </>
                  )}

                  {/* QUẢN LÝ ĐẶT TOUR */}
                  <li 
                    onClick={() => setIsBookingGroupOpen(!isBookingGroupOpen)}
                    style={{ 
                      cursor: 'pointer', 
                      background: '#f8fafc', 
                      padding: '10px 14px', 
                      fontSize: '12px', 
                      fontWeight: '800', 
                      color: '#1e293b', 
                      textTransform: 'uppercase', 
                      display: 'flex', 
                      justify: 'space-between', 
                      alignItems: 'center',
                      borderRadius: '8px',
                      marginTop: '12px',
                      marginBottom: '4px',
                      borderLeft: '4px solid #3b82f6'
                    }}
                  >
                    <span>💳 QUẢN LÝ ĐẶT TOUR</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>{isBookingGroupOpen ? '▲' : '▼'}</span>
                  </li>
                  {isBookingGroupOpen && (
                    <>
                      <li className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
                        🛒 Quản Lý Booking Tour
                      </li>
                      <li className={activeTab === 'payments' ? 'active' : ''} onClick={() => setActiveTab('payments')}>
                        💳 Xác Nhận Thanh Toán
                      </li>
                      <li className={activeTab === 'change_request' ? 'active' : ''} onClick={() => setActiveTab('change_request')}>
                        🔄 Xử Lý Hủy / Đổi Lịch
                      </li>
                      <li className={activeTab === 'hr_customers' ? 'active' : ''} onClick={() => setActiveTab('hr_customers')}>
                        👥 Quản lý Khách hàng
                      </li>
                    </>
                  )}
                </>
              )}

`;

code = code.replace(regex, newBlock);

fs.writeFileSync('frontend/src/components/Dashboard.jsx', code, 'utf8');
console.log('Done reorganizing sidebar');

const fs = require('fs');
let c = fs.readFileSync('frontend/src/components/Dashboard.jsx', 'utf8');

// Add imports
if (!c.includes('StaffVehicleManagement')) {
  c = c.replace("import DriverWorkspace from './DriverWorkspace';", "import DriverWorkspace from './DriverWorkspace';\nimport StaffVehicleManagement from './StaffVehicleManagement';\nimport StaffVehicleIncidents from './StaffVehicleIncidents';\nimport StaffVehicleHistory from './StaffVehicleHistory';");
}

// Add state
if (!c.includes('isOfficeStaffVehicleGroupOpen')) {
  c = c.replace("const [isBookingGroupOpen, setIsBookingGroupOpen] = useState(false);", "const [isBookingGroupOpen, setIsBookingGroupOpen] = useState(false);\n  const [isOfficeStaffVehicleGroupOpen, setIsOfficeStaffVehicleGroupOpen] = useState(false);");
}

// Add sidebar menu under Office Staff
const menuToAdd = `
                  {/* QUẢN LÝ XE (Office Staff) */}
                  <li 
                    onClick={() => setIsOfficeStaffVehicleGroupOpen(!isOfficeStaffVehicleGroupOpen)}
                    style={{ 
                      cursor: 'pointer', 
                      background: '#f8fafc', 
                      padding: '10px 14px', 
                      fontSize: '12px', 
                      fontWeight: '800', 
                      color: '#1e293b', 
                      textTransform: 'uppercase', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      borderRadius: '8px',
                      marginTop: '12px',
                      marginBottom: '4px',
                      borderLeft: '4px solid #0194f3'
                    }}
                  >
                    <span>⚙️ VẬN HÀNH & NGUỒN LỰC</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>{isOfficeStaffVehicleGroupOpen ? '▲' : '▼'}</span>
                  </li>
                  {isOfficeStaffVehicleGroupOpen && (
                    <>
                      <li className={activeTab === 'staff_fleet_vehicles' ? 'active' : ''} onClick={() => setActiveTab('staff_fleet_vehicles')}>
                        🚌 Quản lý xe
                      </li>
                      <li className={activeTab === 'staff_vehicle_incidents' ? 'active' : ''} onClick={() => setActiveTab('staff_vehicle_incidents')}>
                        ⚠️ Báo cáo sự cố xe
                      </li>
                      <li className={activeTab === 'staff_vehicle_history' ? 'active' : ''} onClick={() => setActiveTab('staff_vehicle_history')}>
                        📜 Lịch sử xe
                      </li>
                    </>
                  )}
`;

if (!c.includes('isOfficeStaffVehicleGroupOpen && (')) {
  c = c.replace("{/* QUẢN LÝ ĐẶT TOUR */}", menuToAdd + "\n                  {/* QUẢN LÝ ĐẶT TOUR */}");
}

// Add tab rendering
const contentToAdd = `
          {activeTab === 'staff_fleet_vehicles' && (isOfficeStaff || isAdmin) && <StaffVehicleManagement />}
          {activeTab === 'staff_vehicle_incidents' && (isOfficeStaff || isAdmin) && <StaffVehicleIncidents />}
          {activeTab === 'staff_vehicle_history' && (isOfficeStaff || isAdmin) && <StaffVehicleHistory />}
`;

if (!c.includes('<StaffVehicleManagement />')) {
  c = c.replace("{activeTab === 'hr_customers' && (isOfficeStaff || isAdmin) && <HRCustomerManagement />}", "{activeTab === 'hr_customers' && (isOfficeStaff || isAdmin) && <HRCustomerManagement />}\n" + contentToAdd);
}

fs.writeFileSync('frontend/src/components/Dashboard.jsx', c);
console.log("Patched Dashboard.jsx");

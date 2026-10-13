const fs = require('fs');

let c = fs.readFileSync('frontend/src/components/VehicleFleetManagement.jsx', 'utf8');

c = c.replace(
  `onClick={() => { setSelectedVehicle(v); setShowMaintModal(true); }}\n                            style={{ ...styles.btnSmall, backgroundColor: '#f59e0b', color: '#fff' }}\n                          >\n                            Xem tình trạng`,
  `onClick={() => { setSelectedVehicle(v); fetchHistory(v.vehicle_id); setShowMaintModal(true); }}\n                            style={{ ...styles.btnSmall, backgroundColor: '#64748b', color: '#fff' }}\n                          >\n                            Xem tình trạng`
);

fs.writeFileSync('frontend/src/components/VehicleFleetManagement.jsx', c);
console.log("Updated onClick and color for Xem tình trạng button.");

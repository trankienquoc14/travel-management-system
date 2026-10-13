const fs = require('fs');

let content = fs.readFileSync('routes/tourRoutes.js', 'utf8');

const newRoutes = `

// ==========================================
// OFFICE STAFF VEHICLE FUNCTIONS
// ==========================================
router.put('/fleet/staff/vehicles/:id/status', protect, restrictTo(1, 4), vehicleController.updateVehicleStatusStaff);
router.get('/fleet/staff/incidents', protect, restrictTo(1, 4), vehicleController.getDriverIncidentsStaff);
router.put('/fleet/staff/incidents/:id', protect, restrictTo(1, 4), vehicleController.updateDriverIncidentStaff);
router.get('/fleet/staff/vehicles/:id/history', protect, restrictTo(1, 4), vehicleController.getVehicleHistoryStaff);

`;

if (!content.includes('/fleet/staff/vehicles/:id/status')) {
  // Find where vehicleController routes end
  content = content.replace("router.get('/fleet/driver-assigned', protect, vehicleController.getDriverAssignedTours);", "router.get('/fleet/driver-assigned', protect, vehicleController.getDriverAssignedTours);\n" + newRoutes);
  fs.writeFileSync('routes/tourRoutes.js', content);
  console.log("Routes updated");
} else {
  console.log("Routes already exist");
}

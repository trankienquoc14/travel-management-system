const fs = require('fs');
let c = fs.readFileSync('microservices/tour-service/routes/tourRoutes.js', 'utf8');
c = c.replace(
  "router.get('/fleet/staff/vehicles/:id/history', protect, restrictTo(1, 4), vehicleController.getVehicleHistoryStaff);",
  "router.get('/fleet/staff/vehicles/:id/history', protect, restrictTo(1, 3, 4), vehicleController.getVehicleHistoryStaff);"
);
fs.writeFileSync('microservices/tour-service/routes/tourRoutes.js', c);
console.log('Routes updated');

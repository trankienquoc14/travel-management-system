const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Cấu hình lưu trữ ảnh kê khai chi phí & báo cáo sự cố xe vào thư mục chia sẻ
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../shared-uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'driver-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Tất cả các tuyến đường của Tài xế đều bảo vệ bằng JWT Token
router.get('/all-drivers', protect, driverController.getAllDriversList);
router.get('/work', protect, driverController.getAssignedTrips);
router.get('/tours/:tourId/itinerary', protect, driverController.getTripItinerary);
router.put('/departures/:departureId/status', protect, driverController.updateTripStatus);

// Chi phí chuyến đi (xăng dầu, cầu đường, đỗ xe)
router.get('/departures/:departureId/expenses', protect, driverController.getTripExpenses);
router.post('/expenses', protect, upload.single('receipt_image'), driverController.createTripExpense);

// Sự cố & bảo dưỡng xe
router.get('/departures/:departureId/incidents', protect, driverController.getVehicleIncidents);
router.post('/incidents', protect, upload.single('image'), driverController.reportVehicleIncident);

module.exports = router;

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
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Tối đa 5MB theo đặc tả
});

// Middleware xử lý lỗi upload vượt quá 5MB
const handleExpenseUpload = (req, res, next) => {
  upload.single('receipt_image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error_code: 'FILE_TOO_LARGE',
          message: 'Kích thước ảnh hóa đơn tối đa 5MB'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Lỗi tải ảnh hóa đơn/chứng từ'
      });
    }
    next();
  });
};

// Tất cả các tuyến đường của Tài xế đều bảo vệ bằng JWT Token
router.get('/all-drivers', protect, driverController.getAllDriversList);
router.get('/work', protect, driverController.getAssignedTrips);
router.get('/departures/:departureId/passengers', protect, driverController.getDeparturePassengers);
router.get('/tours/:tourId/itinerary', protect, driverController.getTripItinerary);
router.put('/departures/:departureId/status', protect, driverController.updateTripStatus);

// Chi phí chuyến đi (xăng dầu, cầu đường, đỗ xe, rửa xe, sửa chữa...)
router.get('/departures/:departureId/expenses', protect, driverController.getTripExpenses);
router.post('/expenses', protect, handleExpenseUpload, driverController.createTripExpense);

// Sự cố & bảo dưỡng xe
router.get('/departures/:departureId/incidents', protect, driverController.getVehicleIncidents);
router.post('/incidents', protect, upload.single('image'), driverController.reportVehicleIncident);

module.exports = router;

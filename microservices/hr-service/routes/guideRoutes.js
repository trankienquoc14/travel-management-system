const express = require('express');
const router = express.Router();
const guideController = require('../controllers/guideController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Cấu hình lưu trữ tệp tin ảnh sự cố vào thư mục chia sẻ shared-uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../shared-uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'incident-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Tất cả các tuyến đường của Hướng dẫn viên đều cần có JWT Token
router.get('/work', protect, guideController.getAssignedWork);
router.get('/departures/:departureId/passengers', protect, guideController.getDeparturePassengers);
router.post('/passengers/:passengerId/checkin', protect, guideController.checkinPassenger);
router.put('/departures/:departureId/status', protect, guideController.updateDepartureStatus);

// Hỗ trợ upload ảnh báo cáo sự cố
router.post('/incidents', protect, upload.single('image'), guideController.reportIncident);

router.get('/departures/:departureId/incidents', protect, guideController.getDepartureIncidents);
router.get('/tours/:tourId/itinerary', protect, guideController.getTourItinerary);
router.get('/profile', protect, guideController.getGuideProfile);

// Hỗ trợ cập nhật hành trình liên tục (Live Trip Updates)
router.get('/departures/:departureId/updates', protect, guideController.getDepartureUpdates);
router.post('/departures/:departureId/updates', protect, upload.single('image'), guideController.createDepartureUpdate);

// Hỗ trợ cập nhật giải quyết sự cố
router.put('/incidents/:id', protect, guideController.updateIncidentStatus);

module.exports = router;


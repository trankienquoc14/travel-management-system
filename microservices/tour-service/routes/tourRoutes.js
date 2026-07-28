const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// === CẤU HÌNH MULTER ĐỂ LƯU ẢNH UPLOAD ===
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../shared-uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 1. CÁC ROUTE KHÁCH HÀNG (PUBLIC API)
router.get('/', tourController.getAllTours);
router.get('/:id', tourController.getTourById);

// 2. CÁC ROUTE QUẢN LÝ VẬN HÀNH (Chỉ Staff, Manager, Admin)
router.post('/design', protect, restrictTo(1, 3, 4), upload.single('image'), tourController.saveFixedTourDesign);

// --- STAFF ROUTES (RBAC Protected) ---
router.get('/staff/tours', protect, restrictTo(1, 3, 4), tourController.getAllFixedTours);
router.post('/staff/tours', protect, restrictTo(1, 3, 4), upload.single('image'), tourController.saveFixedTourDesign);
router.put('/staff/tours/:id/status', protect, restrictTo(1, 3), tourController.updateTourStatus);
router.get('/staff/tours/:id', protect, restrictTo(1, 3, 4), tourController.getFixedTourById);
router.get('/staff/destination-resources', protect, restrictTo(1, 3, 4), tourController.getDestinationResources);

// Lấy chi tiết lịch trình vận hành
router.get('/admin/:id', protect, restrictTo(1, 3), tourController.getTourOperationalDetail);
router.post('/admin/save', protect, restrictTo(1, 3), upload.single('image'), tourController.saveTourOperationalSchedule);

if (tourController.createTour) {
    router.post('/', protect, restrictTo(1, 3, 4), upload.single('image'), tourController.createTour);
}
if (tourController.updateTour) {
    router.put('/:id', protect, restrictTo(1, 3, 4), upload.single('image'), tourController.updateTour);
}

router.delete('/:id', protect, restrictTo(1, 3), tourController.deleteTour);

// === QUẢN LÝ SỰ CỐ TOUR (Dành cho Quản lý Tour & Admin) ===
router.get('/incidents/all', protect, restrictTo(1, 3), tourController.getAllIncidents);
router.put('/incidents/:id/status', protect, restrictTo(1, 3), tourController.updateIncidentStatus);
router.put('/admin/status/:id', protect, restrictTo(1, 3), tourController.updateTourStatus);
router.put('/admin/price/:id', protect, restrictTo(1, 3), tourController.updateTourPrice);

module.exports = router;
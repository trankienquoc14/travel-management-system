const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const { protect } = require('../middleware/authMiddleware');

// === CẤU HÌNH MULTER ĐỂ LƯU ẢNH UPLOAD ===
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Lưu vào thư mục uploads
    },
    filename: function (req, file, cb) {
        // Đổi tên file: Thời gian hiện tại + đuôi ảnh gốc (vd: 1689234123-tour.png)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
// ==========================================

router.get('/', tourController.getAllTours);
router.get('/:id', tourController.getTourById);

// Thêm middleware upload.single('image') vào trước Controller
router.post('/', protect, upload.single('image'), tourController.createTour);
router.put('/:id', protect, upload.single('image'), tourController.updateTour);

router.delete('/:id', protect, tourController.deleteTour);

// === QUẢN LÝ SỰ CỐ TOUR (Dành cho Quản lý Tour & Admin) ===
router.get('/incidents/all', protect, tourController.getAllIncidents);
router.put('/incidents/:id/status', protect, tourController.updateIncidentStatus);

module.exports = router;
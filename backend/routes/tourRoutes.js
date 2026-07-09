const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const { protect } = require('../middleware/authMiddleware');

// === CẤU HÌNH MULTER ĐỂ LƯU ẢNH UPLOAD (TỪ CODE CŨ CỦA BẠN) ===
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tự động tạo thư mục uploads nếu trong máy chưa có (Tránh lỗi ENOENT)
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

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
// ==============================================================

// 1. CÁC ROUTE KHÁCH HÀNG (PUBLIC API)
router.get('/', tourController.getAllTours);
router.get('/:id', tourController.getTourById);

// 2. CÁC ROUTE QUẢN LÝ VẬN HÀNH NÂNG CẤP (MỚI)
// Lấy chi tiết lịch trình vận hành để vào form 3 Tab
router.get('/admin/:id', protect, tourController.getTourOperationalDetail);

// Tạo mới hoặc cập nhật Tour + Lịch trình từng ngày + Đợt khởi hành
router.post('/admin/save', protect, upload.single('image'), tourController.saveTourOperationalSchedule);

// 3. CÁC ROUTE CŨ (GIỮ LẠI AN TOÀN ĐỂ TƯƠNG THÍCH FORM CŨ)
if (tourController.createTour) {
    router.post('/', protect, upload.single('image'), tourController.createTour);
}
if (tourController.updateTour) {
    router.put('/:id', protect, upload.single('image'), tourController.updateTour);
}

// Xóa tour
router.delete('/:id', protect, tourController.deleteTour);

// === QUẢN LÝ SỰ CỐ TOUR (Dành cho Quản lý Tour & Admin) ===
router.get('/incidents/all', protect, tourController.getAllIncidents);
router.put('/incidents/:id/status', protect, tourController.updateIncidentStatus);
// Route dùng để Quản lý duyệt/từ chối Tour Cố định
router.put('/admin/status/:id', protect, tourController.updateTourStatus);

module.exports = router;
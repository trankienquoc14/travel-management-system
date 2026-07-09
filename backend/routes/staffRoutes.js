const express = require('express');
const router = express.Router();
const multer = require('multer'); // BẮT BUỘC PHẢI THÊM THƯ VIỆN NÀY

// Cấu hình thư mục lưu ảnh upload
const upload = multer({ dest: 'uploads/' });

const staffController = require('../controllers/staffController');
const { protect } = require('../middleware/authMiddleware');

// 1. Lấy danh sách tour của nhân viên
router.get('/tours', staffController.getAllFixedTours);

// 2. Nhân viên lưu/thiết kế tour (PHẢI CÓ upload.single('image') Ở GIỮA)
router.post('/tours/save', protect, upload.single('image'), staffController.saveFixedTourDesign);

// 3. Nhân viên xem chi tiết 1 tour để sửa
router.get('/tours/:id', protect, staffController.getFixedTourById);

// 4. Route lấy kho địa điểm
router.get('/destination-resources', protect, staffController.getDestinationResources);
router.get('/destinations', staffController.getAllDestinations);

module.exports = router;
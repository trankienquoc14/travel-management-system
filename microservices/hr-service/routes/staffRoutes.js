const express = require('express');
const router = express.Router();
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

const staffController = require('../controllers/staffController');
const guideController = require('../controllers/guideController');
const { protect } = require('../middleware/authMiddleware');

// 1. Lấy danh sách tour của nhân viên
router.get('/tours', staffController.getAllFixedTours);

// 3. Nhân viên xem chi tiết 1 tour để sửa
router.get('/tours/:id', protect, staffController.getFixedTourById);

// 4. Route lấy kho địa điểm
router.get('/destination-resources', protect, staffController.getDestinationResources);
router.get('/destinations', staffController.getAllDestinations);

// 5. Giải quyết sự cố từ phía Quản lý / Staff
router.put('/incidents/:id', protect, guideController.updateIncidentStatus);

module.exports = router;
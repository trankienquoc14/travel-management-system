const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// Route Đăng nhập
router.post('/login', authController.login);

// Routes Hồ sơ cá nhân (Dành cho tất cả các tài khoản)
router.get('/me', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);

module.exports = router;
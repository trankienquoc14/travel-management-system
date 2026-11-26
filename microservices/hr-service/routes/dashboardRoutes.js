const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // Dùng khiên bảo vệ

router.get('/stats', protect, restrictTo(1, 2, 3, 4), dashboardController.getDashboardStats);

module.exports = router;
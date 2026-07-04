const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware'); // Dùng khiên bảo vệ

router.get('/stats', protect, dashboardController.getDashboardStats);

module.exports = router;
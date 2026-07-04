const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');

// Khách hàng không cần đăng nhập cũng có thể xem danh sách điểm đến
router.get('/', destinationController.getAllDestinations);

module.exports = router;
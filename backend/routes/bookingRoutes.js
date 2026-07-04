const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware'); // Bắt buộc đăng nhập mới được đặt

router.post('/', protect, bookingController.createBooking);
router.get('/my-bookings', protect, bookingController.getMyBookings);

module.exports = router;
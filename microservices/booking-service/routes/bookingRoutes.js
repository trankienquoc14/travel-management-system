const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware'); // Bắt buộc đăng nhập mới được đặt

router.post('/', protect, bookingController.createBooking);
router.get('/my-bookings', protect, bookingController.getMyBookings);
router.post('/:bookingId/setup-payment', protect, bookingController.initiatePayment);
router.put('/:bookingId/pay', protect, bookingController.confirmPayment);
router.get('/admin/payments', protect, bookingController.getAllPayments);
router.put('/:bookingId/confirm-cash', protect, bookingController.confirmCashByStaff);

module.exports = router;
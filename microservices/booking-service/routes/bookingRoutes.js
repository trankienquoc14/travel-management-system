const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, bookingController.createBooking);
router.get('/my-bookings', protect, bookingController.getMyBookings);
router.post('/:bookingId/setup-payment', protect, bookingController.initiatePayment);
router.put('/:bookingId/pay', protect, bookingController.confirmPayment);
router.put('/:bookingId/payment-status', protect, bookingController.confirmPayment);
router.get('/admin/payments', protect, bookingController.getAllPayments);
router.put('/:bookingId/confirm-cash', protect, bookingController.confirmCashByStaff);

// Quản lý tất cả Booking dành cho Nhân viên / Admin
router.get('/admin/all-bookings', protect, bookingController.getAllBookings);
router.put('/admin/bookings/:bookingId/status', protect, bookingController.updateBookingStatus);

// Quản lý yêu cầu Hủy / Đổi lịch
router.post('/change-requests', protect, bookingController.createChangeRequest);
router.get('/admin/change-requests', protect, bookingController.getAllChangeRequests);
router.put('/admin/change-requests/:id/process', protect, bookingController.processChangeRequest);

module.exports = router;
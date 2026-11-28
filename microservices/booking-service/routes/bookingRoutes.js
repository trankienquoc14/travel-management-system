const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.post('/', protect, bookingController.createBooking);
router.get('/my-bookings', protect, bookingController.getMyBookings);

// Tích hợp SePay Realtime (VietQR + Ngân hàng liên kết + Webhook + API Polling)
router.post('/sepay-webhook', bookingController.sepayWebhook);
router.get('/:bookingId/sepay-qr', protect, bookingController.getSepayPaymentInfo);
router.get('/:bookingId/check-sepay', protect, bookingController.checkSepayPaymentStatus);
router.put('/:bookingId/cancel-expired', protect, bookingController.cancelExpiredBooking);

// Endpoint kiểm tra kết nối & chẩn đoán gửi Email trực tiếp
router.get('/test-email', protect, restrictTo(1, 2, 3), bookingController.testEmailDiagnostic);

router.post('/:bookingId/setup-payment', protect, bookingController.initiatePayment);
router.put('/:bookingId/pay', protect, bookingController.confirmPayment);
router.put('/:bookingId/payment-status', protect, bookingController.confirmPayment);
router.get('/admin/payments', protect, restrictTo(1, 2, 3, 4), bookingController.getAllPayments);
router.put('/:bookingId/confirm-cash', protect, restrictTo(1, 2, 3, 4), bookingController.confirmCashByStaff);
router.put('/:bookingId/confirm-refund', protect, restrictTo(1, 2, 3, 4), bookingController.confirmRefundByStaff);
router.post('/:bookingId/resend-email', protect, bookingController.resendBookingEmail);

// Quản lý tất cả Booking dành cho Nhân viên / Admin
router.get('/admin/staff-dashboard-stats', protect, restrictTo(1, 2, 3, 4), bookingController.getStaffDashboardStats);
router.get('/admin/all-bookings', protect, restrictTo(1, 2, 3, 4), bookingController.getAllBookings);
router.put('/admin/bookings/:bookingId/status', protect, restrictTo(1, 2, 3, 4), bookingController.updateBookingStatus);

// Quản lý yêu cầu Hủy / Đổi lịch
router.post('/change-requests', protect, bookingController.createChangeRequest);
router.post('/change-request', protect, bookingController.createChangeRequest);
router.get('/admin/change-requests', protect, restrictTo(1, 2, 3, 4), bookingController.getAllChangeRequests);
router.put('/admin/change-requests/:id/process', protect, restrictTo(1, 2, 3, 4), bookingController.processChangeRequest);
router.get('/:bookingId/reschedule-qr', protect, bookingController.getReschedulePaymentInfo);
router.get('/:bookingId/check-reschedule-sepay', protect, bookingController.checkReschedulePaymentStatus);

// Quản lý Đặt Dịch Vụ (Standalone Services)
router.post('/service', protect, bookingController.bookStandaloneService);
router.get('/my-services', protect, bookingController.getMyServiceBookings);
router.get('/admin/all-services', protect, restrictTo(1, 2, 3, 4), bookingController.getAllServiceBookingsAdmin);
router.put('/admin/services/:id/confirm', protect, restrictTo(1, 2, 3, 4), bookingController.confirmServiceBooking);
router.post('/admin/services/:id/forward-to-partner', protect, restrictTo(1, 2, 3, 4), bookingController.forwardToPartner);

// Dành cho Đối tác (Partner Portal)
router.get('/partner/requests', protect, restrictTo(1, 2, 3, 4, 5), bookingController.getPartnerRequests);
router.put('/partner/requests/:id/status', protect, restrictTo(1, 2, 3, 4, 5), bookingController.updatePartnerRequestStatus);

// =========================================================================
// THÔNG BÁO QUẢN TRỊ & KHÓA TOUR TRƯỚC 30 NGÀY CHO NHÂN VIÊN (REALTIME)
// =========================================================================
router.get('/staff-notifications', protect, bookingController.getStaffNotifications);
router.put('/staff-notifications/read-all', protect, bookingController.markAllNotificationsAsRead);
router.put('/staff-notifications/:id/read', protect, bookingController.markNotificationAsRead);
router.delete('/staff-notifications/:id', protect, bookingController.deleteNotification);

// =========================================================================
// THÔNG BÁO DÀNH CHO KHÁCH HÀNG (CUSTOMER NOTIFICATIONS REALTIME)
// =========================================================================
router.get('/customer-notifications', protect, bookingController.getMyNotifications);
router.put('/customer-notifications/read-all', protect, bookingController.markAllCustomerNotificationsAsRead);
router.put('/customer-notifications/:id/read', protect, bookingController.markCustomerNotificationAsRead);

module.exports = router;
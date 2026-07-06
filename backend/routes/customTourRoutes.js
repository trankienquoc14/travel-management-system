// routes/customTourRoutes.js
const express = require('express');
const router = express.Router();
const customTourController = require('../controllers/customTourController');
const { protect } = require('../middleware/authMiddleware'); // Đảm bảo bạn đã import

// Route dành cho Khách hàng
router.post('/request', protect, customTourController.createCustomRequest);
// Phải thêm dòng này vào NHỮNG DÒNG ĐẦU TIÊN (Trước các route có /:id)
router.get('/requests/pending/staff', protect, customTourController.getStaffPendingTours);
// Đặt cùng chỗ với các route API khác
router.put('/requests/:id/customer-action', customTourController.updateCustomerAction);
router.post('/quotes/:quoteId/book', protect, customTourController.bookCustomTourQuote);

// Route dành cho Nhân viên/Quản lý (Cần thêm middleware kiểm tra quyền Admin/Staff nếu có)
router.get('/requests', protect, customTourController.getAllRequests);
router.put('/requests/:id/quote', protect, customTourController.quoteRequest);
router.put('/requests/:id/approve', protect, customTourController.approveRequest);
router.put('/requests/:id/reject', protect, customTourController.rejectRequest);
router.post('/requests/:id/send-notification', protect, customTourController.sendNotification);
router.get('/services/:destination', customTourController.getDestinationExtraServices);
router.get('/requests/customer/:customerId', protect, customTourController.getCustomerRequests);
router.post('/quotes/:quoteId/book', protect, customTourController.bookCustomTourQuote);

module.exports = router;
const express = require('express');
const router = express.Router();
const customTourController = require('../controllers/customTourController');
const { protect } = require('../middleware/authMiddleware');

// Route dành cho Khách hàng
router.post('/request', protect, customTourController.createCustomRequest);
router.get('/requests/pending/staff', protect, customTourController.getStaffPendingTours);
router.put('/requests/:id/customer-action', customTourController.updateCustomerAction);
router.put('/requests/:id/accept', protect, (req, res, next) => {
  req.body.action = 'Accept';
  return customTourController.updateCustomerAction(req, res, next);
});
router.post('/quotes/:quoteId/respond', protect, customTourController.updateCustomerAction);
router.post('/quotes/:quoteId/book', protect, customTourController.bookCustomTourQuote);
router.get('/my-quotes', protect, customTourController.getAllRequests);

// Alias route cho Quotation creation từ test/API
router.post('/quote', protect, (req, res, next) => {
  req.params.id = req.body.request_id;
  req.body.quoted_price = req.body.total_amount;
  req.body.staff_note = req.body.quote_details;
  return customTourController.quoteRequest(req, res, next);
});

// Route dành cho Nhân viên/Quản lý
router.get('/requests', protect, customTourController.getAllRequests);
router.put('/requests/:id/quote', protect, customTourController.quoteRequest);
router.put('/requests/:id/approve', protect, customTourController.approveRequest);
router.put('/requests/:id/reject', protect, customTourController.rejectRequest);
router.post('/requests/:id/send-notification', protect, customTourController.sendNotification);
router.get('/services/:destination', customTourController.getDestinationExtraServices);
router.get('/requests/customer/:customerId', protect, customTourController.getCustomerRequests);

// --- NEW WORKFLOW ROUTES ---
router.post('/requests/:id/initial-quote', protect, customTourController.sendInitialQuote);
router.put('/requests/:id/start-design', protect, customTourController.startDesigning);
router.post('/requests/:id/submit-manager', protect, customTourController.submitToManager);
router.post('/quotes/:quoteId/manager-review', protect, customTourController.managerReview);
router.post('/quotes/:quoteId/send-to-customer', protect, customTourController.sendToCustomer);

module.exports = router;

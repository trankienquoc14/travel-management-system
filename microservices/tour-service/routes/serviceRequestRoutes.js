const express = require('express');
const router = express.Router();
const serviceRequestController = require('../controllers/serviceRequestController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.get('/groups', protect, restrictTo(1, 2, 3, 4), serviceRequestController.getGroups);
router.get('/groups/:id', protect, restrictTo(1, 2, 3, 4), serviceRequestController.getGroupById);
router.post('/groups', protect, restrictTo(1, 2, 3, 4), serviceRequestController.createGroup);
router.post('/groups/:id/supplement', protect, restrictTo(1, 2, 3, 4), serviceRequestController.createSupplement);


router.get('/partner/my-requests', protect, serviceRequestController.getMyPartnerRequests);
router.get('/partner/my-summary', protect, serviceRequestController.getPartnerSummary);
router.post('/partner/:id/accept', protect, serviceRequestController.acceptRequest);
router.post('/partner/:id/reject', protect, serviceRequestController.rejectRequest);

module.exports = router;


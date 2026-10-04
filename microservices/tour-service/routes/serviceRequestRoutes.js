const express = require('express');
const router = express.Router();
const serviceRequestController = require('../controllers/serviceRequestController');
const { protect } = require('../middleware/authMiddleware');

router.get('/groups', protect, serviceRequestController.getGroups);
router.get('/groups/:id', protect, serviceRequestController.getGroupById);
router.post('/groups', protect, serviceRequestController.createGroup);
router.post('/groups/:id/supplement', protect, serviceRequestController.createSupplement);


router.get('/partner/my-requests', protect, serviceRequestController.getMyPartnerRequests);
router.get('/partner/my-summary', protect, serviceRequestController.getPartnerSummary);
router.post('/partner/:id/accept', protect, serviceRequestController.acceptRequest);
router.post('/partner/:id/reject', protect, serviceRequestController.rejectRequest);

module.exports = router;


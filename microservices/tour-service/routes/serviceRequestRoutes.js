const express = require('express');
const router = express.Router();
const serviceRequestController = require('../controllers/serviceRequestController');
const { protect } = require('../middleware/authMiddleware');

router.get('/groups', protect, serviceRequestController.getGroups);
router.get('/groups/:id', protect, serviceRequestController.getGroupById);
router.post('/groups', protect, serviceRequestController.createGroup);
router.post('/groups/:id/supplement', protect, serviceRequestController.createSupplement);

module.exports = router;

const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hrController');
const { protect } = require('../middleware/authMiddleware');

// Các tuyến đường quản lý nhân sự
router.get('/employees', protect, hrController.getAllEmployees);
router.post('/employees', protect, hrController.createEmployee);
router.put('/employees/:id', protect, hrController.updateEmployee);
router.delete('/employees/:id', protect, hrController.deleteEmployee);

router.get('/performance', protect, hrController.getAllPerformanceReviews);
router.post('/performance', protect, hrController.createPerformanceReview);

// Các tuyến đường quản lý khách hàng
router.get('/customers', protect, hrController.getAllCustomers);
router.post('/customers', protect, hrController.createCustomer);
router.put('/customers/:id', protect, hrController.updateCustomer);
router.delete('/customers/:id', protect, hrController.deleteCustomer);

module.exports = router;

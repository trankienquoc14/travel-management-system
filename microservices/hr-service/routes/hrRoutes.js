const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hrController');
const guideController = require('../controllers/guideController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Các tuyến đường quản lý nhân sự (Admin [1], HR Manager [2], Tour Manager [3])
router.get('/employees', protect, restrictTo(1, 2, 3), hrController.getAllEmployees);
router.post('/employees', protect, restrictTo(1, 2), hrController.createEmployee);
router.put('/employees/:id', protect, restrictTo(1, 2), hrController.updateEmployee);
router.delete('/employees/:id', protect, restrictTo(1, 2), hrController.deleteEmployee);
router.get('/employees/:id/tour-stats', protect, restrictTo(1, 2), hrController.getEmployeeTourStats);

router.get('/performance', protect, restrictTo(1, 2), hrController.getAllPerformanceReviews);
router.post('/performance', protect, restrictTo(1, 2), hrController.createPerformanceReview);

// Các tuyến đường quản lý khách hàng (Admin [1], HR Manager [2], Office Staff [4])
router.get('/customers', protect, restrictTo(1, 2, 4), hrController.getAllCustomers);
router.post('/customers', protect, restrictTo(1, 2, 4), hrController.createCustomer);
router.put('/customers/:id', protect, restrictTo(1, 2, 4), hrController.updateCustomer);
router.delete('/customers/:id', protect, restrictTo(1, 2, 4), hrController.deleteCustomer);

// Các tuyến đường chấm công nhân sự (Admin [1] & HR Manager [2])
router.get('/attendance', protect, restrictTo(1, 2), hrController.getAttendance);
router.post('/attendance', protect, restrictTo(1, 2), hrController.updateAttendance);
router.get('/attendance/history', protect, restrictTo(1, 2), hrController.getAttendanceHistory);

// Các tuyến đường tính lương nhân sự (Admin [1] & HR Manager [2])
router.get('/payroll', protect, restrictTo(1, 2), hrController.getPayroll);
router.post('/payroll', protect, restrictTo(1, 2), hrController.savePayroll);

// Route xử lý giải quyết sự cố (Tour Manager [3] & Admin [1])
router.put('/incidents/:id', protect, restrictTo(1, 3), guideController.updateIncidentStatus);

module.exports = router;

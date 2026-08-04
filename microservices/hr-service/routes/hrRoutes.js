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

// Tuyến đường điểm danh / Chấm công GPS Realtime dành cho TOÀN BỘ nhân sự (trừ Khách hàng)
router.post('/attendance/gps-checkin', protect, hrController.gpsCheckIn);
router.get('/attendance/my-status', protect, hrController.getMyAttendanceStatus);

// Các tuyến đường chấm công nhân sự
router.get('/attendance/history', protect, hrController.getAttendanceHistory);
router.get('/attendance', protect, restrictTo(1, 2), hrController.getAttendance);
router.post('/attendance', protect, restrictTo(1, 2), hrController.updateAttendance);

// Các tuyến đường tính lương nhân sự (Admin [1] & HR Manager [2])
router.get('/payroll', protect, restrictTo(1, 2), hrController.getPayroll);
router.post('/payroll', protect, restrictTo(1, 2), hrController.savePayroll);

// Route xử lý giải quyết sự cố (Tour Manager [3] & Admin [1])
router.put('/incidents/:id', protect, restrictTo(1, 3), guideController.updateIncidentStatus);

// Route Quản lý người dùng & Phân vai trò hệ thống (Dành riêng cho Admin [1])
router.get('/users', protect, restrictTo(1), hrController.getAllUsers);
router.put('/users/:id/role', protect, restrictTo(1), hrController.updateUserRole);

module.exports = router;

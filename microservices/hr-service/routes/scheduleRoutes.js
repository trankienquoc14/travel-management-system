const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');

router.get('/tasks', protect, scheduleController.getTasks);
router.post('/tasks', protect, scheduleController.createTask);
router.put('/tasks/:id', protect, scheduleController.updateTask);
router.delete('/tasks/:id', protect, scheduleController.deleteTask);
router.put('/tasks/:id/status', protect, scheduleController.updateTaskStatus);

router.get('/holidays', protect, scheduleController.getHolidays);

module.exports = router;

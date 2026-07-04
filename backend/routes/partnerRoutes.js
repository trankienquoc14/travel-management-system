const express = require('express');
const router = express.Router();

const partnerController = require('../controllers/partnerController');
const { protect } = require('../middleware/authMiddleware');

// Lấy danh sách đối tác
router.get('/', partnerController.getAllPartners);

// Thêm đối tác
router.post('/', protect, partnerController.createPartner);

// Cập nhật đối tác
router.put('/:id', protect, partnerController.updatePartner);

// Xóa đối tác
router.delete('/:id', protect, partnerController.deletePartner);

module.exports = router;
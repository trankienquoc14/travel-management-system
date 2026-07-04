const express = require('express');
const router = express.Router();
const partnerServiceController = require('../controllers/partnerServiceController');
const { protect } = require('../middleware/authMiddleware');

// Route dành riêng cho đối tác lấy kho hàng của mình
router.get('/my-inventory', protect, partnerServiceController.getMyInventory);

// Route thêm dịch vụ vào kho
router.post('/', protect, partnerServiceController.addServiceToInventory);

// Route xóa mềm dịch vụ
router.delete('/:id', protect, partnerServiceController.deletePartnerService);
// Route cập nhật dịch vụ
router.put('/:id', protect, partnerServiceController.updatePartnerService);
router.get('/', partnerServiceController.getServicesByDestination);

module.exports = router;
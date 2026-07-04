const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');
const upload = require("../middleware/upload");

router.get('/', serviceController.getAllServices);
router.get('/partners', serviceController.getAllPartners);
router.post(
    "/",
    protect,
    upload.single("image"),
    serviceController.createService
);

router.put(
    "/:id",
    protect,
    upload.single("image"),
    serviceController.updateService
);
router.delete('/:id', protect, serviceController.deleteService);

module.exports = router;
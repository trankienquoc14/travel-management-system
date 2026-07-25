const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });
// Get all places (admin/manager view with partner info)
router.get('/all', placeController.getAllPlaces);

// Get places by destination (for tour designers)
router.get('/', placeController.getPlacesByDestination);

// Create place
router.post('/', protect, upload.single('image'), placeController.createPlace);

// Update place
router.put('/:id', protect, upload.single('image'), placeController.updatePlace);

// Delete place
router.delete('/:id', protect, placeController.deletePlace);

module.exports = router;

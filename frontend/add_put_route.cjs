const fs = require('fs');
const path = require('path');
const fPath = path.join(__dirname, '..', 'microservices', 'tour-service', 'routes', 'tourRoutes.js');
let content = fs.readFileSync(fPath, 'utf8');

if (!content.includes('router.put(\'/staff/tours/:id\',')) {
    content = content.replace(
        "router.post('/staff/tours', protect, restrictTo(1, 3, 4), upload.any(), tourController.saveFixedTourDesign);",
        "router.post('/staff/tours', protect, restrictTo(1, 3, 4), upload.any(), tourController.saveFixedTourDesign);\nrouter.put('/staff/tours/:id', protect, restrictTo(1, 3, 4), upload.any(), tourController.saveFixedTourDesign);"
    );
    fs.writeFileSync(fPath, content, 'utf8');
    console.log('Added PUT route for staff/tours/:id');
} else {
    console.log('Already exists');
}

const fs = require('fs');

let content = fs.readFileSync('microservices/tour-service/controllers/vehicleController.js', 'utf8');

content = content.replace(
  "const userId = req.user.id;",
  "const userId = req.user.user_id || req.user.id || null;"
);
// Replace multiple times if present
content = content.replace(
  "const userId = req.user.id;",
  "const userId = req.user.user_id || req.user.id || null;"
);

fs.writeFileSync('microservices/tour-service/controllers/vehicleController.js', content);
console.log('Fixed userId bug');

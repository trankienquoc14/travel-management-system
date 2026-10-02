const fs = require('fs');
if (!fs.existsSync('microservices/tour-service/utils')) {
    fs.mkdirSync('microservices/tour-service/utils', { recursive: true });
}
fs.copyFileSync('microservices/booking-service/utils/roomCalculator.js', 'microservices/tour-service/utils/roomCalculator.js');
console.log('copied');

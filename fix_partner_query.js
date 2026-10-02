const fs = require('fs');
let content = fs.readFileSync('microservices/hr-service/controllers/partnerController.js', 'utf8');

const oldQuery = `            SELECT *
            FROM partners
            ORDER BY partner_id DESC`;

const newQuery = `            SELECT p.*, d.destination_name
            FROM partners p
            LEFT JOIN destinations d ON p.destination_id = d.destination_id
            ORDER BY p.partner_id DESC`;

content = content.replace(oldQuery, newQuery);

fs.writeFileSync('microservices/hr-service/controllers/partnerController.js', content);
console.log('Fixed partner query');

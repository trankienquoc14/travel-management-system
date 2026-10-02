const fs = require('fs');
let content = fs.readFileSync('microservices/tour-service/controllers/tourController.js', 'utf8');

const strToFind = `            // Calculate current pax: max_slots - available_slots
            let minPax = 15;
            let destName = r.destination;
            if (r.design_data) {
                try {
                    const parsed = typeof r.design_data === 'string' ? JSON.parse(r.design_data) : r.design_data;
                    if (parsed?.costConfig?.minimumPax) minPax = parsed.costConfig.minimumPax;
                } catch(e) {}
            }
            
            // Calculate current pax: max_slots - available_slots`;

content = content.replace(strToFind, '            // Calculate current pax: max_slots - available_slots');
fs.writeFileSync('microservices/tour-service/controllers/tourController.js', content);
console.log('done');

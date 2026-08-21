const fs = require('fs');
const fPath = 'src/components/StaffFixedTourDesigner.jsx';
let c = fs.readFileSync(fPath, 'utf8');

const targetStr = `if (parsed.costConfig) {
                            // Migrate old format where transport was just a number
                            if (parsed.costConfig.fixed && parsed.costConfig.fixed.transport !== undefined) {
                                delete parsed.costConfig.fixed.transport;
                            }
                            setCostConfig(parsed.costConfig);
                        }`;

const newStr = `if (parsed.costConfig) {
                            // Migrate old format where transport was just a number
                            if (parsed.costConfig.fixed && parsed.costConfig.fixed.transport !== undefined) {
                                delete parsed.costConfig.fixed.transport;
                            }
                            const defaultCostConfig = {
                                minimumPax: 15,
                                margin: 20,
                                fixed: { guidePerDay: 500000, otherFixed: 0 },
                                variable: { accommPerNight: 0, singleSupplement: 0, breakfast: 250000, lunch: 250000, dinner: 250000, tickets: 0, insurance: 0 },
                                ageMultiplier: { child: 75, infant: 25 },
                                selectedTransport: null
                            };
                            setCostConfig({
                                ...defaultCostConfig,
                                ...parsed.costConfig,
                                fixed: { ...defaultCostConfig.fixed, ...(parsed.costConfig.fixed || {}) },
                                variable: { ...defaultCostConfig.variable, ...(parsed.costConfig.variable || {}) },
                                ageMultiplier: { ...defaultCostConfig.ageMultiplier, ...(parsed.costConfig.ageMultiplier || {}) }
                            });
                        }`;

if (c.includes('delete parsed.costConfig.fixed.transport;')) {
    c = c.replace(targetStr, newStr);
    fs.writeFileSync(fPath, c, 'utf8');
    console.log('Fixed handleEditTour crash!');
} else {
    console.log('Not found');
}

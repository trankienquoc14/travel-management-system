const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src', 'components', 'StaffFixedTourDesigner.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

const oldLogic = `                try {
                    const parsed = typeof tourData.design_data === 'string' ? JSON.parse(tourData.design_data) : tourData.design_data;
                    if (parsed && parsed.gallery) setGalleryPreviews(parsed.gallery);
                    if (parsed && parsed.dayImages) setDayImagePreviews(parsed.dayImages);
                } catch(e) {}
                
                if (tourData.design_data) {
                    try {
                        const parsed = JSON.parse(tourData.design_data);
                        if (parsed.days) setDays(parsed.days);
                        if (parsed.costConfig) {
                            // Migrate old format where transport was just a number
                            if (parsed.costConfig.fixed && parsed.costConfig.fixed.transport !== undefined) {
                                delete parsed.costConfig.fixed.transport;
                            }
                            setCostConfig(prev => ({
                                ...prev,
                                ...parsed.costConfig,
                                fixed: { ...prev.fixed, ...(parsed.costConfig.fixed || {}) },
                                variable: { ...prev.variable, ...(parsed.costConfig.variable || {}) },
                                transportTimes: { ...prev.transportTimes, ...(parsed.costConfig.transportTimes || {}) },
                                ageMultiplier: { ...prev.ageMultiplier, ...(parsed.costConfig.ageMultiplier || {}) }
                            }));
                        }
                    } catch (e) { console.error("JSON parse error:", e); }
                }`;

const newLogic = `                if (tourData.design_data) {
                    try {
                        const parsed = typeof tourData.design_data === 'string' ? JSON.parse(tourData.design_data) : tourData.design_data;
                        if (parsed && parsed.gallery) setGalleryPreviews(parsed.gallery);
                        if (parsed && parsed.dayImages) setDayImagePreviews(parsed.dayImages);
                        
                        if (parsed.days) setDays(parsed.days);
                        if (parsed.costConfig) {
                            if (parsed.costConfig.fixed && parsed.costConfig.fixed.transport !== undefined) {
                                delete parsed.costConfig.fixed.transport;
                            }
                            setCostConfig(prev => ({
                                ...prev,
                                ...parsed.costConfig,
                                fixed: { ...prev.fixed, ...(parsed.costConfig.fixed || {}) },
                                variable: { ...prev.variable, ...(parsed.costConfig.variable || {}) },
                                transportTimes: { ...prev.transportTimes, ...(parsed.costConfig.transportTimes || {}) },
                                ageMultiplier: { ...prev.ageMultiplier, ...(parsed.costConfig.ageMultiplier || {}) }
                            }));
                        }
                    } catch (e) { console.error("JSON parse error:", e); }
                }`;

content = content.replace(oldLogic, newLogic);
fs.writeFileSync(targetFile, content, 'utf8');
console.log('Fixed handleEditTour parse logic');

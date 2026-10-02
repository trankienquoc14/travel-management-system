const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/ServiceRequestCreate.jsx', 'utf8');

const oldLogic = `                                            if (!selectedDep.destination) return true;
                                            
                                            const dest = destinations.find(d => d.destination_id == p.destination_id);
                                            const pDestName = dest ? dest.destination_name : (p.destination_name || '');
                                            
                                            if (!pDestName) return true;
                                            
                                            return pDestName.trim().toLowerCase() === selectedDep.destination.trim().toLowerCase();`;

const newLogic = `                                            const dest = destinations.find(d => d.destination_id == p.destination_id);
                                            const pDestName = dest ? dest.destination_name : (p.destination_name || '');
                                            
                                            if (!pDestName) return true;
                                            
                                            const tourName = selectedDep.tour_name || '';
                                            const tourDest = selectedDep.destination || '';
                                            const pdNameStr = pDestName.trim().toLowerCase();
                                            
                                            const matchDest = tourDest.toLowerCase().includes(pdNameStr);
                                            const matchName = tourName.toLowerCase().includes(pdNameStr);
                                            
                                            return matchDest || matchName || (!tourDest && !tourName);`;

// Replace it globally (it appears twice)
content = content.split(oldLogic).join(newLogic);

fs.writeFileSync('frontend/src/components/ServiceRequestCreate.jsx', content);
console.log('Fixed destination logic');

const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/ServiceRequestCreate.jsx', 'utf8');

const oldFilter = `{partners.filter(p => p.partner_type === 'Hotel' || p.partner_type === 'Accommodation' || p.partner_type === 'Khách sạn').map(p => (`;

const newFilter = `{partners.filter(p => {
                                            const isHotel = p.partner_type === 'Hotel' || p.partner_type === 'Accommodation' || p.partner_type === 'Khách sạn' || p.partner_type === 'Khách Sạn';
                                            if (!isHotel) return false;
                                            
                                            if (!selectedDep.destination) return true;
                                            
                                            const dest = destinations.find(d => d.destination_id == p.destination_id);
                                            const pDestName = dest ? dest.destination_name : (p.destination_name || '');
                                            
                                            if (!pDestName) return true;
                                            
                                            return pDestName.trim().toLowerCase() === selectedDep.destination.trim().toLowerCase();
                                        }).map(p => (`;

content = content.replace(oldFilter, newFilter);

fs.writeFileSync('frontend/src/components/ServiceRequestCreate.jsx', content);
console.log('Applied robust filter');

const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/ServiceRequestCreate.jsx', 'utf8');

// 1. Add destination_id to hotelsMap
content = content.replace(
    /service_id: hotelServiceId/g,
    "service_id: hotelServiceId,\n                        destination_id: day.end_destination_id || day.destination_id"
);

// 2. Update autoServ construction
const oldAutoServ = `            // Auto-select the first available partner if still no match, because user requested to select one
            if (!matchedPartnerId && partners.length > 0) {
                // Find first hotel in this destination
                const availableHotels = partners.filter(p => {
                    const isHotel = p.partner_type === 'Hotel' || p.partner_type === 'Accommodation' || p.partner_type === 'Khách sạn' || p.partner_type === 'Khách Sạn';
                    if (!isHotel) return false;
                    if (!selectedDep.destination) return true;
                    const dest = destinations.find(d => d.destination_id == p.destination_id);
                    const pDestName = dest ? dest.destination_name : (p.destination_name || '');
                    if (!pDestName) return true;
                    return pDestName.trim().toLowerCase() === selectedDep.destination.trim().toLowerCase();
                });
                if (availableHotels.length > 0) {
                    matchedPartnerId = availableHotels[0].partner_id;
                }
            }
            
            autoServ.push({
                id: Math.random().toString(36).substr(2, 9),
                type: 'HOTEL',
                partner_id: matchedPartnerId,
                quantity: h.rooms,
                hotelName: h.name,
                details: { checkIn: h.checkIn, checkOut: h.checkOut, nights: h.nights }
            });`;

const newAutoServ = `            // Auto-select the first available partner if still no match, because user requested to select one
            if (!matchedPartnerId && partners.length > 0) {
                // Find first hotel in this destination
                const availableHotels = partners.filter(p => {
                    const isHotel = p.partner_type === 'Hotel' || p.partner_type === 'Accommodation' || p.partner_type === 'Khách sạn' || p.partner_type === 'Khách Sạn';
                    if (!isHotel) return false;
                    
                    if (h.destination_id) {
                        return p.destination_id == h.destination_id;
                    }
                    
                    if (!selectedDep.destination) return true;
                    const dest = destinations.find(d => d.destination_id == p.destination_id);
                    const pDestName = dest ? dest.destination_name : (p.destination_name || '');
                    if (!pDestName) return true;
                    const tourName = selectedDep.tour_name || '';
                    const tourDest = selectedDep.destination || '';
                    const pdNameStr = pDestName.trim().toLowerCase();
                    const matchDest = tourDest.toLowerCase().includes(pdNameStr);
                    const matchName = tourName.toLowerCase().includes(pdNameStr);
                    return matchDest || matchName || (!tourDest && !tourName);
                });
                if (availableHotels.length > 0) {
                    matchedPartnerId = availableHotels[0].partner_id;
                }
            }
            
            autoServ.push({
                id: Math.random().toString(36).substr(2, 9),
                type: 'HOTEL',
                partner_id: matchedPartnerId,
                quantity: h.rooms,
                hotelName: h.name,
                destination_id: h.destination_id,
                details: { checkIn: h.checkIn, checkOut: h.checkOut, nights: h.nights }
            });`;

content = content.replace(oldAutoServ, newAutoServ);

// 3. Update dropdown filter in render
const oldFilter = `                                        {partners.filter(p => {
                                            const isHotel = p.partner_type === 'Hotel' || p.partner_type === 'Accommodation' || p.partner_type === 'Khách sạn' || p.partner_type === 'Khách Sạn';
                                            if (!isHotel) return false;
                                            
                                            const dest = destinations.find(d => d.destination_id == p.destination_id);
                                            const pDestName = dest ? dest.destination_name : (p.destination_name || '');
                                            
                                            if (!pDestName) return true;
                                            
                                            const tourName = selectedDep.tour_name || '';
                                            const tourDest = selectedDep.destination || '';
                                            const pdNameStr = pDestName.trim().toLowerCase();
                                            
                                            const matchDest = tourDest.toLowerCase().includes(pdNameStr);
                                            const matchName = tourName.toLowerCase().includes(pdNameStr);
                                            
                                            return matchDest || matchName || (!tourDest && !tourName);
                                        }).map(p => (`;

const newFilter = `                                        {partners.filter(p => {
                                            const isHotel = p.partner_type === 'Hotel' || p.partner_type === 'Accommodation' || p.partner_type === 'Khách sạn' || p.partner_type === 'Khách Sạn';
                                            if (!isHotel) return false;
                                            
                                            if (s.destination_id) {
                                                return p.destination_id == s.destination_id;
                                            }
                                            
                                            const dest = destinations.find(d => d.destination_id == p.destination_id);
                                            const pDestName = dest ? dest.destination_name : (p.destination_name || '');
                                            
                                            if (!pDestName) return true;
                                            
                                            const tourName = selectedDep.tour_name || '';
                                            const tourDest = selectedDep.destination || '';
                                            const pdNameStr = pDestName.trim().toLowerCase();
                                            
                                            const matchDest = tourDest.toLowerCase().includes(pdNameStr);
                                            const matchName = tourName.toLowerCase().includes(pdNameStr);
                                            
                                            return matchDest || matchName || (!tourDest && !tourName);
                                        }).map(p => (`;

content = content.replace(oldFilter, newFilter);

fs.writeFileSync('frontend/src/components/ServiceRequestCreate.jsx', content);
console.log('Fixed specific destination filtering');

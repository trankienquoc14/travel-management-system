const sequelize = require('./config/database');

const ALIAS_MAP = {
    'phan thiết': 'mũi né',
    'phú quý': 'mũi né',
    'bình thuận': 'mũi né',
    'sapa': 'lào cai',
    'sa pa': 'lào cai',
    'bảo lộc': 'đà lạt',
    'lâm đồng': 'đà lạt',
    'langbiang': 'đà lạt',
    'cam ranh': 'nha trang',
    'khánh hòa': 'nha trang',
    'bà rịa': 'vũng tàu',
    'hồ tràm': 'vũng tàu',
    'bà nà': 'đà nẵng',
    'sơn trà': 'đà nẵng',
    'quảng nam': 'hội an',
    'thừa thiên huế': 'huế',
    'đắk lắk': 'tây nguyên',
    'buôn ma thuột': 'tây nguyên',
    'gia lai': 'tây nguyên',
    'pleiku': 'tây nguyên',
    'quảng bình': 'quảng bình',
    'phú yên': 'phú yên',
    'tuy hòa': 'phú yên',
    'sài gòn': 'hồ chí minh',
    'tp.hcm': 'hồ chí minh',
    'tphcm': 'hồ chí minh',
    'quảng ninh': 'hạ long',
};

async function testPhanThietTour() {
    try {
        const [deps] = await sequelize.query(`
            SELECT d.departure_id, d.tour_id, d.departure_date, t.tour_name, t.destination, t.design_data 
            FROM departures d 
            JOIN tours t ON d.tour_id = t.tour_id
            WHERE t.tour_name LIKE '%Phan Thiết%' OR t.tour_name LIKE '%Phú Quý%'
            LIMIT 5
        `);

        const [partners] = await sequelize.query(`SELECT partner_id, partner_name, partner_type, destination_id FROM partners`);
        const [destinations] = await sequelize.query(`SELECT destination_id, destination_name FROM destinations`);

        function getValidDestIds(rawIds, hintText, selectedDep) {
            const validIds = new Set();
            const list = (Array.isArray(rawIds) ? rawIds : [rawIds]).filter(Boolean);

            list.forEach(id => {
                const found = destinations.find(d => String(d.destination_id) === String(id));
                if (found) validIds.add(parseInt(found.destination_id));
            });

            if (validIds.size === 0 && destinations.length > 0) {
                const tourName = selectedDep?.tour_name || '';
                const tourDest = selectedDep?.destination || '';
                const rawHints = [hintText, tourDest, tourName].filter(Boolean);

                const hints = [];
                rawHints.forEach(h => {
                    const lowerH = h.toLowerCase();
                    hints.push(lowerH);
                    Object.keys(ALIAS_MAP).forEach(alias => {
                        if (lowerH.includes(alias)) {
                            hints.push(ALIAS_MAP[alias]);
                        }
                    });
                });

                destinations.forEach(d => {
                    const dName = (d.destination_name || '').trim().toLowerCase();
                    if (!dName) return;
                    hints.forEach(hint => {
                        if (hint.includes(dName)) {
                            validIds.add(parseInt(d.destination_id));
                        }
                    });
                });
            }

            return Array.from(validIds);
        }

        deps.forEach(selectedDep => {
            console.log(`\n========================================`);
            console.log(`Dep ID: ${selectedDep.departure_id}, Tour: ${selectedDep.tour_name}, Tour Dest: ${selectedDep.destination}`);
            
            let parsed = {};
            try {
                parsed = typeof selectedDep.design_data === 'string' ? JSON.parse(selectedDep.design_data) : (selectedDep.design_data || {});
            } catch(e) {}
            
            const days = parsed.days || parsed.itinerary || [];

            days.forEach((day, index) => {
                const titleHint = day.title || day.route_title || day.name || '';
                const rawStartDestId = day.destination_id || day.start_destination_id;
                const rawEndDestId = day.end_destination_id || day.destination_id || day.start_destination_id;

                const validIds = getValidDestIds([rawStartDestId, rawEndDestId], titleHint, selectedDep);
                console.log(`Day ${index + 1} title="${titleHint}" => validIds=`, validIds);

                // Hotel partners
                const hotelPartners = partners.filter(p => {
                    const isHotel = p.partner_type === 'Hotel';
                    if (!isHotel) return false;
                    if (validIds.length > 0) return validIds.includes(parseInt(p.destination_id));
                    return true;
                });
                console.log(`  Hotel partners count: ${hotelPartners.length} ->`, hotelPartners.map(h => h.partner_name));

                // Rest partners
                const restPartners = partners.filter(p => p.partner_type === 'Restaurant');
                const matchedRests = restPartners.filter(p => validIds.includes(parseInt(p.destination_id)));
                console.log(`  Restaurant partners count: ${matchedRests.length} ->`, matchedRests.map(r => r.partner_name));
            });
        });

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await sequelize.close();
    }
}

testPhanThietTour();

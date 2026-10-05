const sequelize = require('./config/database');

async function inspectPhanThiet() {
    try {
        console.log('--- ALL DESTINATIONS IN DB ---');
        const [dests] = await sequelize.query(`SELECT destination_id, destination_name FROM destinations`);
        console.log(dests);

        console.log('\n--- TOURS matching Phan Thiết or Phú Quý ---');
        const [tours] = await sequelize.query(`SELECT tour_id, tour_name, destination, design_data FROM tours WHERE tour_name LIKE '%Phan Thiết%' OR tour_name LIKE '%Phú Quý%' OR destination LIKE '%Phan Thiết%' OR destination LIKE '%Bình Thuận%'`);
        tours.forEach(t => {
            console.log(`Tour ID: ${t.tour_id}, Name: ${t.tour_name}, Destination field: ${t.destination}`);
            let parsed = {};
            try {
                parsed = typeof t.design_data === 'string' ? JSON.parse(t.design_data) : (t.design_data || {});
            } catch(e) {}
            const days = parsed.days || parsed.itinerary || [];
            days.forEach((day, i) => {
                console.log(`  Day ${i+1}: destination_id=${day.destination_id}, start_dest=${day.start_destination_id}, end_dest=${day.end_destination_id}, route=${day.route_title || day.title}`);
                if (day.accommodation) console.log('    Accommodation:', day.accommodation);
            });
        });

        console.log('\n--- PARTNERS matching Phan Thiết, Phú Quý, Bình Thuận, Mũi Né ---');
        const [partners] = await sequelize.query(`
            SELECT p.partner_id, p.partner_name, p.partner_type, p.destination_id, d.destination_name 
            FROM partners p 
            LEFT JOIN destinations d ON p.destination_id = d.destination_id 
            WHERE p.partner_name LIKE '%Phan Thiết%' OR p.partner_name LIKE '%Phú Quý%' OR p.partner_name LIKE '%Bình Thuận%' OR p.partner_name LIKE '%Mũi Né%' OR d.destination_name LIKE '%Mũi Né%' OR d.destination_name LIKE '%Phan Thiết%'
        `);
        console.log(partners);

    } catch(e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

inspectPhanThiet();

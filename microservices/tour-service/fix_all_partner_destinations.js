const sequelize = require('./config/database');

async function fixAllPartnerDestinations() {
    try {
        console.log('--- STARTING GLOBAL PARTNER DESTINATION FIX ---');
        
        const updates = [
            { destId: 19, keywords: ['Hà Giang', 'Đồng Văn', 'Phoenix', 'Hmong'] },
            { destId: 20, keywords: ['Phú Yên', 'Tuy Hòa', 'Stelia', 'Seagull'] },
            { destId: 10, keywords: ['Quy Nhơn', 'FLC Quy Nhơn', 'Hải Âu'] },
            { destId: 6, keywords: ['Hội An', 'Hoi An', 'Phố Cổ Hội An'] },
            { destId: 7, keywords: ['Huế', 'Hue'] },
            { destId: 16, keywords: ['Quảng Bình', 'Sun Spa'] },
            { destId: 4, keywords: ['Sapa', 'Lào Cai'] },
            { destId: 9, keywords: ['Hạ Long', 'Halong'] },
            { destId: 15, keywords: ['Ninh Bình', 'Emeralda', 'Bái Đính'] },
            { destId: 12, keywords: ['Cần Thơ', 'Ninh Kiều'] },
            { destId: 13, keywords: ['Côn Đảo', 'Con Dao'] },
            { destId: 14, keywords: ['Vũng Tàu', 'Ho Tram', 'Hồ Tràm', 'Malibu', 'Imperial'] },
            { destId: 21, keywords: ['Buôn Ma Thuột', 'Pleiku', 'Saigon Ban Me', 'Elephants'] },
            { destId: 22, keywords: ['Cà Mau', 'Mũi Cà Mau'] },
            { destId: 23, keywords: ['Tây Ninh', 'Sunrise Tây Ninh'] },
            { destId: 8, keywords: ['Hà Nội', 'Hanoi', 'Lotte Hotel Hà Nội'] },
            { destId: 18, keywords: ['Saigon', 'Sài Gòn', 'Hồ Chí Minh', 'Liberty Central'] },
            { destId: 11, keywords: ['Mũi Né', 'Phan Thiết', 'Phú Quý', 'Bình Thuận', 'Centara'] },
            { destId: 2, keywords: ['Đà Lạt', 'Dalat', 'Lâm Đồng'] },
            { destId: 1, keywords: ['Nha Trang', 'Khánh Hòa'] },
            { destId: 3, keywords: ['Phú Quốc', 'Phu Quoc'] },
            { destId: 5, keywords: ['Đà Nẵng', 'Da Nang', 'Sala Đà Nẵng Beach', 'Mường Thanh Đà Nẵng'] }
        ];

        for (const u of updates) {
            for (const kw of u.keywords) {
                const [res] = await sequelize.query(`
                    UPDATE partners 
                    SET destination_id = ${u.destId} 
                    WHERE partner_name LIKE '%${kw}%' AND (destination_id IS NULL OR destination_id = 0)
                `);
                if (res.affectedRows > 0) {
                    console.log(`Updated ${res.affectedRows} partners matching '${kw}' -> destination_id ${u.destId}`);
                }
            }
        }

        // Also sync services table for any services with NULL destination_id where partner_id is set
        const [resSrv] = await sequelize.query(`
            UPDATE services s
            JOIN partners p ON s.partner_id = p.partner_id
            SET s.destination_id = p.destination_id
            WHERE (s.destination_id IS NULL OR s.destination_id = 0) AND p.destination_id IS NOT NULL
        `);
        console.log(`Synced ${resSrv.affectedRows} services with partner destination_id.`);

        // Verify remaining null count
        const [remaining] = await sequelize.query(`
            SELECT partner_id, partner_name, partner_type 
            FROM partners 
            WHERE (destination_id IS NULL OR destination_id = 0) AND partner_type != 'Transport'
        `);
        console.log(`Remaining Non-Transport Partners with NULL destination_id: ${remaining.length}`);
        if (remaining.length > 0) {
            console.log(remaining);
        }

    } catch(e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

fixAllPartnerDestinations();

const mysql = require('mysql2/promise');

async function seed() {
    const con = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'travel_management'
    });

    try {
        // 1. Ensure Destinations exist
        const destinations = [
            ['Đà Nẵng', 'Thành phố đáng sống nhất Việt Nam', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b'],
            ['Nha Trang', 'Hòn ngọc của biển Đông', 'https://images.unsplash.com/photo-1583417637841-37016dbbebd8'],
            ['Phú Quốc', 'Đảo Ngọc tuyệt đẹp', 'https://images.unsplash.com/photo-1576487508051-9e761df89c44']
        ];

        for (const dest of destinations) {
            const [rows] = await con.query('SELECT destination_id FROM destinations WHERE destination_name = ?', [dest[0]]);
            if (rows.length === 0) {
                await con.query('INSERT INTO destinations (destination_name, description, image_url, status) VALUES (?, ?, ?, "Active")', dest);
            }
        }
        
        const [destRows] = await con.query('SELECT * FROM destinations');
        const destMap = {};
        destRows.forEach(d => destMap[d.destination_name] = d.destination_id);

        // 2. Insert Users (Role 7 is Partner)
        // pass: 123456 -> hash: $2b$10$7Z2t/7f8f9tHlC5P3Z4N1O6Qk.mX/eG.uL0/5Y7Vj1G5Xp4LzT6Yy
        const dummyHash = '$2a$10$wT2Xb8yK9vT3fN9gJ1hJ.uM9N9o5Q9g9Q9g9Q9g9Q9g9Q9g9Q9g9Q'; // Usually use real hash, but let's just insert something
        
        const users = [
            { email: 'muongthanh_dn@gmail.com', name: 'KS Mường Thanh Đà Nẵng', phone: '0901234567' },
            { email: 'vinpearl_nt@gmail.com', name: 'Vinpearl Nha Trang', phone: '0902345678' },
            { email: 'hoanglong_trans@gmail.com', name: 'Nhà Xe Hoàng Long', phone: '0903456789' }
        ];

        for (const u of users) {
            const [rows] = await con.query('SELECT user_id FROM users WHERE email = ?', [u.email]);
            if (rows.length === 0) {
                await con.query(`
                    INSERT INTO users (role_id, full_name, email, password_hash, phone, status)
                    VALUES (7, ?, ?, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ?, 'Active')
                `, [u.name, u.email, u.phone]); // password is 'password' in standard bcrypt
            }
        }

        // 3. Insert Partners
        const partners = [
            { email: 'muongthanh_dn@gmail.com', name: 'Mường Thanh Đà Nẵng', type: 'Accommodation', dest: 'Đà Nẵng' },
            { email: 'vinpearl_nt@gmail.com', name: 'Vinpearl Resort Nha Trang', type: 'Accommodation', dest: 'Nha Trang' },
            { email: 'hoanglong_trans@gmail.com', name: 'Nhà Xe Hoàng Long Toàn Quốc', type: 'Transport', dest: null } // Transport often has no specific destination
        ];

        for (const p of partners) {
            const [rows] = await con.query('SELECT partner_id FROM partners WHERE email = ?', [p.email]);
            if (rows.length === 0) {
                const destId = p.dest ? destMap[p.dest] : null;
                await con.query(`
                    INSERT INTO partners (destination_id, partner_name, partner_type, contact_name, phone, email, status)
                    VALUES (?, ?, ?, 'Quản lý', '0900000000', ?, 'Active')
                `, [destId, p.name, p.type, p.email]);
            }
        }

        // Fetch partners to map
        const [partnerRows] = await con.query('SELECT partner_id, email FROM partners');
        const partnerMap = {};
        partnerRows.forEach(p => partnerMap[p.email] = p.partner_id);

        // 4. Insert Master Services
        const services = [
            { name: 'Phòng Deluxe Hướng Biển', type: 'Accommodation', dest: 'Đà Nẵng', unit: 'Phòng/Đêm', price: 1500000 },
            { name: 'Phòng Suite Cao Cấp', type: 'Accommodation', dest: 'Nha Trang', unit: 'Phòng/Đêm', price: 2500000 },
            { name: 'Xe Ford Transit 16 Chỗ', type: 'Transport', dest: null, unit: 'Xe/Ngày', price: 1200000 },
            { name: 'Xe Thaco 29 Chỗ', type: 'Transport', dest: null, unit: 'Xe/Ngày', price: 2200000 }
        ];

        for (const s of services) {
            const [rows] = await con.query('SELECT service_id FROM services WHERE service_name = ?', [s.name]);
            if (rows.length === 0) {
                const destId = s.dest ? destMap[s.dest] : null;
                await con.query(`
                    INSERT INTO services (service_name, service_type, destination_id, unit, base_cost, selling_price, status)
                    VALUES (?, ?, ?, ?, ?, ?, 'Active')
                `, [s.name, s.type, destId, s.unit, s.price * 0.8, s.price]);
            }
        }

        const [srvRows] = await con.query('SELECT service_id, service_name FROM services');
        const srvMap = {};
        srvRows.forEach(s => srvMap[s.service_name] = s.service_id);

        // 5. Insert Partner Services (assign to partners)
        const partnerServices = [
            { email: 'muongthanh_dn@gmail.com', srvName: 'Phòng Deluxe Hướng Biển', price: 1200000, qty: 50 },
            { email: 'vinpearl_nt@gmail.com', srvName: 'Phòng Suite Cao Cấp', price: 2000000, qty: 30 },
            { email: 'hoanglong_trans@gmail.com', srvName: 'Xe Ford Transit 16 Chỗ', price: 1000000, qty: 10 },
            { email: 'hoanglong_trans@gmail.com', srvName: 'Xe Thaco 29 Chỗ', price: 1800000, qty: 5 }
        ];

        for (const ps of partnerServices) {
            const pId = partnerMap[ps.email];
            const sId = srvMap[ps.srvName];
            
            if (pId && sId) {
                const [rows] = await con.query('SELECT * FROM partner_services WHERE partner_id = ? AND service_id = ?', [pId, sId]);
                if (rows.length === 0) {
                    await con.query(`
                        INSERT INTO partner_services (partner_id, service_id, unit_price, available_quantity, status)
                        VALUES (?, ?, ?, ?, 'Active')
                    `, [pId, sId, ps.price, ps.qty]);
                }
            }
        }

        console.log('Seeding completed successfully!');
    } catch (e) {
        console.error('Error seeding:', e);
    } finally {
        con.end();
    }
}

seed();

const sequelize = require('../config/database');

// API nhỏ: Lấy danh sách Nhà cung cấp để hiển thị trong thẻ Select
exports.getAllPartners = async (req, res) => {
    try {
        const [partners] = await sequelize.query('SELECT partner_id, partner_name FROM partners WHERE status = "Active"');
        res.status(200).json({ success: true, data: partners });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllServices = async (req, res) => {
    try {
        const [services] = await sequelize.query(`
            SELECT s.*, p.partner_name, d.destination_name, s.base_cost as proposed_cost,
                   vsd.seat_capacity as capacity,
                   hsd.max_adults, hsd.max_children, hsd.max_infants, hsd.min_adults, hsd.single_room_allowed, hsd.single_room_supplement
            FROM services s
            LEFT JOIN partners p ON s.partner_id = p.partner_id
            LEFT JOIN travel_management.destinations d ON s.destination_id = d.destination_id
            
            LEFT JOIN vehicle_service_details vsd ON s.service_id = vsd.service_id
            LEFT JOIN hotel_service_details hsd ON s.service_id = hsd.service_id
            ORDER BY s.service_id DESC
        `);

        res.status(200).json({ success: true, data: services });
    } catch (error) {
        console.error("Lỗi API get services:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createService = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { service_name, service_type, description, status, partner_id, destination_id, unit, base_cost, selling_price, capacity, attributes, max_adults, max_children, max_infants, min_adults, single_room_allowed, single_room_supplement } = req.body;

        let finalImageUrl = '';
        if (req.file) finalImageUrl = `/uploads/${req.file.filename}`;

        let parsedPartnerId = partner_id;
        if (parsedPartnerId === 'null' || parsedPartnerId === 'undefined' || parsedPartnerId === '' || parsedPartnerId === undefined) parsedPartnerId = null;

        let parsedDestId = destination_id;
        if (parsedDestId === 'null' || parsedDestId === 'undefined' || parsedDestId === '' || parsedDestId === undefined) parsedDestId = null;

        const [insertResult] = await sequelize.query(`
            INSERT INTO services (service_name, service_type, description, image_url, partner_id, destination_id, unit, base_cost, selling_price, attributes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, { replacements: [
            service_name || '', service_type || 'Khách sạn', description || '', finalImageUrl, 
            parsedPartnerId, parsedDestId, unit || null, 
            base_cost || 0, selling_price || 0, 
            attributes || '{}', status || 'Active'
        ], transaction: t });
        
        const serviceId = insertResult;
        
        if (service_type === 'Hotel' || service_type === 'Khách sạn' || service_type === 'Accommodation') {
            await sequelize.query(`
                INSERT INTO hotel_service_details (service_id, max_adults, max_children, max_infants, min_adults, single_room_allowed, single_room_supplement, room_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, { replacements: [
                serviceId, 
                max_adults !== undefined ? max_adults : 2,
                max_children !== undefined ? max_children : 2,
                max_infants !== undefined ? max_infants : 1,
                min_adults !== undefined ? min_adults : 1,
                single_room_allowed !== undefined ? single_room_allowed : 1,
                single_room_supplement || 0,
                service_name || 'Standard'
            ], transaction: t });
        } else if (service_type === 'Vehicle' || service_type === 'Transport' || service_type === 'Xe vận chuyển') {
            await sequelize.query(`
                INSERT INTO vehicle_service_details (service_id, seat_capacity, vehicle_type)
                VALUES (?, ?, ?)
            `, { replacements: [
                serviceId, capacity || 0, service_name || ''
            ], transaction: t });
        }

        await t.commit();
        res.status(201).json({ success: true, message: 'Thêm Dịch vụ thành công!' });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateService = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { service_name, service_type, description, status, partner_id, destination_id, unit, base_cost, selling_price, capacity, attributes, existing_image_url, max_adults, max_children, max_infants, min_adults, single_room_allowed, single_room_supplement } = req.body;

        let finalImageUrl = existing_image_url || '';
        if (req.file) finalImageUrl = `/uploads/${req.file.filename}`;

        let parsedPartnerId = partner_id;
        if (parsedPartnerId === 'null' || parsedPartnerId === 'undefined' || parsedPartnerId === '' || parsedPartnerId === undefined) parsedPartnerId = null;

        let parsedDestId = destination_id;
        if (parsedDestId === 'null' || parsedDestId === 'undefined' || parsedDestId === '' || parsedDestId === undefined) parsedDestId = null;

        await sequelize.query(`
            UPDATE services 
            SET service_name = ?, service_type = ?, description = ?, image_url = ?, partner_id = ?, destination_id = ?, unit = ?, base_cost = ?, selling_price = ?, attributes = ?, status = ?
            WHERE service_id = ?
        `, { replacements: [
            service_name || '', service_type || 'Khách sạn', description || '', finalImageUrl, 
            parsedPartnerId, parsedDestId, unit || null, 
            base_cost || 0, selling_price || 0, 
            attributes || '{}', status || 'Active', id
        ], transaction: t });
        
        if (service_type === 'Hotel' || service_type === 'Khách sạn' || service_type === 'Accommodation') {
            await sequelize.query(`
                INSERT INTO hotel_service_details (service_id, max_adults, max_children, max_infants, min_adults, single_room_allowed, single_room_supplement, room_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE max_adults=VALUES(max_adults), max_children=VALUES(max_children), max_infants=VALUES(max_infants), min_adults=VALUES(min_adults), single_room_allowed=VALUES(single_room_allowed), single_room_supplement=VALUES(single_room_supplement)
            `, { replacements: [
                id, 
                max_adults !== undefined ? max_adults : 2,
                max_children !== undefined ? max_children : 2,
                max_infants !== undefined ? max_infants : 1,
                min_adults !== undefined ? min_adults : 1,
                single_room_allowed !== undefined ? single_room_allowed : 1,
                single_room_supplement || 0,
                service_name || 'Standard'
            ], transaction: t });
        } else if (service_type === 'Vehicle' || service_type === 'Transport' || service_type === 'Xe vận chuyển') {
            await sequelize.query(`
                INSERT INTO vehicle_service_details (service_id, seat_capacity, vehicle_type)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE seat_capacity=VALUES(seat_capacity)
            `, { replacements: [
                id, capacity || 0, service_name || ''
            ], transaction: t });
        }

        

        await t.commit();
        res.status(200).json({ success: true, message: 'Cập nhật Dịch vụ thành công!' });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        // Gỡ đăng bán (đổi status = Inactive) thay vì xóa cứng
        await sequelize.query("UPDATE services SET status = 'Inactive' WHERE service_id = ?", { replacements: [id] });
        
        
        res.status(200).json({ success: true, message: 'Đã gỡ đăng bán dịch vụ!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

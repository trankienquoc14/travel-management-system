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
        // Câu lệnh SQL mới cực kỳ tối giản, không còn JOIN rườm rà
        const [services] = await sequelize.query(`
            SELECT s.*, p.partner_name, d.destination_name
            FROM services s
            LEFT JOIN partners p ON s.partner_id = p.partner_id
            LEFT JOIN travel_management.destinations d ON s.destination_id = d.destination_id
            ORDER BY s.service_id DESC
        `);

        res.status(200).json({ success: true, data: services });
    } catch (error) {
        console.error("Lỗi API get services:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createService = async (req, res) => {
    try {
        const { service_name, service_type, description, status, partner_id, destination_id, unit, base_cost, selling_price, capacity, attributes } = req.body;

        let finalImageUrl = '';
        if (req.file) finalImageUrl = `/uploads/${req.file.filename}`;

        await sequelize.query(`
            INSERT INTO services (service_name, service_type, description, image_url, partner_id, destination_id, unit, base_cost, selling_price, capacity, attributes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, { replacements: [
            service_name || '', service_type || 'Khách sạn', description || '', finalImageUrl, 
            partner_id || null, destination_id || null, unit || null, 
            base_cost || 0, selling_price || 0, capacity || 0, 
            attributes || '{}', status || 'Active'
        ] });

        res.status(201).json({ success: true, message: 'Thêm Dịch vụ thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { service_name, service_type, description, status, partner_id, destination_id, unit, base_cost, selling_price, capacity, attributes, existing_image_url } = req.body;

        let finalImageUrl = existing_image_url || '';
        if (req.file) finalImageUrl = `/uploads/${req.file.filename}`;

        await sequelize.query(`
            UPDATE services 
            SET service_name = ?, service_type = ?, description = ?, image_url = ?, partner_id = ?, destination_id = ?, unit = ?, base_cost = ?, selling_price = ?, capacity = ?, attributes = ?, status = ?
            WHERE service_id = ?
        `, { replacements: [
            service_name || '', service_type || 'Khách sạn', description || '', finalImageUrl, 
            partner_id || null, destination_id || null, unit || null, 
            base_cost || 0, selling_price || 0, capacity || 0, 
            attributes || '{}', status || 'Active', id
        ] });

        res.status(200).json({ success: true, message: 'Cập nhật Dịch vụ thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params;
        await sequelize.query('DELETE FROM services WHERE service_id = ?', { replacements: [id] });
        res.status(200).json({ success: true, message: 'Xóa Dịch vụ thành công!' });
    } catch (error) {
        if (error.original && error.original.errno === 1451) {
            return res.status(400).json({ success: false, message: 'Không thể xóa vì Dịch vụ đang liên kết với dữ liệu khác!' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};
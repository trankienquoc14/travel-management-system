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
            SELECT service_id, service_name, service_type, description, status 
            FROM services 
            ORDER BY service_id DESC
        `);

        res.status(200).json({ success: true, data: services });
    } catch (error) {
        console.error("Lỗi API get services:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createService = async (req, res) => {
    try {
        const { service_name, service_type, description, status, price, partner_id } = req.body;

        let finalImageUrl = '';
        if (req.file) finalImageUrl = `/uploads/${req.file.filename}`;

        await sequelize.query(`
            INSERT INTO services (service_name, service_type, description, image_url, price, partner_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, { replacements: [service_name, service_type, description, finalImageUrl, price, partner_id || null, status] });

        res.status(201).json({ success: true, message: 'Thêm Dịch vụ thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const { service_name, service_type, description, status, price, partner_id, existing_image_url } = req.body;

        let finalImageUrl = existing_image_url || '';
        if (req.file) finalImageUrl = `/uploads/${req.file.filename}`;

        await sequelize.query(`
            UPDATE services 
            SET service_name = ?, service_type = ?, description = ?, image_url = ?, price = ?, partner_id = ?, status = ?
            WHERE service_id = ?
        `, { replacements: [service_name, service_type, description, finalImageUrl, price, partner_id || null, status, id] });

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
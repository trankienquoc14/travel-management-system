const sequelize = require('../config/database');

// Lấy danh sách địa điểm theo điểm đến (Dùng cho Staff Thiết kế Tour)
exports.getPlacesByDestination = async (req, res) => {
    try {
        const { destination_id } = req.query;
        if (!destination_id) {
            return res.status(400).json({ success: false, message: 'Thiếu destination_id' });
        }

        const [places] = await sequelize.query(`
            SELECT p.*, pt.partner_name 
            FROM places p
            LEFT JOIN partners pt ON p.partner_id = pt.partner_id
            WHERE p.destination_id = ? AND p.status = 'Active'
        `, { replacements: [destination_id] });
        
        res.status(200).json({ success: true, data: places });
    } catch (error) {
        console.error("Lỗi khi tải địa điểm:", error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Lấy TẤT CẢ địa điểm (Kèm thông tin Nhà cung cấp và Điểm đến) - Dành cho Quản lý
exports.getAllPlaces = async (req, res) => {
    try {
        const [places] = await sequelize.query(`
            SELECT p.*, d.destination_name, pt.partner_name 
            FROM places p
            LEFT JOIN destinations d ON p.destination_id = d.destination_id
            LEFT JOIN partners pt ON p.partner_id = pt.partner_id
            ORDER BY p.place_id DESC
        `);
        res.status(200).json({ success: true, data: places });
    } catch (error) {
        console.error("Lỗi tải toàn bộ địa điểm:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Thêm địa điểm mới
exports.createPlace = async (req, res) => {
    try {
        const { destination_id, partner_id, place_name, category, description, estimated_price, status } = req.body;
        
        let finalImageUrl = req.body.image_url || '';
        if (req.file) finalImageUrl = `/uploads/${req.file.filename}`;

        const [result] = await sequelize.query(`
            INSERT INTO places (destination_id, partner_id, place_name, category, description, estimated_price, image_url, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, { 
            replacements: [
                destination_id || null, 
                partner_id || null, 
                place_name, 
                category || 'Tham quan', 
                description || '', 
                estimated_price || 0, 
                image_url || '', 
                status || 'Active'
            ] 
        });

        res.status(201).json({ success: true, message: 'Thêm địa điểm thành công', place_id: result.insertId });
    } catch (error) {
        console.error("Lỗi thêm địa điểm:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Cập nhật địa điểm
exports.updatePlace = async (req, res) => {
    try {
        const { id } = req.params;
        const { destination_id, partner_id, place_name, category, description, estimated_price, status } = req.body;

        let finalImageUrl = req.body.image_url || req.body.existing_image_url || '';
        if (req.file) finalImageUrl = `/uploads/${req.file.filename}`;

        await sequelize.query(`
            UPDATE places 
            SET destination_id=?, partner_id=?, place_name=?, category=?, description=?, estimated_price=?, image_url=?, status=?
            WHERE place_id=?
        `, { 
            replacements: [
                destination_id || null, 
                partner_id || null, 
                place_name, 
                category, 
                description, 
                estimated_price, 
                finalImageUrl, 
                status, 
                id
            ] 
        });

        res.status(200).json({ success: true, message: 'Cập nhật địa điểm thành công' });
    } catch (error) {
        console.error("Lỗi cập nhật địa điểm:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Xóa địa điểm
exports.deletePlace = async (req, res) => {
    try {
        const { id } = req.params;
        await sequelize.query(`DELETE FROM places WHERE place_id=?`, { replacements: [id] });
        res.status(200).json({ success: true, message: 'Xóa địa điểm thành công' });
    } catch (error) {
        console.error("Lỗi xóa địa điểm:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

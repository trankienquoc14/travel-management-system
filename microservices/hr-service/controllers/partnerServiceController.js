const sequelize = require('../config/database');

// 1. Lấy danh sách dịch vụ TRONG KHO CỦA ĐỐI TÁC
exports.getMyInventory = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId || req.user?.user_id;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Lỗi Token!' });
        }

        // Đã sửa: Nối bảng qua u.email = p.email 
        const [services] = await sequelize.query(`
            SELECT ps.*, s.service_name, s.service_type, ps.unit_price as price
            FROM partner_services ps
            JOIN services s ON ps.service_id = s.service_id
            JOIN partners p ON ps.partner_id = p.partner_id
            JOIN users u ON u.email = p.email
            WHERE u.user_id = ?
            ORDER BY ps.partner_service_id DESC
        `, { replacements: [userId] });

        res.status(200).json({ success: true, data: services });
    } catch (error) {
        console.error("Lỗi getMyInventory:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Đối tác gửi yêu cầu duyệt Dịch vụ mới
exports.addServiceToInventory = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId || req.user?.user_id;
        const { service_name, service_type, description, unit, capacity, price, available_quantity, destination_id } = req.body;

        if (!service_name || !price || !available_quantity) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền tên dịch vụ, giá và số lượng!' });
        }

        const [partner] = await sequelize.query(`
            SELECT p.partner_id 
            FROM users u
            LEFT JOIN partners p ON u.email = p.email
            WHERE u.user_id = ?
            LIMIT 1
        `, { replacements: [userId] });

        if (!partner || partner.length === 0 || !partner[0].partner_id) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản của bạn chưa được liên kết với Đối tác nào.'
            });
        }
        const partner_id = partner[0].partner_id;

        let finalImageUrl = '';
        if (req.file) {
            finalImageUrl = `/uploads/${req.file.filename}`;
        }

        // Bước 1: Tạo một Master Service ở trạng thái Pending (Chờ duyệt)
        const [insertId, metadata] = await sequelize.query(`
            INSERT INTO services (service_name, service_type, description, image_url, partner_id, destination_id, unit, base_cost, selling_price, capacity, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
        `, { replacements: [
            service_name, service_type || 'Khách sạn', description || '', finalImageUrl, partner_id,
            destination_id || null, unit || '', 0, 0, capacity || 0
        ] });
        const newServiceId = insertId;

        // Bước 2: Thêm vào kho của đối tác với trạng thái Pending
        await sequelize.query(`
            INSERT INTO partner_services (partner_id, service_id, unit_price, available_quantity, status)
            VALUES (?, ?, ?, ?, 'Pending')
        `, { replacements: [partner_id, newServiceId, price, available_quantity] });

        res.status(201).json({ success: true, message: 'Đã gửi yêu cầu thêm dịch vụ mới! Đang chờ Quản lý duyệt.' });
    } catch (error) {
        console.error("Lỗi addServiceToInventory:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. XÓA CỨNG (Vì bảng partner_services của bạn chưa có cột status)
exports.deletePartnerService = async (req, res) => {
    try {
        const { id } = req.params;

        // Xóa hẳn khỏi database
        const [result] = await sequelize.query(`
            DELETE FROM partner_services 
            WHERE partner_service_id = ?
        `, { replacements: [id] });

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ!' });
        }

        res.status(200).json({ success: true, message: 'Đã gỡ dịch vụ khỏi kệ!' });
    } catch (error) {
        console.error("Lỗi deleteService:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// 4. Đối tác Cập nhật Giá và Số lượng
exports.updatePartnerService = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId || req.user?.user_id;
        const { id } = req.params; // partner_service_id
        const { price, available_quantity } = req.body;

        if (!price || !available_quantity) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đủ Giá và Số lượng!' });
        }

        // 1. Kiểm tra quyền sở hữu
        const [rows] = await sequelize.query(`
            SELECT ps.partner_service_id 
            FROM partner_services ps
            JOIN partners p ON ps.partner_id = p.partner_id
            JOIN users u ON u.email = p.email
            WHERE ps.partner_service_id = ? AND u.user_id = ?
        `, { replacements: [id, userId] });

        if (rows.length === 0) {
            return res.status(403).json({ success: false, message: 'Không thể sửa! Dịch vụ này không thuộc về bạn.' });
        }

        // 2. Cập nhật dữ liệu
        await sequelize.query(`
            UPDATE partner_services 
            SET unit_price = ?, available_quantity = ?
            WHERE partner_service_id = ?
        `, { replacements: [price, available_quantity, id] });

        res.status(200).json({ success: true, message: 'Đã cập nhật giá và số lượng thành công!' });
    } catch (error) {
        console.error("Lỗi updateService:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// =========================================================================
// 5. API DÀNH CHO KHÁCH HÀNG: Lấy Khách sạn (theo tỉnh) & Xe (Toàn quốc)
// =========================================================================
exports.getServicesByDestination = async (req, res) => {
    try {
        const { destination_id } = req.query;

        // Lấy KS ở tỉnh đó HOẶC Xe cộ toàn quốc (NULL)
        let query = `
            SELECT ps.partner_service_id, p.partner_name, p.partner_type, s.service_name, s.image_url, ps.unit_price as price
            FROM partner_services ps
            JOIN partners p ON ps.partner_id = p.partner_id
            JOIN services s ON ps.service_id = s.service_id
            WHERE p.status = 'Active' AND ps.status = 'Active'
        `;
        let replacements = [];

        if (destination_id) {
            query += ` AND (p.destination_id = ? OR p.destination_id IS NULL)`;
            replacements.push(destination_id);
        } else {
            query += ` AND p.destination_id IS NULL`;
        }

        const [services] = await sequelize.query(query, { replacements });

        res.status(200).json({ success: true, data: services });
    } catch (error) {
        console.error("Lỗi getServicesByDestination:", error);
        res.status(500).json({ success: false, message: 'Lỗi server khi tải dịch vụ' });
    }
};
const sequelize = require('../config/database');

// 1. Lấy danh sách tất cả các Tour cố định (Cho màn hình chính)
exports.getAllFixedTours = async (req, res) => {
    try {
        const [tours] = await sequelize.query(`
            SELECT tour_id, tour_name, destination, duration_days, status, base_price 
            FROM tours 
            ORDER BY tour_id DESC
        `);
        res.status(200).json({ success: true, data: tours });
    } catch (error) {
        console.error("Lỗi lấy danh sách tour:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Lấy chi tiết 1 Tour để nhân viên sửa (Bao gồm dữ liệu kéo thả)
exports.getFixedTourById = async (req, res) => {
    try {
        const { id } = req.params;
        const [tours] = await sequelize.query(`
            SELECT * FROM tours WHERE tour_id = ?
        `, { replacements: [id] });

        if (tours.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tour' });
        }

        res.status(200).json({ success: true, data: tours[0] });
    } catch (error) {
        console.error("Lỗi lấy chi tiết tour:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// Thay thế toàn bộ hàm getDestinationResources bằng đoạn này:
exports.getDestinationResources = async (req, res) => {
    try {
        const { destination } = req.query;

        if (!destination) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp điểm đến (destination)' });
        }

        // 1. LẤY ĐỊA ĐIỂM THAM QUAN
        const [places] = await sequelize.query(`
            SELECT CONCAT('place_', p.place_id) as id, p.place_name as name, '🎟️ Tham quan' as type, p.estimated_price as price 
            FROM places p
            JOIN destinations d ON p.destination_id = d.destination_id
            WHERE d.destination_name LIKE ?
        `, { replacements: [`%${destination}%`] });

        // 2. LẤY KHÁCH SẠN
        const [hotels] = await sequelize.query(`
            SELECT CONCAT('hotel_', ps.partner_service_id) as id, CONCAT(p.partner_name, ' - ', s.service_name) as name, '🏨 Lưu trú' as type, ps.unit_price as price
            FROM partner_services ps
            JOIN partners p ON ps.partner_id = p.partner_id
            JOIN services s ON ps.service_id = s.service_id
            JOIN destinations d ON p.destination_id = d.destination_id
            WHERE p.partner_type = 'Hotel' AND d.destination_name LIKE ?
        `, { replacements: [`%${destination}%`] });

        // 3. LẤY XE & MÁY BAY
        const [transports] = await sequelize.query(`
            SELECT CONCAT('transport_', ps.partner_service_id) as id, CONCAT(p.partner_name, ' - ', s.service_name) as name, '✈️ Di chuyển' as type, ps.unit_price as price
            FROM partner_services ps
            JOIN partners p ON ps.partner_id = p.partner_id
            JOIN services s ON ps.service_id = s.service_id
            WHERE p.partner_type = 'Transport'
        `);

        res.status(200).json({
            success: true,
            data: { sightseeing: places || [], accommodation: hotels || [], transport: transports || [] }
        });
    } catch (error) {
        console.error("Lỗi lấy tài nguyên thiết kế tour:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// destinationController.js
exports.getAllDestinations = async (req, res) => {
    try {
        const [rows] = await sequelize.query(`
            SELECT destination_id, destination_name
            FROM destinations
            ORDER BY destination_name
        `);

        res.json({
            success: true,
            data: rows
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
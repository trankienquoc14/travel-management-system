const sequelize = require('../config/database');

exports.getAllDestinations = async (req, res) => {
    try {
        const [destinations] = await sequelize.query(
            "SELECT destination_id, destination_name FROM destinations WHERE status = 'Active'"
        );
        res.status(200).json({ success: true, data: destinations });
    } catch (error) {
        console.error("Lỗi khi tải danh sách điểm đến:", error);
        res.status(500).json({ success: false, message: 'Không thể tải dữ liệu điểm đến' });
    }
};
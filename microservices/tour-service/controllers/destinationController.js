const sequelize = require('../config/database');

exports.getAllDestinations = async (req, res) => {
    try {
        const [destinations] = await sequelize.query(
            "SELECT destination_id, destination_name, description, slogan FROM destinations WHERE status = 'Active' ORDER BY destination_name ASC"
        );
        res.status(200).json({ success: true, data: destinations });
    } catch (error) {
        console.error("Lỗi khi tải danh sách điểm đến:", error);
        res.status(500).json({ success: false, message: 'Không thể tải dữ liệu điểm đến' });
    }
};
const sequelize = require('../config/database');

exports.getPlacesByDestination = async (req, res) => {
    try {
        const { destination_id } = req.query;
        if (!destination_id) {
            return res.status(400).json({ success: false, message: 'Thiếu destination_id' });
        }

        const [places] = await sequelize.query(
            "SELECT * FROM places WHERE destination_id = ? AND status = 'Active'",
            { replacements: [destination_id] }
        );
        res.status(200).json({ success: true, data: places });
    } catch (error) {
        console.error("Lỗi khi tải địa điểm:", error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
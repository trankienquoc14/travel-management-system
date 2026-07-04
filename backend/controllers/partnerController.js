const sequelize = require('../config/database');

// Lấy danh sách đối tác
exports.getAllPartners = async (req, res) => {
    try {
        const [partners] = await sequelize.query(`
            SELECT *
            FROM partners
            ORDER BY partner_id DESC
        `);

        res.status(200).json({
            success: true,
            data: partners
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Thêm đối tác
exports.createPartner = async (req, res) => {
    try {

        const {
            partner_name,
            partner_type,
            contact_name,
            phone,
            email,
            address,
            status
        } = req.body;

        await sequelize.query(`
            INSERT INTO partners
            (
                partner_name,
                partner_type,
                contact_name,
                phone,
                email,
                address,
                status
            )
            VALUES
            (
                ?, ?, ?, ?, ?, ?, ?
            )
        `, {
            replacements: [
                partner_name,
                partner_type,
                contact_name,
                phone,
                email,
                address,
                status
            ]
        });

        res.status(201).json({
            success: true,
            message: "Thêm đối tác thành công!"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};

// Cập nhật đối tác
exports.updatePartner = async (req, res) => {

    try {

        const { id } = req.params;

        const {
            partner_name,
            partner_type,
            contact_name,
            phone,
            email,
            address,
            status
        } = req.body;

        await sequelize.query(`
            UPDATE partners
            SET
                partner_name=?,
                partner_type=?,
                contact_name=?,
                phone=?,
                email=?,
                address=?,
                status=?
            WHERE partner_id=?
        `, {
            replacements: [
                partner_name,
                partner_type,
                contact_name,
                phone,
                email,
                address,
                status,
                id
            ]
        });

        res.status(200).json({
            success: true,
            message: "Cập nhật đối tác thành công!"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// Xóa đối tác
exports.deletePartner = async (req, res) => {
    try {

        const { id } = req.params;

        await sequelize.query(
            "DELETE FROM partners WHERE partner_id = ?",
            {
                replacements: [id]
            }
        );

        res.status(200).json({
            success: true,
            message: "Xóa đối tác thành công!"
        });

    } catch (error) {

        // Lỗi khóa ngoại
        if (error.original && error.original.errno === 1451) {

            return res.status(400).json({
                success: false,
                message: "Không thể xóa đối tác vì đang được sử dụng trong các dịch vụ."
            });

        }

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};
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

// 3. Lưu bản thiết kế Tour Cố Định (Tạo mới hoặc Cập nhật)
// Hàm lưu Thiết kế Tour Cố định của Nhân viên Văn phòng
exports.saveFixedTourDesign = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const userId = req.user?.id || req.user?.user_id;

        // 1. Nhận toàn bộ dữ liệu từ form (Bao gồm cả design_data)
        const {
            tour_id, tour_name, destination, duration_days, base_price, description,
            status = 'Pending', base_cost = 0, markup_percent = 20, design_data = null
        } = req.body;

        const itineraryDays = req.body.itineraryDays ? JSON.parse(req.body.itineraryDays) : [];
        let targetTourId = tour_id && tour_id !== 'null' ? Number(tour_id) : null;

        // Xử lý upload ảnh nếu có
        let finalImageUrl = req.body.existing_image_url || '';
        if (req.file) finalImageUrl = `/uploads/${req.file.filename}`;

        // 2. LƯU VÀO BẢNG TOURS
        if (targetTourId) {
            await sequelize.query(`
                UPDATE tours 
                SET tour_name=?, destination=?, duration_days=?, base_price=?, base_cost=?, markup_percent=?, description=?, image_url=?, status=?, design_data=? 
                WHERE tour_id=?
            `, { replacements: [tour_name, destination, duration_days, base_price, base_cost, markup_percent, description, finalImageUrl, status, design_data, targetTourId], transaction });
        } else {
            const [insertResult] = await sequelize.query(`
                INSERT INTO tours (tour_name, destination, duration_days, base_price, base_cost, markup_percent, description, image_url, status, created_by, design_data)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, { replacements: [tour_name, destination, duration_days, base_price, base_cost, markup_percent, description, finalImageUrl, status, userId, design_data], transaction });
            targetTourId = insertResult;
        }

        // 3. XÓA LỊCH TRÌNH CŨ (Nếu đang sửa tour)
        const [oldItins] = await sequelize.query(`SELECT itinerary_id FROM itineraries WHERE tour_id=?`, { replacements: [targetTourId], transaction });
        for (let old of oldItins) {
            await sequelize.query(`DELETE FROM itinerary_places WHERE itinerary_id=?`, { replacements: [old.itinerary_id], transaction });
        }
        await sequelize.query(`DELETE FROM itineraries WHERE tour_id=?`, { replacements: [targetTourId], transaction });

        // 4. LƯU LỊCH TRÌNH MỚI VÀ CHẶN LỖI (QUAN TRỌNG NHẤT)
        for (let day of itineraryDays) {
            // Lưu tiêu đề và đoạn text mô tả của ngày đó
            const [itinRes] = await sequelize.query(`
                INSERT INTO itineraries (tour_id, day_number, title, description) VALUES (?, ?, ?, ?)
            `, { replacements: [targetTourId, day.day_number, day.title, day.description || ''], transaction });

            const newItinId = Number(itinRes);

            if (day.places && day.places.length > 0) {
                for (let [idx, pl] of day.places.entries()) {
                    const pid = Number(pl.place_id);

                    // CHỐT CHẶN: Chỉ lưu vào DB nếu pid là Số thật sự (Tránh lỗi foreign key constraint fails)
                    if (pid && !isNaN(pid) && pid > 0) {
                        await sequelize.query(`
                            INSERT INTO itinerary_places (itinerary_id, place_id, visit_order, visit_time) VALUES (?, ?, ?, ?)
                        `, { replacements: [newItinId, pid, pl.visit_order || idx + 1, pl.visit_time || '08:00'], transaction });
                    }
                }
            }
        }

        await transaction.commit();
        res.status(200).json({ success: true, message: '🎉 Lưu bản thiết kế Tour thành công!', tour_id: targetTourId });
    } catch (error) {
        await transaction.rollback();
        console.error("LỖI LƯU TOUR (STAFF):", error);
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
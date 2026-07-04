const sequelize = require('../config/database');

exports.createCustomRequest = async (req, res) => {
    try {
        // Lấy ID của khách hàng đang đăng nhập
        const customerId = req.user?.id || req.user?.userId || req.user?.user_id;

        const {
            destination,
            departure_date,
            return_date,
            people_count,
            budget,
            preferences // Rổ sở thích dạng Object (JSON) từ Frontend gửi lên
        } = req.body;

        if (!customerId) {
            return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để gửi yêu cầu!' });
        }

        // Đóng gói rổ sở thích thành một chuỗi JSON chuẩn để lưu vào cột requirements
        const requirementsString = JSON.stringify(preferences);

        // Lưu vào cơ sở dữ liệu
        await sequelize.query(`
            INSERT INTO custom_tour_requests 
            (customer_id, destination, departure_date, return_date, people_count, budget, requirements, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
        `, {
            replacements: [
                customerId, destination, departure_date, return_date,
                people_count, budget, requirementsString
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Đã gửi yêu cầu thiết kế Tour thành công! Chuyên viên của chúng tôi sẽ liên hệ sớm.'
        });
    } catch (error) {
        console.error("Lỗi khi tạo Custom Tour Request:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// 1. Lấy danh sách yêu cầu (Dành cho Nhân viên/Admin)
exports.getAllRequests = async (req, res) => {
    try {
        // Sửa c.user_id thành c.customer_id cho khớp với hình ảnh bảng dữ liệu của bạn
        const [requests] = await sequelize.query(`
            SELECT c.*, u.full_name as customer_name, u.phone as customer_phone
            FROM custom_tour_requests c
            LEFT JOIN users u ON c.customer_id = u.user_id
            ORDER BY c.created_at DESC
        `);

        const formattedRequests = requests.map(req => ({
            ...req,
            // Đảm bảo parse đúng requirements (tùy theo cột bạn lưu JSON là preferences hay requirements)
            preferences: typeof req.requirements === 'string' ? JSON.parse(req.requirements) : req.requirements
        }));

        res.status(200).json({ success: true, data: formattedRequests });
    } catch (error) {
        console.error("Lỗi lấy danh sách yêu cầu:", error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// 2. Nhân viên cập nhật Yêu cầu (Dùng chung cho Lưu Nháp và Gửi Báo giá)
exports.quoteRequest = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const staffId = req.user?.id || req.user?.userId || req.user?.user_id;

        // Frontend truyền thêm approval_status (Pending hoặc Pending_Approval)
        const { base_cost, quoted_price, markup_percent, proposed_itinerary, staff_note, approval_status } = req.body;

        // Trạng thái mặc định nếu frontend không gửi là Pending (Nháp)
        const currentApprovalStatus = approval_status || 'Pending';

        // 1. Cập nhật trạng thái Yêu cầu gốc thành 'Processing' (Đang xử lý nội bộ)
        await sequelize.query(`
            UPDATE custom_tour_requests SET status = 'Processing' WHERE request_id = ?
        `, { replacements: [id], transaction });

        // 2. Kiểm tra xem có bản báo giá nào đang là Nháp (Pending) hoặc đang bị Quản lý bắt sửa (Rejected) không
        const [existingQuotes] = await sequelize.query(`
            SELECT quote_id FROM custom_tour_quotes 
            WHERE request_id = ? AND approval_status IN ('Pending', 'Pending_Approval', 'Rejected', 'Customer_Revision')
            ORDER BY quote_id DESC LIMIT 1
        `, { replacements: [id], transaction });

        if (existingQuotes.length > 0) {
            // Update bản thiết kế hiện tại và chuyển trạng thái (lên Pending_Approval nếu nhân viên bấm gửi)
            await sequelize.query(`
                UPDATE custom_tour_quotes 
                SET staff_id = ?, base_cost = ?, markup_percent = ?, quote_price = ?, itinerary = ?, staff_note = ?, approval_status = ?
                WHERE quote_id = ?
            `, { replacements: [staffId, base_cost || 0, markup_percent || 20, quoted_price || 0, proposed_itinerary || '', staff_note || '', currentApprovalStatus, existingQuotes[0].quote_id], transaction });
        } else {
            // Tạo bản báo giá mới (Version mới)
            await sequelize.query(`
                INSERT INTO custom_tour_quotes (request_id, staff_id, base_cost, markup_percent, quote_price, itinerary, staff_note, approval_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, { replacements: [id, staffId, base_cost || 0, markup_percent || 20, quoted_price || 0, proposed_itinerary || '', staff_note || '', currentApprovalStatus], transaction });
        }

        await transaction.commit();
        res.status(200).json({ success: true, message: currentApprovalStatus === 'Pending_Approval' ? 'Đã gửi quản lý phê duyệt!' : 'Đã lưu nháp bản thiết kế!' });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Quản lý DUYỆT bản thiết kế
exports.approveRequest = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const managerId = req.user?.id || req.user?.userId || req.user?.user_id;

        await sequelize.query(`UPDATE custom_tour_requests SET status = 'Processing' WHERE request_id = ?`, { replacements: [id], transaction });

        // CHÚ Ý ĐIỂM NÀY: Chỉ duyệt những bản đang 'Pending_Approval'
        await sequelize.query(`
            UPDATE custom_tour_quotes SET approval_status = 'Approved', manager_id = ? 
            WHERE request_id = ? AND approval_status = 'Pending_Approval'
        `, { replacements: [managerId, id], transaction });

        await transaction.commit();
        res.status(200).json({ success: true, message: 'Đã duyệt báo giá!' });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Quản lý TỪ CHỐI bản thiết kế
exports.rejectRequest = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { note } = req.body;
        const managerId = req.user?.id || req.user?.userId || req.user?.user_id;

        await sequelize.query(`UPDATE custom_tour_requests SET status = 'Processing' WHERE request_id = ?`, { replacements: [id], transaction });

        // Tương tự, chỉ từ chối những bản đang 'Pending_Approval'
        await sequelize.query(`
            UPDATE custom_tour_quotes SET approval_status = 'Rejected', manager_id = ?, manager_note = ? 
            WHERE request_id = ? AND approval_status = 'Pending_Approval'
        `, { replacements: [managerId, note, id], transaction });

        await transaction.commit();
        res.status(200).json({ success: true, message: 'Đã từ chối và bắt làm lại!' });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};
// Lấy danh sách yêu cầu của 1 khách hàng cụ thể
// Lấy danh sách cho Nhân viên (JOIN lấy bản báo giá mới nhất)
// 1. Lấy danh sách cho Nhân viên/Admin (Lấy dữ liệu từ Request, join lấy bản Quote mới nhất)
exports.getAllRequests = async (req, res) => {
    try {
        const [requests] = await sequelize.query(`
            SELECT 
                r.request_id, r.customer_id, r.destination, r.departure_date, r.return_date, 
                r.people_count, r.budget, r.requirements, r.status, r.created_at,
                u.full_name as customer_name, u.phone as customer_phone,
                q.quote_id, q.base_cost, q.markup_percent, q.quote_price as quoted_price, 
                q.itinerary as proposed_itinerary, q.staff_note, q.manager_note, q.approval_status
            FROM custom_tour_requests r
            LEFT JOIN users u ON r.customer_id = u.user_id
            LEFT JOIN (
                SELECT q1.* FROM custom_tour_quotes q1
                INNER JOIN (SELECT MAX(quote_id) as max_id FROM custom_tour_quotes GROUP BY request_id) q2 
                ON q1.quote_id = q2.max_id
            ) q ON r.request_id = q.request_id
            ORDER BY r.created_at DESC
        `);

        const formattedRequests = requests.map(req => ({
            ...req,
            preferences: typeof req.requirements === 'string' ? JSON.parse(req.requirements) : req.requirements
        }));

        res.status(200).json({ success: true, data: formattedRequests });
    } catch (error) {
        console.error("Lỗi getAllRequests:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Lấy danh sách cho Khách hàng (Chỉ lấy những thông tin cần thiết)
// GET /api/custom-tours/requests (Dành cho Staff xem các thiết kế của mình)
exports.getCustomerRequests = async (req, res) => {
    try {
        const { customerId } = req.params;
        const [requests] = await sequelize.query(`
            SELECT 
                -- 1. LẤY ĐẦY ĐỦ THÔNG TIN YÊU CẦU GỐC CỦA KHÁCH HÀNG
                r.request_id, 
                r.customer_id,
                r.destination, 
                r.departure_date,   -- 👈 Khắc phục lỗi Invalid Date
                r.return_date,      -- 👈 Khắc phục lỗi Invalid Date
                r.people_count, 
                r.budget,           -- 👈 Khắc phục lỗi Ngân sách 0 đ
                r.status, 
                r.created_at,
                
                -- 2. LẤY THÔNG TIN BẢN BÁO GIÁ MỚI NHẤT (NẾU CÓ)
                q.quote_id,
                q.quote_price AS quoted_price, 
                q.itinerary AS proposed_itinerary, 
                q.staff_note, 
                q.manager_note, 
                q.approval_status
            FROM custom_tour_requests r
            LEFT JOIN (
                SELECT q1.* FROM custom_tour_quotes q1
                INNER JOIN (SELECT MAX(quote_id) AS max_id FROM custom_tour_quotes GROUP BY request_id) q2 
                ON q1.quote_id = q2.max_id
            ) q ON r.request_id = q.request_id
            WHERE r.customer_id = ? 
            ORDER BY r.created_at DESC
        `, { replacements: [customerId] });

        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        console.error("Lỗi getCustomerRequests:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// 3. THÊM HÀM LẤY DANH SÁCH CHO NHÂN VIÊN THIẾT KẾ (getStaffPendingTours)
exports.getStaffPendingTours = async (req, res) => {
    try {
        const [tours] = await sequelize.query(`
            SELECT 
                q.quote_id, q.request_id, q.base_cost, q.markup_percent, q.quote_price AS quoted_price, 
                q.itinerary AS proposed_itinerary, q.approval_status, q.manager_note, q.staff_note, q.created_at,
                r.destination, r.departure_date, r.return_date, r.people_count, r.budget, r.requirements, r.status,
                u.full_name AS customer_name
            FROM custom_tour_quotes q
            INNER JOIN (
                SELECT request_id, MAX(quote_id) AS max_id FROM custom_tour_quotes GROUP BY request_id
            ) latest_q ON q.quote_id = latest_q.max_id
            INNER JOIN custom_tour_requests r ON q.request_id = r.request_id
            INNER JOIN users u ON r.customer_id = u.user_id
            ORDER BY q.created_at DESC
        `);
        res.status(200).json({ success: true, data: tours });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// 5. Gửi thông báo có báo giá cho khách hàng
exports.sendNotification = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;

        const [latestQuote] = await sequelize.query(`
            SELECT quote_id, approval_status FROM custom_tour_quotes WHERE request_id = ? ORDER BY quote_id DESC LIMIT 1
        `, { replacements: [id], transaction });

        if (latestQuote.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'Chưa có bản báo giá nào!' });
        }

        // Cập nhật trạng thái chi tiết vào bảng QUOTES
        await sequelize.query(`
            UPDATE custom_tour_quotes SET approval_status = 'Quote_Sent' WHERE quote_id = ? 
        `, { replacements: [latestQuote[0].quote_id], transaction });

        // Bảng REQUESTS chỉ giữ trạng thái 'Processing' (Đang xử lý)
        await sequelize.query(`
            UPDATE custom_tour_requests SET status = 'Processing' WHERE request_id = ?
        `, { replacements: [id], transaction });

        await transaction.commit();
        res.status(200).json({ success: true, message: 'Đã gửi báo giá mới nhất cho khách hàng!' });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. Cập nhật phản hồi từ khách hàng (Chốt tour hoặc Yêu cầu sửa)
exports.updateCustomerAction = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params; // request_id
        const { status, customer_note } = req.body; // status là 'Customer_Accepted' hoặc 'Customer_Revision'

        // 1. Tìm bản Quote mới nhất đang được gửi cho khách
        const [latestQuote] = await sequelize.query(`
            SELECT quote_id FROM custom_tour_quotes 
            WHERE request_id = ? 
            ORDER BY quote_id DESC LIMIT 1
        `, { replacements: [id], transaction });

        if (latestQuote.length > 0) {
            const quoteId = latestQuote[0].quote_id;

            // 2. Cập nhật trạng thái (và ghi chú nếu có) thẳng vào BẢN QUOTE ĐÓ
            if (status === 'Customer_Revision' && customer_note) {
                await sequelize.query(`
                    UPDATE custom_tour_quotes 
                    SET approval_status = ?, staff_note = CONCAT(IFNULL(staff_note, ''), '\\n\\n[Khách phản hồi]: ', ?)
                    WHERE quote_id = ?
                `, { replacements: [status, customer_note, quoteId], transaction });
            } else {
                await sequelize.query(`
                    UPDATE custom_tour_quotes SET approval_status = ? WHERE quote_id = ?
                `, { replacements: [status, quoteId], transaction });
            }
        }

        // 3. Đồng bộ trạng thái sang bảng Requests
        await sequelize.query(`
            UPDATE custom_tour_requests SET status = ? WHERE request_id = ?
        `, { replacements: [status, id], transaction });

        await transaction.commit();
        res.status(200).json({ success: true, message: 'Cập nhật phản hồi thành công!' });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getDestinationExtraServices = async (req, res) => {
    try {
        const { destination } = req.params;

        const [places] = await sequelize.query(`
            SELECT CONCAT('place_', place_id) AS id,
                CASE WHEN category = 'Tham quan' THEN '🎟️ Tham quan' WHEN category = 'Vui chơi' THEN '🎡 Vui chơi' ELSE '🍽️ Ăn uống' END AS type,
                place_name AS name, estimated_price AS price
            FROM places WHERE status = 'Active' AND (destination = ? OR ? = '' OR destination IS NULL)
        `, { replacements: [destination, destination] });

        const [accommodations] = await sequelize.query(`
            SELECT CONCAT('srv_', service_id) AS id, '🏨 Lưu trú' AS type, service_name AS name, 0 AS price FROM services WHERE status = 'Active' AND service_type = 'Hotel'
        `);

        const [transports] = await sequelize.query(`
            SELECT CONCAT('srv_', service_id) AS id, '✈️ Di chuyển' AS type, service_name AS name, 0 AS price FROM services WHERE status = 'Active' AND service_type = 'Transport'
        `);

        res.status(200).json({ success: true, data: { sightseeing: places, accommodation: accommodations, transport: transports } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// POST /api/custom-tours/quotes/:quoteId/book
exports.bookCustomTourQuote = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { quoteId } = req.params;
        const customerId = req.user?.id || req.user?.userId || req.user?.user_id;
        const { payment_method = 'VNPAY' } = req.body;

        if (!customerId) {
            await transaction.rollback();
            return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để đặt tour!' });
        }

        // 1. Lấy thông tin Báo giá và Yêu cầu gốc (Chuẩn theo CSDL số 18)
        const [quotes] = await sequelize.query(`
            SELECT q.*, r.people_count, r.destination, r.departure_date, r.return_date
            FROM custom_tour_quotes q
            INNER JOIN custom_tour_requests r ON q.request_id = r.request_id
            WHERE q.quote_id = ?
        `, { replacements: [quoteId], transaction });

        if (quotes.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy bản báo giá!' });
        }

        const quote = quotes[0];

        if (quote.approval_status !== 'Quote_Sent' && quote.approval_status !== 'Approved') {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'Bản thiết kế này chưa hợp lệ để đặt (Chưa gửi báo giá hoặc đã chốt trước đó)!' });
        }

        // 2. CẬP NHẬT TRẠNG THÁI (ĐÚNG CHUẨN ENUM CSDL 18)
        // Bảng quotes chuyển thành 'Customer_Accepted'
        await sequelize.query(`
            UPDATE custom_tour_quotes SET approval_status = 'Customer_Accepted' WHERE quote_id = ?
        `, { replacements: [quoteId], transaction });

        // Bảng requests chuyển thành 'Completed' (Hoàn thành chu trình thiết kế)
        await sequelize.query(`
            UPDATE custom_tour_requests SET status = 'Completed' WHERE request_id = ?
        `, { replacements: [quote.request_id], transaction });

        // 3. TẠO ĐƠN HÀNG TRONG BẢNG BOOKINGS (booking_status = 'Confirmed', payment_status = 'Unpaid')
        const noteText = `Tour thiết kế riêng: ${quote.destination} (${quote.departure_date} - ${quote.return_date})`;
        const [bookingInsert] = await sequelize.query(`
            INSERT INTO bookings (customer_id, departure_id, quote_id, num_people, booking_date, total_amount, booking_status, payment_status, notes)
            VALUES (?, NULL, ?, ?, NOW(), ?, 'Pending', 'Unpaid', ?)
        `, {
            replacements: [customerId, quoteId, quote.people_count, quote.quote_price, noteText],
            transaction
        });

        const newBookingId = bookingInsert;

        // 4. TRỪ CHỖ DỊCH VỤ TRONG BẢNG partner_services (Inventory Deduction)
        // Quét trong chuỗi JSON itinerary để tìm tên dịch vụ KS/Xe cộ khớp với bảng services -> trừ available_quantity
        try {
            const itineraryData = typeof quote.itinerary === 'string' ? JSON.parse(quote.itinerary) : quote.itinerary;
            const accommodationList = itineraryData?.dragDropState?.fixedServices?.accommodation || [];

            // Tìm và trừ số lượng phòng khách sạn
            for (const acc of accommodationList) {
                if (acc.name) {
                    await sequelize.query(`
                        UPDATE partner_services ps
                        INNER JOIN services s ON ps.service_id = s.service_id
                        SET ps.available_quantity = GREATEST(0, ps.available_quantity - 1)
                        WHERE ? LIKE CONCAT('%', s.service_name, '%')
                    `, { replacements: [acc.name], transaction });
                }
            }
        } catch (err) {
            console.warn("Lưu ý: Không thể parse JSON để trừ chỗ tự động, tiếp tục tạo booking.", err);
        }

        // 5. TẠO PHIẾU CHỜ THANH TOÁN TRONG BẢNG PAYMENTS (payment_status = 'Pending')
        const txnCode = 'TXN_' + Date.now();
        await sequelize.query(`
            INSERT INTO payments (booking_id, payment_method, amount, transaction_code, payment_status)
            VALUES (?, ?, ?, ?, 'Pending')
        `, { replacements: [newBookingId, payment_method, quote.quote_price, txnCode], transaction });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: '🎉 Đặt tour thành công! Đang chuyển hướng đến cổng thanh toán...',
            data: {
                booking_id: newBookingId,
                total_amount: quote.quote_price,
                transaction_code: txnCode
            }
        });

    } catch (error) {
        await transaction.rollback();
        console.error("Lỗi khi tạo Booking Tour Thiết Kế:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
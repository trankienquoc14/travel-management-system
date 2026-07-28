const sequelize = require('../config/database');

exports.createCustomRequest = async (req, res) => {
    try {
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

        const depDate = departure_date || req.body.expected_departure_date || null;
        const retDate = return_date || null;
        const count = people_count || ((req.body.num_adults || 0) + (req.body.num_children || 0)) || 1;
        const estBudget = budget || req.body.estimated_budget || 0;
        const reqObject = preferences || { note: req.body.note || '' };

        const requirementsString = JSON.stringify(reqObject);

        // Lưu vào cơ sở dữ liệu
        await sequelize.query(`
            INSERT INTO custom_tour_requests 
            (customer_id, destination, departure_date, return_date, people_count, budget, requirements, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
        `, {
            replacements: [
                customerId, destination || 'Chưa chọn', depDate, retDate,
                count, estBudget, requirementsString
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Đã gửi yêu cầu thiết kế Tour thành công! Chuyên viên của chúng tôi sẽ liên hệ sớm.'
        });
    } catch (error) {
        console.error("Lá»—i khi táº¡o Custom Tour Request:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// 1. Láº¥y danh sĂ¡ch yĂªu cáº§u (DĂ nh cho NhĂ¢n viĂªn/Admin)
exports.getAllRequests = async (req, res) => {
    try {
        // Sá»­a c.user_id thĂ nh c.customer_id cho khá»›p vá»›i hĂ¬nh áº£nh báº£ng dá»¯ liá»‡u cá»§a báº¡n
        const [requests] = await sequelize.query(`
            SELECT c.*, u.full_name as customer_name, u.phone as customer_phone
            FROM custom_tour_requests c
            LEFT JOIN users u ON c.customer_id = u.user_id
            ORDER BY c.created_at DESC
        `);

        const formattedRequests = requests.map(req => ({
            ...req,
            // Äáº£m báº£o parse Ä‘Ăºng requirements (tĂ¹y theo cá»™t báº¡n lÆ°u JSON lĂ  preferences hay requirements)
            preferences: typeof req.requirements === 'string' ? JSON.parse(req.requirements) : req.requirements
        }));

        res.status(200).json({ success: true, data: formattedRequests });
    } catch (error) {
        console.error("Lá»—i láº¥y danh sĂ¡ch yĂªu cáº§u:", error);
        res.status(500).json({ success: false, message: 'Lá»—i server' });
    }
};

// 2. NhĂ¢n viĂªn cáº­p nháº­t YĂªu cáº§u (DĂ¹ng chung cho LÆ°u NhĂ¡p vĂ  Gá»­i BĂ¡o giĂ¡)
exports.quoteRequest = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const staffId = req.user?.id || req.user?.userId || req.user?.user_id;

        // Frontend truyá»n thĂªm approval_status (Pending hoáº·c Pending_Approval)
        const { base_cost, quoted_price, markup_percent, proposed_itinerary, staff_note, approval_status } = req.body;

        // Tráº¡ng thĂ¡i máº·c Ä‘á»‹nh náº¿u frontend khĂ´ng gá»­i lĂ  Pending (NhĂ¡p)
        const currentApprovalStatus = approval_status || 'Pending';

        // 1. Cáº­p nháº­t tráº¡ng thĂ¡i YĂªu cáº§u gá»‘c thĂ nh 'Processing' (Äang xá»­ lĂ½ ná»™i bá»™)
        await sequelize.query(`
            UPDATE custom_tour_requests SET status = 'Processing' WHERE request_id = ?
        `, { replacements: [id], transaction });

        // 2. Kiá»ƒm tra xem cĂ³ báº£n bĂ¡o giĂ¡ nĂ o Ä‘ang lĂ  NhĂ¡p (Pending) hoáº·c Ä‘ang bá»‹ Quáº£n lĂ½ báº¯t sá»­a (Rejected) khĂ´ng
        const [existingQuotes] = await sequelize.query(`
            SELECT quote_id FROM custom_tour_quotes 
            WHERE request_id = ? AND approval_status IN ('Pending', 'Pending_Approval', 'Rejected', 'Customer_Revision')
            ORDER BY quote_id DESC LIMIT 1
        `, { replacements: [id], transaction });

        if (existingQuotes.length > 0) {
            // Update báº£n thiáº¿t káº¿ hiá»‡n táº¡i vĂ  chuyá»ƒn tráº¡ng thĂ¡i (lĂªn Pending_Approval náº¿u nhĂ¢n viĂªn báº¥m gá»­i)
            await sequelize.query(`
                UPDATE custom_tour_quotes 
                SET staff_id = ?, base_cost = ?, markup_percent = ?, quote_price = ?, itinerary = ?, staff_note = ?, approval_status = ?
                WHERE quote_id = ?
            `, { replacements: [staffId, base_cost || 0, markup_percent || 20, quoted_price || 0, proposed_itinerary || '', staff_note || '', currentApprovalStatus, existingQuotes[0].quote_id], transaction });
        } else {
            // Táº¡o báº£n bĂ¡o giĂ¡ má»›i (Version má»›i)
            await sequelize.query(`
                INSERT INTO custom_tour_quotes (request_id, staff_id, base_cost, markup_percent, quote_price, itinerary, staff_note, approval_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, { replacements: [id, staffId, base_cost || 0, markup_percent || 20, quoted_price || 0, proposed_itinerary || '', staff_note || '', currentApprovalStatus], transaction });
        }

        await transaction.commit();
        res.status(200).json({ success: true, message: currentApprovalStatus === 'Pending_Approval' ? 'ÄĂ£ gá»­i quáº£n lĂ½ phĂª duyá»‡t!' : 'ÄĂ£ lÆ°u nhĂ¡p báº£n thiáº¿t káº¿!' });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Quáº£n lĂ½ DUYá»†T báº£n thiáº¿t káº¿
exports.approveRequest = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const managerId = req.user?.id || req.user?.userId || req.user?.user_id;

        await sequelize.query(`UPDATE custom_tour_requests SET status = 'Processing' WHERE request_id = ?`, { replacements: [id], transaction });

        // CHĂ Ă ÄIá»‚M NĂ€Y: Chá»‰ duyá»‡t nhá»¯ng báº£n Ä‘ang 'Pending_Approval'
        await sequelize.query(`
            UPDATE custom_tour_quotes SET approval_status = 'Approved', manager_id = ? 
            WHERE request_id = ? AND approval_status = 'Pending_Approval'
        `, { replacements: [managerId, id], transaction });

        await transaction.commit();
        res.status(200).json({ success: true, message: 'ÄĂ£ duyá»‡t bĂ¡o giĂ¡!' });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Quáº£n lĂ½ Tá»ª CHá»I báº£n thiáº¿t káº¿
exports.rejectRequest = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { note } = req.body;
        const managerId = req.user?.id || req.user?.userId || req.user?.user_id;

        await sequelize.query(`UPDATE custom_tour_requests SET status = 'Processing' WHERE request_id = ?`, { replacements: [id], transaction });

        // TÆ°Æ¡ng tá»±, chá»‰ tá»« chá»‘i nhá»¯ng báº£n Ä‘ang 'Pending_Approval'
        await sequelize.query(`
            UPDATE custom_tour_quotes SET approval_status = 'Rejected', manager_id = ?, manager_note = ? 
            WHERE request_id = ? AND approval_status = 'Pending_Approval'
        `, { replacements: [managerId, note, id], transaction });

        await transaction.commit();
        res.status(200).json({ success: true, message: 'ÄĂ£ tá»« chá»‘i vĂ  báº¯t lĂ m láº¡i!' });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};
// Láº¥y danh sĂ¡ch yĂªu cáº§u cá»§a 1 khĂ¡ch hĂ ng cá»¥ thá»ƒ
// Láº¥y danh sĂ¡ch cho NhĂ¢n viĂªn (JOIN láº¥y báº£n bĂ¡o giĂ¡ má»›i nháº¥t)
// 1. Láº¥y danh sĂ¡ch cho NhĂ¢n viĂªn/Admin (Láº¥y dá»¯ liá»‡u tá»« Request, join láº¥y báº£n Quote má»›i nháº¥t)
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
        console.error("Lá»—i getAllRequests:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Láº¥y danh sĂ¡ch cho KhĂ¡ch hĂ ng (Chá»‰ láº¥y nhá»¯ng thĂ´ng tin cáº§n thiáº¿t)
// GET /api/custom-tours/requests (DĂ nh cho Staff xem cĂ¡c thiáº¿t káº¿ cá»§a mĂ¬nh)
exports.getCustomerRequests = async (req, res) => {
    try {
        const { customerId } = req.params;
        const [requests] = await sequelize.query(`
            SELECT 
                -- 1. Láº¤Y Äáº¦Y Äá»¦ THĂ”NG TIN YĂU Cáº¦U Gá»C Cá»¦A KHĂCH HĂ€NG
                r.request_id, 
                r.customer_id,
                r.destination, 
                r.departure_date,   -- đŸ‘ˆ Kháº¯c phá»¥c lá»—i Invalid Date
                r.return_date,      -- đŸ‘ˆ Kháº¯c phá»¥c lá»—i Invalid Date
                r.people_count, 
                r.budget,           -- đŸ‘ˆ Kháº¯c phá»¥c lá»—i NgĂ¢n sĂ¡ch 0 Ä‘
                r.status, 
                r.created_at,
                
                -- 2. Láº¤Y THĂ”NG TIN Báº¢N BĂO GIĂ Má»I NHáº¤T (Náº¾U CĂ“)
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
        console.error("Lá»—i getCustomerRequests:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// 3. THĂM HĂ€M Láº¤Y DANH SĂCH CHO NHĂ‚N VIĂN THIáº¾T Káº¾ (getStaffPendingTours)
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
// 5. Gá»­i thĂ´ng bĂ¡o cĂ³ bĂ¡o giĂ¡ cho khĂ¡ch hĂ ng
exports.sendNotification = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;

        const [latestQuote] = await sequelize.query(`
            SELECT quote_id, approval_status FROM custom_tour_quotes WHERE request_id = ? ORDER BY quote_id DESC LIMIT 1
        `, { replacements: [id], transaction });

        if (latestQuote.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'ChÆ°a cĂ³ báº£n bĂ¡o giĂ¡ nĂ o!' });
        }

        // Cáº­p nháº­t tráº¡ng thĂ¡i chi tiáº¿t vĂ o báº£ng QUOTES
        await sequelize.query(`
            UPDATE custom_tour_quotes SET approval_status = 'Quote_Sent' WHERE quote_id = ? 
        `, { replacements: [latestQuote[0].quote_id], transaction });

        // Báº£ng REQUESTS chá»‰ giá»¯ tráº¡ng thĂ¡i 'Processing' (Ä ang xá»­ lĂ½)
        await sequelize.query(`
            UPDATE custom_tour_requests SET status = 'Processing' WHERE request_id = ?
        `, { replacements: [id], transaction });

        await transaction.commit();
        res.status(200).json({ success: true, message: 'Ä Ă£ gá»­i bĂ¡o giĂ¡ má»›i nháº¥t cho khĂ¡ch hĂ ng!' });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. Cáº­p nháº­t pháº£n há»“i tá»« khĂ¡ch hĂ ng (Chá»‘t tour hoáº·c YĂªu cáº§u sá»­a)
exports.updateCustomerAction = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const id = req.params.id || req.params.quoteId;
        const rawStatus = req.body.status || req.body.action || 'Customer_Accepted';
        const finalStatus = (rawStatus === 'Accept' || rawStatus === 'Accepted' || rawStatus === 'Customer_Accepted') ? 'Customer_Accepted' : rawStatus;
        const customer_note = req.body.customer_note || req.body.notes || '';

        // 1. Tìm bản Quote phù hợp
        let latestQuote;
        if (req.params.quoteId) {
            [latestQuote] = await sequelize.query(`
                SELECT quote_id, request_id FROM custom_tour_quotes WHERE quote_id = ?
            `, { replacements: [req.params.quoteId], transaction });
        } else {
            [latestQuote] = await sequelize.query(`
                SELECT quote_id, request_id FROM custom_tour_quotes WHERE request_id = ? ORDER BY quote_id DESC LIMIT 1
            `, { replacements: [req.params.id], transaction });
        }

        if (latestQuote.length > 0) {
            const quoteId = latestQuote[0].quote_id;
            const targetReqId = latestQuote[0].request_id;

            await sequelize.query(`
                UPDATE custom_tour_quotes SET approval_status = ? WHERE quote_id = ?
            `, { replacements: [finalStatus, quoteId], transaction });

            await sequelize.query(`
                UPDATE custom_tour_requests SET status = ? WHERE request_id = ?
            `, { replacements: [finalStatus, targetReqId], transaction });
        }

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
                CASE WHEN category = 'Tham quan' THEN 'đŸŸï¸ Tham quan' WHEN category = 'Vui chÆ¡i' THEN 'đŸ¡ Vui chÆ¡i' ELSE 'đŸ½ï¸ Ä‚n uá»‘ng' END AS type,
                place_name AS name, estimated_price AS price
            FROM places WHERE status = 'Active' AND (destination = ? OR ? = '' OR destination IS NULL)
        `, { replacements: [destination, destination] });

        const [accommodations] = await sequelize.query(`
            SELECT CONCAT('srv_', service_id) AS id, 'đŸ¨ LÆ°u trĂº' AS type, service_name AS name, 0 AS price FROM services WHERE status = 'Active' AND service_type = 'Hotel'
        `);

        const [transports] = await sequelize.query(`
            SELECT CONCAT('srv_', service_id) AS id, 'âœˆï¸ Di chuyá»ƒn' AS type, service_name AS name, 0 AS price FROM services WHERE status = 'Active' AND service_type = 'Transport'
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
        const { payment_method = 'VNPAY', notes } = req.body;

        if (!customerId) {
            await transaction.rollback();
            return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để đặt tour!' });
        }

        const [quotes] = await sequelize.query(`
            SELECT q.*, r.people_count, r.destination, r.departure_date, r.return_date, r.staff_id
            FROM custom_tour_quotes q
            INNER JOIN custom_tour_requests r ON q.request_id = r.request_id
            WHERE q.quote_id = ?
        `, { replacements: [quoteId], transaction });

        if (quotes.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy bản báo giá!' });
        }
        const quote = quotes[0];

        // 2. CẬP NHẬT TRẠNG THÁI
        await sequelize.query(`UPDATE custom_tour_quotes SET approval_status = 'Customer_Accepted' WHERE quote_id = ?`, { replacements: [quoteId], transaction });
        await sequelize.query(`UPDATE custom_tour_requests SET status = 'Completed' WHERE request_id = ?`, { replacements: [quote.request_id], transaction });

        // 3. TẠO TOUR TRONG BẢNG TOURS
        const tourName = `Tour Thiết Kế: ${quote.destination}`;
        const itineraryJson = typeof quote.itinerary === 'string' ? quote.itinerary : JSON.stringify(quote.itinerary);
        const [tourResult] = await sequelize.query(`
            INSERT INTO tours (tour_name, destination, base_price, status, created_by, design_data, is_custom)
            VALUES (?, ?, ?, 'Active', ?, ?, 1)
        `, {
            replacements: [tourName, quote.destination, quote.quote_price, quote.staff_id, itineraryJson],
            transaction
        });
        const newTourId = tourResult[0] || tourResult.insertId;

        // 4. TẠO DEPARTURE TRONG BẢNG DEPARTURES
        const [departureResult] = await sequelize.query(`
            INSERT INTO departures (tour_id, start_date, end_date, price, available_seats, total_seats, status)
            VALUES (?, ?, ?, ?, 0, ?, 'Confirmed')
        `, {
            replacements: [newTourId, quote.departure_date, quote.return_date, quote.quote_price, quote.people_count],
            transaction
        });
        const newDepartureId = departureResult[0] || departureResult.insertId;

        // 5. TẠO ĐƠN HÀNG TRONG BẢNG BOOKINGS
        const noteText = notes || `Tour thiết kế riêng: ${quote.destination} (${quote.departure_date} - ${quote.return_date})`;
        const [bookingInsert] = await sequelize.query(`
            INSERT INTO bookings (customer_id, departure_id, quote_id, num_people, booking_date, total_amount, booking_status, payment_status, notes)
            VALUES (?, ?, ?, ?, NOW(), ?, 'Confirmed', 'Unpaid', ?)
        `, {
            replacements: [customerId, newDepartureId, quoteId, quote.people_count, quote.quote_price, noteText],
            transaction
        });
        const newBookingId = bookingInsert[0] || bookingInsert.insertId;

        // 6. TRỪ CHỖ DỊCH VỤ TRONG BẢNG partner_services
        try {
            const itineraryData = typeof quote.itinerary === 'string' ? JSON.parse(quote.itinerary) : quote.itinerary;
            const accommodationList = itineraryData?.dragDropState?.fixedServices?.accommodation || [];
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

        // 7. TẠO PHIẾU CHỜ THANH TOÁN
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

// ================= NEW WORKFLOW ENDPOINTS =================

// 1. Staff: Báo giá sơ bộ
exports.sendInitialQuote = async (req, res) => {
    try {
        const { id } = req.params;
        const { quote_price, note } = req.body;
        const staffId = req.user?.id || req.user?.userId || req.user?.user_id;

        // Create a new quote entry for initial quote
        await sequelize.query(`
            INSERT INTO custom_tour_quotes (request_id, staff_id, quote_price, staff_note, approval_status)
            VALUES (?, ?, ?, ?, 'Initial_Quoted')
        `, { replacements: [id, staffId, quote_price, note] });

        // Update request status
        await sequelize.query(`
            UPDATE custom_tour_requests SET status = 'Initial_Quoted', quoted_price = ? WHERE request_id = ?
        `, { replacements: [quote_price, id] });

        res.json({ success: true, message: 'Đã gửi báo giá sơ bộ' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Staff: Chuyển sang Trạng thái Thiết kế
exports.startDesigning = async (req, res) => {
    try {
        const { id } = req.params;
        await sequelize.query(`
            UPDATE custom_tour_requests SET status = 'Designing' WHERE request_id = ?
        `, { replacements: [id] });
        res.json({ success: true, message: 'Chuyển sang trạng thái thiết kế' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Staff: Gửi Quản lý Duyệt (Lưu thiết kế chi tiết)
exports.submitToManager = async (req, res) => {
    try {
        const { id } = req.params;
        const { itinerary, base_cost, quote_price, note } = req.body;
        const staffId = req.user?.id || req.user?.userId || req.user?.user_id;

        // Insert new detailed quote
        await sequelize.query(`
            INSERT INTO custom_tour_quotes (request_id, staff_id, base_cost, quote_price, itinerary, staff_note, approval_status)
            VALUES (?, ?, ?, ?, ?, ?, 'Pending_Approval')
        `, { replacements: [id, staffId, base_cost, quote_price, typeof itinerary === 'string' ? itinerary : JSON.stringify(itinerary), note] });

        await sequelize.query(`
            UPDATE custom_tour_requests SET status = 'Pending_Manager_Approval' WHERE request_id = ?
        `, { replacements: [id] });

        res.json({ success: true, message: 'Đã gửi quản lý duyệt' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Manager: Duyệt hoặc Từ chối thiết kế
exports.managerReview = async (req, res) => {
    try {
        const { quoteId } = req.params;
        const { action, manager_note } = req.body; // action: 'approve' or 'reject'
        const managerId = req.user?.id || req.user?.userId || req.user?.user_id;

        const newQuoteStatus = action === 'approve' ? 'Approved' : 'Rejected';
        const newReqStatus = action === 'approve' ? 'Manager_Approved' : 'Manager_Rejected';

        await sequelize.query(`
            UPDATE custom_tour_quotes SET approval_status = ?, manager_note = ?, manager_id = ? WHERE quote_id = ?
        `, { replacements: [newQuoteStatus, manager_note, managerId, quoteId] });

        // Update request status based on the quote's request_id
        await sequelize.query(`
            UPDATE custom_tour_requests 
            SET status = ? 
            WHERE request_id = (SELECT request_id FROM custom_tour_quotes WHERE quote_id = ?)
        `, { replacements: [newReqStatus, quoteId] });

        res.json({ success: true, message: `Đã ${action === 'approve' ? 'duyệt' : 'từ chối'} bản thiết kế` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 5. Staff: Gửi bản thiết kế đã duyệt cho khách
exports.sendToCustomer = async (req, res) => {
    try {
        const { quoteId } = req.params;
        await sequelize.query(`
            UPDATE custom_tour_quotes SET approval_status = 'Quote_Sent' WHERE quote_id = ?
        `, { replacements: [quoteId] });

        await sequelize.query(`
            UPDATE custom_tour_requests 
            SET status = 'Sent_To_Customer' 
            WHERE request_id = (SELECT request_id FROM custom_tour_quotes WHERE quote_id = ?)
        `, { replacements: [quoteId] });

        res.json({ success: true, message: 'Đã gửi thiết kế cho khách hàng' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

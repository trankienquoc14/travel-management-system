const sequelize = require('../config/database');

// 1. Tạo đơn đặt hàng cho Tour trọn gói cố định (Định nghĩa chính thức nằm ở dòng 96 phía dưới)

// 2. Lấy danh sách đơn hàng của khách hàng (HỖ TRỢ CẢ TOUR TRỌN GÓI VÀ TOUR THIẾT KẾ RIÊNG)
exports.getMyBookings = async (req, res) => {
  try {
    const customer_id = req.user?.id || req.user?.user_id || req.user?.userId;

    if (!customer_id) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập!' });
    }

    // Dùng LEFT JOIN và COALESCE để lấy thông tin toàn diện cho cả 2 loại tour
    const [bookings] = await sequelize.query(`
      SELECT 
        b.booking_id, 
        b.num_people, 
        b.total_amount, 
        b.booking_status, 
        b.payment_status,
        b.booking_date,
        b.notes,
        b.quote_id,
        b.departure_id,
        
        COALESCE(t.tour_name, CONCAT('Tour ', cr.destination)) AS tour_name,
        COALESCE(t.destination, cr.destination, 'Việt Nam') AS destination,
        
        COALESCE(d.departure_date, cr.departure_date) AS departure_date,
        COALESCE(d.return_date, cr.return_date) AS return_date,
        COALESCE(t.duration_days, DATEDIFF(cr.return_date, cr.departure_date) + 1, 3) AS duration_days,
        
        ROUND(b.total_amount / GREATEST(b.num_people, 1)) AS price_per_person,
        COALESCE(t.image_url, 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000') AS image_url,
        
        u.full_name AS customer_name,
        u.phone AS customer_phone,
        u.email AS customer_email

      FROM bookings b
      LEFT JOIN users u ON b.customer_id = u.user_id
      LEFT JOIN departures d ON b.departure_id = d.departure_id
      LEFT JOIN tours t ON d.tour_id = t.tour_id
      LEFT JOIN custom_tour_quotes q ON b.quote_id = q.quote_id
      LEFT JOIN custom_tour_requests cr ON q.request_id = cr.request_id
      WHERE b.customer_id = ?
      ORDER BY b.booking_id DESC
    `, {
      replacements: [customer_id]
    });

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error("Lỗi getMyBookings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.createBooking = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { departure_id, num_people, total_amount, notes, payment_method = 'VNPAY_QR' } = req.body;
    const customer_id = req.user?.id || req.user?.user_id || req.user?.userId;

    if (!customer_id) {
      await transaction.rollback();
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để đặt tour!' });
    }

    const count = num_people || (req.body.num_adults ? req.body.num_adults + (req.body.num_children || 0) : 1);
    const amount = total_amount || req.body.total_price || 0;

    // 1. Tạo đơn đặt hàng (Dùng dấu ? an toàn chống SQL Injection)
    const [result] = await sequelize.query(`
      INSERT INTO bookings (customer_id, departure_id, quote_id, num_people, booking_date, total_amount, booking_status, payment_status, notes)
      VALUES (?, ?, NULL, ?, NOW(), ?, 'Pending', 'Unpaid', ?)
    `, {
      replacements: [customer_id, departure_id, count, amount, notes || null],
      transaction
    });

    const newBookingId = result;

    // Insert passengers if provided
    if (req.body.passengers && Array.isArray(req.body.passengers)) {
      for (const p of req.body.passengers) {
        await sequelize.query(`
          INSERT INTO booking_passengers (booking_id, full_name, identity_number, gender, birth_date, is_checked_in)
          VALUES (?, ?, ?, ?, ?, 0)
        `, {
          replacements: [newBookingId, p.full_name, p.identity_number || null, p.gender || 'Other', p.birth_date || null],
          transaction
        });
      }
    }

    // 2. Trừ số lượng chỗ trống
    await sequelize.query(`
      UPDATE departures SET available_slots = GREATEST(0, available_slots - ?) WHERE departure_id = ?
    `, { replacements: [count, departure_id], transaction });

    // 3. Ghi nhận phương thức thanh toán vào bảng payments
    const txnCode = 'TXN_' + Date.now();
    await sequelize.query(`
      INSERT INTO payments (booking_id, payment_method, amount, transaction_code, payment_status)
      VALUES (?, ?, ?, ?, 'Pending')
    `, { replacements: [newBookingId, payment_method, amount, txnCode], transaction });

    await transaction.commit();
    res.status(200).json({ success: true, message: 'Đặt tour thành công!', booking_id: newBookingId });
  } catch (error) {
    await transaction.rollback();
    console.error("Lỗi createBooking:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
// Thiết lập thanh toán / Tạo thông tin QR Code
// POST /api/bookings/:bookingId/setup-payment
exports.initiatePayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { payment_method } = req.body; // 'Cash' hoặc 'VNPAY_QR'

    const [bookings] = await sequelize.query(`SELECT total_amount FROM bookings WHERE booking_id = ?`, { replacements: [bookingId] });
    if (bookings.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });

    const amount = bookings[0].total_amount;
    const txnCode = 'TXN_' + Date.now();

    // Cập nhật phương thức thanh toán mới
    await sequelize.query(`
      UPDATE payments SET payment_method = ?, transaction_code = ? WHERE booking_id = ? AND payment_status = 'Pending'
    `, { replacements: [payment_method, txnCode, bookingId] });

    if (payment_method === 'Cash') {
      return res.status(200).json({ success: true, message: '💵 Đã chuyển sang Tiền mặt. Vui lòng đến văn phòng đóng tiền để nhân viên xác nhận!' });
    } else {
      return res.status(200).json({
        success: true,
        message: '📸 Tạo mã QR thành công!',
        qrData: { bankName: "MB Bank", accountNumber: "0900000008", accountName: "TRAVELERP", amount: amount, info: txnCode }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Xác nhận đã thanh toán xong (Chốt trạng thái Paid)
// PUT /api/bookings/:bookingId/pay
exports.confirmPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { bookingId } = req.params;

    // Chuyển payments sang Success
    await sequelize.query(`UPDATE payments SET payment_status = 'Success', paid_at = NOW() WHERE booking_id = ?`, { replacements: [bookingId], transaction });

    // Chuyển bookings sang Paid & Confirmed
    await sequelize.query(`UPDATE bookings SET payment_status = 'Paid', booking_status = 'Confirmed' WHERE booking_id = ?`, { replacements: [bookingId], transaction });

    await transaction.commit();
    res.status(200).json({ success: true, message: '✅ Cập nhật trạng thái thanh toán thành công!' });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};
// 1. LẤY DANH SÁCH GIAO DỊCH THANH TOÁN (Dành cho Nhân viên văn phòng / Admin)
exports.getAllPayments = async (req, res) => {
  try {
    const [payments] = await sequelize.query(`
      SELECT 
        p.payment_id, p.booking_id, p.payment_method, p.amount, p.transaction_code, p.payment_status, p.paid_at,
        b.booking_date, b.booking_status, b.notes,
        u.full_name AS customer_name, u.phone AS customer_phone
      FROM payments p
      JOIN bookings b ON p.booking_id = b.booking_id
      LEFT JOIN users u ON b.customer_id = u.user_id
      ORDER BY 
        CASE WHEN p.payment_status = 'Pending' THEN 1 ELSE 2 END, -- Ưu tiên đưa đơn Pending lên đầu
        p.payment_id DESC
    `);

    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    console.error("Lỗi getAllPayments:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. NHÂN VIÊN VĂN PHÒNG XÁC NHẬN THU TIỀN MẶT
exports.confirmCashByStaff = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { bookingId } = req.params;

    // A. Chuyển trạng thái bảng payments sang Success
    await sequelize.query(`
      UPDATE payments 
      SET payment_status = 'Success', paid_at = NOW() 
      WHERE booking_id = ?
    `, { replacements: [bookingId], transaction });

    // B. Chuyển trạng thái bảng bookings sang Paid & Confirmed
    await sequelize.query(`
      UPDATE bookings 
      SET payment_status = 'Paid', booking_status = 'Confirmed' 
      WHERE booking_id = ?
    `, { replacements: [bookingId], transaction });

    await transaction.commit();
    res.status(200).json({ success: true, message: '✅ Xác nhận thu tiền mặt & chốt đơn thành công!' });
  } catch (error) {
    await transaction.rollback();
    console.error("Lỗi confirmCashByStaff:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================================================================
// QUẢN LÝ YÊU CẦU HỦY / ĐỔI LỊCH (BOOKING CHANGE REQUESTS)
// =========================================================================

// 1. Khách hàng gửi yêu cầu Hủy hoặc Đổi Lịch
exports.createChangeRequest = async (req, res) => {
  try {
    const { booking_id, request_type, reason, new_departure_id } = req.body;
    const customer_id = req.user?.id || req.user?.user_id || req.user?.userId;

    if (!booking_id || !request_type) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã đơn hàng và loại yêu cầu!' });
    }

    // Kiểm tra đơn hàng thuộc về khách hàng
    const [booking] = await sequelize.query(`SELECT booking_id, booking_status FROM bookings WHERE booking_id = ? AND customer_id = ?`, {
      replacements: [booking_id, customer_id]
    });

    if (booking.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng của bạn!' });
    }

    if (booking[0].booking_status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Đơn hàng này đã được hủy trước đó!' });
    }

    // Kiểm tra xem đã có yêu cầu nào đang chờ xử lý hay chưa
    const [existing] = await sequelize.query(`
      SELECT change_id FROM booking_change_requests WHERE booking_id = ? AND status = 'Pending'
    `, { replacements: [booking_id] });

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Đơn hàng này đã có yêu cầu đang chờ nhân viên xử lý!' });
    }

    await sequelize.query(`
      INSERT INTO booking_change_requests (booking_id, request_type, reason, new_departure_id, status, created_at)
      VALUES (?, ?, ?, ?, 'Pending', NOW())
    `, {
      replacements: [booking_id, request_type, reason || null, new_departure_id || null]
    });

    res.status(201).json({
      success: true,
      message: request_type === 'Cancel' ? 'Đã gửi yêu cầu Hủy Tour! Nhân viên sẽ kiểm tra và phản hồi sớm.' : 'Đã gửi yêu cầu Đổi Lịch! Nhân viên sẽ hỗ trợ bạn.'
    });

  } catch (error) {
    console.error("Lỗi createChangeRequest:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Nhân viên / Admin lấy danh sách các yêu cầu Hủy / Đổi lịch
exports.getAllChangeRequests = async (req, res) => {
  try {
    const [requests] = await sequelize.query(`
      SELECT 
        cr.change_id, cr.booking_id, cr.request_type, cr.reason, cr.status, cr.staff_note, cr.created_at, cr.new_departure_id,
        b.num_people, b.total_amount, b.booking_status, b.payment_status, b.booking_date,
        u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
        COALESCE(t.tour_name, CONCAT('Tour thiết kế: ', ctr.destination)) AS tour_name,
        d.departure_date AS current_departure_date,
        nd.departure_date AS requested_departure_date
      FROM booking_change_requests cr
      JOIN bookings b ON cr.booking_id = b.booking_id
      LEFT JOIN users u ON b.customer_id = u.user_id
      LEFT JOIN departures d ON b.departure_id = d.departure_id
      LEFT JOIN tours t ON d.tour_id = t.tour_id
      LEFT JOIN departures nd ON cr.new_departure_id = nd.departure_id
      LEFT JOIN custom_tour_quotes q ON b.quote_id = q.quote_id
      LEFT JOIN custom_tour_requests ctr ON q.request_id = ctr.request_id
      ORDER BY 
        CASE WHEN cr.status = 'Pending' THEN 1 ELSE 2 END,
        cr.change_id DESC
    `);

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Lỗi getAllChangeRequests:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Nhân viên / Admin duyệt hoặc từ chối yêu cầu
exports.processChangeRequest = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params; // change_id
    const { status, staff_note } = req.body; // 'Approved' hoặc 'Rejected'
    const staff_id = req.user?.id || req.user?.user_id || req.user?.userId;

    if (!['Approved', 'Rejected'].includes(status)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Trạng thái xử lý không hợp lệ!' });
    }

    const [reqRow] = await sequelize.query(`
      SELECT change_id, booking_id, request_type, new_departure_id, status FROM booking_change_requests WHERE change_id = ?
    `, { replacements: [id], transaction });

    if (reqRow.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu!' });
    }

    const request = reqRow[0];

    // Cập nhật trạng thái yêu cầu
    await sequelize.query(`
      UPDATE booking_change_requests 
      SET status = ?, staff_note = ?, processed_by = ? 
      WHERE change_id = ?
    `, {
      replacements: [status, staff_note || null, staff_id, id],
      transaction
    });

    // Nếu Duyệt (Approved)
    if (status === 'Approved') {
      if (request.request_type === 'Cancel') {
        // Hủy booking & Trả chỗ lại cho departure
        const [bk] = await sequelize.query(`SELECT departure_id, num_people FROM bookings WHERE booking_id = ?`, { replacements: [request.booking_id], transaction });
        
        await sequelize.query(`
          UPDATE bookings SET booking_status = 'Cancelled' WHERE booking_id = ?
        `, { replacements: [request.booking_id], transaction });

        if (bk.length > 0 && bk[0].departure_id) {
          await sequelize.query(`
            UPDATE departures SET available_slots = available_slots + ? WHERE departure_id = ?
          `, { replacements: [bk[0].num_people || 1, bk[0].departure_id], transaction });
        }
      } else if (request.request_type === 'Reschedule' && request.new_departure_id) {
        // Đổi sang ngày mới
        await sequelize.query(`
          UPDATE bookings SET departure_id = ? WHERE booking_id = ?
        `, { replacements: [request.new_departure_id, request.booking_id], transaction });
      }
    }

    await transaction.commit();
    res.status(200).json({
      success: true,
      message: status === 'Approved' ? '✅ Đã duyệt yêu cầu thành công!' : '❌ Đã từ chối yêu cầu!'
    });

  } catch (error) {
    await transaction.rollback();
    console.error("Lỗi processChangeRequest:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. LẤY TẤT CẢ BOOKING DÀNH CHO NHÂN VIÊN VĂN PHÒNG & ADMIN
exports.getAllBookings = async (req, res) => {
  try {
    const [bookings] = await sequelize.query(`
      SELECT 
        b.booking_id, 
        b.customer_id,
        b.num_people, 
        b.total_amount, 
        b.booking_status, 
        b.payment_status,
        b.booking_date,
        b.notes,
        b.quote_id,
        b.departure_id,
        
        u.full_name AS customer_name,
        u.email AS customer_email,
        u.phone AS customer_phone,
        
        COALESCE(t.tour_name, CONCAT('Tour thiết kế riêng: ', cr.destination)) AS tour_name,
        COALESCE(d.departure_date, cr.departure_date) AS departure_date,
        COALESCE(t.duration_days, DATEDIFF(cr.return_date, cr.departure_date) + 1) AS duration_days,
        COALESCE(t.image_url, 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000') AS image_url

      FROM bookings b
      LEFT JOIN users u ON b.customer_id = u.user_id
      LEFT JOIN departures d ON b.departure_id = d.departure_id
      LEFT JOIN tours t ON d.tour_id = t.tour_id
      LEFT JOIN custom_tour_quotes q ON b.quote_id = q.quote_id
      LEFT JOIN custom_tour_requests cr ON q.request_id = cr.request_id
      ORDER BY b.booking_id DESC
    `);

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error("Lỗi getAllBookings:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. CẬP NHẬT TRẠNG THÁI BOOKING (Dành cho Nhân viên / Admin)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { booking_status } = req.body;

    if (!['Pending', 'Confirmed', 'Cancelled'].includes(booking_status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ!' });
    }

    await sequelize.query(`UPDATE bookings SET booking_status = ? WHERE booking_id = ?`, {
      replacements: [booking_status, bookingId]
    });

    res.status(200).json({ success: true, message: '✅ Cập nhật trạng thái booking thành công!' });
  } catch (error) {
    console.error("Lỗi updateBookingStatus:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

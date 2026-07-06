const sequelize = require('../config/database');

// 1. Tạo đơn đặt hàng cho Tour trọn gói cố định (Định nghĩa chính thức nằm ở dòng 96 phía dưới)

// 2. Lấy danh sách đơn hàng của khách hàng (HỖ TRỢ CẢ TOUR TRỌN GÓI VÀ TOUR THIẾT KẾ RIÊNG)
exports.getMyBookings = async (req, res) => {
  try {
    const customer_id = req.user?.id || req.user?.user_id || req.user?.userId;

    if (!customer_id) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập!' });
    }

    // Dùng LEFT JOIN và COALESCE để lấy thông tin cho cả 2 loại tour
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
        
        -- Tên tour: Ưu tiên tour trọn gói (tours.tour_name), nếu không có thì tạo tên từ tour thiết kế (custom_tour_requests.destination)
        COALESCE(t.tour_name, CONCAT('Tour thiết kế riêng: ', cr.destination)) AS tour_name,
        
        -- Ngày khởi hành: Ưu tiên departures.departure_date, nếu không có lấy từ custom_tour_requests
        COALESCE(d.departure_date, cr.departure_date) AS departure_date,
        
        -- Số ngày đi tour
        COALESCE(t.duration_days, DATEDIFF(cr.return_date, cr.departure_date) + 1) AS duration_days,
        
        -- Ảnh đại diện
        COALESCE(t.image_url, 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1000') AS image_url

      FROM bookings b
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

    // 1. Tạo đơn đặt hàng (Dùng dấu ? an toàn chống SQL Injection)
    const [result] = await sequelize.query(`
      INSERT INTO bookings (customer_id, departure_id, quote_id, num_people, booking_date, total_amount, booking_status, payment_status, notes)
      VALUES (?, ?, NULL, ?, NOW(), ?, 'Pending', 'Unpaid', ?)
    `, {
      replacements: [customer_id, departure_id, num_people, total_amount, notes || null],
      transaction
    });

    const newBookingId = result;

    // 2. Trừ số lượng chỗ trống
    await sequelize.query(`
      UPDATE departures SET available_slots = GREATEST(0, available_slots - ?) WHERE departure_id = ?
    `, { replacements: [num_people, departure_id], transaction });

    // 3. Ghi nhận phương thức thanh toán vào bảng payments
    const txnCode = 'TXN_' + Date.now();
    await sequelize.query(`
      INSERT INTO payments (booking_id, payment_method, amount, transaction_code, payment_status)
      VALUES (?, ?, ?, ?, 'Pending')
    `, { replacements: [newBookingId, payment_method, total_amount, txnCode], transaction });

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
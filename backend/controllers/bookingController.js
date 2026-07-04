const sequelize = require('../config/database');

// 1. Tạo đơn đặt hàng cho Tour trọn gói cố định (Đã tối ưu bảo mật & Transaction)
exports.createBooking = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { departure_id, num_people, total_amount, notes } = req.body;
    const customer_id = req.user?.id || req.user?.user_id || req.user?.userId;

    if (!customer_id) {
      await transaction.rollback();
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để đặt tour!' });
    }

    // 1. Tạo đơn đặt hàng mới vào bảng bookings (Dùng dấu ? để chống SQL Injection)
    const [result] = await sequelize.query(`
      INSERT INTO bookings (customer_id, departure_id, quote_id, num_people, booking_date, total_amount, booking_status, payment_status, notes)
      VALUES (?, ?, NULL, ?, NOW(), ?, 'Pending', 'Unpaid', ?)
    `, {
      replacements: [customer_id, departure_id, num_people, total_amount, notes || null],
      transaction
    });

    const newBookingId = result;

    // 2. Trừ đi số lượng chỗ trống trong bảng departures
    await sequelize.query(`
      UPDATE departures 
      SET available_slots = GREATEST(0, available_slots - ?)
      WHERE departure_id = ?
    `, {
      replacements: [num_people, departure_id],
      transaction
    });

    await transaction.commit();
    res.status(200).json({ success: true, message: 'Đặt tour thành công!', booking_id: newBookingId });
  } catch (error) {
    await transaction.rollback();
    console.error("Lỗi createBooking:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

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
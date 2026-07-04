const sequelize = require('../config/database');

exports.createBooking = async (req, res) => {
  try {
    const { departure_id, num_people, total_amount, notes } = req.body;
    const customer_id = req.user.id || req.user.user_id; // Đảm bảo lấy đúng ID khách

    // Xử lý biến notes nếu người dùng không nhập gì
    const safeNotes = notes ? `'${notes}'` : 'NULL';

    // 1. Tạo đơn đặt hàng mới vào bảng bookings (Đã thêm num_people và notes)
    const [result] = await sequelize.query(`
      INSERT INTO bookings (customer_id, departure_id, num_people, total_amount, booking_status, payment_status, notes)
      VALUES (${customer_id}, ${departure_id}, ${num_people}, ${total_amount}, 'Pending', 'Unpaid', ${safeNotes})
    `);

    // 2. Trừ đi số lượng chỗ trống trong bảng departures
    await sequelize.query(`
      UPDATE departures 
      SET available_slots = available_slots - ${num_people}
      WHERE departure_id = ${departure_id}
    `);

    res.status(200).json({ success: true, message: 'Đặt tour thành công!', booking_id: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Lấy danh sách đơn hàng của khách hàng đang đăng nhập
exports.getMyBookings = async (req, res) => {
  try {
    // Sửa dòng này: Lấy id hoặc user_id tùy theo cấu trúc token của bạn
    const customer_id = req.user.id || req.user.user_id;

    const [bookings] = await sequelize.query(`
      SELECT 
        b.booking_id, b.num_people, b.total_amount, b.booking_status, b.payment_status,
        d.departure_date, 
        t.tour_id, t.tour_name, t.image_url, t.duration_days
      FROM bookings b
      JOIN departures d ON b.departure_id = d.departure_id
      JOIN tours t ON d.tour_id = t.tour_id
      WHERE b.customer_id = ${customer_id}
      ORDER BY b.booking_id DESC
    `);

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
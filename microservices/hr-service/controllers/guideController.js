const sequelize = require('../config/database');

// 1. Lấy danh sách công việc được phân công (Tours/Departures được gán cho HDV)
exports.getAssignedWork = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Lấy thông tin hướng dẫn viên trước
    const [guide] = await sequelize.query(
      'SELECT guide_id FROM guides WHERE user_id = ?',
      { replacements: [userId] }
    );

    if (guide.length === 0) {
      return res.status(404).json({ success: false, message: 'Tài khoản này chưa được cấu hình làm Hướng dẫn viên!' });
    }

    const guideId = guide[0].guide_id;

    // Lấy danh sách phân công
    const [works] = await sequelize.query(`
      SELECT 
        d.departure_id, d.departure_date, d.return_date, d.max_slots, d.available_slots, d.status,
        t.tour_id, t.tour_name, t.description, t.destination, t.duration_days, t.image_url
      FROM guide_assignments ga
      JOIN departures d ON ga.departure_id = d.departure_id
      JOIN tours t ON d.tour_id = t.tour_id
      WHERE ga.guide_id = ?
      ORDER BY d.departure_date DESC
    `, { replacements: [guideId] });

    res.status(200).json({
      success: true,
      data: works
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Lấy danh sách khách hàng trong đoàn của một chuyến đi cụ thể
// Hỗ trợ hiển thị cả các khách hàng từ booking chưa điền thông tin hành khách (lấy người đặt làm đại diện)
exports.getDeparturePassengers = async (req, res) => {
  try {
    const { departureId } = req.params;

    // Truy vấn kết hợp: 
    // Phần 1: Lấy các hành khách đã được khai báo chi tiết trong booking_passengers
    // Phần 2: Đối với các booking chưa khai báo hành khách, lấy thông tin người đặt (users) làm đại diện
    const [passengers] = await sequelize.query(`
      SELECT 
        CAST(bp.passenger_id AS CHAR) as passenger_id, 
        b.booking_id, 
        bp.full_name, 
        bp.gender, 
        bp.birth_date, 
        bp.identity_number, 
        COALESCE(bp.is_checked_in, 0) as is_checked_in,
        u.full_name as booker_name, 
        u.phone as booker_phone
      FROM bookings b
      JOIN users u ON b.customer_id = u.user_id
      JOIN booking_passengers bp ON b.booking_id = bp.booking_id
      WHERE b.departure_id = ? AND b.booking_status IN ('Confirmed', 'Pending')

      UNION ALL

      SELECT 
        CONCAT('b', b.booking_id) as passenger_id, 
        b.booking_id, 
        u.full_name, 
        u.gender, 
        u.date_of_birth as birth_date, 
        '—' as identity_number, 
        0 as is_checked_in,
        u.full_name as booker_name, 
        u.phone as booker_phone
      FROM bookings b
      JOIN users u ON b.customer_id = u.user_id
      WHERE b.departure_id = ? 
        AND b.booking_status IN ('Confirmed', 'Pending')
        AND NOT EXISTS (
          SELECT 1 FROM booking_passengers WHERE booking_id = b.booking_id
        )
      ORDER BY booking_id DESC
    `, { replacements: [departureId, departureId] });

    res.status(200).json({
      success: true,
      data: passengers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Thực hiện check-in hành khách (Hỗ trợ tự động tạo bản ghi thật nếu điểm danh khách giả định)
exports.checkinPassenger = async (req, res) => {
  try {
    const { passengerId } = req.params;
    const { is_checked_in } = req.body; // 1 hoặc 0

    if (typeof passengerId === 'string' && passengerId.startsWith('b')) {
      const bookingId = parseInt(passengerId.substring(1));

      // 1. Kiểm tra xem đã có bản ghi nào trong booking_passengers cho booking này chưa để tránh chèn trùng lặp
      const [existing] = await sequelize.query(`
        SELECT passenger_id FROM booking_passengers WHERE booking_id = ?
      `, { replacements: [bookingId] });

      if (existing.length > 0) {
        // Nếu đã có bản ghi thực tế, thực hiện UPDATE
        await sequelize.query(`
          UPDATE booking_passengers 
          SET is_checked_in = ? 
          WHERE passenger_id = ?
        `, { replacements: [is_checked_in ? 1 : 0, existing[0].passenger_id] });
      } else {
        // Nếu chưa có bản ghi, thực hiện INSERT lấy thông tin người đặt làm đại diện
        const [bookingData] = await sequelize.query(`
          SELECT b.booking_id, u.full_name, u.gender, u.date_of_birth
          FROM bookings b
          JOIN users u ON b.customer_id = u.user_id
          WHERE b.booking_id = ?
        `, { replacements: [bookingId] });

        if (bookingData.length > 0) {
          const bd = bookingData[0];
          await sequelize.query(`
            INSERT INTO booking_passengers (booking_id, full_name, gender, birth_date, identity_number, is_checked_in)
            VALUES (?, ?, ?, ?, '—', ?)
          `, {
            replacements: [bookingId, bd.full_name, bd.gender || 'Other', bd.date_of_birth || null, is_checked_in ? 1 : 0]
          });
        }
      }
    } else {
      // Bản ghi thực tế đã tồn tại
      await sequelize.query(`
        UPDATE booking_passengers 
        SET is_checked_in = ? 
        WHERE passenger_id = ?
      `, { replacements: [is_checked_in ? 1 : 0, passengerId] });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái điểm danh thành công!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Cập nhật trạng thái chuyến đi (Open, Closed, Completed)
exports.updateDepartureStatus = async (req, res) => {
  try {
    const { departureId } = req.params;
    const { status } = req.body; // 'Open', 'Closed', 'Completed'

    if (!['Open', 'Closed', 'Completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái chuyến đi không hợp lệ!' });
    }

    await sequelize.query(`
      UPDATE departures 
      SET status = ? 
      WHERE departure_id = ?
    `, { replacements: [status, departureId] });

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái chuyến đi thành công!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Báo cáo sự cố khẩn cấp của đoàn đi (Bản chuyên nghiệp: Ảnh, Vị trí)
exports.reportIncident = async (req, res) => {
  try {
    const { departure_id, title, description, location } = req.body;
    const userId = req.user.user_id;

    // Lấy guide_id của tài khoản đăng nhập
    const [guide] = await sequelize.query(
      'SELECT guide_id FROM guides WHERE user_id = ?',
      { replacements: [userId] }
    );

    if (guide.length === 0) {
      return res.status(403).json({ success: false, message: 'Chỉ hướng dẫn viên mới có quyền báo cáo sự cố!' });
    }

    const guideId = guide[0].guide_id;
    const image_url = req.file ? '/uploads/' + req.file.filename : null;

    await sequelize.query(`
      INSERT INTO incident_reports (guide_id, departure_id, title, description, location, image_url, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'Open', NOW())
    `, { replacements: [guideId, departure_id, title, description, location || null, image_url] });

    res.status(201).json({
      success: true,
      message: 'Báo cáo sự cố khẩn cấp thành công! Ban quản lý đã được thông báo.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Lấy danh sách sự cố đã báo cáo của chuyến đi
exports.getDepartureIncidents = async (req, res) => {
  try {
    const { departureId } = req.params;

    const [incidents] = await sequelize.query(`
      SELECT * FROM incident_reports 
      WHERE departure_id = ? 
      ORDER BY incident_id DESC
    `, { replacements: [departureId] });

    res.status(200).json({
      success: true,
      data: incidents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Lấy lịch trình chi tiết của một Tour
exports.getTourItinerary = async (req, res) => {
  try {
    const { tourId } = req.params;
    const [itineraries] = await sequelize.query(`
      SELECT * FROM itineraries 
      WHERE tour_id = ? 
      ORDER BY day_number ASC
    `, { replacements: [tourId] });

    res.status(200).json({
      success: true,
      data: itineraries
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Lấy thông tin hồ sơ của Hướng dẫn viên
exports.getGuideProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const [profile] = await sequelize.query(`
      SELECT g.guide_id, g.license_number, g.experience_years, u.full_name, u.email, u.phone, u.avatar, u.gender
      FROM guides g
      JOIN users u ON g.user_id = u.user_id
      WHERE g.user_id = ?
    `, { replacements: [userId] });

    if (profile.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ Hướng dẫn viên!' });
    }

    res.status(200).json({
      success: true,
      data: profile[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

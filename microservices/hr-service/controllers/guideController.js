const sequelize = require('../config/database');

// 1. Lấy danh sách công việc được phân công (Tours/Departures được gán cho HDV)
exports.getAssignedWork = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const userRole = req.user.role_id;
    const { guide_id } = req.query;

    let whereClause = '';
    let replacements = [];

    if (guide_id && guide_id !== 'all') {
      // Nếu Admin/Manager chọn một Hướng dẫn viên cụ thể
      whereClause = 'WHERE ga.guide_id = ?';
      replacements.push(guide_id);
    } else if (guide_id === 'all' || [1, 2, 3].includes(Number(userRole))) {
      // Nếu Admin/Manager xem tất cả công việc của mọi HDV
      whereClause = '';
    } else {
      // Nếu là tài khoản Hướng dẫn viên đăng nhập
      const [guide] = await sequelize.query(
        'SELECT guide_id FROM guides WHERE user_id = ?',
        { replacements: [userId] }
      );

      if (guide.length === 0) {
        return res.status(200).json({ success: true, data: [] });
      }

      whereClause = 'WHERE ga.guide_id = ?';
      replacements.push(guide[0].guide_id);
    }

    // Lấy danh sách phân công (Kèm tên Hướng dẫn viên phụ trách)
    const [works] = await sequelize.query(`
      SELECT 
        d.departure_id, d.departure_date, d.return_date, d.max_slots, d.status,
        t.tour_id, t.tour_name, t.description, t.destination, t.duration_days, t.image_url,
        gu.full_name AS assigned_guide_name, gu.email AS assigned_guide_email, gu.phone AS assigned_guide_phone, ga.guide_id,
        COALESCE(SUM(CASE WHEN b.booking_status != 'Cancelled' THEN b.num_people ELSE 0 END), 0) AS actual_booked,
        (d.max_slots - COALESCE(SUM(CASE WHEN b.booking_status != 'Cancelled' THEN b.num_people ELSE 0 END), 0)) AS available_slots
      FROM guide_assignments ga
      JOIN departures d ON ga.departure_id = d.departure_id
      JOIN tours t ON d.tour_id = t.tour_id
      JOIN guides g ON ga.guide_id = g.guide_id
      JOIN users gu ON g.user_id = gu.user_id
      LEFT JOIN bookings b ON d.departure_id = b.departure_id
      ${whereClause}
      GROUP BY d.departure_id, d.departure_date, d.return_date, d.max_slots, d.status, t.tour_id, t.tour_name, t.description, t.destination, t.duration_days, t.image_url, gu.full_name, gu.email, gu.phone, ga.guide_id
      ORDER BY d.departure_date DESC
    `, { replacements });

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

// 8. Lấy thông tin hồ sơ của Hướng dẫn viên (Hỗ trợ truy vấn theo guide_id cho Admin)
exports.getGuideProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { guide_id } = req.query;

    let query = '';
    let replacements = [];

    if (guide_id && guide_id !== 'all') {
      query = `
        SELECT g.guide_id, g.license_number, g.experience_years, u.full_name, u.email, u.phone, u.avatar, u.gender
        FROM guides g
        JOIN users u ON g.user_id = u.user_id
        WHERE g.guide_id = ?
      `;
      replacements.push(guide_id);
    } else {
      query = `
        SELECT g.guide_id, g.license_number, g.experience_years, u.full_name, u.email, u.phone, u.avatar, u.gender
        FROM guides g
        JOIN users u ON g.user_id = u.user_id
        WHERE g.user_id = ?
      `;
      replacements.push(userId);
    }

    const [profile] = await sequelize.query(query, { replacements });

    if (profile.length === 0) {
      // Trường hợp Admin xem nhưng chưa chọn HDV cụ thể
      return res.status(200).json({
        success: true,
        data: {
          guide_id: 0,
          license_number: 'ADMIN-ACCESS',
          experience_years: 5,
          full_name: req.user.full_name || 'Hệ thống Quản trị',
          email: req.user.email,
          phone: req.user.phone || '0900000000',
          gender: 'Male'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: profile[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8b. Lấy danh sách toàn bộ Hướng dẫn viên (Cho Admin / Manager chọn)
exports.getAllGuidesList = async (req, res) => {
  try {
    const [guides] = await sequelize.query(`
      SELECT g.guide_id, g.user_id, g.license_number, g.experience_years, u.full_name, u.email, u.phone, u.avatar, u.status
      FROM guides g
      JOIN users u ON g.user_id = u.user_id
      ORDER BY g.guide_id ASC
    `);

    res.status(200).json({
      success: true,
      data: guides
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Lấy nhật ký hành trình của đoàn đi
exports.getDepartureUpdates = async (req, res) => {
  try {
    const { departureId } = req.params;
    const [updates] = await sequelize.query(`
      SELECT * FROM departure_updates 
      WHERE departure_id = ? 
      ORDER BY created_at DESC
    `, { replacements: [departureId] });

    res.status(200).json({ success: true, data: updates, needs_db_migration: false });
  } catch (error) {
    if (error.parent && error.parent.errno === 1146) {
      return res.status(200).json({
        success: true,
        data: [],
        needs_db_migration: true,
        sql: `CREATE TABLE departure_updates (
  update_id INT AUTO_INCREMENT PRIMARY KEY,
  departure_id INT NOT NULL,
  guide_id INT NOT NULL,
  location VARCHAR(255) NOT NULL,
  activity VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  image_url VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (departure_id) REFERENCES departures(departure_id) ON DELETE CASCADE
);`
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Tạo mới cập nhật nhật ký hành trình
exports.createDepartureUpdate = async (req, res) => {
  try {
    const { departureId } = req.params;
    const { location, activity, description } = req.body;
    const userId = req.user.user_id;

    const [guide] = await sequelize.query('SELECT guide_id FROM guides WHERE user_id = ?', {
      replacements: [userId]
    });
    if (guide.length === 0) {
      return res.status(403).json({ success: false, message: 'Chỉ hướng dẫn viên mới có quyền cập nhật!' });
    }
    const guideId = guide[0].guide_id;
    const image_url = req.file ? '/uploads/' + req.file.filename : null;

    await sequelize.query(`
      INSERT INTO departure_updates (departure_id, guide_id, location, activity, description, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, { replacements: [departureId, guideId, location, activity, description, image_url] });

    res.status(201).json({ success: true, message: 'Cập nhật hành trình thành công!' });
  } catch (error) {
    if (error.parent && error.parent.errno === 1146) {
      return res.status(200).json({
        success: true,
        needs_db_migration: true,
        message: 'Lưu ở chế độ mô phỏng thành công!',
        data: {
          location,
          activity,
          description,
          image_url: req.file ? '/uploads/' + req.file.filename : null,
          created_at: new Date().toISOString()
        }
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// 11. Cập nhật trạng thái xử lý sự cố (Dành cho Quản lý / Staff)
exports.updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'Resolved', resolution_notes } = req.body;
    await sequelize.query(`
      UPDATE incident_reports 
      SET status = ?, resolution_notes = ? 
      WHERE incident_id = ?
    `, { replacements: [status, resolution_notes || null, id] });

    res.status(200).json({ success: true, message: 'Cập nhật xử lý sự cố thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



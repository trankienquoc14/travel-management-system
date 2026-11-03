const sequelize = require('../config/database');

let isCheckinColumnVerified = false;
const ensurePassengerCheckinSchema = async () => {
  if (isCheckinColumnVerified) return;
  try {
    const [cols] = await sequelize.query(`SHOW COLUMNS FROM booking_passengers LIKE 'checked_in_at'`);
    if (!cols || cols.length === 0) {
      await sequelize.query(`ALTER TABLE booking_passengers ADD COLUMN checked_in_at DATETIME NULL DEFAULT NULL`);
    }
    isCheckinColumnVerified = true;
  } catch (e) {
    console.error("Ensure checked_in_at column error:", e.message);
  }
};

const formatTimeHMS = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  }
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
};

const syncExpiredDeparturesStatus = async () => {
  try {
    await sequelize.query(`
      UPDATE departures 
      SET status = 'Closed' 
      WHERE (return_date < CURDATE() OR (available_slots <= 0 AND departure_date <= CURDATE()))
        AND status = 'Open'
    `);
  } catch (e) {
    console.error("Auto sync departures status error:", e);
  }
};

// 1. Lấy danh sách công việc được phân công (Tours/Departures được gán cho HDV)
exports.getAssignedWork = async (req, res) => {
  try {
    await syncExpiredDeparturesStatus();
    const userId = req.user.user_id;
    const userRole = req.user.role_id;
    const { guide_id } = req.query;

    let whereClause = '';
    let replacements = [];

    const isAdmin = [1, 2, 3, 4].includes(Number(userRole));

    if (isAdmin) {
      if (guide_id && guide_id !== 'all') {
        whereClause = 'WHERE ga.guide_id = ?';
        replacements.push(guide_id);
      } else {
        whereClause = '';
      }
    } else {
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
    await ensurePassengerCheckinSchema();
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
        bp.checked_in_at,
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
        NULL as checked_in_at,
        u.full_name as booker_name, 
        u.phone as booker_phone
      FROM bookings b
      JOIN users u ON b.customer_id = u.user_id
      WHERE b.departure_id = ? 
        AND b.booking_status IN ('Confirmed', 'Pending')
        AND NOT EXISTS (
          SELECT 1 FROM booking_passengers WHERE booking_id = b.booking_id
        )
      ORDER BY booking_id DESC, passenger_id ASC
    `, { replacements: [departureId, departureId] });

    // Gán mã vé điện tử QR (BKG-{booking_id}-PAX-{idx}) cho từng hành khách trong mỗi booking
    const bookingPaxCounters = {};
    const enrichedPassengers = passengers.map((p) => {
      const bId = p.booking_id;
      const idx = bookingPaxCounters[bId] || 0;
      bookingPaxCounters[bId] = idx + 1;
      return {
        ...p,
        pax_index: idx,
        qr_ticket_code: `BKG-${bId}-PAX-${idx}`,
        checked_in_time: p.checked_in_at ? formatTimeHMS(p.checked_in_at) : null
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedPassengers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Thực hiện check-in hành khách thủ công (Luồng sự kiện thay thế 1.1 & 1.2)
exports.checkinPassenger = async (req, res) => {
  try {
    await ensurePassengerCheckinSchema();
    const { passengerId } = req.params;
    const { is_checked_in } = req.body; // 1 hoặc 0
    const nextStatus = is_checked_in ? 1 : 0;
    const now = new Date();
    const timeStr = formatTimeHMS(now);

    // Kiểm tra trạng thái đơn hàng & chuyến đi (Tiền điều kiện: chuyến đi chuẩn bị xuất phát hoặc đang diễn ra)
    let bookingStatus = null;
    let departureStatus = null;
    let bId = null;

    if (typeof passengerId === 'string' && passengerId.startsWith('b')) {
      bId = parseInt(passengerId.substring(1));
      const [bRows] = await sequelize.query(`
        SELECT b.booking_status, d.status as departure_status
        FROM bookings b
        LEFT JOIN departures d ON b.departure_id = d.departure_id
        WHERE b.booking_id = ?
      `, { replacements: [bId] });
      if (bRows.length > 0) {
        bookingStatus = bRows[0].booking_status;
        departureStatus = bRows[0].departure_status;
      }
    } else {
      const [pRows] = await sequelize.query(`
        SELECT b.booking_status, b.booking_id, d.status as departure_status
        FROM booking_passengers bp 
        JOIN bookings b ON bp.booking_id = b.booking_id 
        LEFT JOIN departures d ON b.departure_id = d.departure_id
        WHERE bp.passenger_id = ?
      `, { replacements: [passengerId] });
      if (pRows.length > 0) {
        bookingStatus = pRows[0].booking_status;
        bId = pRows[0].booking_id;
        departureStatus = pRows[0].departure_status;
      }
    }

    if (bookingStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: `Mã vé không hợp lệ hoặc không thuộc chuyến đi này (Đơn vé #${bId} đã bị hủy).`
      });
    }

    if (departureStatus === 'Completed') {
      return res.status(400).json({
        success: false,
        message: `Chuyến đi đã kết thúc (Completed). Chỉ cho phép điểm danh khi chuyến đi ở trạng thái chuẩn bị xuất phát hoặc đang diễn ra.`
      });
    }

    if (typeof passengerId === 'string' && passengerId.startsWith('b')) {
      const bookingId = parseInt(passengerId.substring(1));

      // 1. Kiểm tra xem đã có bản ghi nào trong booking_passengers cho booking này chưa để tránh chèn trùng lặp
      const [existing] = await sequelize.query(`
        SELECT passenger_id FROM booking_passengers WHERE booking_id = ?
      `, { replacements: [bookingId] });

      if (existing.length > 0) {
        await sequelize.query(`
          UPDATE booking_passengers 
          SET is_checked_in = ?, checked_in_at = ?
          WHERE passenger_id = ?
        `, { replacements: [nextStatus, nextStatus === 1 ? now : null, existing[0].passenger_id] });
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
            INSERT INTO booking_passengers (booking_id, full_name, gender, birth_date, identity_number, is_checked_in, checked_in_at)
            VALUES (?, ?, ?, ?, '—', ?, ?)
          `, {
            replacements: [bookingId, bd.full_name, bd.gender || 'Other', bd.date_of_birth || null, nextStatus, nextStatus === 1 ? now : null]
          });
        }
      }
    } else {
      // Bản ghi thực tế đã tồn tại
      await sequelize.query(`
        UPDATE booking_passengers 
        SET is_checked_in = ?, checked_in_at = ?
        WHERE passenger_id = ?
      `, { replacements: [nextStatus, nextStatus === 1 ? now : null, passengerId] });
    }

    res.status(200).json({
      success: true,
      message: nextStatus === 1
        ? `Xác nhận điểm danh thủ công thành công vào lúc ${timeStr}!`
        : 'Đã đặt lại trạng thái điểm danh của hành khách.',
      data: {
        passenger_id: String(passengerId),
        is_checked_in: nextStatus,
        checked_in_at: nextStatus === 1 ? now.toISOString() : null,
        checked_in_time: nextStatus === 1 ? timeStr : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3b. Điểm danh hành khách bằng mã QR Vé điện tử (Luồng sự kiện chính 1 -> 6 & Luồng thay thế 5.1, 5.2)
exports.qrCheckinPassenger = async (req, res) => {
  try {
    await ensurePassengerCheckinSchema();
    const { qr_code, departure_id } = req.body;
    if (!qr_code || !String(qr_code).trim()) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_TICKET',
        message: 'Mã vé không hợp lệ hoặc không thuộc chuyến đi này'
      });
    }

    // Kiểm tra tiền điều kiện: chuyến đi phải ở trạng thái chuẩn bị xuất phát (Open) hoặc đang diễn ra (Closed)
    if (departure_id) {
      const [depRows] = await sequelize.query(
        `SELECT status FROM departures WHERE departure_id = ?`,
        { replacements: [departure_id] }
      );
      if (depRows.length > 0 && depRows[0].status === 'Completed') {
        return res.status(400).json({
          success: false,
          error_code: 'TRIP_COMPLETED',
          message: 'Chuyến đi này đã hoàn thành. Chỉ có thể điểm danh khi chuyến đi chuẩn bị xuất phát hoặc đang diễn ra.'
        });
      }
    }

    const cleanQr = String(qr_code).trim();
    let bookingId = null;
    let paxIndex = null;
    let passengerId = null;

    // Pattern 1: BKG-12-PAX-0 or BKG-0012-PAX-1
    const matchBkgPax = cleanQr.match(/^BKG-(\d+)-PAX-(\d+)$/i) || cleanQr.match(/BKG-(\d+)-PAX-(\d+)/i);
    if (matchBkgPax) {
      bookingId = parseInt(matchBkgPax[1]);
      paxIndex = parseInt(matchBkgPax[2]);
    } else {
      // Pattern 2: BKG-12
      const matchBkg = cleanQr.match(/^BKG-(\d+)$/i) || cleanQr.match(/BKG-(\d+)/i);
      if (matchBkg) {
        bookingId = parseInt(matchBkg[1]);
      } else {
        // Pattern 3: PAX-45
        const matchPax = cleanQr.match(/^PAX-(\d+)$/i) || cleanQr.match(/PAX-(\d+)/i);
        if (matchPax) {
          passengerId = parseInt(matchPax[1]);
        } else if (/^\d+$/.test(cleanQr)) {
          bookingId = parseInt(cleanQr);
        }
      }
    }

    if (bookingId === null && passengerId === null) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_TICKET',
        message: 'Mã vé không hợp lệ hoặc không thuộc chuyến đi này'
      });
    }

    let targetPassenger = null;
    let targetBookingId = bookingId;

    if (bookingId !== null) {
      // Tìm danh sách hành khách của bookingId
      const [passList] = await sequelize.query(`
        SELECT bp.passenger_id, bp.full_name, bp.is_checked_in, bp.checked_in_at, b.booking_id, b.departure_id, b.booking_status
        FROM bookings b
        LEFT JOIN booking_passengers bp ON b.booking_id = bp.booking_id
        WHERE b.booking_id = ?
        ORDER BY bp.passenger_id ASC
      `, { replacements: [bookingId] });

      // Luồng thay thế 5.2: Mã vé không tồn tại, đã hủy, hoặc không thuộc đoàn này
      if (passList.length === 0 || passList[0].booking_status === 'Cancelled') {
        return res.status(400).json({
          success: false,
          error_code: 'INVALID_TICKET',
          message: 'Mã vé không hợp lệ hoặc không thuộc chuyến đi này'
        });
      }

      const bookingDepId = passList[0].departure_id;
      if (departure_id && Number(bookingDepId) !== Number(departure_id)) {
        return res.status(400).json({
          success: false,
          error_code: 'WRONG_DEPARTURE',
          message: 'Mã vé không hợp lệ hoặc không thuộc chuyến đi này'
        });
      }

      const realPassengers = passList.filter(p => p.passenger_id !== null);

      if (realPassengers.length === 0) {
        // Booking chưa có bản ghi trong booking_passengers -> chỉ hợp lệ nếu paxIndex === null hoặc paxIndex === 0
        if (paxIndex !== null && paxIndex > 0) {
          return res.status(400).json({
            success: false,
            error_code: 'INVALID_TICKET',
            message: 'Mã vé không hợp lệ hoặc không thuộc chuyến đi này'
          });
        }
        const [bkUser] = await sequelize.query(`
          SELECT b.booking_id, u.full_name, u.gender, u.date_of_birth
          FROM bookings b
          JOIN users u ON b.customer_id = u.user_id
          WHERE b.booking_id = ?
        `, { replacements: [bookingId] });

        if (bkUser.length > 0) {
          const bu = bkUser[0];
          const [insRes] = await sequelize.query(`
            INSERT INTO booking_passengers (booking_id, full_name, gender, birth_date, identity_number, is_checked_in, checked_in_at)
            VALUES (?, ?, ?, ?, '—', 0, NULL)
          `, { replacements: [bookingId, bu.full_name, bu.gender || 'Other', bu.date_of_birth || null] });
          const newPaxId = typeof insRes === 'number' ? insRes : (insRes?.insertId || insRes);
          targetPassenger = {
            passenger_id: newPaxId,
            full_name: bu.full_name,
            is_checked_in: 0,
            checked_in_at: null
          };
        }
      } else if (paxIndex !== null) {
        if (!realPassengers[paxIndex]) {
          return res.status(400).json({
            success: false,
            error_code: 'INVALID_TICKET',
            message: 'Mã vé không hợp lệ hoặc không thuộc chuyến đi này'
          });
        }
        targetPassenger = realPassengers[paxIndex];
      } else {
        // Nếu quét mã tổng BKG-{id}, ưu tiên khách chưa điểm danh, nếu tất cả đã điểm danh thì lấy khách đầu tiên để báo 5.1
        const uncheck = realPassengers.find(p => Number(p.is_checked_in) === 0);
        targetPassenger = uncheck || realPassengers[0];
      }
    } else if (passengerId !== null) {
      const [pRow] = await sequelize.query(`
        SELECT bp.passenger_id, bp.full_name, bp.is_checked_in, bp.checked_in_at, bp.booking_id, b.departure_id, b.booking_status
        FROM booking_passengers bp
        JOIN bookings b ON bp.booking_id = b.booking_id
        WHERE bp.passenger_id = ?
      `, { replacements: [passengerId] });

      if (pRow.length === 0 || pRow[0].booking_status === 'Cancelled') {
        return res.status(400).json({
          success: false,
          error_code: 'INVALID_TICKET',
          message: 'Mã vé không hợp lệ hoặc không thuộc chuyến đi này'
        });
      }

      const passengerDepId = pRow[0].departure_id;
      if (departure_id && Number(passengerDepId) !== Number(departure_id)) {
        return res.status(400).json({
          success: false,
          error_code: 'WRONG_DEPARTURE',
          message: 'Mã vé không hợp lệ hoặc không thuộc chuyến đi này'
        });
      }

      targetPassenger = pRow[0];
      targetBookingId = pRow[0].booking_id;
    }

    if (!targetPassenger || !targetPassenger.passenger_id) {
      return res.status(400).json({
        success: false,
        error_code: 'INVALID_TICKET',
        message: 'Mã vé không hợp lệ hoặc không thuộc chuyến đi này'
      });
    }

    // Luồng sự kiện thay thế 5.1: Mã vé đã được điểm danh trước đó
    if (Number(targetPassenger.is_checked_in) === 1) {
      const checkedTimeStr = formatTimeHMS(targetPassenger.checked_in_at || new Date());
      return res.status(400).json({
        success: false,
        error_code: 'ALREADY_CHECKED_IN',
        checked_in_time: checkedTimeStr,
        passenger_name: targetPassenger.full_name,
        message: `Hành khách này đã được điểm danh vào lúc ${checkedTimeStr}`
      });
    }

    // Luồng sự kiện chính 6: Cập nhật trạng thái is_checked_in = 1, ghi nhận mốc thời gian điểm danh vào CSDL
    const now = new Date();
    const checkinTimeStr = formatTimeHMS(now);

    await sequelize.query(`
      UPDATE booking_passengers 
      SET is_checked_in = 1, checked_in_at = ? 
      WHERE passenger_id = ?
    `, { replacements: [now, targetPassenger.passenger_id] });

    res.status(200).json({
      success: true,
      message: `Điểm danh thành công hành khách "${targetPassenger.full_name}" (Vé #${targetBookingId || bookingId}) vào lúc ${checkinTimeStr}`,
      data: {
        passenger_id: String(targetPassenger.passenger_id),
        booking_id: targetBookingId || bookingId,
        full_name: targetPassenger.full_name,
        is_checked_in: 1,
        checked_in_at: now.toISOString(),
        checked_in_time: checkinTimeStr
      }
    });
  } catch (error) {
    console.error("Lỗi QR Check-in:", error);
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

    const [depRow] = await sequelize.query(`SELECT return_date FROM departures WHERE departure_id = ?`, { replacements: [departureId] });
    if (depRow.length > 0 && depRow[0].return_date && new Date(depRow[0].return_date) < new Date(new Date().setHours(0,0,0,0))) {
      if (status === 'Open') {
        return res.status(400).json({ success: false, message: 'Chuyến đi này đã quá ngày kết thúc (CLOSED). Không thể mở lại!' });
      }
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

function formatActivitiesToDescription(day) {
  let lines = [];
  if (day.activities && day.activities.length > 0) {
    day.activities.forEach((act) => {
      const icon = act.type === 'Tham quan' ? '🏞️' : (act.type === 'Ăn uống' || act.type === 'Ẩm thực') ? '🍽️' : '🚌';
      const priceText = (act.price && Number(act.price) > 0) ? ` (${Number(act.price).toLocaleString('vi-VN')} ₫)` : '';
      lines.push(`${icon} ${act.name}${priceText}`);
    });
  }
  if (day.accommodation && (day.accommodation.name || day.accommodation.service_name)) {
    lines.push(`🏨 Khách sạn: ${day.accommodation.name || day.accommodation.service_name}`);
  }
  if (day.meals) {
    const mealParts = [];
    if (day.meals.breakfast) mealParts.push('Bữa sáng');
    if (day.meals.lunch) mealParts.push('Bữa trưa');
    if (day.meals.dinner) mealParts.push('Bữa tối');
    if (mealParts.length > 0) {
      lines.push(`🍽️ Phục vụ: ${mealParts.join(' • ')}`);
    }
  }
  return lines.join('\n\n');
}

async function getTourItinerariesWithFallback(tourId) {
  let [itineraries] = await sequelize.query(`
    SELECT itinerary_id, tour_id, day_number, title, description
    FROM itineraries 
    WHERE tour_id = ? 
    ORDER BY day_number ASC
  `, { replacements: [tourId] });

  if (itineraries.length > 0) {
    return itineraries;
  }

  // Fallback 1: Parse design_data from tours table for custom tours
  const [tours] = await sequelize.query(`
    SELECT tour_id, tour_name, design_data, description FROM tours WHERE tour_id = ?
  `, { replacements: [tourId] });

  if (tours.length > 0) {
    const tour = tours[0];
    let designData = tour.design_data;

    // Fallback 2: Check custom_tour_quotes if design_data is missing
    if (!designData) {
      const [quotes] = await sequelize.query(`
        SELECT q.itinerary
        FROM custom_tour_quotes q
        JOIN custom_tour_requests r ON q.request_id = r.request_id
        WHERE r.destination LIKE CONCAT('%', REPLACE(?, 'Tour Thiết Kế: ', ''), '%')
        ORDER BY q.quote_id DESC LIMIT 1
      `, { replacements: [tour.tour_name] });
      if (quotes.length > 0) {
        designData = quotes[0].itinerary;
      }
    }

    if (designData) {
      try {
        const parsed = typeof designData === 'string' ? JSON.parse(designData) : designData;
        if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
          return parsed.days.map((day, idx) => ({
            itinerary_id: (Number(tourId) * 100) + (day.dayIndex || (idx + 1)),
            tour_id: Number(tourId),
            day_number: day.dayIndex || (idx + 1),
            title: day.route_title ? `Ngày ${day.dayIndex || (idx + 1)}: ${day.route_title}` : `Ngày ${day.dayIndex || (idx + 1)}`,
            description: formatActivitiesToDescription(day)
          }));
        }
      } catch (e) {
        console.error('Lỗi parse design_data cho tour thiết kế:', e);
      }
    }

    if (tour.description) {
      return [{
        itinerary_id: Number(tourId) * 100 + 1,
        tour_id: Number(tourId),
        day_number: 1,
        title: `Lịch trình tour ${tour.tour_name}`,
        description: tour.description
      }];
    }
  }

  return [];
}

// 7. Lấy lịch trình chi tiết của một Tour
exports.getTourItinerary = async (req, res) => {
  try {
    const { tourId } = req.params;
    const itineraries = await getTourItinerariesWithFallback(tourId);

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

// 10. Tạo mới cập nhật nhật ký hành trình (Có gắn mốc lịch trình, chỉ số điểm & trễ giờ)
exports.createDepartureUpdate = async (req, res) => {
  try {
    const { departureId } = req.params;
    const { location, activity, description, itinerary_id, milestone_index, delay_minutes, delay_reason } = req.body;
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
      INSERT INTO departure_updates (departure_id, guide_id, location, activity, description, image_url, itinerary_id, milestone_index, delay_minutes, delay_reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, { 
      replacements: [
        departureId, 
        guideId, 
        location, 
        activity, 
        description, 
        image_url, 
        itinerary_id || null, 
        milestone_index !== undefined ? parseInt(milestone_index) : 0,
        parseInt(delay_minutes) || 0, 
        delay_reason || null
      ] 
    });

    res.status(201).json({ success: true, message: '🎉 Cập nhật mốc hành trình thành công!' });
  } catch (error) {
    console.error('Lỗi createDepartureUpdate:', error);
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

// 12. Nộp Báo cáo Tổng kết Chuyến đi (HDV)
exports.submitTripReport = async (req, res) => {
  try {
    const { departureId } = req.params;
    const {
      total_passengers,
      checked_in_passengers,
      incident_count,
      vehicle_feedback,
      hotel_feedback,
      restaurant_feedback,
      guide_notes,
      overall_rating
    } = req.body;
    const userId = req.user.user_id;

    const [guide] = await sequelize.query('SELECT guide_id FROM guides WHERE user_id = ?', {
      replacements: [userId]
    });
    const guideId = guide.length > 0 ? guide[0].guide_id : 1;

    await sequelize.query(`
      INSERT INTO trip_reports (
        departure_id, guide_id, total_passengers, checked_in_passengers, incident_count,
        vehicle_feedback, hotel_feedback, restaurant_feedback, guide_notes, overall_rating, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', NOW())
    `, {
      replacements: [
        departureId,
        guideId,
        total_passengers || 0,
        checked_in_passengers || 0,
        incident_count || 0,
        vehicle_feedback || null,
        hotel_feedback || null,
        restaurant_feedback || null,
        guide_notes || 'Hoàn thành chuyến đi suôn sẻ.',
        overall_rating || 'Xuất sắc'
      ]
    });

    res.status(201).json({ success: true, message: '🎉 Nộp báo cáo chuyến đi thành công! Ban Quản lý đã được thông báo.' });
  } catch (error) {
    console.error('Lỗi submitTripReport:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 13. Lấy chi tiết báo cáo chuyến đi
exports.getTripReportDetail = async (req, res) => {
  try {
    const { departureId } = req.params;
    const [reports] = await sequelize.query(`
      SELECT tr.*, u.full_name as guide_name, u.email as guide_email, u.phone as guide_phone,
             t.tour_name, d.departure_date, t.destination
      FROM trip_reports tr
      JOIN guides g ON tr.guide_id = g.guide_id
      JOIN users u ON g.user_id = u.user_id
      JOIN departures d ON tr.departure_id = d.departure_id
      JOIN tours t ON d.tour_id = t.tour_id
      WHERE tr.departure_id = ?
    `, { replacements: [departureId] });

    if (reports.length === 0) {
      return res.status(200).json({ success: true, data: null });
    }

    res.status(200).json({ success: true, data: reports[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 14. Lấy danh sách toàn bộ báo cáo chuyến đi (Dành cho Admin / Manager)
exports.getAllTripReports = async (req, res) => {
  try {
    const [reports] = await sequelize.query(`
      SELECT tr.*, u.full_name as guide_name, u.email as guide_email, u.phone as guide_phone,
             t.tour_name, d.departure_date, t.destination, d.status as departure_status
      FROM trip_reports tr
      JOIN guides g ON tr.guide_id = g.guide_id
      JOIN users u ON g.user_id = u.user_id
      JOIN departures d ON tr.departure_id = d.departure_id
      JOIN tours t ON d.tour_id = t.tour_id
      ORDER BY tr.report_id DESC
    `);

    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 15. Phê duyệt báo cáo chuyến đi (Admin / Manager)
exports.approveTripReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { admin_note } = req.body;

    await sequelize.query(`
      UPDATE trip_reports 
      SET status = 'Approved', admin_note = ? 
      WHERE report_id = ?
    `, { replacements: [admin_note || 'Đã duyệt báo cáo thành công', reportId] });

    res.status(200).json({ success: true, message: '⚡ Đã phê duyệt báo cáo chuyến đi thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



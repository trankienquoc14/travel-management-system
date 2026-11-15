const sequelize = require('../config/database');

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

// Lấy danh sách tất cả Tài xế trong hệ thống (dành cho bộ lọc Quản lý / Admin)
exports.getAllDriversList = async (req, res) => {
  try {
    const [drivers] = await sequelize.query(`
      SELECT user_id as driver_id, full_name, email, phone, avatar
      FROM users
      WHERE role_id = 8 OR role_id = '8'
      ORDER BY full_name ASC;
    `);

    return res.status(200).json({
      success: true,
      data: drivers
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách Tài xế:', error);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi lấy danh sách Tài xế' });
  }
};

// Hàm trích xuất danh sách điểm đón (Pickup Points) từ design_data / thông tin tour
const extractPickupPoints = (designDataRaw, destination = '') => {
  const points = [];
  let startLoc = 'TP. Hồ Chí Minh';
  let startTime = '06:00 AM';

  if (designDataRaw) {
    try {
      const parsed = typeof designDataRaw === 'string' ? JSON.parse(designDataRaw) : designDataRaw;
      if (parsed?.start_location_name) startLoc = parsed.start_location_name;
      if (parsed?.pickup_time || parsed?.start_time) startTime = parsed.pickup_time || parsed.start_time;

      if (Array.isArray(parsed?.pickup_points) && parsed.pickup_points.length > 0) {
        parsed.pickup_points.forEach((pt, idx) => {
          if (typeof pt === 'string') {
            points.push({ order: idx + 1, time: startTime, name: pt, address: pt, note: 'Điểm đón cố định' });
          } else if (pt && typeof pt === 'object') {
            points.push({
              order: idx + 1,
              time: pt.time || startTime,
              name: pt.name || pt.location || `Điểm đón #${idx + 1}`,
              address: pt.address || pt.name || startLoc,
              note: pt.note || 'Có mặt trước 15–30 phút'
            });
          }
        });
      }

      if (points.length === 0 && Array.isArray(parsed?.days) && parsed.days.length > 0) {
        const day1 = parsed.days[0];
        if (day1?.route_title) {
          points.push({
            order: 1,
            time: '05:30 - 06:00',
            name: `Điểm tập trung xuất phát (${startLoc})`,
            address: `Văn phòng TravelERP - ${startLoc} (${day1.route_title})`,
            note: 'Đón đoàn tập trung và kiểm tra phương tiện khởi hành'
          });
        }
        if (Array.isArray(day1?.activities)) {
          day1.activities.slice(0, 2).forEach((act, idx) => {
            if (act?.name) {
              points.push({
                order: points.length + 1,
                time: idx === 0 ? '06:30' : '07:30',
                name: act.name,
                address: `${act.name} (${destination || startLoc})`,
                note: act.type === 'Di chuyển' ? 'Điểm trung chuyển / đón khách dọc tuyến' : 'Điểm dừng chặng đầu'
              });
            }
          });
        }
      }
    } catch (e) {}
  }

  if (points.length === 0) {
    points.push(
      {
        order: 1,
        time: '05:30 - 06:00',
        name: `Điểm đón số 1: Trụ sở chính TravelERP (${startLoc})`,
        address: `190 Pasteur, Quận 3, ${startLoc}`,
        note: 'Điểm tập trung chính - Tài xế & HDV đón khách, sắp xếp hành lý lên xe'
      },
      {
        order: 2,
        time: '06:15 - 06:30',
        name: `Điểm đón số 2: Nhà Văn hóa Thanh Niên / Sân bay Tân Sơn Nhất`,
        address: `04 Phạm Ngọc Thạch, Quận 1, ${startLoc}`,
        note: 'Đón khách đăng ký điểm hẹn trung tâm trước khi xuất phát đi ' + (destination || 'điểm đến')
      }
    );
  }

  return points;
};

// Lấy danh sách chuyến xe được phân công cho Tài xế
exports.getAssignedTrips = async (req, res) => {
  try {
    await syncExpiredDeparturesStatus();
    const userId = req.user?.user_id || req.user?.id;
    const userRole = req.user?.role_id || req.user?.role;
    const requestedDriverId = req.query.driver_id;

    const isAdminOrManager = [1, 2, 3, 4, '1', '2', '3', '4'].includes(userRole);

    let whereClause = `WHERE (tva.driver_id = :driverId OR (tva.driver_id IS NULL AND d.driver_id = :driverId))`;
    let targetDriverId = userId;

    if (isAdminOrManager) {
      if (requestedDriverId === 'all' || !requestedDriverId) {
        whereClause = `WHERE (tva.driver_id IS NOT NULL OR d.driver_id IS NOT NULL)`;
      } else {
        targetDriverId = requestedDriverId;
      }
    }

    const [trips] = await sequelize.query(`
      SELECT 
        d.departure_id,
        d.tour_id,
        d.departure_date,
        d.return_date,
        d.max_slots,
        d.status,
        MAX(COALESCE(v.license_plate, d.vehicle_number)) AS vehicle_number,
        MAX(v.vehicle_type) AS vehicle_type,
        MAX(v.brand_model) AS brand_model,
        MAX(v.seat_capacity) AS seat_capacity,
        MAX(d.guide_id) AS guide_id,
        MAX(COALESCE(tva.driver_id, d.driver_id)) AS driver_id,
        MAX(drv.full_name) AS driver_name,
        MAX(drv.phone) AS driver_phone,
        MAX(drv.email) AS driver_email,
        t.tour_name,
        CONCAT('TOUR-', t.tour_id) as tour_code,
        t.destination,
        t.duration_days,
        t.design_data,
        MAX(COALESCE(gu.full_name, g_user.full_name, g_alt.full_name)) as guide_name,
        MAX(COALESCE(gu.phone, g_user.phone, g_alt.phone)) as guide_phone,
        MAX(COALESCE(gu.email, g_user.email, g_alt.email)) as guide_email,
        (
          SELECT COALESCE(SUM(b2.num_people), 0)
          FROM bookings b2
          WHERE b2.departure_id = d.departure_id
            AND b2.booking_status != 'Cancelled'
        ) AS actual_booked
      FROM departures d
      JOIN tours t ON d.tour_id = t.tour_id
      LEFT JOIN tour_vehicle_assignments tva ON d.departure_id = tva.departure_id AND tva.status != 'CANCELLED'
      LEFT JOIN vehicles v ON tva.vehicle_id = v.vehicle_id
      LEFT JOIN users drv ON COALESCE(tva.driver_id, d.driver_id) = drv.user_id
      LEFT JOIN users gu ON d.guide_id = gu.user_id
      LEFT JOIN guides g_table ON d.guide_id = g_table.guide_id
      LEFT JOIN users g_user ON g_table.user_id = g_user.user_id
      LEFT JOIN guide_assignments ga ON ga.departure_id = d.departure_id
      LEFT JOIN guides g ON ga.guide_id = g.guide_id
      LEFT JOIN users g_alt ON g.user_id = g_alt.user_id
      ${whereClause}
      GROUP BY d.departure_id, d.tour_id, d.departure_date, d.return_date, d.max_slots, d.status,
               t.tour_name, t.destination, t.duration_days, t.design_data
      ORDER BY d.departure_date DESC;
    `, {
      replacements: { driverId: targetDriverId }
    });

    const enrichedTrips = trips.map(t => {
      const actualBooked = Number(t.actual_booked || 0);
      const maxSlots = Number(t.max_slots || 0);
      return {
        ...t,
        actual_booked: actualBooked,
        available_slots: Math.max(0, maxSlots - actualBooked),
        pickup_points: extractPickupPoints(t.design_data, t.destination)
      };
    });

    return res.status(200).json({
      success: true,
      data: enrichedTrips
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách chuyến xe của tài xế:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy danh sách chuyến xe' });
  }
};

// Lấy danh sách khách hàng & thông tin liên hệ của một đợt khởi hành cho Tài xế
exports.getDeparturePassengers = async (req, res) => {
  try {
    const { departureId } = req.params;
    const [passengers] = await sequelize.query(`
      SELECT 
        CAST(bp.passenger_id AS CHAR) AS passenger_id,
        b.booking_id,
        b.num_people,
        b.booking_status,
        b.payment_status,
        bp.full_name,
        bp.gender,
        bp.birth_date,
        bp.identity_number,
        COALESCE(bp.is_checked_in, 0) AS is_checked_in,
        COALESCE(NULLIF(b.contact_name, ''), u.full_name) AS booker_name,
        COALESCE(NULLIF(b.contact_phone, ''), u.phone) AS booker_phone,
        COALESCE(NULLIF(b.contact_email, ''), u.email) AS booker_email,
        COALESCE(NULLIF(b.contact_address, ''), '') AS booker_address
      FROM bookings b
      JOIN users u ON b.customer_id = u.user_id
      JOIN booking_passengers bp ON b.booking_id = bp.booking_id
      WHERE b.departure_id = ? AND b.booking_status IN ('Confirmed', 'Pending', 'Completed')

      UNION ALL

      SELECT 
        CONCAT('b', b.booking_id) AS passenger_id,
        b.booking_id,
        b.num_people,
        b.booking_status,
        b.payment_status,
        COALESCE(NULLIF(b.contact_name, ''), u.full_name) AS full_name,
        u.gender,
        u.date_of_birth AS birth_date,
        '—' AS identity_number,
        0 AS is_checked_in,
        COALESCE(NULLIF(b.contact_name, ''), u.full_name) AS booker_name,
        COALESCE(NULLIF(b.contact_phone, ''), u.phone) AS booker_phone,
        COALESCE(NULLIF(b.contact_email, ''), u.email) AS booker_email,
        COALESCE(NULLIF(b.contact_address, ''), '') AS booker_address
      FROM bookings b
      JOIN users u ON b.customer_id = u.user_id
      WHERE b.departure_id = ?
        AND b.booking_status IN ('Confirmed', 'Pending', 'Completed')
        AND NOT EXISTS (
          SELECT 1 FROM booking_passengers WHERE booking_id = b.booking_id
        )
      ORDER BY booking_id DESC, passenger_id ASC
    `, { replacements: [departureId, departureId] });

    return res.status(200).json({
      success: true,
      data: passengers
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách hành khách cho tài xế:', error);
    return res.status(500).json({ success: false, message: error.message });
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
  let targetTourId = Number(tourId);

  // Tự động kiểm tra nếu tourId thực chất là departure_id
  const [depRows] = await sequelize.query(`
    SELECT tour_id FROM departures WHERE departure_id = ? LIMIT 1
  `, { replacements: [tourId] });
  if (depRows.length > 0 && depRows[0].tour_id) {
    const [tourCheck] = await sequelize.query(`SELECT tour_id FROM tours WHERE tour_id = ? LIMIT 1`, { replacements: [targetTourId] });
    if (tourCheck.length === 0) {
      targetTourId = Number(depRows[0].tour_id);
    }
  }

  let [itineraries] = await sequelize.query(`
    SELECT itinerary_id, tour_id, day_number, title, description
    FROM itineraries 
    WHERE tour_id = ? 
    ORDER BY day_number ASC
  `, { replacements: [targetTourId] });

  if (itineraries.length > 0) {
    return itineraries;
  }

  // Fallback 1: Parse design_data from tours table for custom tours
  const [tours] = await sequelize.query(`
    SELECT tour_id, tour_name, design_data, description FROM tours WHERE tour_id = ?
  `, { replacements: [targetTourId] });

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

// Lấy lịch trình chi tiết & mốc thời gian của Tour
exports.getTripItinerary = async (req, res) => {
  try {
    const { tourId } = req.params;
    const itinerary = await getTourItinerariesWithFallback(tourId);

    return res.status(200).json({
      success: true,
      data: itinerary
    });
  } catch (error) {
    console.error('Lỗi lấy lịch trình tour:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy lịch trình tour' });
  }
};

// Cập nhật trạng thái chuyến xe (Mở đăng ký -> Đang đi -> Hoàn thành)
exports.updateTripStatus = async (req, res) => {
  try {
    const { departureId } = req.params;
    const { status } = req.body;

    if (!['Open', 'Closed', 'Completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const [depRow] = await sequelize.query(`SELECT return_date FROM departures WHERE departure_id = ?`, { replacements: [departureId] });
    if (depRow.length > 0 && depRow[0].return_date && new Date(depRow[0].return_date) < new Date(new Date().setHours(0,0,0,0))) {
      if (status === 'Open') {
        return res.status(400).json({ success: false, message: 'Chuyến xe này đã quá ngày kết thúc (CLOSED). Không thể mở lại!' });
      }
    }

    await sequelize.query(`
      UPDATE departures
      SET status = :status
      WHERE departure_id = :departureId;
    `, {
      replacements: { status, departureId }
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái chuyến xe thành công!'
    });
  } catch (error) {
    console.error('Lỗi cập nhật trạng thái chuyến xe:', error);
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi cập nhật trạng thái' });
  }
};

// Tự động đảm bảo cột expense_date tồn tại trong bảng driver_expenses
let isExpenseSchemaChecked = false;
const ensureDriverExpenseSchema = async () => {
  if (isExpenseSchemaChecked) return;
  try {
    const [cols] = await sequelize.query(`SHOW COLUMNS FROM driver_expenses LIKE 'expense_date'`);
    if (!cols || cols.length === 0) {
      await sequelize.query(`ALTER TABLE driver_expenses ADD COLUMN expense_date DATE NULL DEFAULT NULL`);
    }
    isExpenseSchemaChecked = true;
  } catch (err) {
    console.error('Lỗi kiểm tra schema driver_expenses:', err.message);
  }
};

// Lấy danh sách chi phí chuyến đi (xăng dầu, cầu đường, đỗ xe, rửa xe, sửa chữa...)
exports.getTripExpenses = async (req, res) => {
  try {
    await ensureDriverExpenseSchema();
    const { departureId } = req.params;
    const [expenses] = await sequelize.query(`
      SELECT 
        e.expense_id,
        e.departure_id,
        e.driver_id,
        e.category,
        e.amount,
        e.expense_date,
        e.description,
        e.receipt_image,
        e.status,
        e.created_at,
        u.full_name as driver_name
      FROM driver_expenses e
      LEFT JOIN users u ON e.driver_id = u.user_id
      WHERE e.departure_id = :departureId
      ORDER BY COALESCE(e.expense_date, DATE(e.created_at)) DESC, e.created_at DESC;
    `, {
      replacements: { departureId }
    });

    return res.status(200).json({
      success: true,
      data: expenses
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách chi phí:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy danh sách chi phí' });
  }
};

// Kê khai chi phí chuyến đi mới
exports.createTripExpense = async (req, res) => {
  try {
    await ensureDriverExpenseSchema();
    const driverId = req.user.id || req.user.user_id;
    const { departure_id, category, amount, expense_date, description } = req.body;

    if (!departure_id) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn chuyến xe cần kê khai chi phí!' });
    }

    if (!category || !String(category).trim()) {
      return res.status(400).json({ success: false, field: 'category', message: 'Vui lòng chọn loại chi phí' });
    }

    if (amount === undefined || amount === null || String(amount).trim() === '') {
      return res.status(400).json({ success: false, field: 'amount', message: 'Vui lòng nhập số tiền chi phí' });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, field: 'amount', message: 'Số tiền chi phí phải lớn hơn 0 VNĐ' });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        field: 'receipt_image',
        message: 'Vui lòng chụp ảnh hóa đơn/chứng từ để được kế toán phê duyệt hoàn tiền'
      });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        field: 'receipt_image',
        message: 'Kích thước ảnh hóa đơn tối đa 5MB'
      });
    }

    const receipt_image = `/uploads/${req.file.filename}`;
    const validExpenseDate = expense_date && String(expense_date).trim() ? String(expense_date).trim() : new Date().toISOString().split('T')[0];

    const [result] = await sequelize.query(`
      INSERT INTO driver_expenses (departure_id, driver_id, category, amount, expense_date, description, receipt_image, status)
      VALUES (:departure_id, :driverId, :category, :amount, :expense_date, :description, :receipt_image, 'Pending');
    `, {
      replacements: {
        departure_id,
        driverId,
        category: String(category).trim(),
        amount: parsedAmount,
        expense_date: validExpenseDate,
        description: description || '',
        receipt_image
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Kê khai chi phí thành công!',
      expense_id: result
    });
  } catch (error) {
    console.error('Lỗi kê khai chi phí:', error);
    return res.status(500).json({ success: false, message: 'Không thể gửi kê khai chi phí' });
  }
};

// Lấy danh sách sự cố xe
exports.getVehicleIncidents = async (req, res) => {
  try {
    const { departureId } = req.params;
    const [incidents] = await sequelize.query(`
      SELECT 
        i.incident_id,
        i.departure_id,
        i.driver_id,
        i.vehicle_number,
        i.title,
        i.description,
        i.location,
        i.image_url,
        i.status,
        i.created_at,
        u.full_name as driver_name,
        u.phone as driver_phone
      FROM driver_incidents i
      LEFT JOIN users u ON i.driver_id = u.user_id
      WHERE i.departure_id = :departureId OR :departureId = 'all'
      ORDER BY i.created_at DESC;
    `, {
      replacements: { departureId }
    });

    return res.status(200).json({
      success: true,
      data: incidents
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách sự cố xe:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy danh sách sự cố xe' });
  }
};

// Báo cáo sự cố xe khẩn cấp
exports.reportVehicleIncident = async (req, res) => {
  try {
    const driverId = req.user.id || req.user.user_id;
    const { departure_id, vehicle_number, title, description, location } = req.body;

    if (!title || !description || !vehicle_number) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền tiêu đề, biển số xe và mô tả chi tiết sự cố!' });
    }

    let image_url = null;
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    const [result] = await sequelize.query(`
      INSERT INTO driver_incidents (departure_id, driver_id, vehicle_number, title, description, location, image_url, status)
      VALUES (:departure_id, :driverId, :vehicle_number, :title, :description, :location, :image_url, 'Reported');
    `, {
      replacements: {
        departure_id: departure_id || null,
        driverId,
        vehicle_number,
        title,
        description,
        location: location || '',
        image_url
      }
    });

    // Bắn thông báo Realtime cho Nhân viên điều hành (STAFF) và Quản trị
    try {
      const [driverRow] = await sequelize.query(`SELECT full_name, phone FROM users WHERE user_id = :driverId`, { replacements: { driverId } });
      const driverName = driverRow[0]?.full_name || 'Tài xế';
      const notifTitle = `🚨 Báo cáo sự cố xe (${vehicle_number}) #${result}`;
      const notifContent = `Tài xế ${driverName} vừa báo cáo sự cố xe ${vehicle_number}: "${title}" - ${description}. Địa điểm: ${location || 'Trên đường'}. Vui lòng xử lý cứu hộ/sửa chữa!`;

      await sequelize.query(`
        INSERT INTO notifications (type, target_role, title, content, departure_id, is_read, action_url, created_at)
        VALUES ('TOUR_INCIDENT', 'STAFF', :notifTitle, :notifContent, :departure_id, 0, 'staff_vehicle_incidents', NOW())
      `, {
        replacements: {
          notifTitle,
          notifContent,
          departure_id: departure_id || null
        }
      });
    } catch (notifErr) {
      console.error('Lỗi tạo notification reportVehicleIncident:', notifErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Đã báo cáo sự cố xe thành công! Ban điều hành sẽ liên hệ cứu hộ/hỗ trợ ngay.',
      incident_id: result
    });
  } catch (error) {
    console.error('Lỗi báo cáo sự cố xe:', error);
    return res.status(500).json({ success: false, message: 'Không thể gửi báo cáo sự cố xe' });
  }
};

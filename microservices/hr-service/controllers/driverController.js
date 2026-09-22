const sequelize = require('../config/database');

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

// Lấy danh sách chuyến xe được phân công cho Tài xế
exports.getAssignedTrips = async (req, res) => {
  try {
    const userId = req.user?.user_id || req.user?.id;
    const userRole = req.user?.role_id || req.user?.role;
    const requestedDriverId = req.query.driver_id;

    const isAdminOrManager = [1, 2, 3, '1', '2', '3'].includes(userRole);

    let whereClause = `WHERE d.driver_id = :driverId`;
    let targetDriverId = userId;

    if (isAdminOrManager) {
      if (requestedDriverId === 'all' || !requestedDriverId) {
        whereClause = `WHERE d.driver_id IS NOT NULL`;
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
        d.available_slots,
        d.status,
        d.vehicle_number,
        d.guide_id,
        d.driver_id,
        t.tour_name,
        CONCAT('TOUR-', t.tour_id) as tour_code,
        t.destination,
        t.duration_days,
        g.full_name as guide_name,
        g.phone as guide_phone,
        g.email as guide_email
      FROM departures d
      JOIN tours t ON d.tour_id = t.tour_id
      LEFT JOIN users g ON d.guide_id = g.user_id
      ${whereClause}
      ORDER BY d.departure_date DESC;
    `, {
      replacements: { driverId: targetDriverId }
    });

    return res.status(200).json({
      success: true,
      data: trips
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách chuyến xe của tài xế:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy danh sách chuyến xe' });
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

// Lấy danh sách chi phí chuyến đi (xăng dầu, cầu đường, đỗ xe)
exports.getTripExpenses = async (req, res) => {
  try {
    const { departureId } = req.params;
    const [expenses] = await sequelize.query(`
      SELECT 
        e.expense_id,
        e.departure_id,
        e.driver_id,
        e.category,
        e.amount,
        e.description,
        e.receipt_image,
        e.status,
        e.created_at,
        u.full_name as driver_name
      FROM driver_expenses e
      LEFT JOIN users u ON e.driver_id = u.user_id
      WHERE e.departure_id = :departureId
      ORDER BY e.created_at DESC;
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
    const driverId = req.user.id || req.user.user_id;
    const { departure_id, category, amount, description } = req.body;

    if (!departure_id || !category || !amount) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ chuyến xe, loại chi phí và số tiền!' });
    }

    let receipt_image = null;
    if (req.file) {
      receipt_image = `/uploads/${req.file.filename}`;
    }

    const [result] = await sequelize.query(`
      INSERT INTO driver_expenses (departure_id, driver_id, category, amount, description, receipt_image, status)
      VALUES (:departure_id, :driverId, :category, :amount, :description, :receipt_image, 'Pending');
    `, {
      replacements: {
        departure_id,
        driverId,
        category,
        amount: parseFloat(amount),
        description: description || '',
        receipt_image
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Kê khai chi phí chuyến đi thành công! Đã gửi Ban quản lý phê duyệt.',
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

const sequelize = require('../config/database');

// 1. LẤY DANH SÁCH TẤT CẢ XE & TRẠNG THÁI HIỆN TẠI
exports.getAllVehicles = async (req, res) => {
  try {
    const [vehicles] = await sequelize.query(`
      SELECT 
        v.*,
        (
          SELECT JSON_OBJECT('maintenance_id', vm.maintenance_id, 'reason', vm.reason, 'start_date', vm.start_date, 'end_date', vm.end_date)
          FROM vehicle_maintenances vm 
          WHERE vm.vehicle_id = v.vehicle_id AND vm.status != 'COMPLETED' AND CURRENT_DATE() BETWEEN vm.start_date AND vm.end_date
          LIMIT 1
        ) AS current_maintenance,
        (
          SELECT JSON_OBJECT('assignment_id', tva.assignment_id, 'departure_id', tva.departure_id, 'tour_name', t.tour_name, 'driver_name', u.full_name, 'start_date', tva.start_date, 'end_date', tva.end_date)
          FROM tour_vehicle_assignments tva
          JOIN departures d ON tva.departure_id = d.departure_id
          JOIN tours t ON d.tour_id = t.tour_id
          LEFT JOIN users u ON tva.driver_id = u.user_id
          WHERE tva.vehicle_id = v.vehicle_id AND tva.status IN ('ASSIGNED', 'IN_PROGRESS') AND CURRENT_DATE() BETWEEN tva.start_date AND tva.end_date
          LIMIT 1
        ) AS current_tour
      FROM vehicles v
      ORDER BY v.vehicle_id DESC
    `);

    // Parse JSON string fields if returned as string by MySQL
    const formatted = vehicles.map(v => ({
      ...v,
      current_maintenance: typeof v.current_maintenance === 'string' ? JSON.parse(v.current_maintenance) : v.current_maintenance,
      current_tour: typeof v.current_tour === 'string' ? JSON.parse(v.current_tour) : v.current_tour
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Lỗi getAllVehicles:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. THÊM MỚI XE VÀO ĐỘI XE
exports.createVehicle = async (req, res) => {
  try {
    const { vehicle_code, license_plate, seat_capacity, vehicle_type, brand_model, image_url, color, status, notes } = req.body;

    if (!license_plate || !seat_capacity) {
      return res.status(400).json({ success: false, message: 'Biển số xe và số chỗ ngồi là bắt buộc!' });
    }

    const [existing] = await sequelize.query(`SELECT vehicle_id FROM vehicles WHERE license_plate = ?`, {
      replacements: [license_plate.trim()]
    });

    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: `Biển số xe ${license_plate} đã tồn tại trong hệ thống!` });
    }

    const autoCode = vehicle_code || `XE-${seat_capacity}C-${Date.now().toString().slice(-4)}`;

    await sequelize.query(`
      INSERT INTO vehicles (vehicle_code, license_plate, seat_capacity, vehicle_type, brand_model, image_url, color, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        autoCode.toUpperCase(),
        license_plate.trim().toUpperCase(),
        seat_capacity,
        vehicle_type || `Xe ${seat_capacity} chỗ`,
        brand_model || '',
        image_url || '',
        color || '',
        status || 'AVAILABLE',
        notes || ''
      ]
    });

    res.json({ success: true, message: 'Đã thêm xe mới vào Đội xe thành công!' });
  } catch (error) {
    console.error("Lỗi createVehicle:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. CẬP NHẬT THÔNG TIN XE
exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicle_code, license_plate, seat_capacity, vehicle_type, brand_model, image_url, color, status, notes } = req.body;

    await sequelize.query(`
      UPDATE vehicles
      SET vehicle_code = ?, license_plate = ?, seat_capacity = ?, vehicle_type = ?, brand_model = ?, image_url = ?, color = ?, status = ?, notes = ?
      WHERE vehicle_id = ?
    `, {
      replacements: [vehicle_code, license_plate.trim().toUpperCase(), seat_capacity, vehicle_type, brand_model, image_url, color, status, notes, id]
    });

    res.json({ success: true, message: 'Đã cập nhật thông tin xe thành công!' });
  } catch (error) {
    console.error("Lỗi updateVehicle:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. XÓA XE
exports.deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    await sequelize.query(`DELETE FROM vehicles WHERE vehicle_id = ?`, { replacements: [id] });
    res.json({ success: true, message: 'Đã xóa xe khỏi hệ thống!' });
  } catch (error) {
    console.error("Lỗi deleteVehicle:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. TRA CỨU DANH SÁCH XE RẢNH THEO THỜI GIAN TOUR
exports.getAvailableVehicles = async (req, res) => {
  try {
    const { start_date, end_date, min_seats } = req.query;

    let query = `
      SELECT v.* 
      FROM vehicles v
      WHERE v.status != 'INACTIVE'
    `;
    const replacements = [];

    if (min_seats) {
      query += ` AND v.seat_capacity >= ?`;
      replacements.push(Number(min_seats));
    }

    if (start_date && end_date) {
      // Loại bỏ xe đang vướng lịch bảo dưỡng trong khoảng thời gian này
      query += `
        AND v.vehicle_id NOT IN (
          SELECT vm.vehicle_id FROM vehicle_maintenances vm
          WHERE vm.status != 'COMPLETED'
            AND (vm.start_date <= ? AND vm.end_date >= ?)
        )
      `;
      replacements.push(end_date, start_date);

      // Loại bỏ xe đang vướng lịch chạy Tour khác trong khoảng thời gian này
      query += `
        AND v.vehicle_id NOT IN (
          SELECT tva.vehicle_id FROM tour_vehicle_assignments tva
          WHERE tva.status IN ('ASSIGNED', 'IN_PROGRESS')
            AND (tva.start_date <= ? AND tva.end_date >= ?)
        )
      `;
      replacements.push(end_date, start_date);
    }

    query += ` ORDER BY v.seat_capacity ASC, v.license_plate ASC`;

    const [availableVehicles] = await sequelize.query(query, { replacements });
    res.json({ success: true, data: availableVehicles });
  } catch (error) {
    console.error("Lỗi getAvailableVehicles:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. ĐIỀU XE & PHÂN CÔNG TÀI XẾ CHO TOUR
exports.dispatchVehicle = async (req, res) => {
  try {
    const { departure_id, vehicle_id, driver_id, start_date, end_date } = req.body;

    if (!departure_id || !vehicle_id || !driver_id || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ: Chuyến đi, Chiếc xe (Biển số), Tài xế và Ngày bắt đầu/kết thúc!' });
    }

    // Kiểm tra xe có bị trùng lịch không
    const [conflictVehicle] = await sequelize.query(`
      SELECT assignment_id FROM tour_vehicle_assignments
      WHERE vehicle_id = ? AND status IN ('ASSIGNED', 'IN_PROGRESS')
        AND (start_date <= ? AND end_date >= ?)
      LIMIT 1
    `, { replacements: [vehicle_id, end_date, start_date] });

    if (conflictVehicle && conflictVehicle.length > 0) {
      return res.status(400).json({ success: false, message: '❌ Xe này đã được phân công cho tour khác trong khoảng thời gian này!' });
    }

    // Kiểm tra tài xế có bị trùng lịch không
    const [conflictDriver] = await sequelize.query(`
      SELECT assignment_id FROM tour_vehicle_assignments
      WHERE driver_id = ? AND status IN ('ASSIGNED', 'IN_PROGRESS')
        AND (start_date <= ? AND end_date >= ?)
      LIMIT 1
    `, { replacements: [driver_id, end_date, start_date] });

    if (conflictDriver && conflictDriver.length > 0) {
      return res.status(400).json({ success: false, message: '❌ Tài xế này đã được phân công lái tour khác trong khoảng thời gian này!' });
    }

    // Ghi nhận phân công điều xe
    await sequelize.query(`
      INSERT INTO tour_vehicle_assignments (departure_id, vehicle_id, driver_id, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?, 'ASSIGNED')
    `, { replacements: [departure_id, vehicle_id, driver_id, start_date, end_date] });

    res.json({ success: true, message: '✅ Đã phân công Xe & Tài xế cho chuyến đi thành công!' });
  } catch (error) {
    console.error("Lỗi dispatchVehicle:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. DÀNH CHO TÀI XẾ: XEM CHI TIẾT XE ĐƯỢC PHÂN CÔNG
exports.getDriverAssignedTours = async (req, res) => {
  try {
    const driver_id = req.user.user_id || req.user.id;

    const [assignments] = await sequelize.query(`
      SELECT 
        tva.assignment_id,
        tva.departure_id,
        tva.start_date,
        tva.end_date,
        tva.status AS assignment_status,
        v.vehicle_id,
        v.license_plate,
        v.seat_capacity,
        v.vehicle_type,
        v.brand_model,
        v.color,
        v.notes AS vehicle_notes,
        d.departure_date,
        t.tour_name,
        t.destination,
        COALESCE(gu.full_name, g_user.full_name, g_alt.full_name) AS guide_name,
        COALESCE(gu.phone, g_user.phone, g_alt.phone) AS guide_phone
      FROM tour_vehicle_assignments tva
      JOIN vehicles v ON tva.vehicle_id = v.vehicle_id
      JOIN departures d ON tva.departure_id = d.departure_id
      JOIN tours t ON d.tour_id = t.tour_id
      LEFT JOIN users gu ON d.guide_id = gu.user_id
      LEFT JOIN guides g_table ON d.guide_id = g_table.guide_id
      LEFT JOIN users g_user ON g_table.user_id = g_user.user_id
      LEFT JOIN guide_assignments ga ON ga.departure_id = d.departure_id
      LEFT JOIN guides g ON ga.guide_id = g.guide_id
      LEFT JOIN users g_alt ON g.user_id = g_alt.user_id
      WHERE tva.driver_id = ?
      ORDER BY tva.start_date DESC
    `, { replacements: [driver_id] });

    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error("Lỗi getDriverAssignedTours:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. TẠO LỊCH BẢO DƯỠNG XE
exports.createMaintenance = async (req, res) => {
  try {
    const { vehicle_id, start_date, end_date, reason } = req.body;

    if (!vehicle_id || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập xe, ngày bắt đầu và kết thúc bảo dưỡng!' });
    }

    await sequelize.query(`
      INSERT INTO vehicle_maintenances (vehicle_id, start_date, end_date, reason, status)
      VALUES (?, ?, ?, ?, 'IN_PROGRESS')
    `, { replacements: [vehicle_id, start_date, end_date, reason || 'Bảo dưỡng định kỳ'] });

    // Cập nhật status của xe thành MAINTENANCE
    await sequelize.query(`UPDATE vehicles SET status = 'MAINTENANCE' WHERE vehicle_id = ?`, {
      replacements: [vehicle_id]
    });

    res.json({ success: true, message: 'Đã lên lịch bảo dưỡng xe thành công!' });
  } catch (error) {
    console.error("Lỗi createMaintenance:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

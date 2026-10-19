const sequelize = require('../config/database');

// 1. LẤY DANH SÁCH TẤT CẢ XE & TRẠNG THÁI HIỆN TẠI (LIÊN KẾT VỚI SERVICES & VEHICLE_SERVICE_DETAILS)
exports.getAllVehicles = async (req, res) => {
  try {
    const isPublic = req.path.includes('public-vehicles') || req.query.is_public === 'true';
    const whereClause = isPublic ? "WHERE v.status != 'MAINTENANCE'" : "";
    const [vehicles] = await sequelize.query(`
      SELECT 
        v.*,
        COALESCE(NULLIF(v.base_cost, 0), s.base_cost, 0) AS base_cost,
        COALESCE(NULLIF(v.selling_price, 0), NULLIF(v.price, 0), s.selling_price, 0) AS selling_price,
        COALESCE(NULLIF(v.price, 0), NULLIF(v.selling_price, 0), s.selling_price, 0) AS price,
        s.service_name,
        s.unit AS service_unit,
        vsd.vehicle_service_id,
        vsd.vehicle_model AS service_vehicle_model,
        vsd.total_quantity AS service_total_quantity,
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
      LEFT JOIN services s ON v.service_id = s.service_id
      LEFT JOIN vehicle_service_details vsd ON s.service_id = vsd.service_id
      ${whereClause}
      ORDER BY v.seat_capacity ASC, v.vehicle_id DESC
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

// Helper: Tìm hoặc đồng bộ service_id từ bảng vehicle_service_details / services
async function resolveVehicleServiceLink(service_id, seat_capacity, vehicle_type) {
  let finalServiceId = service_id && service_id !== 'null' && service_id !== 'undefined' && service_id !== '' ? Number(service_id) : null;
  let finalCapacity = Number(seat_capacity) || 7;
  let finalVehicleType = vehicle_type || `Xe ${finalCapacity} chỗ`;

  if (finalServiceId) {
    const [vsdRows] = await sequelize.query(`
      SELECT vsd.service_id, vsd.seat_capacity, vsd.vehicle_type
      FROM vehicle_service_details vsd
      WHERE vsd.service_id = ?
      LIMIT 1
    `, { replacements: [finalServiceId] });

    if (vsdRows && vsdRows.length > 0) {
      finalCapacity = Number(vsdRows[0].seat_capacity) || finalCapacity;
      finalVehicleType = vsdRows[0].vehicle_type || finalVehicleType;
      return { service_id: finalServiceId, seat_capacity: finalCapacity, vehicle_type: finalVehicleType };
    }
  }

  // Nếu chưa truyền service_id, tự động tìm gói dịch vụ xe nội bộ theo seat_capacity
  const [byCap] = await sequelize.query(`
    SELECT vsd.service_id, vsd.seat_capacity, vsd.vehicle_type
    FROM vehicle_service_details vsd
    JOIN services s ON vsd.service_id = s.service_id
    WHERE vsd.seat_capacity = ? AND s.partner_id IS NULL
    ORDER BY s.status = 'Active' DESC, s.service_id ASC
    LIMIT 1
  `, { replacements: [finalCapacity] });

  if (byCap && byCap.length > 0) {
    return {
      service_id: byCap[0].service_id,
      seat_capacity: Number(byCap[0].seat_capacity) || finalCapacity,
      vehicle_type: byCap[0].vehicle_type || finalVehicleType
    };
  }

  return { service_id: null, seat_capacity: finalCapacity, vehicle_type: finalVehicleType };
}

// 2. THÊM MỚI XE VÀO ĐỘI XE
exports.createVehicle = async (req, res) => {
  try {
    const { service_id, vehicle_name, base_cost, selling_price, price, vehicle_code, license_plate, seat_capacity, vehicle_type, brand_model, image_url, color, status, notes } = req.body;

    let finalImageUrl = image_url;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    if (!license_plate) {
      return res.status(400).json({ success: false, message: 'Biển số xe là bắt buộc!' });
    }

    const [existing] = await sequelize.query(`SELECT vehicle_id FROM vehicles WHERE license_plate = ?`, {
      replacements: [license_plate.trim()]
    });

    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: `Biển số xe ${license_plate} đã tồn tại trong hệ thống!` });
    }

    const resolved = await resolveVehicleServiceLink(service_id, seat_capacity, vehicle_type);
    const autoCode = vehicle_code || `XE-${resolved.seat_capacity}C-${Date.now().toString().slice(-4)}`;
    const finalVehicleName = vehicle_name || brand_model || `Xe ${resolved.seat_capacity} chỗ`;
    const finalSellingPrice = selling_price !== undefined && selling_price !== '' ? Number(selling_price) : (price !== undefined && price !== '' ? Number(price) : 0);
    const finalBaseCost = base_cost !== undefined && base_cost !== '' ? Number(base_cost) : 0;

    await sequelize.query(`
      INSERT INTO vehicles (service_id, vehicle_code, vehicle_name, license_plate, seat_capacity, base_cost, selling_price, price, vehicle_type, brand_model, image_url, color, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        resolved.service_id,
        autoCode.toUpperCase(),
        finalVehicleName,
        license_plate.trim().toUpperCase(),
        resolved.seat_capacity,
        finalBaseCost,
        finalSellingPrice,
        finalSellingPrice,
        resolved.vehicle_type,
        brand_model || finalVehicleName,
        finalImageUrl || '',
        color || '',
        status || 'AVAILABLE',
        notes || ''
      ]
    });

    // Đồng bộ cập nhật giá dịch vụ định phí liên kết nếu có
    if (resolved.service_id && (finalBaseCost > 0 || finalSellingPrice > 0)) {
      await sequelize.query(`
        UPDATE services 
        SET base_cost = CASE WHEN ? > 0 THEN ? ELSE base_cost END,
            selling_price = CASE WHEN ? > 0 THEN ? ELSE selling_price END
        WHERE service_id = ?
      `, { replacements: [finalBaseCost, finalBaseCost, finalSellingPrice, finalSellingPrice, resolved.service_id] });
    }

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
    const { service_id, vehicle_name, base_cost, selling_price, price, vehicle_code, license_plate, seat_capacity, vehicle_type, brand_model, image_url, color, status, notes } = req.body;

    let finalImageUrl = image_url;
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    const resolved = await resolveVehicleServiceLink(service_id, seat_capacity, vehicle_type);
    const finalVehicleName = vehicle_name || brand_model;
    const finalSellingPrice = selling_price !== undefined && selling_price !== '' ? Number(selling_price) : (price !== undefined && price !== '' ? Number(price) : 0);
    const finalBaseCost = base_cost !== undefined && base_cost !== '' ? Number(base_cost) : 0;

    await sequelize.query(`
      UPDATE vehicles
      SET service_id = ?, vehicle_code = ?, vehicle_name = ?, license_plate = ?, seat_capacity = ?, base_cost = ?, selling_price = ?, price = ?, vehicle_type = ?, brand_model = ?, image_url = ?, color = ?, status = ?, notes = ?
      WHERE vehicle_id = ?
    `, {
      replacements: [
        resolved.service_id,
        vehicle_code,
        finalVehicleName,
        license_plate.trim().toUpperCase(),
        resolved.seat_capacity,
        finalBaseCost,
        finalSellingPrice,
        finalSellingPrice,
        resolved.vehicle_type,
        brand_model || finalVehicleName,
        finalImageUrl,
        color,
        status,
        notes,
        id
      ]
    });

    // Đồng bộ cập nhật giá dịch vụ định phí liên kết nếu có
    if (resolved.service_id && (finalBaseCost > 0 || finalSellingPrice > 0)) {
      await sequelize.query(`
        UPDATE services 
        SET base_cost = CASE WHEN ? > 0 THEN ? ELSE base_cost END,
            selling_price = CASE WHEN ? > 0 THEN ? ELSE selling_price END
        WHERE service_id = ?
      `, { replacements: [finalBaseCost, finalBaseCost, finalSellingPrice, finalSellingPrice, resolved.service_id] });
    }

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
    const { start_date, end_date, min_seats, service_id } = req.query;

    let query = `
      SELECT v.*, s.service_name, s.base_cost, s.selling_price, vsd.vehicle_service_id
      FROM vehicles v
      LEFT JOIN services s ON v.service_id = s.service_id
      LEFT JOIN vehicle_service_details vsd ON s.service_id = vsd.service_id
      WHERE v.status != 'INACTIVE'
    `;
    const replacements = [];

    if (service_id) {
      query += ` AND v.service_id = ?`;
      replacements.push(Number(service_id));
    } else if (min_seats) {
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
        d.tour_id,
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


// ==========================================
// OFFICE STAFF FUNCTIONS
// ==========================================

exports.updateVehicleStatusStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_status, reason, start_date, end_date } = req.body;
    const userId = req.user.user_id || req.user.id || null;

    // Check current status
    const [vehicles] = await sequelize.query('SELECT status, license_plate FROM vehicles WHERE vehicle_id = ?', {
      replacements: [id]
    });

    if (vehicles.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy xe' });
    }

    const currentStatus = vehicles[0].status;

    if (new_status === 'IN_TOUR' || currentStatus === 'IN_TOUR') {
      return res.status(403).json({ success: false, message: 'Không thể chuyển thủ công trạng thái Đang đi tour' });
    }

    await sequelize.query('UPDATE vehicles SET status = ? WHERE vehicle_id = ?', {
      replacements: [new_status, id]
    });

    await sequelize.query(`
      INSERT INTO vehicle_status_history (vehicle_id, old_status, new_status, reason, updated_by)
      VALUES (?, ?, ?, ?, ?)
    `, {
      replacements: [id, currentStatus, new_status, reason || '', userId]
    });

    if (new_status === 'MAINTENANCE' || new_status === 'REPAIR') {
      await sequelize.query(`
        INSERT INTO vehicle_maintenances (vehicle_id, start_date, end_date, reason, status)
        VALUES (?, ?, ?, ?, 'IN_PROGRESS')
      `, {
        replacements: [id, start_date || new Date(), end_date || new Date(), reason || '']
      });
    } else if (new_status === 'AVAILABLE') {
      await sequelize.query(`
        UPDATE vehicle_maintenances 
        SET status = 'COMPLETED'
        WHERE vehicle_id = ? AND status = 'IN_PROGRESS'
      `, {
        replacements: [id]
      });
    }

    res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
  } catch (error) {
    console.error('Lỗi updateVehicleStatusStaff:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDriverIncidentsStaff = async (req, res) => {
  try {
    const [incidents] = await sequelize.query(`
      SELECT d.*, v.license_plate, v.brand_model, v.status as vehicle_status
      FROM driver_incidents d
      LEFT JOIN vehicles v ON d.vehicle_number = v.license_plate
      ORDER BY d.created_at DESC
    `);
    res.json({ success: true, data: incidents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDriverIncidentStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, action, reason } = req.body;
    const userId = req.user.user_id || req.user.id || null;

    await sequelize.query('UPDATE driver_incidents SET status = ? WHERE incident_id = ?', {
      replacements: [status, id]
    });

    // Lấy thông tin sự cố và biển số xe
    const [incs] = await sequelize.query('SELECT incident_id, vehicle_number, title, driver_id FROM driver_incidents WHERE incident_id = ?', { replacements: [id] });
    if (incs.length > 0) {
      const lp = incs[0].vehicle_number;
      const incTitle = incs[0].title || 'Sự cố xe';
      const [vehs] = await sequelize.query('SELECT vehicle_id, status FROM vehicles WHERE license_plate = ?', { replacements: [lp] });

      if (vehs.length > 0) {
        const v = vehs[0];

        // 1. Chuyển sang sửa chữa
        if (action === 'REPAIR') {
          if (v.status !== 'REPAIR') {
            await sequelize.query('UPDATE vehicles SET status = ? WHERE vehicle_id = ?', { replacements: ['REPAIR', v.vehicle_id] });
            await sequelize.query(`
              INSERT INTO vehicle_status_history (vehicle_id, old_status, new_status, reason, updated_by)
              VALUES (?, ?, ?, ?, ?)
            `, {
              replacements: [v.vehicle_id, v.status, 'REPAIR', reason || `Chuyển vào sửa chữa từ sự cố: ${incTitle}`, userId]
            });
            await sequelize.query(`
              INSERT INTO vehicle_maintenances (vehicle_id, start_date, end_date, reason, status)
              VALUES (?, ?, ?, ?, 'IN_PROGRESS')
            `, {
              replacements: [v.vehicle_id, new Date(), new Date(), reason || `Sửa chữa sự cố: ${incTitle}`]
            });
          }
        } 
        // 2. Đánh dấu đã giải quyết xong sự cố -> Đưa xe về Sẵn sàng
        else if (action === 'RESOLVED' || status === 'Resolved') {
          const oldStatus = v.status;
          const targetStatus = (oldStatus === 'REPAIR' || oldStatus === 'MAINTENANCE') ? 'AVAILABLE' : oldStatus;

          if (oldStatus !== targetStatus) {
            await sequelize.query('UPDATE vehicles SET status = ? WHERE vehicle_id = ?', { replacements: [targetStatus, v.vehicle_id] });
            await sequelize.query(`
              INSERT INTO vehicle_status_history (vehicle_id, old_status, new_status, reason, updated_by)
              VALUES (?, ?, ?, ?, ?)
            `, {
              replacements: [v.vehicle_id, oldStatus, targetStatus, reason || `Sự cố đã được giải quyết: ${incTitle} - Đưa xe về Sẵn sàng hoạt động`, userId]
            });
          }

          // Hoàn thành các phiếu sửa chữa / bảo dưỡng đang tiến hành
          await sequelize.query(`
            UPDATE vehicle_maintenances 
            SET status = 'COMPLETED', end_date = ?
            WHERE vehicle_id = ? AND status = 'IN_PROGRESS'
          `, {
            replacements: [new Date(), v.vehicle_id]
          });
        }
      }

      // Bắn thông báo Realtime cho Tài xế đã báo cáo sự cố này
      if (incs[0].driver_id) {
        try {
          const isResolved = status === 'Resolved' || action === 'RESOLVED';
          const notifTitle = isResolved ? `✅ Sự cố xe ${lp} đã được xử lý xong` : `🔧 Sự cố xe ${lp} đang được sửa chữa`;
          const notifContent = isResolved
            ? `Sự cố "${incTitle}" đã được Ban điều hành giải quyết xong. Xe ${lp} đã sẵn sàng vận hành trở lại!`
            : `Sự cố "${incTitle}" đã được Ban điều hành tiếp nhận và chuyển xe vào xưởng sửa chữa. Vui lòng theo dõi tiến độ!`;

          await sequelize.query(`
            INSERT INTO notifications (user_id, type, target_role, title, content, is_read, action_url, created_at)
            VALUES (?, 'DRIVER_INCIDENT_UPDATE', 'DRIVER', ?, ?, 0, 'driver_assigned', NOW())
          `, {
            replacements: [incs[0].driver_id, notifTitle, notifContent]
          });
        } catch (dNotifErr) {
          console.error('Lỗi gửi thông báo cho tài xế:', dNotifErr);
        }
      }
    }

    res.json({ success: true, message: 'Đã cập nhật sự cố' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVehicleHistoryStaff = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Thông tin phương tiện
    const [vehicles] = await sequelize.query(`
      SELECT vehicle_id, license_plate, brand_model, vehicle_type, seat_capacity, status, color
      FROM vehicles
      WHERE vehicle_id = ?
    `, { replacements: [id] });

    if (vehicles.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy xe' });
    }

    const vehicle = vehicles[0];

    // 2. Lịch sử thay đổi trạng thái xe
    const [history] = await sequelize.query(`
      SELECT h.*, u.full_name as user_name
      FROM vehicle_status_history h
      LEFT JOIN users u ON h.updated_by = u.user_id
      WHERE h.vehicle_id = ?
      ORDER BY h.created_at DESC
    `, { replacements: [id] });

    // 3. Lịch sử bảo dưỡng & sửa chữa (vehicle_maintenances)
    const [maintenances] = await sequelize.query(`
      SELECT m.*
      FROM vehicle_maintenances m
      WHERE m.vehicle_id = ?
      ORDER BY m.created_at DESC
    `, { replacements: [id] });

    // 4. Lịch sử sự cố do tài xế báo cáo cho xe này (driver_incidents)
    const [incidents] = await sequelize.query(`
      SELECT d.*, u.full_name as driver_name, u.phone as driver_phone
      FROM driver_incidents d
      LEFT JOIN users u ON d.driver_id = u.user_id
      WHERE d.vehicle_number = ?
      ORDER BY d.created_at DESC
    `, { replacements: [vehicle.license_plate] });

    res.json({ 
      success: true, 
      data: history, // giữ tương thích ngược
      vehicle,
      history,
      maintenances,
      incidents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


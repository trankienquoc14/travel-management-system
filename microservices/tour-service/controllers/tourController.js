const { calculateDepartureCrossBooking } = require('../utils/roomCalculator');
const sequelize = require('../config/database');
const Tour = require('../models/Tour');

// Tự động kiểm tra và chuyển trạng thái đợt khởi hành hết hạn / quá ngày về CLOSED
const syncExpiredDeparturesStatus = async (transaction = null) => {
  try {
    const opts = transaction ? { transaction } : {};
    await sequelize.query(`
      UPDATE departures 
      SET status = 'Closed' 
      WHERE (return_date < CURDATE() OR (available_slots <= 0 AND departure_date <= CURDATE()))
        AND status = 'Open'
    `, opts);
  } catch (error) {
    console.error("Auto sync departures status error:", error);
  }
};
exports.syncExpiredDeparturesStatus = syncExpiredDeparturesStatus;

// =====================================================================
// NHÓM 1: CÁC HÀM CŨ ĐANG CHẠY (GIỮ NGUYÊN 100% ĐỂ KHÔNG GÂY CODE)
// =====================================================================

// Lấy danh sách tour mở bán cho khách hàng
exports.getAllTours = async (req, res) => {
  try {
    await syncExpiredDeparturesStatus();
    const tours = await Tour.findAll({ where: { status: 'Active', is_custom: 0 } });
    res.status(200).json({ success: true, data: tours });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy chi tiết tour cơ bản cho khách
exports.getTourById = async (req, res) => {
  try {
    await syncExpiredDeparturesStatus();
    const tourId = req.params.id;
    const [tour] = await sequelize.query(`SELECT * FROM tours WHERE tour_id = ${tourId}`);
    if (!tour.length) return res.status(404).json({ success: false, message: 'Không tìm thấy tour' });

    const [itineraries] = await sequelize.query(`SELECT * FROM itineraries WHERE tour_id = ${tourId} ORDER BY day_number ASC`);
    const [departures] = await sequelize.query(`SELECT * FROM departures WHERE tour_id = ${tourId} AND status = 'Open' AND available_slots > 0 AND return_date >= CURDATE() ORDER BY departure_date ASC`);

    res.status(200).json({ success: true, data: { ...tour[0], itineraries, departures } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [HÄ‚â‚¬M CĂ…Â¨] ThÄ‚Âªm tour cĂ†Â¡ bĂ¡ÂºÂ£n tĂ¡Â»Â« form cĂ…Â©
exports.createTour = async (req, res) => {
  try {
    const { tour_name, description, destination, duration_days, base_price, status } = req.body;
    const created_by = req.user?.id || req.user?.user_id;

    let finalImageUrl = '';
    if (req.file) finalImageUrl = `/uploads/${req.file.filename}`;

    await sequelize.query(`
      INSERT INTO tours (tour_name, description, destination, duration_days, base_price, image_url, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, { replacements: [tour_name, description, destination, duration_days, base_price, finalImageUrl, status, created_by] });

    res.status(201).json({ success: true, message: 'ThÄ‚Âªm Tour thÄ‚Â nh cÄ‚Â´ng!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [HÄ‚â‚¬M CĂ…Â¨] SĂ¡Â»Â­a tour cĂ†Â¡ bĂ¡ÂºÂ£n tĂ¡Â»Â« form cĂ…Â©
exports.updateTour = async (req, res) => {
  try {
    const { id } = req.params;
    const { tour_name, description, destination, duration_days, base_price, status, existing_image_url } = req.body;

    let finalImageUrl = existing_image_url || '';
    if (req.file) finalImageUrl = `/uploads/${req.file.filename}`;

    await sequelize.query(`
      UPDATE tours 
      SET tour_name = ?, description = ?, destination = ?, duration_days = ?, base_price = ?, image_url = ?, status = ?
      WHERE tour_id = ?
    `, { replacements: [tour_name, description, destination, duration_days, base_price, finalImageUrl, status, id] });

    res.status(200).json({ success: true, message: 'CĂ¡ÂºÂ­p nhĂ¡ÂºÂ­t Tour thÄ‚Â nh cÄ‚Â´ng!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [HÄ‚â‚¬M CĂ…Â¨] XÄ‚Â³a tour
exports.deleteTour = async (req, res) => {
  try {
    const { id } = req.params;
    await sequelize.query(`DELETE FROM tours WHERE tour_id = ?`, { replacements: [id] });
    res.status(200).json({ success: true, message: 'XÄ‚Â³a Tour thÄ‚Â nh cÄ‚Â´ng!' });
  } catch (error) {
    if (error.original && error.original.errno === 1451) {
      return res.status(400).json({ success: false, message: 'KhÄ‚Â´ng thĂ¡Â»Æ’ xÄ‚Â³a! Tour nÄ‚Â y Ă„â€˜ang cÄ‚Â³ NgÄ‚Â y khĂ¡Â»Å¸i hÄ‚Â nh hoĂ¡ÂºÂ·c Ă„ÂĂ†Â¡n Ă„â€˜Ă¡ÂºÂ·t hÄ‚Â ng liÄ‚Âªn kĂ¡ÂºÂ¿t.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// LĂ¡ÂºÂ¥y danh sÄ‚Â¡ch toÄ‚Â n bĂ¡Â»â„¢ sĂ¡Â»Â± cĂ¡Â»â€˜ (GET)
exports.getAllIncidents = async (req, res) => {
  try {
    const [incidents] = await sequelize.query(`
      SELECT 
        ir.incident_id, ir.title, ir.description, ir.status, ir.created_at,
        d.departure_id, d.departure_date,
        t.tour_id, t.tour_name, t.destination,
        u.full_name as guide_name, u.phone as guide_phone, g.license_number
      FROM incident_reports ir
      JOIN departures d ON ir.departure_id = d.departure_id
      JOIN tours t ON d.tour_id = t.tour_id
      JOIN guides g ON ir.guide_id = g.guide_id
      JOIN users u ON g.user_id = u.user_id
      ORDER BY ir.incident_id DESC
    `);

    res.status(200).json({
      success: true,
      data: incidents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CĂ¡ÂºÂ­p nhĂ¡ÂºÂ­t trĂ¡ÂºÂ¡ng thÄ‚Â¡i sĂ¡Â»Â± cĂ¡Â»â€˜ vÄ‚Â  phĂ¡ÂºÂ£n hĂ¡Â»â€œi giĂ¡ÂºÂ£i quyĂ¡ÂºÂ¿t (PUT)
exports.updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;

    if (!['Open', 'Resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'TrĂ¡ÂºÂ¡ng thÄ‚Â¡i sĂ¡Â»Â± cĂ¡Â»â€˜ khÄ‚Â´ng hĂ¡Â»Â£p lĂ¡Â»â€¡!' });
    }

    await sequelize.query(`
      UPDATE incident_reports 
      SET status = ?, resolution_notes = ? 
      WHERE incident_id = ?
    `, {
      replacements: [status, resolution_notes || null, id]
    });

    res.status(200).json({
      success: true,
      message: 'CĂ¡ÂºÂ­p nhĂ¡ÂºÂ­t trĂ¡ÂºÂ¡ng thÄ‚Â¡i sĂ¡Â»Â± cĂ¡Â»â€˜ vÄ‚Â  ghi chÄ‚Âº giĂ¡ÂºÂ£i quyĂ¡ÂºÂ¿t thÄ‚Â nh cÄ‚Â´ng!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}; // Ä‘Å¸â€˜Ë† Ă„ÂÄ‚Æ’ BĂ¡Â»â€ SUNG DĂ¡ÂºÂ¤U Ă„ÂÄ‚â€œNG HÄ‚â‚¬M TĂ¡ÂºÂ I Ă„ÂÄ‚â€Y Ă„ÂĂ¡Â»â€ TRÄ‚ÂNH LĂ¡Â»â€“I NHĂ¡Â»ÂT HÄ‚â‚¬M!

// =====================================================================
// NHÄ‚â€œM 2: CÄ‚ÂC HÄ‚â‚¬M MĂ¡Â»ÂI NÄ‚â€NG CĂ¡ÂºÂ¤P (VĂ¡ÂºÂ¬N HÄ‚â‚¬NH & Ă„ÂĂ¡Â»ÂNH GIÄ‚Â TOUR)
// =====================================================================

// [HÀM MỚI] Lấy trọn bộ dữ liệu vận hành (Tour + Lịch trình ngày + Điểm ghé thăm + Đợt khởi hành)
exports.getTourOperationalDetail = async (req, res) => {
  try {
    await syncExpiredDeparturesStatus();
    const { id } = req.params;
    const [tours] = await sequelize.query(`SELECT * FROM tours WHERE tour_id = ?`, { replacements: [id] });
    if (tours.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy tour!' });
    const tour = tours[0];

    const [days] = await sequelize.query(`SELECT * FROM itineraries WHERE tour_id = ? ORDER BY day_number ASC`, { replacements: [id] });
    for (let day of days) {
      const [activities] = await sequelize.query(`
        SELECT ia.activity_id as id, ia.itinerary_id, ia.activity_type, ia.reference_id as place_id, ia.order_index as visit_order, ia.start_time as visit_time,
               CASE 
                 WHEN ia.activity_type = 'Place' THEN p.place_name
                 WHEN ia.activity_type = 'Accommodation' THEN s.service_name
                 WHEN ia.activity_type = 'Transport' THEN s.service_name
                 ELSE NULL
               END as place_name,
               CASE 
                 WHEN ia.activity_type = 'Place' THEN p.estimated_price
                 WHEN ia.activity_type IN ('Accommodation', 'Transport') THEN s.base_cost
                 ELSE 0
               END as estimated_price
        FROM itinerary_activities ia
        LEFT JOIN places p ON ia.activity_type = 'Place' AND ia.reference_id = p.place_id
        LEFT JOIN services s ON ia.activity_type IN ('Accommodation', 'Transport') AND ia.reference_id = s.service_id
        WHERE ia.itinerary_id = ?
        ORDER BY ia.order_index ASC, ia.start_time ASC
      `, { replacements: [day.itinerary_id] });
      day.places = activities; // Keeping the name 'places' so frontend doesn't break
    }

    const [departures] = await sequelize.query(`SELECT * FROM departures WHERE tour_id = ? ORDER BY departure_date ASC`, { replacements: [id] });

    res.status(200).json({ success: true, data: { ...tour, itineraryDays: days, departures } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [HÀM MỚI] Lưu trọn bộ Tour + Lịch trình + Định giá (% Lợi nhuận) + Khởi hành bằng Transaction
exports.saveTourOperationalSchedule = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    await syncExpiredDeparturesStatus(transaction);
    const userId = req.user?.id || req.user?.user_id;
    let {
            tour_id, tour_name, destination, duration_days, base_price = 0,
      base_cost = 0, markup_percent = 20, description, status = 'Pending', existing_image_url
    } = req.body;

    const itineraryDays = req.body.itineraryDays ? JSON.parse(req.body.itineraryDays) : [];
    const departures = req.body.departures ? JSON.parse(req.body.departures) : [];

    let finalImageUrl = existing_image_url || '';
    if (req.file) finalImageUrl = `/uploads/${req.file.filename}`;

    let targetTourId = tour_id && tour_id !== 'null' ? Number(tour_id) : null;

    // A. LƯU BẢNG TOURS (Đã thêm base_cost và markup_percent)
    if (targetTourId) {
      await sequelize.query(`
        UPDATE tours 
        SET tour_name=?, destination=?, duration_days=?, base_price=?, base_cost=?, markup_percent=?, description=?, image_url=?, status=? 
        WHERE tour_id=?
      `, { replacements: [tour_name, destination, duration_days, base_price, base_cost, markup_percent, description, finalImageUrl, status, targetTourId], transaction });
    } else {
      const [insertResult] = await sequelize.query(`
        INSERT INTO tours (tour_name, destination, duration_days, base_price, base_cost, markup_percent, description, image_url, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, { replacements: [tour_name, destination, duration_days, base_price, base_cost, markup_percent, description, finalImageUrl, status, userId], transaction });
      targetTourId = insertResult;
    }

    // B. LƯU LỊCH TRÌNH VẬN HÀNH
    if (targetTourId) {
      const [oldItins] = await sequelize.query(`SELECT itinerary_id FROM itineraries WHERE tour_id=?`, { replacements: [targetTourId], transaction });
      for (let old of oldItins) {
        await sequelize.query(`DELETE FROM itinerary_activities WHERE itinerary_id=?`, { replacements: [old.itinerary_id], transaction });
      }
      await sequelize.query(`DELETE FROM itineraries WHERE tour_id=?`, { replacements: [targetTourId], transaction });

      for (let day of itineraryDays) {
        const [itinRes] = await sequelize.query(`
          INSERT INTO itineraries (tour_id, day_number, title, description) VALUES (?, ?, ?, ?)
        `, { replacements: [targetTourId, day.day_number, day.title || `Ngày ${day.day_number}`, day.description || ''], transaction });

        const newItinId = itinRes;
        if (day.places && day.places.length > 0) {
          for (let [idx, pl] of day.places.entries()) {
             let activityType = 'Place';
             let refId = null;

             if (typeof pl.place_id === 'string' || typeof pl.reference_id === 'string') {
                 let idStr = pl.place_id || pl.reference_id;
                 if (idStr.startsWith('hotel_')) {
                     activityType = 'Accommodation';
                     refId = parseInt(idStr.replace('hotel_', ''));
                 } else if (idStr.startsWith('transport_')) {
                     activityType = 'Transport';
                     refId = parseInt(idStr.replace('transport_', ''));
                 } else {
                     refId = parseInt(idStr);
                 }
             } else {
                 refId = parseInt(pl.place_id || pl.reference_id);
             }
             
             if (refId && !isNaN(refId)) {
                await sequelize.query(`
                  INSERT INTO itinerary_activities (itinerary_id, activity_type, reference_id, order_index, start_time) VALUES (?, ?, ?, ?, ?)
                `, { replacements: [newItinId, activityType, refId, pl.order_index || pl.visit_order || idx + 1, pl.start_time || pl.visit_time || null], transaction });
             }
          }
        }
      }

      // C. LƯU ĐỢT KHỞI HÀNH & PHÂN CÔNG HƯỚNG DẪN VIÊN
      const keepDepIds = departures.map(d => d.departure_id).filter(id => id);
      if (keepDepIds.length > 0) {
          await sequelize.query(`DELETE FROM departures WHERE tour_id=? AND available_slots = max_slots AND status != 'Closed' AND status != 'Completed' AND return_date >= CURDATE() AND departure_id NOT IN (?)`, { replacements: [targetTourId, keepDepIds], transaction });
      } else {
          await sequelize.query(`DELETE FROM departures WHERE tour_id=? AND available_slots = max_slots AND status != 'Closed' AND status != 'Completed' AND return_date >= CURDATE()`, { replacements: [targetTourId], transaction });
      }

      const todayStr = new Date().toISOString().split('T')[0];

      for (let dep of departures) {
        let realGuideId = null;
        if (dep.guide_id) {
          const [gRow] = await sequelize.query(`SELECT guide_id FROM guides WHERE user_id = ? OR guide_id = ? LIMIT 1`, {
            replacements: [dep.guide_id, dep.guide_id],
            transaction
          });
          if (gRow.length > 0) {
            realGuideId = gRow[0].guide_id;
          }
        }

        let targetDepId = dep.departure_id;

        const gIdToSave = dep.guide_id ? Number(dep.guide_id) : null;
        const dIdToSave = dep.driver_id ? Number(dep.driver_id) : null;
        const vehToSave = (dep.vehicle_number && String(dep.vehicle_number).trim()) ? String(dep.vehicle_number).trim() : null;

        if (targetDepId) {
            const [oldDepRow] = await sequelize.query(`SELECT departure_date, return_date, status, guide_id, driver_id, vehicle_number, max_slots, available_slots FROM departures WHERE departure_id = ? LIMIT 1`, {
              replacements: [targetDepId],
              transaction
            });
            let newMaxSlots = Number(dep.max_slots || 30);
            let newAvailSlots = newMaxSlots;

            if (oldDepRow.length > 0) {
              const oldDep = oldDepRow[0];
              const oldRetStr = oldDep.return_date ? String(oldDep.return_date).substring(0, 10) : '';
              const isOldPast = oldRetStr ? oldRetStr < todayStr : false;
              const isOldClosed = oldDep.status === 'Closed' || oldDep.status === 'Completed' || isOldPast;

              if (isOldClosed) {
                const oldGuide = oldDep.guide_id ? Number(oldDep.guide_id) : null;
                const oldDriver = oldDep.driver_id ? Number(oldDep.driver_id) : null;
                const oldVeh = oldDep.vehicle_number ? String(oldDep.vehicle_number).trim() : null;
                const oldDepDate = oldDep.departure_date ? String(oldDep.departure_date).substring(0, 10) : '';
                const newDepDate = dep.departure_date ? String(dep.departure_date).substring(0, 10) : '';
                const newRetDate = dep.return_date ? String(dep.return_date).substring(0, 10) : '';

                if (
                  gIdToSave !== oldGuide ||
                  dIdToSave !== oldDriver ||
                  vehToSave !== oldVeh ||
                  (newDepDate && oldDepDate && newDepDate !== oldDepDate) ||
                  (newRetDate && oldRetStr && newRetDate !== oldRetStr)
                ) {
                  await transaction.rollback();
                  return res.status(400).json({
                    success: false,
                    message: `⚠️ Đợt khởi hành #${targetDepId} đã kết thúc hoặc ở trạng thái KHÓA (CLOSED). Không thể phân công HDV/Tài xế mới hoặc thay đổi lịch vận hành!`
                  });
                }
              }

              const oldMax = Number(oldDep.max_slots || 30);
              const oldAvail = Number(oldDep.available_slots || 30);
              const booked = Math.max(0, oldMax - oldAvail);
              newAvailSlots = Math.max(0, newMaxSlots - booked);
            }

            const isPastDep = dep.return_date && String(dep.return_date).substring(0, 10) < todayStr;
            const depStatus = isPastDep ? 'Closed' : (dep.status || 'Open');

            await sequelize.query(`
              UPDATE departures 
              SET departure_date=?, return_date=?, max_slots=?, available_slots=?, guide_id=?, driver_id=?, vehicle_number=?, status=?
              WHERE departure_id=?
            `, { replacements: [
                dep.departure_date, 
                dep.return_date, 
                newMaxSlots, 
                newAvailSlots,
                gIdToSave, 
                dIdToSave, 
                vehToSave, 
                depStatus,
                targetDepId
              ], transaction });
        } else {
            if ((dep.departure_date && String(dep.departure_date).substring(0, 10) < todayStr) || (dep.return_date && String(dep.return_date).substring(0, 10) < todayStr)) {
              await transaction.rollback();
              return res.status(400).json({
                success: false,
                message: `⚠️ Không thể tạo đợt khởi hành mới ở ngày quá khứ (${dep.departure_date}).`
              });
            }

            const [insRes] = await sequelize.query(`
              INSERT INTO departures (tour_id, departure_date, return_date, max_slots, available_slots, status, guide_id, driver_id, vehicle_number)
              VALUES (?, ?, ?, ?, ?, 'Open', ?, ?, ?)
            `, { replacements: [
                targetTourId, 
                dep.departure_date, 
                dep.return_date, 
                dep.max_slots || 30, 
                dep.max_slots || 30, 
                gIdToSave, 
                dIdToSave, 
                vehToSave
              ], transaction });
            targetDepId = insRes;
        }

        // Luôn xóa sạch bản ghi phân công cũ cho đợt này trước khi chèn mới duy nhất 1 HDV
        await sequelize.query(`DELETE FROM guide_assignments WHERE departure_id = ?`, {
          replacements: [targetDepId],
          transaction
        });

        if (realGuideId && targetDepId) {
          await sequelize.query(`INSERT INTO guide_assignments (departure_id, guide_id, assigned_at) VALUES (?, ?, NOW())`, {
            replacements: [targetDepId, realGuideId],
            transaction
          });
        }

        if (targetDepId && vehToSave && dIdToSave) {
          try {
            await sequelize.query(`DELETE FROM tour_vehicle_assignments WHERE departure_id = ?`, {
              replacements: [targetDepId],
              transaction
            });
            const [vRows] = await sequelize.query(`SELECT vehicle_id FROM vehicles WHERE license_plate = ? LIMIT 1`, {
              replacements: [vehToSave],
              transaction
            });
            if (vRows.length > 0) {
              await sequelize.query(`
                INSERT INTO tour_vehicle_assignments (departure_id, vehicle_id, driver_id, start_date, end_date, status)
                VALUES (?, ?, ?, ?, ?, 'ASSIGNED')
              `, {
                replacements: [targetDepId, vRows[0].vehicle_id, dIdToSave, dep.departure_date, dep.return_date],
                transaction
              });
            }
          } catch(ve) {
            console.warn("Không thể đồng bộ tour_vehicle_assignments:", ve.message);
          }
        }
      }
    }

    await transaction.commit();
    res.status(200).json({ success: true, message: 'Ä‘Å¸Ââ€° ThiĂ¡ÂºÂ¿t lĂ¡ÂºÂ­p lĂ¡Â»â€¹ch trÄ‚Â¬nh & Ă„â€˜Ă¡Â»â€¹nh giÄ‚Â¡ Tour thÄ‚Â nh cÄ‚Â´ng!', tour_id: targetTourId });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};
// [QUĂ¡ÂºÂ¢N LÄ‚Â ] PhÄ‚Âª duyĂ¡Â»â€¡t hoĂ¡ÂºÂ·c TĂ¡Â»Â« chĂ¡Â»â€˜i Tour CĂ¡Â»â€˜ Ă„â€˜Ă¡Â»â€¹nh
exports.updateTourStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;
    const finalStatus = (status === 'Approved' || status === 'Active') ? 'Active' : status;

    await sequelize.query(`
      UPDATE tours SET status = ?, rejection_reason = ? WHERE tour_id = ?
    `, { replacements: [finalStatus, rejection_reason || null, id] });

    res.status(200).json({ success: true, message: `Đã cập nhật trạng thái thành ${finalStatus}` });
  } catch (error) {
    console.error("LĂ¡Â»â€”i cĂ¡ÂºÂ­p nhĂ¡ÂºÂ­t trĂ¡ÂºÂ¡ng thÄ‚Â¡i tour:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// [MĂ¡Â»ÂI] LĂ†Â°u thiĂ¡ÂºÂ¿t kĂ¡ÂºÂ¿ tour cĂ¡Â»â€˜ Ă„â€˜Ă¡Â»â€¹nh theo chuĂ¡ÂºÂ©n DDD vÄ‚Â  Ă„â€˜a hÄ‚Â¬nh
exports.saveFixedTourDesign = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const userId = req.user?.id || req.user?.user_id;

        let {
            tour_id, tour_name = '', destination = '', duration_days = 1, base_price = 0, description = '',
            status = 'Pending', base_cost = 0, markup_percent = 20, design_data = null
        } = req.body;

        description = description || '';
        destination = destination || 'Chưa phân loại';

        if (destination && !isNaN(Number(destination))) {
            const [destRows] = await sequelize.query(`SELECT destination_name FROM destinations WHERE destination_id = ?`, { replacements: [Number(destination)], transaction });
            if (destRows.length > 0) {
                destination = destRows[0].destination_name;
            }
        }

        const itineraryDays = req.body.itineraryDays ? JSON.parse(req.body.itineraryDays) : [];
        let targetTourId = tour_id && tour_id !== 'null' ? Number(tour_id) : null;

                let finalImageUrl = req.body.existing_image_url || '';
        let dayImages = {};

        try {
            if (req.body.existing_day_images) {
                dayImages = JSON.parse(req.body.existing_day_images);
            }
        } catch(e){}

        if (req.files && Array.isArray(req.files)) {
            const mainImg = req.files.find(f => f.fieldname === 'image');
            if (mainImg) finalImageUrl = `/uploads/${mainImg.filename}`;

            req.files.forEach(f => {
                if (f.fieldname.startsWith('dayImage_')) {
                    const dayIdx = f.fieldname.split('_')[1];
                    dayImages[dayIdx] = `/uploads/${f.filename}`;
                }
            });
        }

        if (design_data) {
            try {
                let parsed = typeof design_data === 'string' ? JSON.parse(design_data) : design_data;
                parsed.dayImages = dayImages;
                design_data = JSON.stringify(parsed);
            } catch(e) {}
        }

        if (targetTourId) {
            await sequelize.query(`
                UPDATE tours 
                SET tour_name=?, destination=?, duration_days=?, base_price=?, base_cost=?, markup_percent=?, description=?, image_url=?, status=?, design_data=? 
                WHERE tour_id=?
            `, { replacements: [tour_name, destination, duration_days, base_price, base_cost, markup_percent, description, finalImageUrl, status, design_data, targetTourId], transaction });
        } else {
            const [insertResult] = await sequelize.query(`
                INSERT INTO tours (tour_name, destination, duration_days, base_price, base_cost, markup_percent, description, image_url, status, created_by, design_data)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, { replacements: [tour_name, destination, duration_days, base_price, base_cost, markup_percent, description, finalImageUrl, status, userId, design_data], transaction });
            targetTourId = insertResult;
        }

        // XÄ‚Â³a lĂ¡Â»â€¹ch trÄ‚Â¬nh cĂ…Â© (sĂ¡ÂºÂ½ cascade xÄ‚Â³a itinerary_activities)
        await sequelize.query(`DELETE FROM itineraries WHERE tour_id=?`, { replacements: [targetTourId], transaction });

        for (let day of itineraryDays) {
            const [itinRes] = await sequelize.query(`
                INSERT INTO itineraries (tour_id, day_number, title, description) VALUES (?, ?, ?, ?)
            `, { replacements: [targetTourId, day.day_number, day.title, day.description || ''], transaction });

            const newItinId = itinRes;

            if (day.places && day.places.length > 0) {
                for (let [idx, pl] of day.places.entries()) {
                    let activityType = 'Place';
                    let refId = null;

                    if (typeof pl.place_id === 'string') {
                        if (pl.place_id.startsWith('hotel_')) {
                            activityType = 'Accommodation';
                            refId = parseInt(pl.place_id.replace('hotel_', ''));
                        } else if (pl.place_id.startsWith('transport_')) {
                            activityType = 'Transport';
                            refId = parseInt(pl.place_id.replace('transport_', ''));
                        } else {
                            refId = parseInt(pl.place_id);
                        }
                    } else {
                        refId = parseInt(pl.place_id);
                    }

                    if (refId && !isNaN(refId)) {
                        await sequelize.query(`
                            INSERT INTO itinerary_activities (itinerary_id, activity_type, reference_id, order_index, start_time) 
                            VALUES (?, ?, ?, ?, ?)
                        `, { replacements: [newItinId, activityType, refId, pl.visit_order || idx + 1, pl.visit_time || null], transaction });
                    }
                }
            }
        }

        await transaction.commit();
        res.status(200).json({ success: true, message: 'Ä‘Å¸Ââ€° LĂ†Â°u bĂ¡ÂºÂ£n thiĂ¡ÂºÂ¿t kĂ¡ÂºÂ¿ Tour thÄ‚Â nh cÄ‚Â´ng!', tour_id: targetTourId });
    } catch (error) {
        await transaction.rollback();
        console.error("LĂ¡Â»â€“I LĂ†Â¯U TOUR (DDD):", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// =====================================================================
// NHÄ‚â€œM 3: CÄ‚ÂC HÄ‚â‚¬M CHO STAFF THIĂ¡ÂºÂ¾T KĂ¡ÂºÂ¾ TOUR
// =====================================================================

// 1. LĂ¡ÂºÂ¥y danh sÄ‚Â¡ch tĂ¡ÂºÂ¥t cĂ¡ÂºÂ£ cÄ‚Â¡c Tour cĂ¡Â»â€˜ Ă„â€˜Ă¡Â»â€¹nh (Cho mÄ‚Â n hÄ‚Â¬nh chÄ‚Â­nh)
exports.getAllFixedTours = async (req, res) => {
    try {
        const [tours] = await sequelize.query(`
            SELECT t.tour_id, t.tour_name, t.destination, t.duration_days, t.status, t.base_price, t.image_url, t.markup_percent, t.is_custom,
                   GROUP_CONCAT(d.departure_date ORDER BY d.departure_date ASC) as departure_dates
            FROM tours t
            LEFT JOIN departures d ON t.tour_id = d.tour_id AND d.status != 'Completed'
            GROUP BY t.tour_id
            ORDER BY t.tour_id DESC
        `);
        res.status(200).json({ success: true, data: tours });
    } catch (error) {
        console.error("LĂ¡Â»â€”i lĂ¡ÂºÂ¥y danh sÄ‚Â¡ch tour:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. LĂ¡ÂºÂ¥y chi tiĂ¡ÂºÂ¿t 1 Tour Ă„â€˜Ă¡Â»Æ’ nhÄ‚Â¢n viÄ‚Âªn sĂ¡Â»Â­a (Bao gĂ¡Â»â€œm dĂ¡Â»Â¯ liĂ¡Â»â€¡u kÄ‚Â©o thĂ¡ÂºÂ£)
exports.getFixedTourById = async (req, res) => {
    try {
        const { id } = req.params;
        const [tours] = await sequelize.query(`
            SELECT * FROM tours WHERE tour_id = ?
        `, { replacements: [id] });

        if (tours.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tour' });
        }
        const tour = tours[0];

        // Query đầy đủ lịch trình chi tiết từ CSDL
        const [days] = await sequelize.query(`SELECT * FROM itineraries WHERE tour_id = ? ORDER BY day_number ASC`, { replacements: [id] });
        for (let day of days) {
            const [activities] = await sequelize.query(`
                SELECT ia.activity_id as id, ia.itinerary_id, ia.activity_type, ia.reference_id as place_id, ia.order_index as visit_order, ia.start_time as visit_time,
                       CASE 
                         WHEN ia.activity_type = 'Place' THEN p.place_name
                         WHEN ia.activity_type = 'Accommodation' THEN s.service_name
                         WHEN ia.activity_type = 'Transport' THEN s.service_name
                         ELSE NULL
                       END as place_name,
                       CASE 
                         WHEN ia.activity_type = 'Place' THEN p.estimated_price
                         WHEN ia.activity_type IN ('Accommodation', 'Transport') THEN s.base_cost
                         ELSE 0
                       END as estimated_price
                FROM itinerary_activities ia
                LEFT JOIN places p ON ia.activity_type = 'Place' AND ia.reference_id = p.place_id
                LEFT JOIN services s ON ia.activity_type IN ('Accommodation', 'Transport') AND ia.reference_id = s.service_id
                WHERE ia.itinerary_id = ?
                ORDER BY ia.order_index ASC, ia.start_time ASC
            `, { replacements: [day.itinerary_id] });
            day.places = activities;
        }

        const [departures] = await sequelize.query(`SELECT * FROM departures WHERE tour_id = ? ORDER BY departure_date ASC`, { replacements: [id] });

        res.status(200).json({ success: true, data: { ...tour, itineraryDays: days, departures, itineraries: days } });
    } catch (error) {
        console.error("Lỗi lấy chi tiết tour:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. LĂ¡ÂºÂ¥y tÄ‚Â i nguyÄ‚Âªn theo Ă„â€˜iĂ¡Â»Æ’m Ă„â€˜Ă¡ÂºÂ¿n (Places, Hotels, Transports)
exports.getDestinationResources = async (req, res) => {
    try {
        const { destination } = req.query;

        if (!destination) {
            return res.status(400).json({ success: false, message: 'Vui lÄ‚Â²ng cung cĂ¡ÂºÂ¥p Ă„â€˜iĂ¡Â»Æ’m Ă„â€˜Ă¡ÂºÂ¿n (destination)' });
        }

        // 1. LĂ¡ÂºÂ¤Y Ă„ÂĂ¡Â»ÂA Ă„ÂIĂ¡Â»â€M THAM QUAN
        const [places] = await sequelize.query(`
            SELECT CONCAT('place_', p.place_id) as id, CONCAT(p.place_name, ' (Bởi: ', COALESCE(pt.partner_name, 'Tự do'), ')') as name, '🎟️ Tham quan' as type, p.estimated_price as price 
            FROM places p
            JOIN destinations d ON p.destination_id = d.destination_id
            LEFT JOIN partners pt ON p.partner_id = pt.partner_id
            WHERE d.destination_name LIKE ?
        `, { replacements: [`%${destination}%`] });

        // 2. LĂ¡ÂºÂ¤Y KHÄ‚ÂCH SĂ¡ÂºÂ N
                // 2. LẤY KHÁCH SẠN
        const [hotels] = await sequelize.query(`
            SELECT CONCAT('hotel_', s.service_id) as id, CONCAT(COALESCE(p.partner_name, 'Nội bộ'), ' - ', s.service_name) as name, '🏨 Lưu trú' as type, s.base_cost as price
            FROM services s
            LEFT JOIN partners p ON s.partner_id = p.partner_id
            JOIN destinations d ON s.destination_id = d.destination_id
            WHERE s.service_type = 'Khách sạn' AND d.destination_name LIKE ?
        `, { replacements: [`%${destination}%`] });

        // 3. LĂ¡ÂºÂ¤Y XE & MÄ‚ÂY BAY
                // 3. LẤY XE & MÁY BAY
        const [transports] = await sequelize.query(`
            SELECT CONCAT('transport_', s.service_id) as id, CONCAT(COALESCE(p.partner_name, 'Nội bộ'), ' - ', s.service_name) as name, '✈️ Di chuyển' as type, s.base_cost as price
            FROM services s
            LEFT JOIN partners p ON s.partner_id = p.partner_id
            WHERE s.service_type IN ('Xe vận chuyển', 'Vé máy bay')
        `);

        res.status(200).json({
            success: true,
            data: { sightseeing: places || [], accommodation: hotels || [], transport: transports || [] }
        });
    } catch (error) {
        console.error("Lá»—i láº¥y tĂ i nguyĂªn thiáº¿t káº¿ tour:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateTourPrice = async (req, res) => {
    try {
        const { id } = req.params;
        const { base_price, markup_percent } = req.body;
        await sequelize.query(
            "UPDATE tours SET base_price=?, markup_percent=? WHERE tour_id=?", 
            { replacements: [base_price, markup_percent, id] }
        );
        res.status(200).json({ success: true, message: "Cáº­p nháº­t giĂ¡ thĂ nh cĂ´ng!" });
    } catch (error) {
        console.error("Lá»—i cáº­p nháº­t giĂ¡:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getGuideSchedule = async (req, res) => {
    try {
        const [departures] = await sequelize.query(`
            SELECT 
                d.departure_id, d.tour_id, d.departure_date, d.return_date, d.guide_id, d.driver_id, d.vehicle_number,
                t.tour_name, t.is_custom 
            FROM departures d
            JOIN tours t ON d.tour_id = t.tour_id
            WHERE (t.status = 'Approved' OR t.status = 'Active')
              AND d.status != 'Completed'
            ORDER BY d.departure_date ASC
        `);

        res.status(200).json({ success: true, data: departures });
    } catch (error) {
        console.error("Lỗi lấy lịch chạy HDV:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getVehicles = async (req, res) => {
    try {
        const [vehicles] = await sequelize.query(`
            SELECT 
                s.service_id,
                s.service_name,
                s.service_type,
                vsd.seat_capacity as capacity,
                s.status,
                COALESCE(p.partner_name, 'Nội bộ') as partner_name
            FROM services s
            LEFT JOIN partners p ON s.partner_id = p.partner_id
            WHERE s.service_type = 'Xe vận chuyển' AND (s.status = 'Active' OR s.status IS NULL)
            ORDER BY vsd.seat_capacity ASC, s.service_name ASC
        `);
        res.status(200).json({ success: true, data: vehicles });
    } catch (error) {
        console.error("Lỗi lấy danh sách Xe hệ thống:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🚀 4. LƯU CẤU TRÚC NGUYỆN VỌNG DU LỊCH KHÁCH HÀNG (FOR AI RECOMMENDATION)
exports.saveCustomerPreferences = async (req, res) => {
    try {
        const userId = req.user?.user_id || req.user?.id || null;
        const {
            session_id,
            destinations,
            trip_purposes,
            companions,
            budget_range,
            interests,
            pace_preference,
            accommodation_level,
            transport_type,
            key_priorities
        } = req.body;

        const sessionKey = session_id || req.headers['x-session-id'] || 'guest_session_' + Date.now();

        const [result] = await sequelize.query(`
            INSERT INTO customer_travel_preferences (
                user_id, session_id, destinations, trip_purposes, companions,
                budget_range, interests, pace_preference, accommodation_level,
                transport_type, key_priorities
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, {
            replacements: [
                userId,
                sessionKey,
                JSON.stringify(destinations || []),
                JSON.stringify(trip_purposes || []),
                JSON.stringify(companions || []),
                budget_range || null,
                JSON.stringify(interests || []),
                pace_preference || null,
                accommodation_level || null,
                JSON.stringify(transport_type || []),
                JSON.stringify(key_priorities || [])
            ]
        });

        res.status(200).json({
            success: true,
            message: 'Đã lưu cấu trúc nguyện vọng du lịch (Travel Preference Profile) thành công!',
            preference_id: result.insertId || result
        });
    } catch (error) {
        console.error('Lỗi lưu Travel Preference Profile:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🚀 5. GHI NHẬN HÀNH VI KHÁCH HÀNG AI (Search -> View -> Click -> Favorite -> Booking -> Cancel -> Rating)
exports.logCustomerBehavior = async (req, res) => {
    try {
        const userId = req.user?.user_id || req.user?.id || null;
        const { session_id, event_type, tour_id, metadata } = req.body;

        const sessionKey = session_id || req.headers['x-session-id'] || 'guest_session_' + Date.now();

        await sequelize.query(`
            INSERT INTO customer_behavior_logs (user_id, session_id, event_type, tour_id, metadata)
            VALUES (?, ?, ?, ?, ?)
        `, {
            replacements: [
                userId,
                sessionKey,
                event_type || 'SEARCH',
                tour_id || null,
                JSON.stringify(metadata || {})
            ]
        });

        res.status(200).json({ success: true, message: 'Đã ghi nhận nhật ký hành vi AI.' });
    } catch (error) {
        console.error('Lỗi ghi nhận behavior log:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.getOperationalDepartures = async (req, res) => {
    try {
        const query = `
            SELECT 
                d.departure_id, d.tour_id, d.departure_date, d.return_date, 
                d.max_slots, d.available_slots, d.status, 
                d.operational_status, d.decision_history,
                t.tour_name, t.duration_days, t.design_data, t.is_custom, t.destination
            FROM departures d
            JOIN tours t ON d.tour_id = t.tour_id
            ORDER BY d.departure_date ASC
        `;
        const [rows] = await sequelize.query(query);
        
        
        // Fetch all active bookings and their passengers to calculate exact room allocations
        const [allBookings] = await sequelize.query(`
            SELECT b.booking_id, b.departure_id, p.passenger_type, p.single_room
            FROM bookings b
            JOIN booking_passengers p ON b.booking_id = p.booking_id
            WHERE b.booking_status != 'Cancelled'
        `);
        
        // Group by departure_id -> booking_id
        const departureBookings = {};
        for (const row of allBookings) {
            if (!departureBookings[row.departure_id]) departureBookings[row.departure_id] = {};
            if (!departureBookings[row.departure_id][row.booking_id]) {
                departureBookings[row.departure_id][row.booking_id] = { booking_id: row.booking_id, passengers: [] };
            }
            departureBookings[row.departure_id][row.booking_id].passengers.push({
                passenger_type: row.passenger_type,
                single_room: row.single_room === 1 || row.single_room === true
            });
        }

        const departures = await Promise.all(rows.map(async r => {
            let minPax = 15;
            let destName = r.destination;
            let roomRules = { max_adults: 2, max_children: 2, max_infants: 1, min_adults: 1, single_room_allowed: true };
            
            if (r.design_data) {
                try {
                    const parsed = typeof r.design_data === 'string' ? JSON.parse(r.design_data) : r.design_data;
                    if (parsed?.costConfig?.minimumPax) minPax = parsed.costConfig.minimumPax;
                    
                    // Attempt to extract specific room rules for this tour's accommodation
                    const days = parsed.days || parsed.itinerary || [];
                    for (const day of days) {
                        if (day.accommodation && day.accommodation.service_id) {
                            const [srvRows] = await sequelize.query("SELECT s.*, hsd.max_adults, hsd.max_children, hsd.max_infants, hsd.min_adults, hsd.single_room_allowed FROM services s LEFT JOIN hotel_service_details hsd ON s.service_id = hsd.service_id WHERE s.service_id = ?", { replacements: [day.accommodation.service_id] });
                            if (srvRows.length > 0) {
                                const srv = srvRows[0];
                                roomRules = {
                                    max_adults: srv.max_adults !== undefined ? srv.max_adults : 2,
                                    max_children: srv.max_children !== undefined ? srv.max_children : 2,
                                    max_infants: srv.max_infants !== undefined ? srv.max_infants : 1,
                                    min_adults: srv.min_adults !== undefined ? srv.min_adults : 1,
                                    single_room_allowed: srv.single_room_allowed !== undefined ? !!srv.single_room_allowed : true
                                };
                                break;
                            }
                        }
                    }
                } catch(e) {}
            }
            
            // Calculate total_required_rooms using cross-booking algorithm
            let total_required_rooms = 0;
            const bksForDep = departureBookings[r.departure_id];
            if (bksForDep) {
                const bookingsArr = Object.values(bksForDep);
                total_required_rooms = calculateDepartureCrossBooking(bookingsArr, roomRules);
            }

            // Calculate current pax: max_slots - available_slots
            const currentPax = (r.max_slots || 0) - (r.available_slots || 0);
            
            // Calculate days until departure
            const today = new Date();
            today.setHours(0,0,0,0);
            const depDate = new Date(r.departure_date);
            depDate.setHours(0,0,0,0);
            const diffTime = depDate - today;
            const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let milestone = null;
            if (daysUntil <= 7 && daysUntil > 0) milestone = 'T-7';
            else if (daysUntil <= 14 && daysUntil > 7) milestone = 'T-14';
            else if (daysUntil <= 21 && daysUntil > 14) milestone = 'T-21';
            
            let decHistory = [];
            if (r.decision_history) {
                decHistory = typeof r.decision_history === 'string' ? JSON.parse(r.decision_history) : r.decision_history;
            }

            return {
                ...r,
                min_pax: minPax,
                current_pax: currentPax,
                days_until: daysUntil,
                milestone: milestone,
                decision_history: decHistory,
                total_required_rooms: total_required_rooms
            };
        }));
        
        res.status(200).json({ success: true, data: departures });
    } catch (err) {
        console.error('Error getOperationalDepartures:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.makeOperationalDecision = async (req, res) => {
    const { id } = req.params;
    const { action, note, user_id, user_name } = req.body;
    
    try {
        const [depRows] = await sequelize.query('SELECT * FROM departures WHERE departure_id = ?', {
            replacements: [id]
        });
        
        if (!depRows || depRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đợt khởi hành' });
        }
        
        const dep = depRows[0];
        
        let newOperationalStatus = dep.operational_status;
        let newStatus = dep.status;
        
        if (action === 'Xác nhận vận hành') {
            newOperationalStatus = 'Confirmed';
        } else if (action === 'Tiếp tục xem xét' || action === 'Tiếp tục vận hành') {
            newOperationalStatus = 'Reviewing';
        } else if (action === 'Đóng tour') {
            newOperationalStatus = 'Cancelled';
            newStatus = 'Closed';
        } else if (action === 'Đóng booking') {
            newStatus = 'Closed';
        }
        
        let decHistory = [];
        if (dep.decision_history) {
            decHistory = typeof dep.decision_history === 'string' ? JSON.parse(dep.decision_history) : dep.decision_history;
        }
        
        const currentPax = (dep.max_slots || 0) - (dep.available_slots || 0);
        
        decHistory.push({
            timestamp: new Date().toISOString(),
            user_id: user_id || req.user?.id || 'System',
            user_name: user_name || req.user?.full_name || 'System',
            action: action,
            pax_at_time: currentPax + '/' + dep.max_slots,
            note: note || ''
        });
        
        await sequelize.query(`
            UPDATE departures 
            SET operational_status = ?, status = ?, decision_history = ?
            WHERE departure_id = ?
        `, {
            replacements: [newOperationalStatus, newStatus, JSON.stringify(decHistory), id]
        });
        
        res.status(200).json({ success: true, message: 'Đã lưu quyết định thành công.' });
    } catch (err) {
        console.error('Error makeOperationalDecision:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

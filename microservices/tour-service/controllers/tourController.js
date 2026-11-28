const { calculateDepartureCrossBooking } = require('../utils/roomCalculator');
const sequelize = require('../config/database');
const Tour = require('../models/Tour');
const jwt = require('jsonwebtoken');
const { broadcastRealtime } = require('../../shared/realtimeNotifier');

const notifyTourEvent = (type, data = {}) => {
  broadcastRealtime('realtime:tour', { type, ...data });
  broadcastRealtime('realtime:dashboard', { type, ...data });
};

// Tự động kiểm tra và chuyển trạng thái đợt khởi hành hết hạn / quá ngày về CLOSED
const syncExpiredDeparturesStatus = async (transaction = null) => {
  try {
    const opts = transaction ? { transaction } : {};
    // Đóng nhận khách cho các đợt đã hoặc đang khởi hành
    await sequelize.query(`
      UPDATE departures 
      SET status = 'Closed' 
      WHERE (departure_date <= CURDATE() OR return_date < CURDATE())
        AND status = 'Open'
    `, opts);

    // Chuyển sang Hoàn tất cho các đợt đã qua ngày về
    await sequelize.query(`
      UPDATE departures 
      SET status = 'Completed' 
      WHERE return_date < CURDATE() 
        AND status = 'Closed'
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

// Lấy chi tiết tour cơ bản cho khách (Bảo mật chống SQL Injection, hỗ trợ SEO slug, kiểm soát quyền truy cập tour riêng & tour nháp)
exports.getTourById = async (req, res) => {
  try {
    await syncExpiredDeparturesStatus();
    const tourIdParam = req.params.id;

    // Hỗ trợ cả định dạng ID số thuần túy (VD: "39") lẫn slug SEO (VD: "du-lich-da-lat-3n2d-39")
    let tourId = tourIdParam;
    if (typeof tourIdParam === 'string' && isNaN(Number(tourIdParam))) {
      const match = tourIdParam.match(/(\d+)$/) || tourIdParam.match(/^(\d+)/);
      if (match) {
        tourId = match[1];
      }
    }
    const numericTourId = parseInt(tourId, 10);
    if (isNaN(numericTourId) || numericTourId <= 0) {
      return res.status(400).json({ success: false, message: 'Mã định danh tour không hợp lệ' });
    }

    // 1. Chống SQL Injection tuyệt đối bằng Parameterized Query
    const [tour] = await sequelize.query(`SELECT * FROM tours WHERE tour_id = ?`, {
      replacements: [numericTourId]
    });
    if (!tour.length) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tour du lịch' });
    }

    const tourData = tour[0];

    // 2. Kiểm tra phân quyền truy cập (Chống IDOR / Rò rỉ thông tin Tour riêng hoặc Tour nháp)
    const isCustomTour = Boolean(tourData.is_custom === 1 || tourData.is_custom === true);
    const isPublicActive = (tourData.status === 'Active' || tourData.status === 'Public');

    if (isCustomTour || !isPublicActive) {
      // Giải mã JWT token nếu có trong Authorization header
      let authUser = req.user;
      if (!authUser && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          authUser = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        } catch (jwtErr) {
          // Token không hợp lệ hoặc hết hạn
        }
      }

      const roleId = Number(authUser?.role_id || authUser?.role || 6);
      const isStaffOrAdmin = [1, 2, 3, 4].includes(roleId);
      const isOwnerCustomer = authUser && (
        authUser.id === tourData.created_by ||
        authUser.user_id === tourData.created_by ||
        (tourData.customer_id && (authUser.id === tourData.customer_id || authUser.user_id === tourData.customer_id))
      );

      if (!isStaffOrAdmin && !isOwnerCustomer) {
        if (isCustomTour) {
          return res.status(403).json({
            success: false,
            message: 'Đây là tour du lịch thiết kế riêng theo yêu cầu bảo mật của khách hàng và không được công khai.'
          });
        }
        return res.status(404).json({
          success: false,
          message: 'Tour du lịch này hiện không khả dụng hoặc chưa được mở bán công khai.'
        });
      }
    }

    const [itineraries] = await sequelize.query(
      `SELECT * FROM itineraries WHERE tour_id = ? ORDER BY day_number ASC`,
      { replacements: [numericTourId] }
    );
    const [departures] = await sequelize.query(
      `SELECT * FROM departures WHERE tour_id = ? AND status = 'Open' AND available_slots > 0 AND departure_date > CURDATE() ORDER BY departure_date ASC`,
      { replacements: [numericTourId] }
    );

    res.status(200).json({ success: true, data: { ...tourData, itineraries, departures } });
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

    notifyTourEvent('create_tour');
    res.status(201).json({ success: true, message: 'Thêm Tour thành công!' });
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

    notifyTourEvent('update_tour', { tourId: id });
    res.status(200).json({ success: true, message: 'Cập nhật Tour thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [HÄ‚â‚¬M CĂ…Â¨] XÄ‚Â³a tour
exports.deleteTour = async (req, res) => {
  try {
    const { id } = req.params;
    await sequelize.query(`DELETE FROM tours WHERE tour_id = ?`, { replacements: [id] });
    notifyTourEvent('delete_tour', { tourId: id });
    res.status(200).json({ success: true, message: 'Xóa Tour thành công!' });
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

      // Kiểm tra nếu có đợt bị xóa mà đợt đó đã có khách đặt chỗ
      const [existingDepsWithBookings] = await sequelize.query(`
        SELECT departure_id, departure_date, (max_slots - available_slots) as booked 
        FROM departures 
        WHERE tour_id = ? AND available_slots < max_slots ${keepDepIds.length > 0 ? 'AND departure_id NOT IN (?)' : ''}
      `, { replacements: keepDepIds.length > 0 ? [targetTourId, keepDepIds] : [targetTourId], transaction });

      if (existingDepsWithBookings.length > 0) {
        await transaction.rollback();
        const depWarn = existingDepsWithBookings.map(d => `#${d.departure_id} (ngày ${String(d.departure_date).substring(0, 10)}: ${d.booked} khách)`).join(', ');
        return res.status(400).json({
          success: false,
          message: `⚠️ Không thể xóa các đợt khởi hành đã có khách đặt cọc: ${depWarn}. Vui lòng chuyển trạng thái sang KHÓA (CLOSED) thay vì xóa!`
        });
      }

      if (keepDepIds.length > 0) {
          await sequelize.query(`DELETE FROM departures WHERE tour_id=? AND available_slots = max_slots AND status != 'Closed' AND status != 'Completed' AND departure_id NOT IN (?)`, { replacements: [targetTourId, keepDepIds], transaction });
      } else {
          await sequelize.query(`DELETE FROM departures WHERE tour_id=? AND available_slots = max_slots AND status != 'Closed' AND status != 'Completed'`, { replacements: [targetTourId], transaction });
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

          // Gửi thông báo phân công trực tiếp cho HDV
          try {
            const [gUser] = await sequelize.query(`
              SELECT g.user_id, t.tour_name, d.departure_date
              FROM guides g
              JOIN departures d ON d.departure_id = ?
              JOIN tours t ON d.tour_id = t.tour_id
              WHERE g.guide_id = ?
            `, { replacements: [targetDepId, realGuideId], transaction });

            if (gUser.length > 0 && gUser[0].user_id) {
              const u = gUser[0];
              const depDateStr = u.departure_date ? new Date(u.departure_date).toLocaleDateString('vi-VN') : 'Sắp tới';
              const title = `🚩 Phân công HDV: ${u.tour_name}`;
              const content = `Bạn đã được phân công dẫn đoàn cho tour "${u.tour_name}" - Ngày khởi hành: ${depDateStr}. Vui lòng kiểm tra lịch trình và danh sách đoàn!`;

              await sequelize.query(`
                INSERT INTO notifications (user_id, type, target_role, title, content, departure_id, is_read, action_url, created_at)
                VALUES (?, 'GUIDE_ASSIGNED', 'GUIDE', ?, ?, ?, 0, 'guide_assigned', NOW())
              `, { replacements: [u.user_id, title, content, targetDepId], transaction });
            }
          } catch (gErr) {
            console.warn("Lỗi tạo thông báo HDV:", gErr.message);
          }
        }

        if (targetDepId) {
          if (vehToSave && dIdToSave) {
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

              // Gửi thông báo phân công trực tiếp cho tài xế
              const [dInfo] = await sequelize.query(`
                SELECT t.tour_name, d.departure_date
                FROM departures d
                JOIN tours t ON d.tour_id = t.tour_id
                WHERE d.departure_id = ?
              `, { replacements: [targetDepId], transaction });

              if (dInfo.length > 0) {
                const depDateStr = dInfo[0].departure_date ? new Date(dInfo[0].departure_date).toLocaleDateString('vi-VN') : 'Sắp tới';
                const title = `🚌 Phân công lái xe: ${dInfo[0].tour_name}`;
                const content = `Bạn được phân công phụ trách xe cho tour "${dInfo[0].tour_name}" (Xe: ${vehToSave}) - Ngày khởi hành: ${depDateStr}. Vui lòng kiểm tra phương tiện sẵn sàng!`;

                await sequelize.query(`
                  INSERT INTO notifications (user_id, type, target_role, title, content, departure_id, is_read, action_url, created_at)
                  VALUES (?, 'DRIVER_ASSIGNED', 'DRIVER', ?, ?, ?, 0, 'driver_assigned', NOW())
                `, { replacements: [dIdToSave, title, content, targetDepId], transaction });
              }
            } catch(ve) {
              console.warn("Không thể đồng bộ tour_vehicle_assignments:", ve.message);
            }
          } else {
            await sequelize.query(`DELETE FROM tour_vehicle_assignments WHERE departure_id = ?`, {
              replacements: [targetDepId],
              transaction
            });
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

        // --- BACKEND VALIDATION FOR FIXED TOUR DESIGN ---
        if (!tour_name || tour_name.trim().length < 5) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'Tên tour phải có tối thiểu 5 ký tự' });
        }
        if (Number(base_price) <= 0) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'Giá bán cơ bản của tour phải lớn hơn 0 đ' });
        }
        if (Number(duration_days) < 1) {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'Thời lượng tour phải có ít nhất 1 ngày' });
        }

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
            SELECT t.tour_id, t.tour_name, t.destination, t.duration_days, t.status, t.base_price, t.image_url, t.markup_percent, t.base_cost, t.design_data, t.is_custom,
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
            WHERE s.service_type IN ('Khách sạn', 'Hotel', 'Accommodation') AND d.destination_name LIKE ?
        `, { replacements: [`%${destination}%`] });

        // 3. LĂ¡ÂºÂ¤Y XE & MÄ‚ÂY BAY
                // 3. LẤY XE & MÁY BAY
        const [transports] = await sequelize.query(`
            SELECT CONCAT('transport_', s.service_id) as id, CONCAT(COALESCE(p.partner_name, 'Nội bộ'), ' - ', s.service_name) as name, '✈️ Di chuyển' as type, s.base_cost as price
            FROM services s
            LEFT JOIN partners p ON s.partner_id = p.partner_id
            WHERE s.service_type IN ('Xe vận chuyển', 'Transport', 'Vehicle', 'Vé máy bay', 'Flight')
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
        const { base_price, markup_percent, base_cost, design_data } = req.body;
        
        let query = "UPDATE tours SET base_price = ?, markup_percent = ?";
        const replacements = [Number(base_price), Number(markup_percent || 0)];

        if (base_cost !== undefined && base_cost !== null) {
            query += ", base_cost = ?";
            replacements.push(Number(base_cost));
        }

        if (design_data !== undefined && design_data !== null) {
            query += ", design_data = ?";
            replacements.push(typeof design_data === 'object' ? JSON.stringify(design_data) : design_data);
        }

        query += " WHERE tour_id = ?";
        replacements.push(id);

        await sequelize.query(query, { replacements });
        res.status(200).json({ success: true, message: "Cập nhật giá và chi phí tour thành công!" });
    } catch (error) {
        console.error("Lỗi cập nhật giá:", error);
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
                s.base_cost,
                s.selling_price,
                s.unit,
                vsd.seat_capacity as capacity,
                vsd.total_quantity,
                vsd.vehicle_service_id,
                vsd.vehicle_type as vehicle_detail_type,
                vsd.vehicle_model,
                (
                    SELECT COUNT(*) FROM travel_management.vehicles v 
                    WHERE v.service_id = s.service_id
                ) as total_vehicles_count,
                (
                    SELECT COUNT(*) FROM travel_management.vehicles v 
                    WHERE v.service_id = s.service_id AND v.status = 'AVAILABLE'
                ) as available_vehicles_count,
                s.status,
                COALESCE(p.partner_name, 'Nội bộ') as partner_name
            FROM services s
            LEFT JOIN partners p ON s.partner_id = p.partner_id
            LEFT JOIN vehicle_service_details vsd ON s.service_id = vsd.service_id
            WHERE s.service_type IN ('Xe vận chuyển', 'Transport', 'Vehicle') AND (s.status = 'Active' OR s.status IS NULL)
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
            SELECT b.booking_id, b.departure_id, b.num_people, p.passenger_id, p.passenger_type, p.single_room
            FROM bookings b
            LEFT JOIN booking_passengers p ON b.booking_id = p.booking_id
            WHERE b.booking_status != 'Cancelled'
        `);
        
        // Group by departure_id -> booking_id
        const departureBookings = {};
        for (const row of allBookings) {
            if (!departureBookings[row.departure_id]) departureBookings[row.departure_id] = {};
            if (!departureBookings[row.departure_id][row.booking_id]) {
                departureBookings[row.departure_id][row.booking_id] = { 
                    booking_id: row.booking_id, 
                    num_people: Number(row.num_people) || 1, 
                    passengers: [] 
                };
            }
            if (row.passenger_id) {
                departureBookings[row.departure_id][row.booking_id].passengers.push({
                    passenger_type: row.passenger_type,
                    single_room: row.single_room === 1 || row.single_room === true
                });
            }
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
                for (const bId in bksForDep) {
                    const bk = bksForDep[bId];
                    if (bk.passengers.length === 0 && bk.num_people > 0) {
                        for (let i = 0; i < bk.num_people; i++) {
                            bk.passengers.push({ passenger_type: 'ADULT', single_room: false });
                        }
                    }
                }
                const bookingsArr = Object.values(bksForDep);
                total_required_rooms = calculateDepartureCrossBooking(bookingsArr, roomRules);
            }

            // Calculate current pax: actual active passengers or sum of num_people from all active bookings
            let actualPax = 0;
            if (bksForDep) {
                for (const bId in bksForDep) {
                    const bk = bksForDep[bId];
                    actualPax += Math.max((bk.passengers || []).length, bk.num_people || 0);
                }
            }
            const calculatedPax = Math.max(0, (r.max_slots || 0) - (r.available_slots || 0));
            const currentPax = actualPax > 0 ? actualPax : calculatedPax;
            
            // Calculate days until departure
            const today = new Date();
            today.setHours(0,0,0,0);
            const depDate = new Date(r.departure_date);
            depDate.setHours(0,0,0,0);
            const diffTime = depDate - today;
            const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let milestone = null;
            if (daysUntil <= 0) milestone = 'DEP';
            else if (daysUntil <= 30) milestone = 'T-30';
            else milestone = 'PRE_T30';
            
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
    
    const transaction = await sequelize.transaction();
    try {
        const [depRows] = await sequelize.query(`
            SELECT d.*, t.tour_name, t.min_participants, t.tour_id
            FROM departures d
            JOIN tours t ON d.tour_id = t.tour_id
            WHERE d.departure_id = ?
        `, {
            replacements: [id],
            transaction
        });
        
        if (!depRows || depRows.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy đợt khởi hành' });
        }
        
        const dep = depRows[0];
        const depDateStr = dep.departure_date ? new Date(dep.departure_date).toLocaleDateString('vi-VN') : 'Sắp tới';
        
        let newOperationalStatus = dep.operational_status;
        let newStatus = dep.status;
        
        if (action === 'Xác nhận vận hành') {
            newOperationalStatus = 'Confirmed';
        } else if (action === 'Tiếp tục xem xét' || action === 'Tiếp tục vận hành') {
            newOperationalStatus = 'Reviewing';
        } else if (action === 'Đóng tour' || action === 'Hủy tour' || action === 'Đóng / Hủy tour') {
            newOperationalStatus = 'Cancelled';
            newStatus = 'Closed';
        } else if (action === 'Đóng booking') {
            newStatus = 'Closed';
        }
        
        let decHistory = [];
        if (dep.decision_history) {
            decHistory = typeof dep.decision_history === 'string' ? JSON.parse(dep.decision_history) : dep.decision_history;
        }
        
        const currentPax = Math.max(0, (dep.max_slots || 0) - (dep.available_slots || 0));
        
        decHistory.push({
            timestamp: new Date().toISOString(),
            user_id: user_id || req.user?.id || 'System',
            user_name: user_name || req.user?.full_name || 'System',
            action: action,
            pax_at_time: currentPax + '/' + dep.max_slots,
            note: note || ''
        });
        
        // NẾU HỦY TOUR (DO THIẾU KHÁCH MỐC T-30 HOẶC QUẢN LÝ QUYẾT ĐỊNH HỦY)
        if (action === 'Đóng tour' || action === 'Hủy tour' || action === 'Đóng / Hủy tour') {
            // 1. LẤY TẤT CẢ BOOKING THUỘC ĐỢT KHỞI HÀNH NÀY (TRỪ NHỮNG ĐƠN ĐÃ HỦY TRƯỚC ĐÓ)
            const [affectedBookings] = await sequelize.query(`
                SELECT b.booking_id, b.customer_id, b.num_people, b.total_amount, b.payment_status,
                       b.contact_name, b.contact_phone, b.contact_email, b.notes,
                       u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
                FROM bookings b
                LEFT JOIN users u ON b.customer_id = u.user_id
                WHERE b.departure_id = ? AND b.booking_status != 'Cancelled'
            `, { replacements: [id], transaction });

            const paidBookings = [];
            const unpaidBookings = [];

            for (const bk of affectedBookings) {
                const totalAmt = Number(bk.total_amount || 0);
                const custName = bk.contact_name || bk.customer_name || 'Quý khách';
                const custPhone = bk.contact_phone || bk.customer_phone || '';

                if (bk.payment_status === 'Paid') {
                    paidBookings.push(bk);
                    // Cập nhật đơn hàng sang Cancelled và payment_status sang Pending_Refund (Chờ kế toán hoàn 100%)
                    await sequelize.query(`
                        UPDATE bookings 
                        SET booking_status = 'Cancelled',
                            payment_status = 'Pending_Refund',
                            notes = CONCAT(COALESCE(notes, ''), '\n[HỦY TOUR T-30 THIẾU KHÁCH: Hoàn 100% (', ?, ' ₫) - Chờ hoàn tiền]')
                        WHERE booking_id = ?
                    `, {
                        replacements: [totalAmt.toLocaleString('vi-VN'), bk.booking_id],
                        transaction
                    });

                    // Ghi nhận yêu cầu hoàn tiền 100% trong booking_change_requests
                    await sequelize.query(`
                        INSERT INTO booking_change_requests (
                            booking_id, request_type, reason, status, staff_note,
                            fee_percentage, fee_amount, refund_amount, days_before_departure, processed_by, created_at
                        ) VALUES (?, 'Cancel', ?, 'Approved', ?, 0, 0, ?, 30, ?, NOW())
                    `, {
                        replacements: [
                            bk.booking_id,
                            'Hủy tour mốc T-30 do không đủ số khách tối thiểu',
                            `Hệ thống tự động duyệt hủy do tour thiếu khách mốc T-30. Hoàn 100% (${totalAmt.toLocaleString('vi-VN')} ₫). Cần CSKH/Kế toán liên hệ đối soát và chuyển khoản.`,
                            totalAmt,
                            user_id || null
                        ],
                        transaction
                    });

                    // Gửi thông báo đến CHUÔNG THÔNG BÁO CỦA KHÁCH HÀNG
                    const custNotifTitle = `📢 Thông báo hủy tour & Hoàn tiền 100%: ${dep.tour_name}`;
                    const custNotifContent = `Chào ${custName}, rất tiếc đợt khởi hành ngày ${depDateStr} của tour "${dep.tour_name}" đã bị hủy do chưa đạt đủ số lượng khách tối thiểu. Công ty cam kết HOÀN LẠI 100% số tiền (${totalAmt.toLocaleString('vi-VN')} ₫) cho quý khách (miễn mọi chi phí hủy). Nhân viên CSKH sẽ chủ động liên hệ qua SĐT ${custPhone ? custPhone : 'của bạn'} để xác nhận số tài khoản và chuyển khoản hoàn tiền ngay.`;

                    await sequelize.query(`
                        INSERT INTO notifications (user_id, type, target_role, title, content, departure_id, tour_id, is_read, action_url, created_at)
                        VALUES (?, 'TOUR_CANCELLED_REFUND', 'Customer', ?, ?, ?, ?, 0, '/my-bookings', NOW())
                    `, {
                        replacements: [bk.customer_id, custNotifTitle, custNotifContent, id, dep.tour_id],
                        transaction
                    });
                } else {
                    unpaidBookings.push(bk);
                    // Đơn chưa thanh toán: hủy tự động
                    await sequelize.query(`
                        UPDATE bookings 
                        SET booking_status = 'Cancelled',
                            payment_status = 'Cancelled',
                            notes = CONCAT(COALESCE(notes, ''), '\n[HỦY TOUR T-30 THIẾU KHÁCH: Hủy đơn chưa thanh toán]')
                        WHERE booking_id = ?
                    `, { replacements: [bk.booking_id], transaction });

                    const custNotifTitle = `📢 Thông báo hủy tour: ${dep.tour_name}`;
                    const custNotifContent = `Chào ${custName}, đợt khởi hành ngày ${depDateStr} của tour "${dep.tour_name}" đã bị hủy do chưa đạt đủ số lượng khách tối thiểu. Đơn đặt chỗ #${bk.booking_id} của bạn đã được hủy tự động và miễn phí.`;

                    await sequelize.query(`
                        INSERT INTO notifications (user_id, type, target_role, title, content, departure_id, tour_id, is_read, action_url, created_at)
                        VALUES (?, 'TOUR_CANCELLED_REFUND', 'Customer', ?, ?, ?, ?, 0, '/my-bookings', NOW())
                    `, {
                        replacements: [bk.customer_id, custNotifTitle, custNotifContent, id, dep.tour_id],
                        transaction
                    });
                }
            }

            // Vô hiệu hóa mã QR check-in cho toàn bộ khách của đợt này
            await sequelize.query(`
                UPDATE booking_passengers 
                SET is_checked_in = 0 
                WHERE booking_id IN (SELECT booking_id FROM bookings WHERE departure_id = ?)
            `, { replacements: [id], transaction });

            // 2. GỬI THÔNG BÁO ĐẾN CHUÔNG CỦA NHÂN VIÊN VĂN PHÒNG & KẾ TOÁN (STAFF)
            const staffNotifTitle = `⚠️ Cần liên hệ & Hoàn tiền 100%: Tour ${dep.tour_name} đã hủy (Mốc T-30)`;
            const staffNotifContent = `Đợt khởi hành ${depDateStr} của tour "${dep.tour_name}" đã chính thức hủy do không đạt số khách tối thiểu (${currentPax}/${dep.min_participants || 5} khách). ${paidBookings.length > 0 ? `Có ${paidBookings.length} đơn hàng đã thanh toán cần chuyên viên CSKH liên hệ khách hàng xác nhận tài khoản và thực hiện hoàn tiền 100% tại Quản lý Đặt Tour.` : 'Tất cả đơn đặt tour đều chưa thanh toán và đã được hệ thống hủy tự động.'}`;

            await sequelize.query(`
                INSERT INTO notifications (user_id, type, target_role, title, content, departure_id, tour_id, is_read, action_url, created_at)
                VALUES (NULL, 'TOUR_CANCELLED_STAFF_REFUND', 'STAFF', ?, ?, ?, ?, 0, 'orders', NOW())
            `, {
                replacements: [staffNotifTitle, staffNotifContent, id, dep.tour_id],
                transaction
            });

            // 3. GIẢI PHÓNG HƯỚNG DẪN VIÊN & GỬI THÔNG BÁO ĐẾN CHUÔNG HDV
            const [assignedGuides] = await sequelize.query(`
                SELECT DISTINCT g.user_id, u.full_name, g.guide_id
                FROM guide_assignments ga
                JOIN guides g ON ga.guide_id = g.guide_id
                JOIN users u ON g.user_id = u.user_id
                WHERE ga.departure_id = ?
            `, { replacements: [id], transaction });

            if (dep.guide_id) {
                const [directG] = await sequelize.query(`
                    SELECT g.user_id, u.full_name, g.guide_id
                    FROM guides g
                    JOIN users u ON g.user_id = u.user_id
                    WHERE g.guide_id = ? OR g.user_id = ?
                `, { replacements: [dep.guide_id, dep.guide_id], transaction });
                if (directG.length > 0 && !assignedGuides.some(g => g.user_id === directG[0].user_id)) {
                    assignedGuides.push(directG[0]);
                }
            }

            for (const g of assignedGuides) {
                if (g.user_id) {
                    const guideTitle = `⚠️ Thông báo hủy chuyến & Giải phóng lịch dẫn đoàn: ${dep.tour_name}`;
                    const guideContent = `Đợt khởi hành ngày ${depDateStr} của tour "${dep.tour_name}" đã bị hủy do không đủ số khách tối thiểu. Phân công dẫn đoàn của bạn đã được giải phóng và chuyển về trạng thái Sẵn sàng nhận tour mới.`;
                    await sequelize.query(`
                        INSERT INTO notifications (user_id, type, target_role, title, content, departure_id, tour_id, is_read, action_url, created_at)
                        VALUES (?, 'TOUR_CANCELLED_GUIDE', 'GUIDE', ?, ?, ?, ?, 0, 'guide_assigned', NOW())
                    `, {
                        replacements: [g.user_id, guideTitle, guideContent, id, dep.tour_id],
                        transaction
                    });
                }
            }

            // Xóa phân công HDV
            await sequelize.query(`DELETE FROM guide_assignments WHERE departure_id = ?`, {
                replacements: [id],
                transaction
            });

            // 4. GIẢI PHÓNG TÀI XẾ, HOÀN XE VỀ BÃI & GỬI THÔNG BÁO ĐẾN CHUÔNG TÀI XẾ
            const [assignedVehicles] = await sequelize.query(`
                SELECT DISTINCT tva.driver_id, tva.vehicle_id, v.license_plate, u.full_name AS driver_name
                FROM tour_vehicle_assignments tva
                LEFT JOIN vehicles v ON tva.vehicle_id = v.vehicle_id
                LEFT JOIN users u ON tva.driver_id = u.user_id
                WHERE tva.departure_id = ? AND tva.status != 'CANCELLED'
            `, { replacements: [id], transaction });

            if (dep.driver_id) {
                if (!assignedVehicles.some(v => v.driver_id === dep.driver_id)) {
                    assignedVehicles.push({ driver_id: dep.driver_id, vehicle_id: null, license_plate: dep.vehicle_number || '' });
                }
            }

            for (const d of assignedVehicles) {
                if (d.driver_id) {
                    const driverTitle = `⚠️ Thông báo hủy chuyến & Hoàn trả xe: ${dep.tour_name}`;
                    const driverContent = `Đợt khởi hành ngày ${depDateStr} của tour "${dep.tour_name}" đã bị hủy do không đủ số khách tối thiểu. Lịch điều động xe đã được giải phóng, phương tiện xe (${d.license_plate || dep.vehicle_number || 'xe được cấp'}) đã được hoàn về bãi và sẵn sàng nhận chuyến mới.`;
                    await sequelize.query(`
                        INSERT INTO notifications (user_id, type, target_role, title, content, departure_id, tour_id, is_read, action_url, created_at)
                        VALUES (?, 'TOUR_CANCELLED_DRIVER', 'DRIVER', ?, ?, ?, ?, 0, 'driver_assigned', NOW())
                    `, {
                        replacements: [d.driver_id, driverTitle, driverContent, id, dep.tour_id],
                        transaction
                    });
                }
            }

            // Đổi trạng thái phân công xe sang CANCELLED
            await sequelize.query(`
                UPDATE tour_vehicle_assignments 
                SET status = 'CANCELLED' 
                WHERE departure_id = ?
            `, { replacements: [id], transaction });

            // Đưa phương tiện về trạng thái 'Hoạt động' (sẵn sàng) nếu đang ở trạng thái điều động
            for (const d of assignedVehicles) {
                if (d.vehicle_id) {
                    await sequelize.query(`
                        UPDATE vehicles 
                        SET status = 'Hoạt động' 
                        WHERE vehicle_id = ? AND status = 'Đang đi tour'
                    `, { replacements: [d.vehicle_id], transaction });
                }
            }

            // 5. CẬP NHẬT ĐỢT KHỞI HÀNH: XÓA GUIDE_ID, DRIVER_ID, VEHICLE_NUMBER VÀ ĐỔI TRẠNG THÁI
            await sequelize.query(`
                UPDATE departures 
                SET operational_status = ?, status = ?, guide_id = NULL, driver_id = NULL, vehicle_number = NULL, decision_history = ?
                WHERE departure_id = ?
            `, {
                replacements: [newOperationalStatus, newStatus, JSON.stringify(decHistory), id],
                transaction
            });
        } else {
            // Các quyết định khác (Xác nhận vận hành, Tiếp tục xem xét, v.v.)
            await sequelize.query(`
                UPDATE departures 
                SET operational_status = ?, status = ?, decision_history = ?
                WHERE departure_id = ?
            `, {
                replacements: [newOperationalStatus, newStatus, JSON.stringify(decHistory), id],
                transaction
            });
        }

        await transaction.commit();

        // Broadcast realtime
        notifyTourEvent('departure_updated', { departure_id: id, action });
        broadcastRealtime('realtime:notification', { type: 'NEW_NOTIFICATION', departure_id: id });
        broadcastRealtime('realtime:booking', { type: 'BOOKING_UPDATED', departure_id: id });
        
        res.status(200).json({
            success: true,
            message: (action === 'Đóng / Hủy tour' || action === 'Hủy tour' || action === 'Đóng tour')
                ? '✅ Đã hủy đợt khởi hành thành công! Hệ thống đã tự động gửi thông báo hoàn tiền 100% đến khách hàng, thông báo cho nhân viên văn phòng, giải phóng lịch cho HDV và tài xế.'
                : 'Đã lưu quyết định thành công.'
        });
    } catch (err) {
        await transaction.rollback();
        console.error('Error makeOperationalDecision:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

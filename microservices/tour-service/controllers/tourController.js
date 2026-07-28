const sequelize = require('../config/database');
const Tour = require('../models/Tour');

// =====================================================================
// NHÄ‚â€œM 1: CÄ‚Â C HÄ‚â‚¬M CĂ…Â¨ Ă„Â ANG CHĂ¡ÂºÂ Y (GIĂ¡Â»Â® NGUYÄ‚ÂŠN 100% Ă„Â Ă¡Â»â€š KHÄ‚â€ NG GÄ‚Æ’Y CODE)
// =====================================================================

// Lấy danh sách tour mở bán cho khách hàng
exports.getAllTours = async (req, res) => {
  try {
    const tours = await Tour.findAll({ where: { status: 'Active', is_custom: 0 } });
    res.status(200).json({ success: true, data: tours });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// LĂ¡ÂºÂ¥y chi tiĂ¡ÂºÂ¿t tour cĂ†Â¡ bĂ¡ÂºÂ£n cho khÄ‚Â¡ch
exports.getTourById = async (req, res) => {
  try {
    const tourId = req.params.id;
    const [tour] = await sequelize.query(`SELECT * FROM tours WHERE tour_id = ${tourId}`);
    if (!tour.length) return res.status(404).json({ success: false, message: 'KhÄ‚Â´ng tÄ‚Â¬m thĂ¡ÂºÂ¥y tour' });

    const [itineraries] = await sequelize.query(`SELECT * FROM itineraries WHERE tour_id = ${tourId} ORDER BY day_number ASC`);
    const [departures] = await sequelize.query(`SELECT * FROM departures WHERE tour_id = ${tourId} AND status = 'Open' AND available_slots > 0 ORDER BY departure_date ASC`);

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

// [HÄ‚â‚¬M MĂ¡Â»ÂI] LĂ¡ÂºÂ¥y trĂ¡Â»Ân bĂ¡Â»â„¢ dĂ¡Â»Â¯ liĂ¡Â»â€¡u vĂ¡ÂºÂ­n hÄ‚Â nh (Tour + LĂ¡Â»â€¹ch trÄ‚Â¬nh ngÄ‚Â y + Ă„ÂiĂ¡Â»Æ’m ghÄ‚Â© thĂ„Æ’m + Ă„ÂĂ¡Â»Â£t khĂ¡Â»Å¸i hÄ‚Â nh)
exports.getTourOperationalDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const [tours] = await sequelize.query(`SELECT * FROM tours WHERE tour_id = ?`, { replacements: [id] });
    if (tours.length === 0) return res.status(404).json({ success: false, message: 'KhÄ‚Â´ng tÄ‚Â¬m thĂ¡ÂºÂ¥y tour!' });
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
                 WHEN ia.activity_type IN ('Accommodation', 'Transport') THEN ps.unit_price
                 ELSE 0
               END as estimated_price
        FROM itinerary_activities ia
        LEFT JOIN places p ON ia.activity_type = 'Place' AND ia.reference_id = p.place_id
        LEFT JOIN partner_services ps ON ia.activity_type IN ('Accommodation', 'Transport') AND ia.reference_id = ps.partner_service_id
        LEFT JOIN services s ON ps.service_id = s.service_id
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

// [HÄ‚â‚¬M MĂ¡Â»ÂI] LĂ†Â°u trĂ¡Â»Ân bĂ¡Â»â„¢ Tour + LĂ¡Â»â€¹ch trÄ‚Â¬nh + Ă„ÂĂ¡Â»â€¹nh giÄ‚Â¡ (% LĂ¡Â»Â£i nhuĂ¡ÂºÂ­n) + KhĂ¡Â»Å¸i hÄ‚Â nh bĂ¡ÂºÂ±ng Transaction
exports.saveTourOperationalSchedule = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.user?.id || req.user?.user_id;
    const {
      tour_id, tour_name, destination, duration_days, base_price = 0,
      base_cost = 0, markup_percent = 20, description, status = 'Pending', existing_image_url
    } = req.body;

    const itineraryDays = req.body.itineraryDays ? JSON.parse(req.body.itineraryDays) : [];
    const departures = req.body.departures ? JSON.parse(req.body.departures) : [];

    let finalImageUrl = existing_image_url || '';
    if (req.file) finalImageUrl = `/uploads/${req.file.filename}`;

    let targetTourId = tour_id && tour_id !== 'null' ? Number(tour_id) : null;

    // A. LĂ†Â¯U BĂ¡ÂºÂ¢NG TOURS (Ă„ÂÄ‚Â£ thÄ‚Âªm base_cost vÄ‚Â  markup_percent)
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

    // B. LĂ†Â¯U LĂ¡Â»ÂCH TRÄ‚Å’NH VĂ¡ÂºÂ¬N HÄ‚â‚¬NH
    if (targetTourId) {
      const [oldItins] = await sequelize.query(`SELECT itinerary_id FROM itineraries WHERE tour_id=?`, { replacements: [targetTourId], transaction });
      for (let old of oldItins) {
        await sequelize.query(`DELETE FROM itinerary_activities WHERE itinerary_id=?`, { replacements: [old.itinerary_id], transaction });
      }
      await sequelize.query(`DELETE FROM itineraries WHERE tour_id=?`, { replacements: [targetTourId], transaction });

      for (let day of itineraryDays) {
        const [itinRes] = await sequelize.query(`
          INSERT INTO itineraries (tour_id, day_number, title, description) VALUES (?, ?, ?, ?)
        `, { replacements: [targetTourId, day.day_number, day.title || `NgÄ‚Â y ${day.day_number}`, day.description || ''], transaction });

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
          await sequelize.query(`DELETE FROM departures WHERE tour_id=? AND available_slots = max_slots AND departure_id NOT IN (?)`, { replacements: [targetTourId, keepDepIds], transaction });
      } else {
          await sequelize.query(`DELETE FROM departures WHERE tour_id=? AND available_slots = max_slots`, { replacements: [targetTourId], transaction });
      }

      for (let dep of departures) {
        let realGuideId = null;
        if (dep.guide_id) {
          // Tìm guide_id chuẩn từ bảng guides theo user_id hoặc guide_id
          const [gRow] = await sequelize.query(`SELECT guide_id FROM guides WHERE user_id = ? OR guide_id = ? LIMIT 1`, {
            replacements: [dep.guide_id, dep.guide_id],
            transaction
          });
          if (gRow.length > 0) {
            realGuideId = gRow[0].guide_id;
          }
        }

        let targetDepId = dep.departure_id;

        if (targetDepId) {
            await sequelize.query(`
              UPDATE departures 
              SET departure_date=?, return_date=?, max_slots=?, guide_id=? 
              WHERE departure_id=?
            `, { replacements: [dep.departure_date, dep.return_date, dep.max_slots || 30, dep.guide_id || null, targetDepId], transaction });
        } else {
            const [insRes] = await sequelize.query(`
              INSERT INTO departures (tour_id, departure_date, return_date, max_slots, available_slots, status, guide_id)
              VALUES (?, ?, ?, ?, ?, 'Open', ?)
            `, { replacements: [targetTourId, dep.departure_date, dep.return_date, dep.max_slots || 30, dep.max_slots || 30, dep.guide_id || null], transaction });
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

        const {
            tour_id, tour_name, destination, duration_days, base_price, description,
            status = 'Pending', base_cost = 0, markup_percent = 20, design_data = null
        } = req.body;

        const itineraryDays = req.body.itineraryDays ? JSON.parse(req.body.itineraryDays) : [];
        let targetTourId = tour_id && tour_id !== 'null' ? Number(tour_id) : null;

        let finalImageUrl = req.body.existing_image_url || '';
        if (req.file) finalImageUrl = `/uploads/${req.file.filename}`;

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
            SELECT tour_id, tour_name, destination, duration_days, status, base_price, image_url, markup_percent 
            FROM tours 
            ORDER BY tour_id DESC
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
            return res.status(404).json({ success: false, message: 'KhÄ‚Â´ng tÄ‚Â¬m thĂ¡ÂºÂ¥y tour' });
        }

        res.status(200).json({ success: true, data: tours[0] });
    } catch (error) {
        console.error("LĂ¡Â»â€”i lĂ¡ÂºÂ¥y chi tiĂ¡ÂºÂ¿t tour:", error);
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


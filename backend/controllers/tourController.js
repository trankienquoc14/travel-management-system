const sequelize = require('../config/database');
const Tour = require('../models/Tour');

// =====================================================================
// NHÓM 1: CÁC HÀM CŨ ĐANG CHẠY (GIỮ NGUYÊN 100% ĐỂ KHÔNG GÃY CODE)
// =====================================================================

// Lấy danh sách tour mở bán cho khách hàng
exports.getAllTours = async (req, res) => {
  try {
    const tours = await Tour.findAll({ where: { status: 'Active' } });
    res.status(200).json({ success: true, data: tours });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy chi tiết tour cơ bản cho khách
exports.getTourById = async (req, res) => {
  try {
    const tourId = req.params.id;
    const [tour] = await sequelize.query(`SELECT * FROM tours WHERE tour_id = ${tourId}`);
    if (!tour.length) return res.status(404).json({ success: false, message: 'Không tìm thấy tour' });

    const [itineraries] = await sequelize.query(`SELECT * FROM itineraries WHERE tour_id = ${tourId} ORDER BY day_number ASC`);
    const [departures] = await sequelize.query(`SELECT * FROM departures WHERE tour_id = ${tourId} AND status = 'Open' AND available_slots > 0 ORDER BY departure_date ASC`);

    res.status(200).json({ success: true, data: { ...tour[0], itineraries, departures } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [HÀM CŨ] Thêm tour cơ bản từ form cũ
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

    res.status(201).json({ success: true, message: 'Thêm Tour thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [HÀM CŨ] Sửa tour cơ bản từ form cũ
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

    res.status(200).json({ success: true, message: 'Cập nhật Tour thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [HÀM CŨ] Xóa tour
exports.deleteTour = async (req, res) => {
  try {
    const { id } = req.params;
    await sequelize.query(`DELETE FROM tours WHERE tour_id = ?`, { replacements: [id] });
    res.status(200).json({ success: true, message: 'Xóa Tour thành công!' });
  } catch (error) {
    if (error.original && error.original.errno === 1451) {
      return res.status(400).json({ success: false, message: 'Không thể xóa! Tour này đang có Ngày khởi hành hoặc Đơn đặt hàng liên kết.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lấy danh sách toàn bộ sự cố (GET)
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

// Cập nhật trạng thái sự cố và phản hồi giải quyết (PUT)
exports.updateIncidentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;

    if (!['Open', 'Resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái sự cố không hợp lệ!' });
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
      message: 'Cập nhật trạng thái sự cố và ghi chú giải quyết thành công!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}; // 👈 ĐÃ BỔ SUNG DẤU ĐÓNG HÀM TẠI ĐÂY ĐỂ TRÁNH LỖI NHỐT HÀM!

// =====================================================================
// NHÓM 2: CÁC HÀM MỚI NÂNG CẤP (VẬN HÀNH & ĐỊNH GIÁ TOUR)
// =====================================================================

// [HÀM MỚI] Lấy trọn bộ dữ liệu vận hành (Tour + Lịch trình ngày + Điểm ghé thăm + Đợt khởi hành)
exports.getTourOperationalDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const [tours] = await sequelize.query(`SELECT * FROM tours WHERE tour_id = ?`, { replacements: [id] });
    if (tours.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy tour!' });
    const tour = tours[0];

    const [days] = await sequelize.query(`SELECT * FROM itineraries WHERE tour_id = ? ORDER BY day_number ASC`, { replacements: [id] });
    for (let day of days) {
      const [places] = await sequelize.query(`
        SELECT ip.id, ip.place_id, ip.visit_order, ip.visit_time, p.place_name, p.category, p.estimated_price
        FROM itinerary_places ip
        JOIN places p ON ip.place_id = p.place_id
        WHERE ip.itinerary_id = ?
        ORDER BY ip.visit_order ASC, ip.visit_time ASC
      `, { replacements: [day.itinerary_id] });
      day.places = places;
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
        await sequelize.query(`DELETE FROM itinerary_places WHERE itinerary_id=?`, { replacements: [old.itinerary_id], transaction });
      }
      await sequelize.query(`DELETE FROM itineraries WHERE tour_id=?`, { replacements: [targetTourId], transaction });

      for (let day of itineraryDays) {
        const [itinRes] = await sequelize.query(`
          INSERT INTO itineraries (tour_id, day_number, title, description) VALUES (?, ?, ?, ?)
        `, { replacements: [targetTourId, day.day_number, day.title || `Ngày ${day.day_number}`, day.description || ''], transaction });

        const newItinId = itinRes;
        if (day.places && day.places.length > 0) {
          for (let [idx, pl] of day.places.entries()) {
            await sequelize.query(`
              INSERT INTO itinerary_places (itinerary_id, place_id, visit_order, visit_time) VALUES (?, ?, ?, ?)
            `, { replacements: [newItinId, pl.place_id, pl.visit_order || idx + 1, pl.visit_time || null], transaction });
          }
        }
      }

      // C. LƯU ĐỢT KHỞI HÀNH
      await sequelize.query(`DELETE FROM departures WHERE tour_id=? AND available_slots = max_slots`, { replacements: [targetTourId], transaction });
      for (let dep of departures) {
        if (!dep.departure_id) {
          await sequelize.query(`
            INSERT INTO departures (tour_id, departure_date, return_date, max_slots, available_slots, status)
            VALUES (?, ?, ?, ?, ?, 'Open')
          `, { replacements: [targetTourId, dep.departure_date, dep.return_date, dep.max_slots || 30, dep.max_slots || 30], transaction });
        }
      }
    }

    await transaction.commit();
    res.status(200).json({ success: true, message: '🎉 Thiết lập lịch trình & định giá Tour thành công!', tour_id: targetTourId });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: error.message });
  }
};
// [QUẢN LÝ] Phê duyệt hoặc Từ chối Tour Cố định
exports.updateTourStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Bắt giá trị 'Active' (Duyệt) hoặc 'Rejected' (Từ chối)

    // Cập nhật trạng thái trong database
    await sequelize.query(`
            UPDATE tours SET status = ? WHERE tour_id = ?
        `, { replacements: [status, id] });

    res.status(200).json({ success: true, message: `Đã cập nhật trạng thái thành ${status}` });
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái tour:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
const sequelize = require('../config/database');
const Tour = require('../models/Tour');

exports.getAllTours = async (req, res) => {
  try {
    const tours = await Tour.findAll({ where: { status: 'Active' } });
    res.status(200).json({ success: true, data: tours });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// THÊM HÀM NÀY: Lấy chi tiết 1 tour kèm lịch trình và ngày khởi hành
exports.getTourById = async (req, res) => {
  try {
    const tourId = req.params.id;

    // Lấy thông tin cơ bản
    const [tour] = await sequelize.query(`SELECT * FROM tours WHERE tour_id = ${tourId}`);
    if (!tour.length) return res.status(404).json({ success: false, message: 'Không tìm thấy tour' });

    // Lấy lịch trình từng ngày
    const [itineraries] = await sequelize.query(`SELECT * FROM itineraries WHERE tour_id = ${tourId} ORDER BY day_number ASC`);

    // Lấy các chuyến đi đang mở và còn chỗ
    const [departures] = await sequelize.query(`SELECT * FROM departures WHERE tour_id = ${tourId} AND status = 'Open' AND available_slots > 0 ORDER BY departure_date ASC`);

    res.status(200).json({
      success: true,
      data: {
        ...tour[0],
        itineraries,
        departures
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Thêm Tour mới (POST)
exports.createTour = async (req, res) => {
  try {
    const { tour_name, description, destination, duration_days, base_price, image_url, status } = req.body;

    // Lấy ID của nhân viên đang thao tác từ Token
    const created_by = req.user.id || req.user.user_id;

    await sequelize.query(`
            INSERT INTO tours (tour_name, description, destination, duration_days, base_price, image_url, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, {
      replacements: [tour_name, description, destination, duration_days, base_price, image_url, status, created_by]
    });

    res.status(201).json({ success: true, message: 'Thêm Tour thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cập nhật Tour (PUT)
exports.updateTour = async (req, res) => {
  try {
    const { id } = req.params;
    const { tour_name, description, destination, duration_days, base_price, image_url, status } = req.body;

    await sequelize.query(`
            UPDATE tours 
            SET tour_name = ?, description = ?, destination = ?, duration_days = ?, 
                base_price = ?, image_url = ?, status = ?
            WHERE tour_id = ?
        `, {
      replacements: [tour_name, description, destination, duration_days, base_price, image_url, status, id]
    });

    res.status(200).json({ success: true, message: 'Cập nhật Tour thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.createTour = async (req, res) => {
  try {
    const { tour_name, description, destination, duration_days, base_price, status } = req.body;
    const created_by = req.user.id || req.user.user_id;

    // Kiểm tra xem có file ảnh được upload lên không
    let finalImageUrl = '';
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    await sequelize.query(`
            INSERT INTO tours (tour_name, description, destination, duration_days, base_price, image_url, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, {
      replacements: [tour_name, description, destination, duration_days, base_price, finalImageUrl, status, created_by]
    });

    res.status(201).json({ success: true, message: 'Thêm Tour thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const { id } = req.params;
    const { tour_name, description, destination, duration_days, base_price, status, existing_image_url } = req.body;

    // Nếu có upload ảnh mới thì lấy link ảnh mới, nếu không thì xài lại link ảnh cũ truyền từ form
    let finalImageUrl = existing_image_url || '';
    if (req.file) {
      finalImageUrl = `/uploads/${req.file.filename}`;
    }

    await sequelize.query(`
            UPDATE tours 
            SET tour_name = ?, description = ?, destination = ?, duration_days = ?, 
                base_price = ?, image_url = ?, status = ?
            WHERE tour_id = ?
        `, {
      replacements: [tour_name, description, destination, duration_days, base_price, finalImageUrl, status, id]
    });

    res.status(200).json({ success: true, message: 'Cập nhật Tour thành công!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Xóa Tour (DELETE)
exports.deleteTour = async (req, res) => {
  try {
    const { id } = req.params;

    // Lệnh xóa Tour trong CSDL
    await sequelize.query(`
            DELETE FROM tours WHERE tour_id = ?
        `, {
      replacements: [id]
    });

    res.status(200).json({ success: true, message: 'Xóa Tour thành công!' });
  } catch (error) {
    // Bắt lỗi số 1451 của MySQL: Lỗi ràng buộc khóa ngoại (Foreign Key Constraint)
    // Nếu Tour đã có Đơn hàng hoặc Lịch trình thì MySQL sẽ chặn không cho xóa và quăng lỗi này.
    if (error.original && error.original.errno === 1451) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa! Tour này đang có Ngày khởi hành hoặc Đơn đặt hàng liên kết.'
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
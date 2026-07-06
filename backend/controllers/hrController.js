const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

// 1. Lấy danh sách nhân viên
exports.getAllEmployees = async (req, res) => {
  try {
    const [employees] = await sequelize.query(`
      SELECT u.user_id, u.role_id, u.full_name, u.email, u.phone, u.avatar, u.gender, u.date_of_birth, u.status, u.created_at, r.role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.role_id 
      WHERE u.role_id != 6 
      ORDER BY u.user_id DESC
    `);

    res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Thêm nhân viên mới
exports.createEmployee = async (req, res) => {
  try {
    const {
      role_id,
      full_name,
      email,
      password,
      phone,
      gender,
      date_of_birth,
      status = 'Active'
    } = req.body;

    // Kiểm tra email tồn tại
    const [existing] = await sequelize.query(
      'SELECT user_id FROM users WHERE email = ?',
      { replacements: [email] }
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email đã tồn tại trên hệ thống!' });
    }

    // Mã hóa mật khẩu
    const password_hash = await bcrypt.hash(password || '123456', 10);

    await sequelize.query(`
      INSERT INTO users (role_id, full_name, email, password_hash, phone, gender, date_of_birth, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, {
      replacements: [role_id, full_name, email, password_hash, phone || null, gender || null, date_of_birth || null, status]
    });

    res.status(201).json({
      success: true,
      message: 'Thêm nhân viên thành công!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Cập nhật thông tin nhân viên
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      role_id,
      full_name,
      email,
      password,
      phone,
      gender,
      date_of_birth,
      status
    } = req.body;

    // Kiểm tra email trùng lặp với người khác
    const [existing] = await sequelize.query(
      'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
      { replacements: [email, id] }
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email đã được sử dụng bởi người dùng khác!' });
    }

    if (password) {
      // Có cập nhật mật khẩu
      const password_hash = await bcrypt.hash(password, 10);
      await sequelize.query(`
        UPDATE users 
        SET role_id = ?, full_name = ?, email = ?, password_hash = ?, phone = ?, gender = ?, date_of_birth = ?, status = ?, updated_at = NOW()
        WHERE user_id = ?
      `, {
        replacements: [role_id, full_name, email, password_hash, phone || null, gender || null, date_of_birth || null, status, id]
      });
    } else {
      // Không cập nhật mật khẩu
      await sequelize.query(`
        UPDATE users 
        SET role_id = ?, full_name = ?, email = ?, phone = ?, gender = ?, date_of_birth = ?, status = ?, updated_at = NOW()
        WHERE user_id = ?
      `, {
        replacements: [role_id, full_name, email, phone || null, gender || null, date_of_birth || null, status, id]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật nhân viên thành công!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Xóa nhân viên
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra nếu xóa chính mình
    if (Number(id) === Number(req.user.user_id)) {
      return res.status(400).json({ success: false, message: 'Bạn không thể tự xóa tài khoản của chính mình!' });
    }

    await sequelize.query('DELETE FROM users WHERE user_id = ?', {
      replacements: [id]
    });

    res.status(200).json({
      success: true,
      message: 'Xóa nhân viên thành công!'
    });
  } catch (error) {
    // Xử lý lỗi khóa ngoại
    if (error.original && error.original.errno === 1451) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa nhân viên này vì đang liên kết với các dữ liệu khác (như điều hành tour, đánh giá, yêu cầu dịch vụ...). Hãy chuyển trạng thái sang Blocked hoặc Inactive.'
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Lấy danh sách đánh giá hiệu suất nhân viên
exports.getAllPerformanceReviews = async (req, res) => {
  try {
    const [reviews] = await sequelize.query(`
      SELECT pr.*, u.full_name as employee_name, r.role_name as employee_role, u2.full_name as reviewer_name 
      FROM performance_reviews pr 
      LEFT JOIN users u ON pr.employee_id = u.user_id 
      LEFT JOIN roles r ON u.role_id = r.role_id 
      LEFT JOIN users u2 ON pr.reviewer_id = u2.user_id 
      ORDER BY pr.performance_id DESC
    `);

    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Thêm đánh giá hiệu suất nhân viên
exports.createPerformanceReview = async (req, res) => {
  try {
    const {
      employee_id,
      score,
      comment,
      review_date
    } = req.body;

    const reviewer_id = req.user.user_id;

    await sequelize.query(`
      INSERT INTO performance_reviews (employee_id, reviewer_id, score, comment, review_date)
      VALUES (?, ?, ?, ?, ?)
    `, {
      replacements: [employee_id, reviewer_id, score, comment, review_date || new Date().toISOString().slice(0, 10)]
    });

    res.status(201).json({
      success: true,
      message: 'Thêm đánh giá nhân sự thành công!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Lấy danh sách khách hàng (role_id = 6)
exports.getAllCustomers = async (req, res) => {
  try {
    const [customers] = await sequelize.query(`
      SELECT u.user_id, u.role_id, u.full_name, u.email, u.phone, u.avatar, u.gender, u.date_of_birth, u.status, u.created_at, r.role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.role_id 
      WHERE u.role_id = 6 
      ORDER BY u.user_id DESC
    `);

    res.status(200).json({
      success: true,
      data: customers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Thêm khách hàng mới
exports.createCustomer = async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
      phone,
      gender,
      date_of_birth,
      status = 'Active'
    } = req.body;

    const [existing] = await sequelize.query(
      'SELECT user_id FROM users WHERE email = ?',
      { replacements: [email] }
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email đã tồn tại trên hệ thống!' });
    }

    const password_hash = await bcrypt.hash(password || '123456', 10);

    await sequelize.query(`
      INSERT INTO users (role_id, full_name, email, password_hash, phone, gender, date_of_birth, status, created_at, updated_at)
      VALUES (6, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, {
      replacements: [full_name, email, password_hash, phone || null, gender || null, date_of_birth || null, status]
    });

    res.status(201).json({
      success: true,
      message: 'Thêm khách hàng thành công!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Cập nhật thông tin khách hàng
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      full_name,
      email,
      password,
      phone,
      gender,
      date_of_birth,
      status
    } = req.body;

    const [existing] = await sequelize.query(
      'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
      { replacements: [email, id] }
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email đã được sử dụng bởi người dùng khác!' });
    }

    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      await sequelize.query(`
        UPDATE users 
        SET full_name = ?, email = ?, password_hash = ?, phone = ?, gender = ?, date_of_birth = ?, status = ?, updated_at = NOW()
        WHERE user_id = ? AND role_id = 6
      `, {
        replacements: [full_name, email, password_hash, phone || null, gender || null, date_of_birth || null, status, id]
      });
    } else {
      await sequelize.query(`
        UPDATE users 
        SET full_name = ?, email = ?, phone = ?, gender = ?, date_of_birth = ?, status = ?, updated_at = NOW()
        WHERE user_id = ? AND role_id = 6
      `, {
        replacements: [full_name, email, phone || null, gender || null, date_of_birth || null, status, id]
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật khách hàng thành công!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Xóa khách hàng
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    await sequelize.query('DELETE FROM users WHERE user_id = ? AND role_id = 6', {
      replacements: [id]
    });

    res.status(200).json({
      success: true,
      message: 'Xóa khách hàng thành công!'
    });
  } catch (error) {
    if (error.original && error.original.errno === 1451) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa khách hàng này vì đang liên kết với dữ liệu đặt tour, hóa đơn thanh toán... Hãy chuyển trạng thái tài khoản sang Blocked hoặc Inactive.'
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

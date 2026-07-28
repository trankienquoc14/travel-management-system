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

// 11. Lấy thống kê hiệu suất dẫn đoàn của nhân viên (Dành cho Hướng dẫn viên)
exports.getEmployeeTourStats = async (req, res) => {
  try {
    const { id } = req.params; // user_id của nhân viên

    // 1. Kiểm tra vai trò của người dùng
    const [user] = await sequelize.query('SELECT role_id FROM users WHERE user_id = ?', {
      replacements: [id]
    });

    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng!' });
    }

    const roleId = user[0].role_id;
    if (roleId !== 5) {
      // Không phải Hướng dẫn viên
      return res.status(200).json({
        success: true,
        isGuide: false,
        message: 'Nhân sự này không thuộc vai trò Hướng dẫn viên, không có dữ liệu điều hành tour.'
      });
    }

    // 2. Lấy số lượng tour đã dẫn
    const [toursLed] = await sequelize.query(`
      SELECT COUNT(DISTINCT ga.departure_id) as count 
      FROM guide_assignments ga 
      JOIN guides g ON ga.guide_id = g.guide_id 
      WHERE g.user_id = ?
    `, { replacements: [id] });

    // 3. Lấy tổng số hành khách đã dẫn dắt (Confirmed bookings)
    const [passengersGuided] = await sequelize.query(`
      SELECT COUNT(bp.passenger_id) as count 
      FROM guide_assignments ga 
      JOIN guides g ON ga.guide_id = g.guide_id 
      JOIN bookings b ON ga.departure_id = b.departure_id 
      JOIN booking_passengers bp ON b.booking_id = bp.booking_id
      WHERE g.user_id = ? AND b.booking_status = 'Confirmed'
    `, { replacements: [id] });

    // 4. Lấy điểm đánh giá trung bình từ khách hàng cho các tour mà HDV này từng dẫn
    const [avgRating] = await sequelize.query(`
      SELECT AVG(r.rating) as avg 
      FROM reviews r
      WHERE r.tour_id IN (
        SELECT DISTINCT d.tour_id 
        FROM guide_assignments ga 
        JOIN guides g ON ga.guide_id = g.guide_id 
        JOIN departures d ON ga.departure_id = d.departure_id 
        WHERE g.user_id = ?
      )
    `, { replacements: [id] });

    // 5. Lấy tổng số sự cố đã báo cáo
    const [incidentsCount] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM incident_reports ir 
      JOIN guides g ON ir.guide_id = g.guide_id 
      WHERE g.user_id = ?
    `, { replacements: [id] });

    // 6. Lấy danh sách các chuyến đi thực tế của HDV này
    const [departuresList] = await sequelize.query(`
      SELECT 
        d.departure_id, d.departure_date, d.status, t.tour_name, t.tour_id,
        (SELECT COUNT(*) FROM bookings b JOIN booking_passengers bp ON b.booking_id = bp.booking_id WHERE b.departure_id = d.departure_id AND b.booking_status = 'Confirmed') as passenger_count,
        (SELECT COUNT(*) FROM incident_reports ir WHERE ir.departure_id = d.departure_id) as incident_count
      FROM guide_assignments ga
      JOIN guides g ON ga.guide_id = g.guide_id
      JOIN departures d ON ga.departure_id = d.departure_id
      JOIN tours t ON d.tour_id = t.tour_id
      WHERE g.user_id = ?
      ORDER BY d.departure_date DESC
    `, { replacements: [id] });

    res.status(200).json({
      success: true,
      isGuide: true,
      data: {
        toursCount: toursLed[0].count || 0,
        passengersCount: passengersGuided[0].count || 0,
        averageRating: avgRating[0].avg ? parseFloat(avgRating[0].avg).toFixed(1) : '—',
        incidentsCount: incidentsCount[0].count || 0,
        departures: departuresList
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 12. Lấy danh sách chấm công của nhân viên theo ngày
exports.getAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Thiếu ngày chấm công!' });

    try {
      const [attendance] = await sequelize.query(`
        SELECT 
          u.user_id, u.full_name, u.email, r.role_name,
          t.timekeeping_id, t.status, t.check_in, t.check_out, t.notes
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        LEFT JOIN timekeeping t ON u.user_id = t.employee_id AND t.work_date = ?
        WHERE u.role_id IN (2, 3, 4, 5) AND u.status = 'Active'
        ORDER BY u.user_id ASC
      `, { replacements: [date] });

      res.status(200).json({
        success: true,
        needs_db_migration: false,
        data: attendance
      });
    } catch (innerError) {
      // Nếu chưa có bảng timekeeping trong CSDL, trả về danh sách nhân sự trống kèm flag cảnh báo
      if (innerError.original && (innerError.original.errno === 1146 || innerError.original.code === 'ER_NO_SUCH_TABLE')) {
        const [employees] = await sequelize.query(`
          SELECT 
            u.user_id, u.full_name, u.email, r.role_name,
            NULL as timekeeping_id, NULL as status, NULL as check_in, NULL as check_out, NULL as notes
          FROM users u
          JOIN roles r ON u.role_id = r.role_id
          WHERE u.role_id IN (2, 3, 4, 5) AND u.status = 'Active'
          ORDER BY u.user_id ASC
        `);
        return res.status(200).json({
          success: true,
          needs_db_migration: true,
          data: employees
        });
      }
      throw innerError;
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 13. Cập nhật hoặc thêm mới chấm công cho nhân viên
exports.updateAttendance = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const work_date = req.body.work_date || req.body.date;
    if (!work_date) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Thiếu ngày chấm công!' });
    }

    let attendance = req.body.attendance;
    if (!attendance && (req.body.user_id || req.body.employee_id)) {
      attendance = [{
        employee_id: req.body.user_id || req.body.employee_id,
        status: req.body.status,
        check_in: req.body.check_in,
        check_out: req.body.check_out,
        notes: req.body.notes
      }];
    }

    if (!attendance || !Array.isArray(attendance)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Dữ liệu chấm công không hợp lệ!' });
    }

    try {
      for (const item of attendance) {
        const { employee_id, status, check_in, check_out, notes } = item;
        
        await sequelize.query(`
          INSERT INTO timekeeping (employee_id, work_date, status, check_in, check_out, notes)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            check_in = VALUES(check_in),
            check_out = VALUES(check_out),
            notes = VALUES(notes)
        `, {
          replacements: [
            employee_id, 
            work_date, 
            status || 'Present', 
            check_in || null, 
            check_out || null, 
            notes || null
          ],
          transaction
        });
      }

      await transaction.commit();
      res.status(200).json({
        success: true,
        message: 'Lưu thông tin chấm công nhân viên thành công!'
      });
    } catch (innerError) {
      await transaction.rollback();
      if (innerError.original && (innerError.original.errno === 1146 || innerError.original.code === 'ER_NO_SUCH_TABLE')) {
        return res.status(400).json({
          success: false,
          needs_db_migration: true,
          message: 'Bảng timekeeping chưa tồn tại trong cơ sở dữ liệu. Vui lòng tạo bảng trước khi chấm công!'
        });
      }
      throw innerError;
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 14. Lấy bảng lương nhân viên theo tháng (YYYY-MM)
exports.getPayroll = async (req, res) => {
  try {
    const { month } = req.query; // Định dạng YYYY-MM
    if (!month) return res.status(400).json({ success: false, message: 'Thiếu tháng tính lương!' });

    try {
      // 1. Lấy danh sách nhân viên đang hoạt động
      const [employees] = await sequelize.query(`
        SELECT u.user_id, u.full_name, u.email, r.role_name
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.role_id IN (2, 3, 4, 5) AND u.status = 'Active'
        ORDER BY u.user_id ASC
      `);

      // 2. Lấy số ngày công thực tế tính từ bảng timekeeping của tháng này (nếu bảng tồn tại)
      let workDaysMap = {};
      try {
        const [timekeepingDays] = await sequelize.query(`
          SELECT 
            employee_id,
            SUM(CASE WHEN status = 'Present' THEN 1.0 WHEN status = 'Late' THEN 1.0 WHEN status = 'Leave' THEN 0.5 ELSE 0.0 END) as calculated_days
          FROM timekeeping
          WHERE DATE_FORMAT(work_date, '%Y-%m') = ?
          GROUP BY employee_id
        `, { replacements: [month] });

        timekeepingDays.forEach(row => {
          workDaysMap[row.employee_id] = parseFloat(row.calculated_days || 0);
        });
      } catch (err) {
        console.warn('Lưu ý: Bảng timekeeping chưa tồn tại hoặc bị lỗi, số ngày công mặc định là 26.', err.message);
      }

      // 3. Lấy dữ liệu bảng lương đã lưu (nếu bảng tồn tại)
      let payrollMap = {};
      let needsMigration = false;
      try {
        const [savedPayroll] = await sequelize.query(`
          SELECT * FROM payroll WHERE salary_month = ?
        `, { replacements: [month] });

        savedPayroll.forEach(row => {
          payrollMap[row.employee_id] = row;
        });
      } catch (err) {
        if (err.original && (err.original.errno === 1146 || err.original.code === 'ER_NO_SUCH_TABLE')) {
          needsMigration = true;
        } else {
          throw err;
        }
      }

      // 4. Tổ hợp dữ liệu lương trả về cho frontend
      const payrollData = employees.map(emp => {
        const saved = payrollMap[emp.user_id] || {};
        const calculatedDays = workDaysMap[emp.user_id] !== undefined ? workDaysMap[emp.user_id] : 26.0;

        // Đặt mức lương cơ bản mặc định theo vai trò nếu không có dữ liệu lưu trước đó
        let defaultBase = 8000000.00; // Mức mặc định
        if (emp.role_name === 'HR Manager') defaultBase = 12000000.00;
        else if (emp.role_name === 'Tour Guide') defaultBase = 10000000.00;
        else if (emp.role_name === 'Tour Operator') defaultBase = 9000000.00;

        const base_salary = saved.base_salary !== undefined ? parseFloat(saved.base_salary) : defaultBase;
        const working_days = saved.working_days !== undefined ? parseFloat(saved.working_days) : calculatedDays;
        const allowance = saved.allowance !== undefined ? parseFloat(saved.allowance) : 0.00;
        const bonus = saved.bonus !== undefined ? parseFloat(saved.bonus) : 0.00;
        const deductions = saved.deductions !== undefined ? parseFloat(saved.deductions) : 0.00;

        // Công thức tính thực lĩnh: (Lương cơ bản / 26) * Ngày công + Phụ cấp + Thưởng - Phạt
        const net_salary = Math.round((base_salary / 26.0) * working_days + allowance + bonus - deductions);

        return {
          employee_id: emp.user_id,
          full_name: emp.full_name,
          email: emp.email,
          role_name: emp.role_name,
          payroll_id: saved.payroll_id || null,
          base_salary,
          working_days,
          allowance,
          bonus,
          deductions,
          net_salary,
          status: saved.status || 'Draft',
          notes: saved.notes || ''
        };
      });

      res.status(200).json({
        success: true,
        needs_db_migration: needsMigration,
        data: payrollData
      });

    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 15. Lưu hoặc cập nhật bảng lương nhân viên
exports.savePayroll = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { salary_month, payroll } = req.body;
    if (!salary_month) return res.status(400).json({ success: false, message: 'Thiếu tháng tính lương!' });
    if (!payroll || !Array.isArray(payroll)) {
      return res.status(400).json({ success: false, message: 'Dữ liệu bảng lương không hợp lệ!' });
    }

    try {
      for (const item of payroll) {
        const { employee_id, base_salary, working_days, allowance, bonus, deductions, net_salary, status, notes } = item;

        await sequelize.query(`
          INSERT INTO payroll (employee_id, salary_month, base_salary, working_days, allowance, bonus, deductions, net_salary, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            base_salary = VALUES(base_salary),
            working_days = VALUES(working_days),
            allowance = VALUES(allowance),
            bonus = VALUES(bonus),
            deductions = VALUES(deductions),
            net_salary = VALUES(net_salary),
            status = VALUES(status),
            notes = VALUES(notes)
        `, {
          replacements: [
            employee_id,
            salary_month,
            base_salary || 0.00,
            working_days || 0.0,
            allowance || 0.00,
            bonus || 0.00,
            deductions || 0.00,
            net_salary || 0.00,
            status || 'Draft',
            notes || null
          ],
          transaction
        });
      }

      await transaction.commit();
      res.status(200).json({
        success: true,
        message: 'Lưu bảng lương tháng thành công!'
      });
    } catch (innerError) {
      await transaction.rollback();
      if (innerError.original && (innerError.original.errno === 1146 || innerError.original.code === 'ER_NO_SUCH_TABLE')) {
        return res.status(400).json({
          success: false,
          needs_db_migration: true,
          message: 'Bảng payroll chưa tồn tại trong cơ sở dữ liệu. Vui lòng tạo bảng trước khi lưu lương!'
        });
      }
      throw innerError;
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 16. Lấy lịch sử chấm công chi tiết có bộ lọc (Từ ngày, Đến ngày, Trạng thái, Tìm kiếm)
exports.getAttendanceHistory = async (req, res) => {
  try {
    const { startDate, endDate, status, search, role_name } = req.query;

    let query = `
      SELECT 
        t.timekeeping_id, t.work_date, t.status, t.check_in, t.check_out, t.notes,
        u.user_id, u.full_name, u.email, r.role_name
      FROM timekeeping t
      JOIN users u ON t.employee_id = u.user_id
      JOIN roles r ON u.role_id = r.role_id
      WHERE 1=1
    `;
    const replacements = [];

    if (startDate && endDate) {
      query += ` AND t.work_date BETWEEN ? AND ?`;
      replacements.push(startDate, endDate);
    } else if (startDate) {
      query += ` AND t.work_date >= ?`;
      replacements.push(startDate);
    } else if (endDate) {
      query += ` AND t.work_date <= ?`;
      replacements.push(endDate);
    }

    if (status && status !== 'All') {
      query += ` AND t.status = ?`;
      replacements.push(status);
    }

    if (search) {
      query += ` AND (u.full_name LIKE ? OR u.email LIKE ?)`;
      replacements.push(`%${search}%`, `%${search}%`);
    }

    if (role_name && role_name !== 'All') {
      query += ` AND r.role_name = ?`;
      replacements.push(role_name);
    }

    query += ` ORDER BY t.work_date DESC, u.user_id ASC`;

    try {
      const [history] = await sequelize.query(query, { replacements });
      res.status(200).json({
        success: true,
        needs_db_migration: false,
        data: history
      });
    } catch (innerError) {
      if (innerError.original && (innerError.original.errno === 1146 || innerError.original.code === 'ER_NO_SUCH_TABLE')) {
        return res.status(200).json({
          success: true,
          needs_db_migration: true,
          data: []
        });
      }
      throw innerError;
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

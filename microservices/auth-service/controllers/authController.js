const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ email và mật khẩu' });
    }

    // 1. Kiểm tra user có tồn tại không
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email không tồn tại trong hệ thống' });
    }

    // 2. Kiểm tra trạng thái tài khoản
    if (user.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt' });
    }

    // 3. Kiểm tra mật khẩu (Hỗ trợ cả mã hóa Bcrypt và Text thuần)
    let isMatch = false;
    
    // Nếu password_hash bắt đầu bằng chuỗi đặc trưng của bcrypt
    if (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$')) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      // Dùng cho trường hợp data cũ vẫn lưu dạng text (ví dụ user khác chưa được mã hóa)
      isMatch = password === user.password_hash; 
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác' });
    }

    // 4. Tạo JWT Token
    const payload = {
      user_id: user.user_id,
      role_id: user.role_id,
      email: user.email
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    // 5. Trả về kết quả
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.user_id,
        fullName: user.full_name,
        role: user.role_id,
        avatar: user.avatar
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};

// 6. Lấy hồ sơ cá nhân của người dùng đăng nhập
exports.getProfile = async (req, res) => {
  try {
    const sequelize = require('../config/database');
    const userId = req.user.user_id || req.user.id;

    const [users] = await sequelize.query(`
      SELECT u.user_id, u.role_id, u.full_name, u.email, u.phone, u.avatar, u.gender, u.date_of_birth, u.status, u.created_at, r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ?
    `, { replacements: [userId] });

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng' });
    }

    res.status(200).json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy hồ sơ: ' + error.message });
  }
};

// 7. Cập nhật hồ sơ cá nhân của người dùng
exports.updateProfile = async (req, res) => {
  try {
    const sequelize = require('../config/database');
    const userId = req.user.user_id || req.user.id;
    const { full_name, phone, gender, date_of_birth, avatar, new_password } = req.body;

    // Xử lý lưu file ảnh avatar nếu người dùng tải lên Base64
    let avatarPath = avatar;
    if (avatar && typeof avatar === 'string' && avatar.startsWith('data:image')) {
      try {
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '../../shared-uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        
        const base64Data = avatar.replace(/^data:image\/\w+;base64,/, "");
        const filename = `avatar_${userId}_${Date.now()}.jpg`;
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, base64Data, 'base64');
        avatarPath = `/uploads/${filename}`;
      } catch (imgErr) {
        console.error("Lỗi lưu file ảnh avatar:", imgErr);
      }
    }

    let updateFields = [];
    let replacements = [];

    if (full_name) { updateFields.push('full_name = ?'); replacements.push(full_name); }
    if (phone !== undefined) { updateFields.push('phone = ?'); replacements.push(phone); }
    if (gender !== undefined) { updateFields.push('gender = ?'); replacements.push(gender); }
    if (date_of_birth !== undefined) { updateFields.push('date_of_birth = ?'); replacements.push(date_of_birth || null); }
    if (avatar !== undefined) { updateFields.push('avatar = ?'); replacements.push(avatarPath); }

    if (new_password) {
      const password_hash = await bcrypt.hash(new_password, 10);
      updateFields.push('password_hash = ?');
      replacements.push(password_hash);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'Không có thông tin nào thay đổi' });
    }

    replacements.push(userId);
    await sequelize.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`,
      { replacements }
    );

    const [updatedUsers] = await sequelize.query(`
      SELECT u.user_id, u.role_id, u.full_name, u.email, u.phone, u.avatar, u.gender, u.date_of_birth, u.status, r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ?
    `, { replacements: [userId] });

    res.status(200).json({
      success: true,
      message: '🎉 Cập nhật hồ sơ cá nhân thành công!',
      data: updatedUsers[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật hồ sơ: ' + error.message });
  }
};
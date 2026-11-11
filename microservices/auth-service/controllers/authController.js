const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^(0|\+84)[0-9]{9}$/;

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Kiểm tra bỏ trống các trường bắt buộc
    if (!email || !password || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ các thông tin bắt buộc' });
    }

    // 2. Kiểm tra email đúng định dạng
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Email nhập phải đúng định dạng' });
    }

    // 3. Kiểm tra mật khẩu phải từ 6 ký tự trở lên
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải từ 6 ký tự trở lên' });
    }

    // 4. Kiểm tra user có tồn tại không
    const user = await User.findOne({ where: { email: email.trim() } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email không tồn tại trong hệ thống' });
    }

    // 5. Kiểm tra trạng thái tài khoản
    if (user.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa hoặc chưa kích hoạt' });
    }

    // 6. Kiểm tra mật khẩu (Hỗ trợ cả mã hóa Bcrypt và Text thuần)
    let isMatch = false;
    if (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$')) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      isMatch = password === user.password_hash; 
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác' });
    }

    // 7. Tạo JWT Token
    const payload = {
      user_id: user.user_id,
      role_id: user.role_id,
      email: user.email
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'travel_management_secret_key_2026', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    // 8. Trả về kết quả
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

// API Đăng ký tài khoản Khách hàng mới
exports.register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    // 1. Kiểm tra bỏ trống các trường bắt buộc
    if (!full_name || !email || !password || !full_name.trim() || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ các thông tin bắt buộc' });
    }

    // 2. Kiểm tra email đúng định dạng
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Email nhập phải đúng định dạng' });
    }

    // 3. Kiểm tra mật khẩu phải từ 6 ký tự trở lên
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải từ 6 ký tự trở lên' });
    }

    // 4. Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ where: { email: email.trim() } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email này đã được sử dụng. Vui lòng đăng nhập!' });
    }

    // 5. Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 6. Tạo user mới (Role 6 mặc định là Khách Hàng)
    const newUser = await User.create({
      full_name: full_name.trim(),
      email: email.trim(),
      password_hash,
      role_id: 6, 
      status: 'Active'
    });

    // 7. Tạo JWT Token tự động đăng nhập sau khi đăng ký
    const payload = {
      user_id: newUser.user_id,
      role_id: newUser.role_id,
      email: newUser.email
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'travel_management_secret_key_2026', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      token,
      user: {
        id: newUser.user_id,
        fullName: newUser.full_name,
        role: newUser.role_id,
        avatar: newUser.avatar
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};

// 6. Lấy hồ sơ cá nhân của người dùng đăng nhập (Bảng 3.10 - Luồng 2)
exports.getProfile = async (req, res) => {
  try {
    const sequelize = require('../config/database');
    const userId = req.user.user_id || req.user.id;

    const [users] = await sequelize.query(`
      SELECT u.user_id, u.role_id, u.full_name, u.email, u.phone, u.avatar, u.gender, u.date_of_birth, u.address, u.status, u.created_at, r.role_name
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

// 7. Cập nhật hồ sơ cá nhân của người dùng (Bảng 3.10 - Luồng 4, 5, 6, 7 & Luồng ngoại lệ 5.1)
exports.updateProfile = async (req, res) => {
  try {
    const sequelize = require('../config/database');
    const userId = req.user.user_id || req.user.id;
    const { full_name, phone, gender, date_of_birth, address, avatar } = req.body;

    // Kiểm tra định dạng số điện thoại nếu có nhập (Luồng 5)
    if (phone && phone.trim()) {
      const trimmedPhone = phone.trim();
      if (!phoneRegex.test(trimmedPhone)) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại không đúng định dạng. Vui lòng nhập số điện thoại hợp lệ (10 chữ số)!'
        });
      }
    }

    // Xử lý kiểm tra và lưu file ảnh avatar (Luồng 5 & Luồng ngoại lệ 5.1)
    let avatarPath = avatar;
    if (avatar && typeof avatar === 'string' && avatar.startsWith('data:image')) {
      try {
        // Kiểm tra dung lượng ảnh (< 3MB)
        // 3MB = 3 * 1024 * 1024 bytes = 3,145,728 bytes. Base64 length * 0.75 ~ bytes
        const base64Content = avatar.replace(/^data:image\/\w+;base64,/, '');
        const approximateByteSize = (base64Content.length * 3) / 4;
        const MAX_SIZE = 3 * 1024 * 1024; // 3MB

        if (approximateByteSize > MAX_SIZE) {
          return res.status(400).json({
            success: false,
            message: 'Không thể tải lên ảnh đại diện. Vui lòng kiểm tra dung lượng ảnh (< 3MB) và thử lại'
          });
        }

        const uploadsDir = path.join(__dirname, '../../shared-uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Xác định extension từ data URL
        let ext = 'jpg';
        const match = avatar.match(/^data:image\/(\w+);base64,/);
        if (match && match[1]) {
          ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        }

        const filename = `avatar_${userId}_${Date.now()}.${ext}`;
        const filepath = path.join(uploadsDir, filename);
        fs.writeFileSync(filepath, base64Content, 'base64');
        avatarPath = `/uploads/${filename}`;
      } catch (imgErr) {
        console.error('Lỗi lưu file ảnh avatar:', imgErr);
        return res.status(400).json({
          success: false,
          message: 'Không thể tải lên ảnh đại diện. Vui lòng kiểm tra dung lượng ảnh (< 3MB) và thử lại'
        });
      }
    }

    let updateFields = [];
    let replacements = [];

    if (full_name !== undefined) { 
      if (!full_name.trim()) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập họ và tên' });
      }
      updateFields.push('full_name = ?'); 
      replacements.push(full_name.trim()); 
    }
    if (phone !== undefined) { 
      updateFields.push('phone = ?'); 
      replacements.push(phone ? phone.trim() : null); 
    }
    if (gender !== undefined) { 
      updateFields.push('gender = ?'); 
      replacements.push(gender); 
    }
    if (date_of_birth !== undefined) { 
      updateFields.push('date_of_birth = ?'); 
      replacements.push(date_of_birth || null); 
    }
    if (address !== undefined) { 
      updateFields.push('address = ?'); 
      replacements.push(address ? address.trim() : null); 
    }
    if (avatar !== undefined) { 
      updateFields.push('avatar = ?'); 
      replacements.push(avatarPath); 
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, message: 'Không có thông tin nào thay đổi' });
    }

    // Luồng 6: Cập nhật CSDL
    replacements.push(userId);
    await sequelize.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`,
      { replacements }
    );

    const [updatedUsers] = await sequelize.query(`
      SELECT u.user_id, u.role_id, u.full_name, u.email, u.phone, u.avatar, u.gender, u.date_of_birth, u.address, u.status, r.role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ?
    `, { replacements: [userId] });

    // Luồng 7: Thông báo cập nhật hồ sơ cá nhân thành công
    res.status(200).json({
      success: true,
      message: 'Cập nhật hồ sơ cá nhân thành công!',
      data: updatedUsers[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật hồ sơ: ' + error.message });
  }
};

// 8. Đổi mật khẩu tài khoản (Bảng 3.10 - Luồng thay thế 3.1 - 3.5)
exports.changePassword = async (req, res) => {
  try {
    const sequelize = require('../config/database');
    const userId = req.user.user_id || req.user.id;
    const { current_password, new_password, confirm_password } = req.body;

    // Kiểm tra bỏ trống các trường
    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng nhập đầy đủ các thông tin bắt buộc' 
      });
    }

    // Luồng 3.4: Kiểm tra mật khẩu mới dưới 6 ký tự
    if (new_password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mật khẩu mới phải từ 6 ký tự trở lên' 
      });
    }

    // Luồng 3.4: Kiểm tra không khớp với xác nhận mật khẩu
    if (new_password !== confirm_password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mật khẩu xác nhận không khớp' 
      });
    }

    // Luồng 3.3: Lấy thông tin người dùng và kiểm tra mật khẩu hiện tại
    const [users] = await sequelize.query(
      'SELECT user_id, password_hash FROM users WHERE user_id = ?',
      { replacements: [userId] }
    );

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng' });
    }

    const user = users[0];
    let isMatch = false;
    if (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$')) {
      isMatch = await bcrypt.compare(current_password, user.password_hash);
    } else {
      isMatch = current_password === user.password_hash;
    }

    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mật khẩu hiện tại không chính xác' 
      });
    }

    // Luồng 3.5: Thông tin chính xác -> Băm mật khẩu mới, cập nhật CSDL
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(new_password, salt);

    await sequelize.query(
      'UPDATE users SET password_hash = ? WHERE user_id = ?',
      { replacements: [newPasswordHash, userId] }
    );

    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi đổi mật khẩu: ' + error.message });
  }
};

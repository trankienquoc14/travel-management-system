const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

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
        role: user.role_id
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};
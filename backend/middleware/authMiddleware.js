const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
  let token;

  // Lấy token từ header Authorization (Định dạng: Bearer <token>)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Không có quyền truy cập, vui lòng đăng nhập' });
  }

  try {
    // Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Gắn thông tin user vào request để các controller sau có thể dùng
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};
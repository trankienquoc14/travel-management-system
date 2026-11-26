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
    const secret = process.env.JWT_SECRET || 'travel_management_secret_key_2026';
    const decoded = jwt.verify(token, secret);
    
    // Gắn thông tin user vào request để các controller sau có thể dùng
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

// Phân quyền theo Role (RBAC)
exports.restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để thực hiện' });
    }
    const userRole = Number(req.user.role_id || req.user.role);
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền thực hiện hành động này!' 
      });
    }
    next();
  };
};
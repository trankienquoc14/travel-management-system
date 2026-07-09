const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

// 1. Khởi tạo app Express (PHẢI NẰM ĐẦU TIÊN)
const app = express();

// 2. Cài đặt Middlewares cơ bản (Xử lý lỗi CORS và đọc JSON)
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. Import các cấu hình và Route
const sequelize = require('./config/database');
const tourRoutes = require('./routes/tourRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const partnerServiceRoutes = require('./routes/partnerServiceRoutes');
const customTourRoutes = require('./routes/customTourRoutes');
const destinationRoutes = require('./routes/destinationRoutes');
const placeRoutes = require('./routes/placeRoutes');
const hrRoutes = require('./routes/hrRoutes');
const guideRoutes = require('./routes/guideRoutes');
const staffRoutes = require('./routes/staffRoutes');

// 4. Đăng ký các Routes (TẤT CẢ app.use phải nằm ở khu vực này)
app.use('/api/tours', tourRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/partner-services', partnerServiceRoutes);
app.use('/api/custom-tours', customTourRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/guide', guideRoutes);
app.use('/api/staff', staffRoutes);

// 5. Kết nối Database và Khởi động Server
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log('✅ Đã kết nối MySQL Database thành công!');
    app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối Database:', err);
  });
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const sequelize = require('./config/database');
const bookingRoutes = require('./routes/bookingRoutes');

// Cấu hình routes
app.use('/api/bookings', bookingRoutes);

const PORT = process.env.PORT || 5003;

sequelize.authenticate()
  .then(() => {
    console.log('✅ Booking Service đã kết nối MySQL Database thành công!');
    app.listen(PORT, () => {
      console.log(`🚀 Booking Service đang chạy tại http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối Database:', err);
  });

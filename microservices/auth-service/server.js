const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

app.use(cors());
app.use(express.json());

const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');

// Cấu hình routes
app.use('/api/auth', authRoutes);

const PORT = process.env.AUTH_SERVICE_PORT || 5001;

sequelize.authenticate()
  .then(() => {
    console.log('✅ Auth Service đã kết nối MySQL Database thành công!');
    app.listen(PORT, () => {
      console.log(`🚀 Auth Service đang chạy tại http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối Database:', err);
  });

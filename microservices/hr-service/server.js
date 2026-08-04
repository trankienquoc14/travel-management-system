const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

const sequelize = require('./config/database');
const hrRoutes = require('./routes/hrRoutes');
const staffRoutes = require('./routes/staffRoutes');
const guideRoutes = require('./routes/guideRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const partnerServiceRoutes = require('./routes/partnerServiceRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Cấu hình routes
app.use('/api/hr', hrRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/guide', guideRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/partner-services', partnerServiceRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/dashboard', dashboardRoutes);

const PORT = process.env.HR_SERVICE_PORT || 5004;

sequelize.authenticate()
  .then(() => {
    console.log('✅ HR Service đã kết nối MySQL Database thành công!');
    app.listen(PORT, () => {
      console.log(`🚀 HR Service đang chạy tại http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối Database:', err);
  });

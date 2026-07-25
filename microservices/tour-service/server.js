const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const sequelize = require('./config/database');
const tourRoutes = require('./routes/tourRoutes');
const customTourRoutes = require('./routes/customTourRoutes');
const destinationRoutes = require('./routes/destinationRoutes');
const placeRoutes = require('./routes/placeRoutes');

// Cấu hình routes
app.use('/api/tours', tourRoutes);
app.use('/api/custom-tours', customTourRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/places', placeRoutes);

const PORT = process.env.PORT || 5002;

sequelize.authenticate()
  .then(() => {
    console.log('✅ Tour Service đã kết nối MySQL Database thành công!');
    app.listen(PORT, () => {
      console.log(`🚀 Tour Service đang chạy tại http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối Database:', err);
  });

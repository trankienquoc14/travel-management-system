const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

app.use(cors());
app.use(morgan('dev'));

// Serve static uploads folder from the shared location and tour-service uploads
app.use('/uploads', express.static(path.join(__dirname, '../shared-uploads')));
app.use('/uploads', express.static(path.join(__dirname, '../tour-service/uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'API Gateway', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'TravelVN ERP API Gateway', version: '1.0.0' });
});

// Routing configuration for microservices
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:5001',
  tour: process.env.TOUR_SERVICE_URL || 'http://127.0.0.1:5002',
  booking: process.env.BOOKING_SERVICE_URL || 'http://127.0.0.1:5003',
  hr: process.env.HR_SERVICE_URL || 'http://127.0.0.1:5004',
  chat: process.env.CHAT_SERVICE_URL || 'http://127.0.0.1:5005'
};

// WebSocket proxy for Socket.IO realtime chat (MUST be placed before root proxy)
const wsProxy = createProxyMiddleware({
  target: services.chat,
  ws: true,
  changeOrigin: true
});
app.use('/socket.io', wsProxy);

// Set up proxy using router option to preserve paths
app.use('/', createProxyMiddleware({
  target: 'http://127.0.0.1:9999', // Fail fast instead of infinite loop
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      console.error(`❌ [API Gateway Proxy] Lỗi kết nối tới dịch vụ (${req.method} ${req.url}):`, err.message);
      if (res && !res.headersSent && typeof res.status === 'function') {
        res.status(502).json({
          success: false,
          message: `Không thể kết nối đến microservice xử lý (${err.code || err.message}). Vui lòng kiểm tra dịch vụ đã được khởi động chưa.`
        });
      }
    }
  },
  router: {
    '/api/auth': services.auth,
    '/api/tours': services.tour,
    '/api/destinations': services.tour,
    '/api/places': services.tour,
    '/api/builder': services.tour,
    '/api/custom-tours': services.tour,
    '/api/service-requests': services.tour,
    '/api/bookings': services.booking,
    '/api/sepay-webhook': services.booking,
    '/sepay-webhook': services.booking,
    '/api/hr': services.hr,
    '/api/guide': services.hr,
    '/api/driver': services.hr,
    '/api/staff': services.hr,
    '/api/partners': services.hr,
    '/api/partner-services': services.hr,
    '/api/services': services.hr,
    '/api/dashboard': services.hr,
    '/api/chat': services.chat
  }
}));

const PORT = process.env.PORT || process.env.API_GATEWAY_PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [API Gateway] Server is successfully running on http://0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ [API Gateway] Server listen error:', err);
});

server.on('upgrade', (req, socket, head) => {
  if (req.url && req.url.startsWith('/socket.io')) {
    wsProxy.upgrade(req, socket, head);
  }
});

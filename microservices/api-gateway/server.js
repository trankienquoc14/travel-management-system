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

// Serve static uploads folder from the shared location
app.use('/uploads', express.static(path.join(__dirname, '../shared-uploads')));

// Routing configuration for microservices
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
  tour: process.env.TOUR_SERVICE_URL || 'http://localhost:5002',
  booking: process.env.BOOKING_SERVICE_URL || 'http://localhost:5003',
  hr: process.env.HR_SERVICE_URL || 'http://localhost:5004'
};

// Set up proxy using router option to preserve paths
app.use('/', createProxyMiddleware({
  target: 'http://localhost:5000', // Default dummy target, will be overridden by router
  changeOrigin: true,
  router: {
    '/api/auth': services.auth,
    '/api/tours': services.tour,
    '/api/destinations': services.tour,
    '/api/places': services.tour,
    '/api/custom-tours': services.tour,
    '/api/bookings': services.booking,
    '/api/hr': services.hr,
    '/api/guide': services.hr,
    '/api/staff': services.hr,
    '/api/partners': services.hr,
    '/api/partner-services': services.hr,
    '/api/services': services.hr,
    '/api/dashboard': services.hr
  }
}));

const PORT = process.env.API_GATEWAY_PORT || process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API Gateway is running on http://localhost:${PORT}`);
});

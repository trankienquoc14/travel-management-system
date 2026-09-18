const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');
code = code.replace("import MyBookings from './components/MyBookings';", "import MyBookings from './components/MyBookings';\nimport ErrorBoundary from './components/ErrorBoundary';");
code = code.replace("<Route path=\"/my-bookings\" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />", "<Route path=\"/my-bookings\" element={<ProtectedRoute><ErrorBoundary><MyBookings /></ErrorBoundary></ProtectedRoute>} />");
fs.writeFileSync('frontend/src/App.jsx', code);

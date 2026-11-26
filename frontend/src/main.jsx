import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App.jsx';

// DÒNG NÀY CỰC KỲ QUAN TRỌNG: Gọi file CSS dùng chung cho toàn hệ thống
import './index.css';
import './styles/traveltech.css';

// Tự động chuyển hướng toàn bộ request axios từ http://localhost:5000 sang API Gateway trong môi trường Production
const PRODUCTION_GATEWAY = (
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://travel-management-system-xzid.onrender.com'
    : 'http://localhost:5000')
).replace(/\/+$/, '');

axios.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith('http://localhost:5000')) {
    config.url = config.url.replace('http://localhost:5000', PRODUCTION_GATEWAY);
  }
  const token = localStorage.getItem('token');
  if (token && (!config.headers || !config.headers.Authorization)) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
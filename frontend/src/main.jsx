import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// DÒNG NÀY CỰC KỲ QUAN TRỌNG: Gọi file CSS dùng chung cho toàn hệ thống
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
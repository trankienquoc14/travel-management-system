import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import toàn bộ các trang
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import HomePage from './components/HomePage';
import TourDetail from './components/TourDetail';
import MyBookings from './components/MyBookings';
import BookingForm from './components/BookingForm';
import CustomerTourBuilder from './components/CustomerTourBuilder';
import StaffTourRequestManager from './components/StaffTourRequestManager';
import CustomerQuotes from './components/CustomerQuotes';
import StaffFixedTourDesigner from './components/StaffFixedTourDesigner'; // Thêm trang thiết kế tour

// 1. Bảo vệ cơ bản: Chỉ cần có đăng nhập
const ProtectedRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  if (!userStr || !token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// 2. BẢO VỆ NÂNG CAO: Chặn khách hàng vào trang của Nhân viên/Quản lý
const StaffProtectedRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  if (!userStr || !token) return <Navigate to="/login" replace />;
  
  const user = JSON.parse(userStr);
  const userRole = Number(user.role_id || user.role);

  // Nếu là Khách hàng (6), đá về trang chủ
  if (userRole === 6) {
    return <Navigate to="/home" replace />;
  }
  
  // Nếu là Nhân viên/Admin (khác 6) thì cho phép vào
  return children;
};

// 3. Phân luồng lúc mới vào web
const RootRedirect = () => {
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  if (!userStr || !token) return <Navigate to="/login" replace />;
  
  const user = JSON.parse(userStr);
  const userRole = Number(user.role_id || user.role); 

  return userRole === 6 ? <Navigate to="/home" replace /> : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RootRedirect />} />

        {/* =========================================
            KHU VỰC DÀNH CHO KHÁCH HÀNG (MỌI ROLE ĐỀU VÀO ĐƯỢC) 
            ========================================= */}
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/tour/:id" element={<ProtectedRoute><TourDetail /></ProtectedRoute>} />
        <Route path="/booking-form" element={<ProtectedRoute><BookingForm /></ProtectedRoute>} />
        <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="/my-quotes" element={<ProtectedRoute><CustomerQuotes /></ProtectedRoute>} />
        
        {/* Đã bọc bảo vệ cho việc khách hàng tự build tour */}
        <Route path="/build-tour" element={<ProtectedRoute><CustomerTourBuilder /></ProtectedRoute>} />


        {/* =========================================
            KHU VỰC DÀNH CHO NHÂN VIÊN VÀ QUẢN LÝ (Chặn Role 6) 
            ========================================= */}
        <Route path="/dashboard" element={
          <StaffProtectedRoute><Dashboard /></StaffProtectedRoute>
        } />
        
        {/* Đã bọc bảo vệ chống khách hàng xem trộm */}
        <Route path="/admin/tour-requests" element={
          <StaffProtectedRoute><StaffTourRequestManager /></StaffProtectedRoute>
        } />

        {/* Khai báo thêm trang thiết kế tour cố định mà chúng ta vừa làm */}
        <Route path="/admin/fixed-tours" element={
          <StaffProtectedRoute><StaffFixedTourDesigner /></StaffProtectedRoute>
        } />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
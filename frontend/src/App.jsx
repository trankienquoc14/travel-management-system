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

// ✅ SỬA 1: Hàm bảo vệ Route kiểm tra đồng bộ cả 'user' lẫn 'token'
const ProtectedRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  // Nếu thiếu 1 trong 2 thì bắt đăng nhập lại
  if (!userStr || !token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// ✅ SỬA 2: Hàm phân luồng hỗ trợ cả 'role_id' chuẩn theo CSDL MySQL
const RootRedirect = () => {
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  if (!userStr || !token) return <Navigate to="/login" replace />;
  
  const user = JSON.parse(userStr);
  const userRole = Number(user.role_id || user.role); // Lấy role_id hoặc role

  return userRole === 6 ? <Navigate to="/home" replace /> : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RootRedirect />} />

        {/* Các trang dành cho Khách hàng */}
        <Route path="/home" element={
          <ProtectedRoute><HomePage /></ProtectedRoute>
        } />

        <Route path="/tour/:id" element={
          <ProtectedRoute><TourDetail /></ProtectedRoute>
        } />

        <Route path="/booking-form" element={
          <ProtectedRoute><BookingForm /></ProtectedRoute>
        } />

        <Route path="/my-bookings" element={
          <ProtectedRoute><MyBookings /></ProtectedRoute>
        } />

        <Route path="/my-quotes" element={
          <ProtectedRoute><CustomerQuotes /></ProtectedRoute>
        } />

        {/* Các trang dành cho Nhân viên/Admin */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        
        <Route path="/build-tour" element={<CustomerTourBuilder />} />
        
        <Route path="/admin/tour-requests" element={<StaffTourRequestManager />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
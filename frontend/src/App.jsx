import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import toàn bộ các trang (Kiểm tra kỹ xem có đủ không nhé)
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import HomePage from './components/HomePage';
import TourDetail from './components/TourDetail';
import MyBookings from './components/MyBookings';
import BookingForm from './components/BookingForm'; // <-- Dòng import bắt buộc cho trang Checkout
import CustomerTourBuilder from './components/CustomerTourBuilder';
import StaffTourRequestManager from './components/StaffTourRequestManager';
import CustomerQuotes from './components/CustomerQuotes';

// Hàm bảo vệ Route: Chưa đăng nhập thì đuổi về trang Login
const ProtectedRoute = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;
  return children;
};

// Hàm phân luồng khi vừa vào web
const RootRedirect = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;
  const user = JSON.parse(userStr);
  return user.role === 6 ? <Navigate to="/home" replace /> : <Navigate to="/dashboard" replace />;
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

        {/* Các trang dành cho Nhân viên/Admin */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/build-tour" element={<CustomerTourBuilder />} />
        {/* Đường dẫn dành cho Nhân viên/Admin quản lý Yêu cầu Tour */}
        <Route path="/admin/tour-requests" element={<StaffTourRequestManager />} />
       
        <Route path="/my-quotes" element={
          <ProtectedRoute><CustomerQuotes /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
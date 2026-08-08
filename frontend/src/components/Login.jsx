import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError('');

    if (isRegisterMode) {
      if (password !== confirmPassword) {
        return setError('Mật khẩu nhập lại không khớp!');
      }
      if (!fullName.trim()) {
        return setError('Vui lòng nhập họ và tên!');
      }
    }

    setLoading(true);

    try {
      const endpoint = isRegisterMode ? 'http://localhost:5000/api/auth/register' : 'http://localhost:5000/api/auth/login';
      const payload = isRegisterMode 
        ? { full_name: fullName, email: email, password: password }
        : { email: email, password: password };

      const response = await axios.post(endpoint, payload);

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Chuyển hướng mượt mà
      navigate('/'); 

    } catch (err) {
      if (err.response && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{isRegisterMode ? 'Đăng ký tài khoản' : 'Đăng nhập Hệ thống'}</h2>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isRegisterMode && (
            <div className="input-group">
              <label>Họ và tên</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Ví dụ: Nguyễn Văn A"
              />
            </div>
          )}

          <div className="input-group">
            <label>Email đăng nhập</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Ví dụ: admin@example.com"
            />
          </div>

          <div className="input-group">
            <label>Mật khẩu</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu"
            />
          </div>

          {isRegisterMode && (
            <div className="input-group">
              <label>Nhập lại mật khẩu</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Nhập lại mật khẩu"
              />
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : (isRegisterMode ? 'Đăng ký' : 'Đăng nhập')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
          {isRegisterMode ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'} 
          <span 
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError('');
            }}
            style={{ color: '#0194f3', fontWeight: '600', cursor: 'pointer', marginLeft: '5px' }}
          >
            {isRegisterMode ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
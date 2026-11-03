import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const Login = () => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordHovered, setIsPasswordHovered] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // Regex chuẩn kiểm tra định dạng email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError('');

    // 1. Kiểm tra bỏ trống các trường bắt buộc (*)
    if (isRegisterMode) {
      if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
        return setError('Vui lòng nhập đầy đủ các thông tin bắt buộc');
      }
    } else {
      if (!email.trim() || !password) {
        return setError('Vui lòng nhập đầy đủ các thông tin bắt buộc');
      }
    }

    // 2. Kiểm tra định dạng Email
    if (!emailRegex.test(email.trim())) {
      return setError('Email nhập phải đúng định dạng');
    }

    // 3. Mật khẩu phải từ 6 ký tự trở lên
    if (password.length < 6) {
      return setError('Mật khẩu phải từ 6 ký tự trở lên');
    }

    // 4. Nếu ở chế độ Đăng ký: kiểm tra xác nhận mật khẩu
    if (isRegisterMode && password !== confirmPassword) {
      return setError('Mật khẩu nhập lại không khớp!');
    }

    setLoading(true);

    try {
      const endpoint = isRegisterMode 
        ? 'http://localhost:5000/api/auth/register' 
        : 'http://localhost:5000/api/auth/login';
      const payload = isRegisterMode 
        ? { full_name: fullName.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const response = await axios.post(endpoint, payload);

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Chuyển hướng mượt mà
      const userRole = Number(user.role_id || user.role);
      if (userRole !== 6) {
        navigate('/dashboard');
      } else {
        navigate('/home');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{isRegisterMode ? 'Đăng ký tài khoản' : 'Đăng nhập Hệ thống'}</h2>
        
        {error && (
          <div className="error-message" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {isRegisterMode && (
            <div className="input-group">
              <label>
                Họ và tên <span style={{ color: '#ef4444', fontWeight: 'bold' }}>(*)</span>
              </label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ví dụ: Nguyễn Văn A"
              />
            </div>
          )}

          <div className="input-group">
            <label>
              Email đăng nhập <span style={{ color: '#ef4444', fontWeight: 'bold' }}>(*)</span>
            </label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              placeholder="Ví dụ: admin@example.com"
            />
          </div>

          <div className="input-group">
            <label>
              Mật khẩu <span style={{ color: '#ef4444', fontWeight: 'bold' }}>(*)</span>
            </label>
            <div 
              style={{ position: 'relative' }}
              onMouseEnter={() => setIsPasswordHovered(true)}
              onMouseLeave={() => setIsPasswordHovered(false)}
            >
              {password.length > 0 && password.length < 6 && isPasswordHovered && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 6px)',
                    left: '0',
                    background: '#fffbeb',
                    color: '#b45309',
                    border: '1px solid #fcd34d',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    zIndex: 20,
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <AlertCircle size={14} color="#d97706" style={{ flexShrink: 0 }} />
                  <span>Mật khẩu từ 6 ký tự trở lên</span>
                </div>
              )}
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Nhập mật khẩu"
                title={password.length > 0 && password.length < 6 ? 'Mật khẩu từ 6 ký tự trở lên' : undefined}
                style={{ 
                  paddingRight: '42px',
                  borderColor: password.length > 0 && password.length < 6 ? '#f59e0b' : undefined
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isRegisterMode && (
            <div className="input-group">
              <label>
                Nhập lại mật khẩu <span style={{ color: '#ef4444', fontWeight: 'bold' }}>(*)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Nhập lại mật khẩu"
                  style={{ paddingRight: '42px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
            onClick={toggleMode}
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

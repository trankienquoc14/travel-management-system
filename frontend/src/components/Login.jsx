import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Compass,
  Mail,
  Lock,
  User,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CalendarCheck
} from 'lucide-react';

const Login = ({ defaultRegister = false }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isRegisterMode, setIsRegisterMode] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('mode') === 'register' || location.pathname === '/register' || defaultRegister;
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setIsRegisterMode(params.get('mode') === 'register' || location.pathname === '/register' || defaultRegister);
    setError('');
    setSuccessMsg('');
  }, [location.search, location.pathname, defaultRegister]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPasswordHovered, setIsPasswordHovered] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Regex chuẩn kiểm tra định dạng email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Kiểm tra các trường khi Đăng ký
    if (isRegisterMode) {
      if (!fullName || !fullName.trim()) {
        return setError('Vui lòng nhập họ và tên');
      }
      if (!email || !email.trim()) {
        return setError('Vui lòng nhập email đăng ký');
      }
      if (!emailRegex.test(email.trim())) {
        return setError('Email nhập phải đúng định dạng');
      }
      if (!password) {
        return setError('Vui lòng nhập mật khẩu');
      }
      if (password.length < 6) {
        return setError('Mật khẩu phải từ 6 ký tự trở lên');
      }
      if (!confirmPassword || password !== confirmPassword) {
        return setError('Mật khẩu nhập lại không khớp!');
      }
    } else {
      // 5.1. Bỏ trống trường bắt buộc: Email đăng nhập
      if (!email || !email.trim()) {
        return setError('Vui lòng nhập email đăng nhập');
      }
      // Kiểm tra định dạng Email
      if (!emailRegex.test(email.trim())) {
        return setError('Email nhập phải đúng định dạng');
      }
      // 5.2. Bỏ trống trường bắt buộc: Mật khẩu
      if (!password) {
        return setError('Vui lòng nhập mật khẩu');
      }
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

      if (isRegisterMode) {
        // 8. Hệ thống hiển thị thông báo "Đăng ký tài khoản thành công!" và tự động đăng nhập vào hệ thống điều hướng về trang chủ
        setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển hướng...');
        setTimeout(() => {
          navigate('/home');
        }, 1200);
      } else {
        // Chuyển hướng mượt mà theo vai trò hoặc theo URL redirect nếu truy cập từ link email
        const redirectParam = new URLSearchParams(window.location.search).get('redirect');
        const userRole = Number(user.role_id || user.role);
        if (redirectParam && redirectParam.startsWith('/')) {
          navigate(redirectParam);
        } else if (userRole !== 6) {
          navigate('/dashboard');
        } else {
          navigate('/home');
        }
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        const serverMsg = err.response.data.message;
        if (!isRegisterMode) {
          // 5.3, 5.4, 5.5: Hiển thị thông báo "Đăng nhập thất bại" kèm theo thông báo lỗi từ server
          if (serverMsg.toLowerCase().includes('đã tồn tại')) {
            setError('Đăng nhập thất bại! Tài khoản đã tồn tại');
          } else {
            setError(`Đăng nhập thất bại: ${serverMsg}`);
          }
        } else {
          // 5.7 & 7.1: Xử lý lỗi đăng ký từ server
          if (err.response.status === 500) {
            setError('Không thể xử lý yêu cầu đăng ký do lỗi server');
          } else {
            setError(serverMsg);
          }
        }
      } else {
        // Luồng ngoại lệ (exception flow)
        if (isRegisterMode) {
          setError('Không thể xử lý yêu cầu đăng ký do lỗi server');
        } else {
          setError('Đăng nhập thất bại! Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (targetRegister) => {
    const next = typeof targetRegister === 'boolean' ? targetRegister : !isRegisterMode;
    setIsRegisterMode(next);
    setError('');
    setSuccessMsg('');
    if (next) {
      navigate('/register', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="tt-auth-wrapper">
      {/* LEFT VISUAL SHOWCASE */}
      <div className="tt-auth-visual">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/home" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#ffffff' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: '#168BEB', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(22, 139, 235, 0.4)'
            }}>
              <Compass size={22} color="#ffffff" />
            </div>
            <span style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.4px' }}>
              TravelVN <span style={{ color: '#FF9852' }}>ERP</span>
            </span>
          </Link>
        </div>

        <div style={{ maxWidth: '480px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255, 255, 255, 0.16)', backdropFilter: 'blur(8px)',
            padding: '6px 14px', borderRadius: '999px', fontSize: '12.5px', fontWeight: '700',
            marginBottom: '18px', border: '1px solid rgba(255,255,255,0.25)'
          }}>
            <Sparkles size={14} color="#FF9852" /> Modern TravelTech Platform
          </span>
          <h1 style={{ fontSize: '36px', fontWeight: '900', lineHeight: '1.22', margin: '0 0 16px 0', color: '#ffffff' }}>
            Khám Phá Việt Nam Theo Cách Thông Minh Hơn
          </h1>
          <p style={{ fontSize: '15.5px', color: '#E2E8F0', lineHeight: '1.65', margin: '0 0 28px 0' }}>
            Quản lý đặt tour trực tuyến, theo dõi vé điện tử QR, tự thiết kế hành trình riêng và nhận thông báo cập nhật theo thời gian thực.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: <ShieldCheck size={18} color="#FF9852" />, text: 'Thanh toán an toàn, minh bạch chi phí từng hành khách' },
              { icon: <CalendarCheck size={18} color="#38BDF8" />, text: 'Lịch khởi hành & số chỗ cập nhật theo thời gian thực' },
              { icon: <Sparkles size={18} color="#FF9852" />, text: 'Tự thiết kế tour cá nhân hóa và nhận báo giá nhanh chóng' }
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#F0F4F8', fontWeight: '600' }}>
                {item.icon}
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: '13px', color: '#CBD5E1' }}>
          © {new Date().getFullYear()} TravelVN ERP — Hệ thống Lữ hành & Quản trị Tour
        </div>
      </div>

      {/* RIGHT FORM SIDE */}
      <div className="tt-auth-form-side">
        <div className="tt-auth-card">
          <div style={{ marginBottom: '20px' }}>
            <Link
              to="/home"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '13px', fontWeight: '700', color: '#486581', textDecoration: 'none'
              }}
            >
              <ArrowLeft size={14} /> Về trang chủ
            </Link>
          </div>

          {/* MODE SWITCHER */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px',
            background: '#F3F8FE', padding: '5px', borderRadius: '12px', marginBottom: '24px',
            border: '1px solid #D9E2EC'
          }}>
            <button
              type="button"
              onClick={() => toggleMode(false)}
              style={{
                padding: '9px 12px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                fontWeight: '700', fontSize: '13.5px', transition: 'all 0.2s',
                background: !isRegisterMode ? '#168BEB' : 'transparent',
                color: !isRegisterMode ? '#ffffff' : '#486581'
              }}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => toggleMode(true)}
              style={{
                padding: '9px 12px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                fontWeight: '700', fontSize: '13.5px', transition: 'all 0.2s',
                background: isRegisterMode ? '#168BEB' : 'transparent',
                color: isRegisterMode ? '#ffffff' : '#486581'
              }}
            >
              Đăng ký
            </button>
          </div>

          <h2 style={{ fontSize: '23px', fontWeight: '900', color: '#102A43', margin: '0 0 6px 0' }}>
            {isRegisterMode ? 'Tạo tài khoản thành viên' : 'Chào mừng trở lại'}
          </h2>
          <p style={{ fontSize: '13.5px', color: '#486581', margin: '0 0 22px 0' }}>
            {isRegisterMode
              ? 'Đăng ký để đặt tour nhanh chóng và tự thiết kế lịch trình riêng.'
              : 'Đăng nhập bằng tài khoản TravelVN ERP của bạn để tiếp tục.'}
          </p>

          {successMsg && (
            <div style={{
              marginBottom: '18px',
              backgroundColor: '#ecfdf5',
              border: '1px solid #6ee7b7',
              color: '#047857',
              padding: '12px 16px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              fontWeight: '700',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.12)'
            }}>
              <CheckCircle size={20} color="#059669" style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="tt-alert tt-alert-error" style={{ marginBottom: '18px' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isRegisterMode && (
              <div>
                <label className="tt-input-label">
                  Họ và tên <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#829AB1" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="tt-input"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="tt-input-label">
                Email đăng nhập <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#829AB1" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="tt-input"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Ví dụ: khachhang@example.com"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <div>
              <label className="tt-input-label">
                Mật khẩu <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setIsPasswordHovered(true)}
                onMouseLeave={() => setIsPasswordHovered(false)}
              >
                {isRegisterMode && password.length > 0 && password.length < 6 && isPasswordHovered && (
                  <div
                    className="tt-alert tt-alert-warning"
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 6px)',
                      left: '0',
                      padding: '6px 10px',
                      fontSize: '12px',
                      zIndex: 20,
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(16, 42, 67, 0.12)'
                    }}
                  >
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>Mật khẩu từ 6 ký tự trở lên</span>
                  </div>
                )}
                <Lock size={16} color="#829AB1" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="tt-input"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder={isRegisterMode ? "Nhập mật khẩu (tối thiểu 6 ký tự)" : "Nhập mật khẩu"}
                  title={isRegisterMode && password.length > 0 && password.length < 6 ? 'Mật khẩu từ 6 ký tự trở lên' : undefined}
                  style={{
                    paddingLeft: '38px',
                    paddingRight: '42px',
                    borderColor: isRegisterMode && password.length > 0 && password.length < 6 ? '#F59E0B' : undefined
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
                    color: '#829AB1',
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
              <div>
                <label className="tt-input-label">
                  Nhập lại mật khẩu <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="#829AB1" style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="tt-input"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Nhập lại mật khẩu"
                    style={{ paddingLeft: '38px', paddingRight: '42px' }}
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
                      color: '#829AB1',
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
              className="tt-btn tt-btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '13px 20px', fontSize: '15px', borderRadius: '12px', marginTop: '6px' }}
            >
              {loading ? 'Đang xử lý...' : (isRegisterMode ? 'Đăng ký tài khoản' : 'Đăng nhập')}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13.5px', color: '#486581' }}>
            {isRegisterMode ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
            <span
              onClick={() => toggleMode(!isRegisterMode)}
              style={{ color: '#168BEB', fontWeight: '700', cursor: 'pointer', marginLeft: '6px' }}
            >
              {isRegisterMode ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

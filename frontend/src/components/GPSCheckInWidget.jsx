import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  detectFaceInCanvas, 
  extractFaceDescriptor, 
  compareFaceDescriptors, 
  loadFaceDescriptorFromImage 
} from '../utils/faceIdEngine';

const GPSCheckInWidget = ({ compact = false, onCheckInSuccess }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });
  const [showModal, setShowModal] = useState(false);

  // States cho tính năng FaceID Biometrics (Sinh trắc học nhận diện khuôn mặt)
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [faceProfile, setFaceProfile] = useState(null); // { avatar, full_name, email, has_face_profile }
  const [profileDescriptor, setProfileDescriptor] = useState(null); // Descriptor khuôn mặt gốc
  const [faceSnapshot, setFaceSnapshot] = useState(null); // Ảnh chụp từ camera
  const [faceVerified, setFaceVerified] = useState(false); // Đã xác thực đúng mặt chính chủ chưa
  const [confidenceScore, setConfidenceScore] = useState(0); // Tỷ lệ phần trăm khớp
  const [scanStatus, setScanStatus] = useState({
    status: 'IDLE', // 'IDLE' | 'SCANNING' | 'DETECTED' | 'MATCHED' | 'MISMATCHED' | 'NO_FACE' | 'NO_PROFILE'
    message: 'Bật camera để nhận diện FaceID',
    box: null,
    metrics: null
  });

  // Modal Đăng ký khuôn mặt mẫu FaceID
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const regVideoRef = useRef(null);
  const regStreamRef = useRef(null);

  // Cập nhật đồng hồ thời gian thực
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Nạp trạng thái chấm công, hồ sơ FaceID và vị trí GPS
  useEffect(() => {
    fetchMyStatus();
    fetchMyFaceProfile();
    getGPSLocation();
  }, []);

  // Gắn stream vào video element khi cameraActive thay đổi
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => console.warn("Lỗi phát video camera:", err));
      startLiveScanningLoop();
    } else {
      stopLiveScanningLoop();
    }
  }, [cameraActive]);

  // Giải phóng camera khi unmount
  useEffect(() => {
    return () => {
      stopCamera();
      stopLiveScanningLoop();
      stopRegCamera();
    };
  }, []);

  // Tải trạng thái chấm công cá nhân hôm nay
  const fetchMyStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/hr/attendance/my-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.data) {
        setAttendanceStatus(res.data.data);
        if (res.data.data.face_image_url) {
          const imgUrl = res.data.data.face_image_url.startsWith('http') 
            ? res.data.data.face_image_url 
            : `http://localhost:5000${res.data.data.face_image_url}`;
          setFaceSnapshot(imgUrl);
        }
      }
    } catch (err) {
      console.error('Lỗi tải trạng thái chấm công cá nhân:', err);
    }
  };

  // Tải hồ sơ khuôn mặt FaceID mẫu của nhân viên
  const fetchMyFaceProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/hr/attendance/face-profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.data) {
        const data = res.data.data;
        setFaceProfile(data);
        if (data.avatar) {
          const avatarFullUrl = data.avatar.startsWith('http') 
            ? data.avatar 
            : `http://localhost:5000${data.avatar}`;
          const descriptor = await loadFaceDescriptorFromImage(avatarFullUrl);
          if (descriptor) {
            setProfileDescriptor(descriptor);
          }
        }
      }
    } catch (err) {
      console.warn('Lỗi tải hồ sơ FaceID mẫu:', err);
    }
  };

  // QUÉT VỊ TRÍ GPS REALTIME
  const getGPSLocation = () => {
    setGpsLoading(true);
    setGpsError('');

    if (!navigator.geolocation) {
      setGpsError('Trình duyệt không hỗ trợ Geolocation!');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const coordsData = { lat: latitude, lng: longitude, accuracy: Math.round(accuracy) };
        setLocation(coordsData);

        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=vi`);
          const geoData = await geoRes.json();
          if (geoData && geoData.display_name) {
            setAddress(geoData.display_name);
          } else {
            setAddress(`Tọa độ: ${latitude.toFixed(5)}°N, ${longitude.toFixed(5)}°E`);
          }
        } catch (e) {
          setAddress(`Tọa độ GPS: ${latitude.toFixed(5)}°N, ${longitude.toFixed(5)}°E (±${Math.round(accuracy)}m)`);
        } finally {
          setGpsLoading(false);
        }
      },
      (error) => {
        let msg = 'Không thể lấy vị trí GPS.';
        if (error.code === error.PERMISSION_DENIED) msg = 'Vui lòng cho phép quyền truy cập Vị trí (GPS) trên trình duyệt!';
        setGpsError(msg);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // BẬT CAMERA WEBCAM
  const startCamera = async () => {
    setCameraError('');
    setAlertMsg({ type: '', text: '' });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      setCameraActive(true);
      setScanStatus({
        status: 'SCANNING',
        message: '👁️ Đang quét khuôn mặt trước camera...',
        box: null,
        metrics: null
      });
    } catch (err) {
      console.error("Lỗi bật camera:", err);
      setCameraError('Không thể truy cập Camera. Vui lòng kiểm tra webcam hoặc cấp quyền camera!');
    }
  };

  // TẮT CAMERA
  const stopCamera = () => {
    stopLiveScanningLoop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // VÒNG LẶP QUÉT VÀ ĐỐI SOÁT FACEID LIÊN TỤC KHI CAMERA HOẠT ĐỘNG
  const startLiveScanningLoop = () => {
    stopLiveScanningLoop();
    // Chạy kiểm tra mỗi 450ms để bắt chuẩn cử chỉ và vị trí mặt người
    scanIntervalRef.current = setInterval(() => {
      runFaceVerificationStep();
    }, 450);
  };

  const stopLiveScanningLoop = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  // BƯỚC ĐỐI SOÁT SINH TRẮC HỌC TỪNG KHUNG HÌNH (FACEID SCAN STEP)
  const runFaceVerificationStep = () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    if (w === 0 || h === 0) return;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Lật ngang video để giống gương
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();

    // 1. Phát hiện khuôn mặt trong khung hình
    const detection = detectFaceInCanvas(canvas);

    if (!detection.detected) {
      setFaceVerified(false);
      setScanStatus({
        status: 'NO_FACE',
        message: detection.message || '⚠️ Không phát hiện khuôn mặt trước camera',
        box: null,
        metrics: null
      });
      return;
    }

    // 2. Kiểm tra hồ sơ nhân viên đã có khuôn mặt mẫu (FaceID profile) chưa
    if (!profileDescriptor) {
      setFaceVerified(false);
      setScanStatus({
        status: 'NO_PROFILE',
        message: '⚠️ Chưa có khuôn mặt mẫu trong hồ sơ. Vui lòng bấm [Đăng ký FaceID]!',
        box: detection.box,
        metrics: null
      });
      return;
    }

    // 3. Trích xuất đặc trưng sinh trắc học từ khuôn mặt camera trực tiếp
    const liveDescriptor = extractFaceDescriptor(canvas, detection.box);

    // 4. Đối soát sinh trắc học với ảnh khuôn mặt gốc đã đăng ký
    const matchResult = compareFaceDescriptors(liveDescriptor, profileDescriptor);
    setConfidenceScore(matchResult.confidence);

    const liveDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    if (matchResult.matched) {
      // ✅ ĐÚNG KHUÔN MẶT CHÍNH CHỦ
      setFaceVerified(true);
      setFaceSnapshot(liveDataUrl);
      setScanStatus({
        status: 'MATCHED',
        message: `✅ KHUÔN MẶT CHÍNH CHỦ: Đã khớp ${matchResult.confidence}% (Đạt chuẩn)`,
        box: detection.box,
        metrics: matchResult.metrics,
        confidence: matchResult.confidence
      });
    } else {
      // ❌ SAI KHUÔN MẶT / NGƯỜI KHÁC QUÉT
      setFaceVerified(false);
      setScanStatus({
        status: 'MISMATCHED',
        message: `❌ KHUÔN MẶT KHÔNG KHỚP: Chỉ đạt ${matchResult.confidence}% (Yêu cầu >= 70%)`,
        box: detection.box,
        metrics: matchResult.metrics,
        confidence: matchResult.confidence
      });
    }
  };

  // CHỤP SNAPSHOT VÀ BUỘC KIỂM TRA THỦ CÔNG
  const handleManualScan = () => {
    runFaceVerificationStep();
  };

  // THỰC HIỆN ĐIỂM DANH GPS + FACEID CHÍNH CHỦ
  const handleGPSCheckIn = async () => {
    setAlertMsg({ type: '', text: '' });

    // Bắt buộc camera phải bật
    if (!cameraActive) {
      setAlertMsg({
        type: 'error',
        text: '⚠️ Vui lòng bấm [Bật Camera FaceID] và quét khuôn mặt trước khi bấm điểm danh!'
      });
      startCamera();
      return;
    }

    // Thực hiện quét ngay lập tức
    runFaceVerificationStep();

    // 🔒 KIỂM TRA BẢO MẬT NGHIÊM NGẶT: ĐÚNG MẶT MỚI GHI NHẬN
    if (!profileDescriptor) {
      setAlertMsg({
        type: 'error',
        text: '⚠️ Bạn chưa đăng ký khuôn mặt FaceID mẫu vào hồ sơ. Vui lòng bấm nút [Đăng ký FaceID] bên dưới trước!'
      });
      return;
    }

    if (!faceVerified || confidenceScore < 70.0) {
      setAlertMsg({
        type: 'error',
        text: `❌ KHUÔN MẶT KHÔNG TRÙNG KHỚP! Độ khớp chỉ đạt ${confidenceScore.toFixed(1)}% (yêu cầu tối thiểu 70.0%). Hệ thống từ chối ghi nhận chấm công cho người này!`
      });
      return;
    }

    if (!faceSnapshot) {
      setAlertMsg({
        type: 'error',
        text: '⚠️ Chưa thể chụp được ảnh khuôn mặt rõ nét. Vui lòng đứng trước ánh sáng và thử lại!'
      });
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        latitude: location ? location.lat : null,
        longitude: location ? location.lng : null,
        location_address: address || (location ? `Lat: ${location.lat}, Lng: ${location.lng}` : 'Vị trí GPS thời gian thực'),
        device_info: `Live FaceID Biometrics (${confidenceScore.toFixed(1)}%) • ${navigator.userAgent.slice(0, 40)}`,
        face_image: faceSnapshot,
        face_verified: true,
        match_confidence: confidenceScore,
        notes: location ? `Xác thực FaceID thành công (${confidenceScore.toFixed(1)}%) + GPS ±${location.accuracy}m` : `Xác thực FaceID thành công (${confidenceScore.toFixed(1)}%)`
      };

      const res = await axios.post('http://localhost:5000/api/hr/attendance/gps-checkin', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setAlertMsg({ type: 'success', text: res.data.message });
        stopCamera();
        fetchMyStatus();
        if (onCheckInSuccess) onCheckInSuccess();
      } else {
        setAlertMsg({ type: 'error', text: res.data.message || 'Điểm danh thất bại!' });
      }
    } catch (err) {
      console.error('Lỗi khi gửi điểm danh GPS & FaceID:', err);
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi chấm công!';
      setAlertMsg({ type: 'error', text: errMsg });
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // XỬ LÝ ĐĂNG KÝ KHUÔN MẶT MẪU FACEID VÀO HỒ SƠ
  // ==========================================
  const startRegCamera = async () => {
    setRegError('');
    setRegSuccess('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      regStreamRef.current = stream;
      if (regVideoRef.current) {
        regVideoRef.current.srcObject = stream;
        regVideoRef.current.play().catch(e => console.warn(e));
      }
    } catch (err) {
      console.error("Lỗi bật camera đăng ký:", err);
      setRegError('Không thể mở camera để đăng ký FaceID!');
    }
  };

  const stopRegCamera = () => {
    if (regStreamRef.current) {
      regStreamRef.current.getTracks().forEach(t => t.stop());
      regStreamRef.current = null;
    }
  };

  const captureAndSaveFaceProfile = async () => {
    if (!regVideoRef.current) return;
    setRegLoading(true);
    setRegError('');
    setRegSuccess('');

    try {
      const video = regVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Kiểm tra có khuôn mặt người rõ ràng trước khi đăng ký
      const detection = detectFaceInCanvas(canvas);
      if (!detection.detected) {
        setRegError('⚠️ ' + (detection.message || 'Không phát hiện khuôn mặt rõ ràng để lưu hồ sơ!'));
        setRegLoading(false);
        return;
      }

      const photoData = canvas.toDataURL('image/jpeg', 0.9);
      const token = localStorage.getItem('token');

      const res = await axios.post('http://localhost:5000/api/hr/attendance/face-profile', {
        face_image: photoData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setRegSuccess('🎉 Đăng ký khuôn mặt mẫu FaceID thành công!');
        stopRegCamera();
        // Cập nhật lại hồ sơ FaceID ngay lập tức
        await fetchMyFaceProfile();
        setTimeout(() => {
          setShowRegisterModal(false);
          setRegSuccess('');
        }, 1200);
      } else {
        setRegError(res.data.message || 'Lỗi khi lưu khuôn mặt mẫu!');
      }
    } catch (err) {
      console.error('Lỗi đăng ký khuôn mặt:', err);
      setRegError(err.response?.data?.message || 'Có lỗi khi lưu khuôn mặt FaceID!');
    } finally {
      setRegLoading(false);
    }
  };

  const isCheckedIn = attendanceStatus && attendanceStatus.check_in;
  const isCheckedOut = attendanceStatus && attendanceStatus.check_out;

  // ==========================================
  // COMPACT BUTTON CHO HEADER NAVBAR
  // ==========================================
  if (compact) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '24px',
            background: isCheckedOut 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : isCheckedIn 
                ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' 
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#ffffff',
            border: 'none',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease'
          }}
          title="Chấm công FaceID & GPS"
        >
          <span>👁️‍🗨️</span>
          <span>
            {isCheckedOut 
              ? '✅ Đã Check-out' 
              : isCheckedIn 
                ? '🏁 Check-out FaceID' 
                : '🚀 Chấm Công FaceID'}
          </span>
        </button>

        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', width: '540px', maxWidth: '94%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
              <button 
                onClick={() => { stopCamera(); setShowModal(false); }}
                style={{ position: 'absolute', top: '16px', right: '16px', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold', color: '#64748b' }}
              >
                ✕
              </button>
              
              <GPSCheckInWidget 
                compact={false} 
                onCheckInSuccess={() => {
                  fetchMyStatus();
                  if (onCheckInSuccess) onCheckInSuccess();
                }} 
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // FULL CARD WIDGET TẠI TRANG CHẤM CÔNG CÁ NHÂN
  // ==========================================
  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '20px',
      border: '1px solid #e2e8f0',
      padding: '24px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Canvas ẩn dùng để xử lý trích xuất đặc trưng hình ảnh */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* HEADER CARD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            🛡️ SINH TRẮC HỌC FACE ID & ĐỊNH VỊ GPS REALTIME
          </div>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👤👁️‍🗨️</span> Chấm Công Quét Mặt FaceID
          </h3>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', fontFamily: 'monospace' }}>
            {currentTime.toLocaleTimeString('vi-VN')}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
            {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* THÔNG BÁO ALERT */}
      {alertMsg.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: '16px',
          fontSize: '13px',
          fontWeight: '700',
          backgroundColor: alertMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: alertMsg.type === 'success' ? '#15803d' : '#b91c1c',
          border: `1px solid ${alertMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{alertMsg.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* BANNER TRẠNG THÁI HỒ SƠ FACE ID MẪU CỦA NHÂN VIÊN */}
      <div style={{
        background: profileDescriptor ? '#f0fdf4' : '#fffbeb',
        border: `1px solid ${profileDescriptor ? '#bbf7d0' : '#fef3c7'}`,
        borderRadius: '12px',
        padding: '10px 14px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {faceProfile?.avatar ? (
            <img 
              src={faceProfile.avatar.startsWith('http') ? faceProfile.avatar : `http://localhost:5000${faceProfile.avatar}`} 
              alt="Hồ sơ gốc" 
              style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #10b981' }} 
            />
          ) : (
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>!</div>
          )}
          <div>
            <div style={{ fontWeight: '700', color: profileDescriptor ? '#166534' : '#92400e' }}>
              {profileDescriptor ? '✅ Đã kích hoạt hồ sơ FaceID' : '⚠️ Chưa đăng ký khuôn mặt mẫu'}
            </div>
            <div style={{ color: '#64748b', fontSize: '11px' }}>
              {profileDescriptor ? 'Hệ thống sẽ đối soát khuôn mặt camera trực tiếp với ảnh gốc' : 'Cần chụp khuôn mặt chính chủ để hệ thống đối soát'}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setShowRegisterModal(true);
            setTimeout(() => startRegCamera(), 200);
          }}
          style={{
            background: profileDescriptor ? '#ffffff' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: profileDescriptor ? '#0f766e' : '#ffffff',
            border: profileDescriptor ? '1px solid #cbd5e1' : 'none',
            borderRadius: '8px',
            padding: '6px 12px',
            fontWeight: '700',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          {profileDescriptor ? '🔄 Đổi ảnh mẫu' : '📸 Đăng ký FaceID'}
        </button>
      </div>

      {/* KHUNG CAMERA QUÉT FACEID REALTIME (LIVE FACE SCANNER BOX) */}
      <div style={{
        background: '#090d16',
        borderRadius: '18px',
        padding: '16px',
        marginBottom: '18px',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
        overflow: 'hidden'
      }}>
        {/* TIÊU ĐỀ KHUNG SCAN */}
        <div style={{ color: '#38bdf8', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <span>👁️‍🗨️</span> MÁY QUÉT SINH TRẮC HỌC KHUÔN MẶT
        </div>

        {cameraActive ? (
          <div style={{
            position: 'relative',
            width: '240px',
            height: '240px',
            margin: '0 auto',
            borderRadius: '50%',
            overflow: 'hidden',
            border: faceVerified 
              ? '4px solid #10b981' 
              : scanStatus.status === 'MISMATCHED' 
                ? '4px solid #ef4444' 
                : '4px solid #38bdf8',
            boxShadow: faceVerified 
              ? '0 0 30px rgba(16, 185, 129, 0.6)' 
              : scanStatus.status === 'MISMATCHED' 
                ? '0 0 30px rgba(239, 68, 68, 0.6)' 
                : '0 0 25px rgba(56, 189, 248, 0.4)',
            transition: 'border 0.3s ease, box-shadow 0.3s ease'
          }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
            />

            {/* VÙNG KHUNG ELIP VÀ TIA LASER QUÉT SINH TRẮC HỌC */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '160px',
              height: '180px',
              border: faceVerified ? '2px solid #10b981' : scanStatus.status === 'MISMATCHED' ? '2px dashed #ef4444' : '2px dashed #38bdf8',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />

            {/* TIA LASER QUÉT */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: faceVerified 
                ? 'linear-gradient(90deg, transparent, #10b981, transparent)' 
                : 'linear-gradient(90deg, transparent, #38bdf8, transparent)',
              boxShadow: '0 0 10px #38bdf8',
              animation: 'scanLine 2s linear infinite'
            }} />

            {/* BADGE TRẠNG THÁI HIỂN THỊ TRỰC TIẾP TRÊN VIDEO */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: faceVerified 
                ? 'rgba(16, 185, 129, 0.95)' 
                : scanStatus.status === 'MISMATCHED' 
                  ? 'rgba(239, 68, 68, 0.95)' 
                  : 'rgba(15, 23, 42, 0.85)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '800',
              padding: '6px 4px',
              letterSpacing: '0.3px'
            }}>
              {faceVerified 
                ? `🎯 ĐÃ KHỚP: ${confidenceScore.toFixed(1)}%` 
                : scanStatus.status === 'MISMATCHED' 
                  ? `❌ KHÔNG KHỚP: ${confidenceScore.toFixed(1)}%` 
                  : scanStatus.status === 'NO_PROFILE'
                    ? '⚠️ CHƯA ĐĂNG KÝ FACEID'
                    : '🔍 ĐANG QUÉT MẶT...'}
            </div>
          </div>
        ) : faceSnapshot ? (
          <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto', borderRadius: '50%', overflow: 'hidden', border: '4px solid #10b981', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}>
            <img src={faceSnapshot} alt="Face Snapshot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#10b981', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '4px 0' }}>
              ✅ ĐÃ CHỤP ẢNH XÁC THỰC
            </div>
          </div>
        ) : (
          <div style={{ padding: '24px 10px', color: '#94a3b8' }}>
            <div style={{ fontSize: '44px', marginBottom: '10px' }}>👁️‍🗨️</div>
            <div style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: '600' }}>Bật camera để nhận diện sinh trắc học FaceID</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Hệ thống chỉ ghi nhận khi nhận diện đúng khuôn mặt chính chủ</div>
          </div>
        )}

        {/* THÔNG ĐIỆP HƯỚNG DẪN KẾT QUẢ QUÉT */}
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '700',
          background: faceVerified 
            ? 'rgba(16, 185, 129, 0.15)' 
            : scanStatus.status === 'MISMATCHED' 
              ? 'rgba(239, 68, 68, 0.15)' 
              : 'rgba(255, 255, 255, 0.05)',
          color: faceVerified ? '#34d399' : scanStatus.status === 'MISMATCHED' ? '#f87171' : '#94a3b8'
        }}>
          {scanStatus.message}
        </div>

        {/* NÚT ĐIỀU KHIỂN CAMERA */}
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {!cameraActive ? (
            <button
              onClick={startCamera}
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '24px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
              }}
            >
              <span>📷</span>
              <span>Bật Camera Quét FaceID</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleManualScan}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: '24px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🎯</span>
                <span>Quét & Đối Soát Ngay</span>
              </button>
              <button
                onClick={stopCamera}
                style={{
                  background: '#334155',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: '24px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                ⏹️ Tắt Camera
              </button>
            </>
          )}
        </div>

        {cameraError && (
          <div style={{ color: '#f87171', fontSize: '11px', fontWeight: '600', marginTop: '10px' }}>
            ⚠️ {cameraError}
          </div>
        )}
      </div>

      {/* THÔNG TIN VỊ TRÍ GPS REALTIME */}
      <div style={{
        background: '#f1f5f9',
        borderRadius: '14px',
        padding: '14px 16px',
        marginBottom: '18px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📡</span> Tọa Độ Vị Trí GPS:
          </span>
          <button
            onClick={getGPSLocation}
            disabled={gpsLoading}
            style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {gpsLoading ? '🔄 Đang quét...' : '🔄 Làm mới GPS'}
          </button>
        </div>

        {gpsError ? (
          <div style={{ color: '#dc2626', fontSize: '11px', fontWeight: '600', background: '#fef2f2', padding: '8px', borderRadius: '6px' }}>
            ⚠️ {gpsError}
          </div>
        ) : location ? (
          <div>
            <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: '600', marginBottom: '4px', lineHeight: '1.4' }}>
              🏠 {address || 'Đang cập nhật địa chỉ...'}
            </div>
            <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: '#475569', fontWeight: '600' }}>
              <span>📐 Vĩ độ: <strong>{location.lat.toFixed(5)}°</strong></span>
              <span>📐 Kinh độ: <strong>{location.lng.toFixed(5)}°</strong></span>
              <span>🎯 Sai số: <strong>±{location.accuracy}m</strong></span>
            </div>
          </div>
        ) : (
          <div style={{ color: '#64748b', fontSize: '12px' }}>⏳ Đang bật định vị GPS...</div>
        )}
      </div>

      {/* TRẠNG THÁI CA LÀM VIỆC HÔM NAY */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        padding: '14px',
        marginBottom: '18px',
        border: '1px solid #e2e8f0',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px'
      }}>
        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Giờ Vào Ca (Check-in)</div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: attendanceStatus?.check_in ? '#059669' : '#94a3b8', marginTop: '2px' }}>
            {attendanceStatus?.check_in || 'Chưa ghi nhận'}
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Giờ Ra Ca (Check-out)</div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: attendanceStatus?.check_out ? '#0284c7' : '#94a3b8', marginTop: '2px' }}>
            {attendanceStatus?.check_out || 'Chưa ghi nhận'}
          </div>
        </div>
      </div>

      {/* NÚT THỰC HIỆN CHẤM CÔNG GPS & FACEID */}
      <button
        onClick={handleGPSCheckIn}
        disabled={actionLoading || gpsLoading || isCheckedOut}
        style={{
          width: '100%',
          padding: '14px 20px',
          borderRadius: '14px',
          border: 'none',
          background: isCheckedOut
            ? '#94a3b8'
            : !faceVerified && cameraActive
              ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
              : isCheckedIn
                ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          fontWeight: '800',
          fontSize: '15px',
          cursor: isCheckedOut ? 'not-allowed' : 'pointer',
          boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
          transition: 'all 0.2s ease',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <span>{actionLoading ? '⏳' : isCheckedOut ? '✅' : isCheckedIn ? '🏁' : '🚀'}</span>
        <span>
          {actionLoading 
            ? 'Đang đối soát FaceID & Ghi nhận công...' 
            : isCheckedOut 
              ? 'Hôm nay bạn đã hoàn thành ca làm việc' 
              : !faceVerified && cameraActive
                ? '⚠️ CHỜ QUÉT ĐÚNG KHUÔN MẶT CHÍNH CHỦ...'
                : isCheckedIn 
                  ? '🏁 CHECK-OUT GPS & FACE ID' 
                  : '🚀 CHẤM CÔNG GPS & QUÉT MẶT FACE ID'}
        </span>
      </button>

      {/* ==================================================== */}
      {/* MODAL ĐĂNG KÝ KHUÔN MẶT MẪU FACEID VÀO HỒ SƠ NHÂN VIÊN */}
      {/* ==================================================== */}
      {showRegisterModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '28px',
            width: '480px',
            maxWidth: '92%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            position: 'relative',
            textAlign: 'center'
          }}>
            <button 
              onClick={() => { stopRegCamera(); setShowRegisterModal(false); }}
              style={{ position: 'absolute', top: '16px', right: '16px', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold', color: '#64748b' }}
            >
              ✕
            </button>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span>📸</span> Đăng Ký Khuôn Mặt FaceID
            </h3>
            <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '13px' }}>
              Vui lòng nhìn thẳng vào camera, giữ khuôn mặt ngay ngắn giữa khung tròn để hệ thống lưu trữ sinh trắc học chính chủ.
            </p>

            {regError && (
              <div style={{ padding: '10px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', fontSize: '12px', fontWeight: '700', marginBottom: '14px' }}>
                {regError}
              </div>
            )}

            {regSuccess && (
              <div style={{ padding: '10px', borderRadius: '8px', background: '#f0fdf4', color: '#166534', fontSize: '12px', fontWeight: '700', marginBottom: '14px' }}>
                {regSuccess}
              </div>
            )}

            {/* KHUNG CAMERA ĐĂNG KÝ */}
            <div style={{
              width: '240px',
              height: '240px',
              margin: '0 auto 20px auto',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '4px solid #0284c7',
              boxShadow: '0 0 25px rgba(2, 132, 199, 0.4)',
              position: 'relative',
              background: '#0f172a'
            }}>
              <video 
                ref={regVideoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
              />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '160px',
                height: '190px',
                border: '2px dashed rgba(255,255,255,0.7)',
                borderRadius: '50%',
                pointerEvents: 'none'
              }} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { stopRegCamera(); setShowRegisterModal(false); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#f1f5f9',
                  border: 'none',
                  color: '#475569',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={captureAndSaveFaceProfile}
                disabled={regLoading}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: '800',
                  cursor: regLoading ? 'wait' : 'pointer'
                }}
              >
                {regLoading ? '⏳ Đang phân tích & lưu...' : '📸 Chụp & Lưu Làm FaceID Gốc'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIỆU ỨNG CSS LASER SCANNER */}
      <style>{`
        @keyframes scanLine {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default GPSCheckInWidget;

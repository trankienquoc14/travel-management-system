import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  detectFaceInCanvas, 
  extractFaceDescriptor, 
  compareFaceDescriptors, 
  loadFaceDescriptorFromImage 
} from '../utils/faceIdEngine';
import soundService from '../utils/soundService';

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
  const fileInputRef = useRef(null);

  // Refs hỗ trợ làm mịn điểm số và khóa trạng thái xác thực chống giật lag
  const smoothedScoreRef = useRef(0);
  const verifiedLockUntilRef = useRef(0);
  const bestConfRef = useRef(0);
  const mismatchCountRef = useRef(0);
  const hasAutoTriggeredRef = useRef(false);

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

  // Tải hồ sơ khuôn mặt FaceID mẫu của nhân viên (Hỗ trợ đa nguồn: auth/me, hr/face-profile, localStorage)
  const fetchMyFaceProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      let userData = null;

      // 1. Thử lấy từ /api/auth/me trước (endpoint chuẩn luôn sẵn sàng)
      try {
        const meRes = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (meRes.data && meRes.data.success && meRes.data.data) {
          userData = meRes.data.data;
        }
      } catch (meErr) {
        // Fallback sang hr-service
      }

      // 2. Fallback sang /api/hr/attendance/face-profile
      if (!userData) {
        try {
          const hrRes = await axios.get('http://localhost:5000/api/hr/attendance/face-profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (hrRes.data && hrRes.data.success && hrRes.data.data) {
            userData = hrRes.data.data;
          }
        } catch (hrErr) {
          // Fallback sang localStorage
        }
      }

      // 3. Fallback sang localStorage
      if (!userData) {
        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            userData = {
              avatar: parsed.avatar,
              full_name: parsed.fullName || parsed.full_name,
              email: parsed.email
            };
          } catch (e) {}
        }
      }

      if (userData) {
        setFaceProfile(userData);
        if (userData.avatar) {
          const avatarFullUrl = (userData.avatar.startsWith('http') || userData.avatar.startsWith('data:'))
            ? userData.avatar 
            : `http://localhost:5000${userData.avatar}`;
          const descriptor = await loadFaceDescriptorFromImage(avatarFullUrl);
          if (descriptor) {
            setProfileDescriptor(descriptor);
          }
        }
      }
    } catch (err) {
      console.warn('Lỗi tải hồ sơ FaceID:', err);
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
    hasAutoTriggeredRef.current = false;
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
    smoothedScoreRef.current = 0;
    verifiedLockUntilRef.current = 0;
    bestConfRef.current = 0;
    mismatchCountRef.current = 0;
    hasAutoTriggeredRef.current = false;
  };

  // VÒNG LẶP QUÉT VÀ ĐỐI SOÁT FACEID LIÊN TỤC KHI CAMERA HOẠT ĐỘNG (220ms/lần siêu mượt)
  const startLiveScanningLoop = () => {
    stopLiveScanningLoop();
    scanIntervalRef.current = setInterval(() => {
      runFaceVerificationStep();
    }, 220);
  };

  const stopLiveScanningLoop = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  // BƯỚC ĐỐI SOÁT SINH TRẮC HỌC TỪNG KHUNG HÌNH (FACEID SCAN STEP KÈM BỘ LỌC CHỐNG NHẢY ĐIỂM)
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

    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();

    // 1. Phát hiện khuôn mặt trong khung hình
    const detection = detectFaceInCanvas(canvas);

    if (!detection.detected) {
      // Nếu đã từng xác thực thành công trong 4 giây gần nhất, không đột ngột tắt báo lỗi do chớp mắt/nhấp nháy
      if (Date.now() < verifiedLockUntilRef.current) {
        return;
      }
      setFaceVerified(false);
      smoothedScoreRef.current = 0;
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
        message: '⚠️ Chưa có khuôn mặt mẫu trong hồ sơ. Vui lòng bấm [Đăng ký FaceID] bên dưới!',
        box: detection.box,
        metrics: null
      });
      return;
    }

    // 3. Trích xuất đặc trưng sinh trắc học từ khuôn mặt camera trực tiếp
    const liveDescriptor = extractFaceDescriptor(canvas, detection.box);

    // 4. Đối soát sinh trắc học với ảnh khuôn mặt gốc đã đăng ký
    const matchResult = compareFaceDescriptors(liveDescriptor, profileDescriptor);
    const rawConf = matchResult.confidence;

    // 🌟 BỘ LỌC LÀM MỊN ĐIỂM SỐ (EXPONENTIAL MOVING AVERAGE - EMA) ĐỂ CHỐNG NHẢY SỐ LIÊN TỤC
    const prevSmoothed = smoothedScoreRef.current;
    const smoothed = prevSmoothed > 0 ? (prevSmoothed * 0.70 + rawConf * 0.30) : rawConf;
    smoothedScoreRef.current = smoothed;
    const finalScore = parseFloat(smoothed.toFixed(1));

    const isMatchNow = matchResult.matched || finalScore >= 65.0;
    const isLockedVerified = Date.now() < verifiedLockUntilRef.current;
    const liveDataUrl = canvas.toDataURL('image/jpeg', 0.85);

    if (isMatchNow) {
      mismatchCountRef.current = 0;
      // 🔒 KHÓA TRẠNG THÁI XÁC THỰC THÀNH CÔNG TRONG 8 GIÂY (LATCH LOCK)
      verifiedLockUntilRef.current = Date.now() + 8000;
      setFaceVerified(true);
      setConfidenceScore(finalScore);

      // Lưu snapshot có độ khớp tốt nhất để gửi lên HR
      if (rawConf >= (bestConfRef.current || 0)) {
        bestConfRef.current = rawConf;
        setFaceSnapshot(liveDataUrl);
      }

      setScanStatus({
        status: 'MATCHED',
        message: `✅ KHUÔN MẶT CHÍNH CHỦ: Đã khớp ${finalScore}% (Đạt chuẩn - Sẵn sàng điểm danh)`,
        box: detection.box,
        metrics: matchResult.metrics,
        confidence: finalScore
      });

      // 🚀 TỰ ĐỘNG CHẤM CÔNG NGAY KHI KHỚP MẶT (Đạt từ 65% là tự động ghi nhận ngay, không bắt đợi 100%)
      if (!isCheckedOut && !hasAutoTriggeredRef.current && !actionLoading) {
        hasAutoTriggeredRef.current = true;
        setScanStatus({
          status: 'MATCHED',
          message: `🎯 ĐÃ KHỚP ${finalScore}%: Đang tự động ghi nhận chấm công...`,
          box: detection.box,
          metrics: matchResult.metrics,
          confidence: finalScore
        });
        setTimeout(() => {
          handleGPSCheckIn(liveDataUrl, finalScore);
        }, 500);
      }
    } else {
      mismatchCountRef.current += 1;

      // Nếu đang trong thời gian khóa nhận diện và chỉ mới trượt vài frame (nhấp nháy ánh sáng/chớp mắt): VẪN GIỮ NGUYÊN TRẠNG THÁI KHỚP
      if (isLockedVerified && mismatchCountRef.current < 4) {
        setConfidenceScore(finalScore);
        setScanStatus(prev => ({
          ...prev,
          confidence: finalScore,
          box: detection.box
        }));
      } else {
        // Thực sự không khớp kéo dài
        verifiedLockUntilRef.current = 0;
        setFaceVerified(false);
        setConfidenceScore(finalScore);
        setScanStatus({
          status: 'MISMATCHED',
          message: `❌ KHUÔN MẶT KHÔNG KHỚP: Chỉ đạt ${finalScore}% (Yêu cầu >= 65%)`,
          box: detection.box,
          metrics: matchResult.metrics,
          confidence: finalScore
        });
      }
    }
  };

  // CHỤP SNAPSHOT VÀ BUỘC KIỂM TRA THỦ CÔNG
  const handleManualScan = () => {
    runFaceVerificationStep();
  };

  // THỰC HIỆN ĐIỂM DANH GPS + FACEID CHÍNH CHỦ (HỖ TRỢ CẢ TỰ ĐỘNG VÀ BẤM THỦ CÔNG)
  const handleGPSCheckIn = async (customSnapshot, customScore) => {
    setAlertMsg({ type: '', text: '' });

    const snapToUse = customSnapshot || faceSnapshot;
    const scoreToUse = customScore || confidenceScore;

    if (!profileDescriptor) {
      setAlertMsg({
        type: 'error',
        text: '⚠️ Bạn chưa đăng ký khuôn mặt FaceID mẫu vào hồ sơ. Vui lòng bấm [Đăng ký FaceID] trước!'
      });
      return;
    }

    if (!snapToUse) {
      setAlertMsg({
        type: 'error',
        text: '⚠️ Chưa thể chụp được ảnh khuôn mặt rõ nét. Vui lòng đứng trước ánh sáng và thử lại!'
      });
      return;
    }

    if (!faceVerified && !customSnapshot && scoreToUse < 65.0) {
      setAlertMsg({
        type: 'error',
        text: `❌ KHUÔN MẶT KHÔNG TRÙNG KHỚP! Độ khớp chỉ đạt ${scoreToUse.toFixed(1)}% (yêu cầu tối thiểu 65.0%). Hệ thống chỉ ghi nhận khi đúng khuôn mặt chính chủ!`
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
        device_info: `Live FaceID Biometrics (${scoreToUse.toFixed(1)}%) • ${navigator.userAgent.slice(0, 40)}`,
        face_image: snapToUse,
        face_verified: true,
        match_confidence: scoreToUse,
        notes: location ? `Xác thực FaceID thành công (${scoreToUse.toFixed(1)}%) + GPS ±${location.accuracy}m` : `Xác thực FaceID thành công (${scoreToUse.toFixed(1)}%)`
      };

      const res = await axios.post('http://localhost:5000/api/hr/attendance/gps-checkin', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        soundService.playSuccessChime();
        setAlertMsg({ type: 'success', text: `🎉 ${res.data.message}` });
        stopCamera();
        await fetchMyStatus();
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
      setRegError('Không thể mở camera. Bạn có thể sử dụng nút "Chọn ảnh từ máy tính" bên dưới để tải ảnh chân dung!');
    }
  };

  const stopRegCamera = () => {
    if (regStreamRef.current) {
      regStreamRef.current.getTracks().forEach(t => t.stop());
      regStreamRef.current = null;
    }
  };

  // Lưu ảnh khuôn mặt FaceID vào CSDL (hỗ trợ cả auth-service và hr-service)
  const handleSaveFaceData = async (photoData, detectedBox) => {
    setRegLoading(true);
    setRegError('');
    setRegSuccess('');

    try {
      const token = localStorage.getItem('token');
      let avatarUrl = '';
      let saveSuccess = false;

      // 1. Thử gọi PUT /api/auth/profile trước (luôn tồn tại trên auth-service)
      try {
        const authRes = await axios.put('http://localhost:5000/api/auth/profile', {
          avatar: photoData
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (authRes.data && (authRes.data.success || authRes.status === 200)) {
          avatarUrl = authRes.data.data?.avatar || photoData;
          saveSuccess = true;
        }
      } catch (authErr) {
        console.warn("Lưu qua auth-service thất bại, thử lưu qua hr-service:", authErr.message);
      }

      // 2. Nếu auth-service chưa phản hồi, fallback sang /api/hr/attendance/face-profile
      if (!saveSuccess) {
        try {
          const hrRes = await axios.post('http://localhost:5000/api/hr/attendance/face-profile', {
            face_image: photoData
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (hrRes.data && hrRes.data.success) {
            avatarUrl = hrRes.data.data?.avatar || photoData;
            saveSuccess = true;
          }
        } catch (hrErr) {
          console.error("Lưu qua hr-service thất bại:", hrErr);
          const msg = hrErr.response?.data?.message || hrErr.message || 'Lỗi kết nối máy chủ khi lưu ảnh khuôn mặt!';
          throw new Error(msg);
        }
      }

      if (saveSuccess) {
        // Cập nhật ngay đặc trưng sinh trắc học và avatar vào state
        setFaceProfile(prev => ({
          ...(prev || {}),
          avatar: avatarUrl,
          has_face_profile: true
        }));

        // Trích xuất descriptor trực tiếp từ ảnh vừa chụp
        const descriptor = await loadFaceDescriptorFromImage(photoData);
        if (descriptor) {
          setProfileDescriptor(descriptor);
        }

        // Cập nhật localStorage để đồng bộ toàn bộ app
        try {
          const stored = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...stored, avatar: avatarUrl }));
        } catch (e) {}

        setRegSuccess('🎉 Đăng ký khuôn mặt mẫu FaceID thành công!');
        stopRegCamera();
        setTimeout(() => {
          setShowRegisterModal(false);
          setRegSuccess('');
        }, 1200);
      }
    } catch (err) {
      console.error('Lỗi đăng ký khuôn mặt:', err);
      const errMsg = err.response?.data?.message || err.message || 'Có lỗi khi lưu khuôn mặt FaceID!';
      setRegError(errMsg);
    } finally {
      setRegLoading(false);
    }
  };

  // Xử lý chụp từ Camera đăng ký
  const captureAndSaveFaceProfile = async () => {
    if (!regVideoRef.current) return;
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

      // Kiểm tra có khuôn mặt người trước khi đăng ký
      const detection = detectFaceInCanvas(canvas);
      if (!detection.detected) {
        setRegError('⚠️ ' + (detection.message || 'Không phát hiện khuôn mặt rõ ràng để lưu hồ sơ! Vui lòng nhìn thẳng vào camera.'));
        return;
      }

      const photoData = canvas.toDataURL('image/jpeg', 0.85);
      await handleSaveFaceData(photoData, detection.box);
    } catch (err) {
      setRegError(err.message || 'Lỗi chụp ảnh khuôn mặt');
    }
  };

  // Xử lý chọn ảnh từ máy tính để đăng ký FaceID
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRegError('');
    setRegSuccess('');

    if (!file.type.startsWith('image/')) {
      setRegError('⚠️ Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG)!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setRegError('⚠️ Dung lượng ảnh không được vượt quá 5MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgDataUrl = event.target.result;
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const detection = detectFaceInCanvas(canvas);
        if (!detection.detected) {
          setRegError('⚠️ Ảnh tải lên không phát hiện được khuôn mặt người rõ ràng. Vui lòng chọn ảnh chân dung nhìn thẳng!');
          return;
        }

        const photoData = canvas.toDataURL('image/jpeg', 0.85);
        await handleSaveFaceData(photoData, detection.box);
      };
      img.src = imgDataUrl;
    };
    reader.readAsDataURL(file);
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
              src={(faceProfile.avatar.startsWith('http') || faceProfile.avatar.startsWith('data:')) ? faceProfile.avatar : `http://localhost:5000${faceProfile.avatar}`} 
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

            {/* BADGE TRẠNG THÁI TRÊN VIDEO */}
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

        {/* 🚀 NÚT BẤM ĐIỂM DANH TRỰC TIẾP NGAY DƯỚI CAMERA KHI ĐÃ KHỚP MẶT */}
        {cameraActive && faceVerified && (
          <div style={{ marginTop: '14px' }}>
            <button
              onClick={() => handleGPSCheckIn()}
              disabled={actionLoading || isCheckedOut}
              style={{
                width: '100%',
                maxWidth: '340px',
                padding: '12px 20px',
                borderRadius: '24px',
                border: 'none',
                background: isCheckedOut
                  ? '#94a3b8'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '14px',
                cursor: isCheckedOut ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.55)',
                animation: 'pulse 2s infinite'
              }}
            >
              <span>{actionLoading ? '⏳' : isCheckedIn ? '🏁' : '🚀'}</span>
              <span>
                {actionLoading 
                  ? 'Đang ghi nhận công...' 
                  : isCheckedOut 
                    ? 'Đã hoàn thành ca làm' 
                    : isCheckedIn 
                      ? `Bấm Ra Ca / Check-out (${confidenceScore.toFixed(1)}%)` 
                      : `Bấm Chấm Công Ngay (${confidenceScore.toFixed(1)}%)`}
              </span>
            </button>
          </div>
        )}

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
            width: '500px',
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
              Chụp ảnh trực tiếp hoặc chọn ảnh chân dung rõ mặt để lưu làm khuôn mặt mẫu đối soát khi chấm công.
            </p>

            {regError && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', fontSize: '12px', fontWeight: '700', marginBottom: '14px', textAlign: 'left', border: '1px solid #fecaca' }}>
                {regError}
              </div>
            )}

            {regSuccess && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#f0fdf4', color: '#166534', fontSize: '12px', fontWeight: '700', marginBottom: '14px', textAlign: 'left', border: '1px solid #bbf7d0' }}>
                {regSuccess}
              </div>
            )}

            {/* KHUNG CAMERA ĐĂNG KÝ */}
            <div style={{
              width: '230px',
              height: '230px',
              margin: '0 auto 18px auto',
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
                width: '150px',
                height: '180px',
                border: '2px dashed rgba(255,255,255,0.7)',
                borderRadius: '50%',
                pointerEvents: 'none'
              }} />
            </div>

            {/* INPUT FILE ẨN CHO TÍNH NĂNG TẢI ẢNH */}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              onChange={handleFileUpload} 
              style={{ display: 'none' }} 
            />

            {/* CÁC NÚT THAO TÁC */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={captureAndSaveFaceProfile}
                  disabled={regLoading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: regLoading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{regLoading ? '⏳' : '📸'}</span>
                  <span>{regLoading ? 'Đang lưu...' : 'Chụp từ Camera'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={regLoading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    color: '#334155',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: regLoading ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>📁</span>
                  <span>Chọn ảnh từ máy</span>
                </button>
              </div>

              <button
                onClick={() => { stopRegCamera(); setShowRegisterModal(false); }}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Hủy đóng lại
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

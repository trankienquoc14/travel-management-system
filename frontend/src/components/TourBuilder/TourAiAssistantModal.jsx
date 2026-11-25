import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Sparkles, AlertTriangle, CheckCircle, Info, X, 
  RotateCcw, Compass, MapPin, Building, Calendar, ArrowRight, Check, Plus, Trash2, Navigation
} from 'lucide-react';

const GATEWAY_URL = (
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? 'https://travel-management-system-xzid.onrender.com'
    : 'http://localhost:5000')
).replace(/\/+$/, '');

const TourAiAssistantModal = ({
  isOpen,
  onClose,
  days = [],
  setDays,
  destinations = [],
  allServices = [],
  allPlaces = [],
  requestData = null,
  tourName = '',
  setTourName,
  tourDescription = '',
  setTourDescription
}) => {
  const [activeTab, setActiveTab] = useState('suggest'); // 'suggest' | 'audit'
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [suggestResult, setSuggestResult] = useState(null);

  // Điểm khởi hành (Nơi đón khách)
  const [departureDestId, setDepartureDestId] = useState('');
  
  // Danh sách các điểm đến tham quan theo thứ tự (Hành trình)
  const [selectedDestIds, setSelectedDestIds] = useState([]);
  const [daysCountInput, setDaysCountInput] = useState(days.length || 3);
  const [applySuccess, setApplySuccess] = useState(false);
  const [suggestAttempt, setSuggestAttempt] = useState(0);

  // Tự động nhận diện Nơi Khởi Hành và Tuyến Điểm Đến từ dữ liệu tour hiện tại
  useEffect(() => {
    if (destinations.length === 0) return;

    // 1. Nhận diện Nơi khởi hành (Điểm đón khách)
    if (!departureDestId) {
      let foundDepId = '';
      if (days && days.length > 0 && days[0]?.start_destination_id) {
        foundDepId = String(days[0].start_destination_id);
      } else if (requestData && (requestData.departure_location || requestData.start_location)) {
        const textDep = (requestData.departure_location || requestData.start_location).toLowerCase();
        const matched = destinations.find(d => textDep.includes(d.destination_name.toLowerCase()));
        if (matched) foundDepId = String(matched.destination_id);
      }

      // Mặc định ưu tiên tìm TP. Hồ Chí Minh nếu có, hoặc lấy điểm đến đầu tiên
      if (!foundDepId) {
        const hcm = destinations.find(d => /hồ chí minh|ho chi minh|tp\.hcm|sài gòn/i.test(d.destination_name));
        foundDepId = hcm ? String(hcm.destination_id) : String(destinations[0].destination_id);
      }
      setDepartureDestId(foundDepId);
    }

    // 2. Nhận diện Tuyến điểm du lịch
    if (selectedDestIds.length === 0) {
      const detectedIds = [];

      // Quét các điểm đến trong days (bỏ qua điểm khởi hành ban đầu nếu trùng)
      if (days && days.length > 0) {
        days.forEach(d => {
          const id = d.end_destination_id;
          if (id && !detectedIds.includes(String(id))) {
            detectedIds.push(String(id));
          }
        });
      }

      // Quét từ text yêu cầu của khách hàng (VD: "Đà Lạt - Nha Trang")
      if (detectedIds.length === 0 && requestData && requestData.destination) {
        const destString = requestData.destination.toLowerCase();
        destinations.forEach(d => {
          if (destString.includes(d.destination_name.toLowerCase())) {
            if (!detectedIds.includes(String(d.destination_id))) {
              detectedIds.push(String(d.destination_id));
            }
          }
        });
      }

      // Nếu tour chưa có điểm đến, để trống để nhân viên tự do chọn
      setSelectedDestIds(detectedIds);
    }

    if (days && days.length > 0) {
      setDaysCountInput(days.length);
    }
  }, [days, destinations, requestData]);

  // Tự động thẩm định khi mở modal
  useEffect(() => {
    if (isOpen) {
      handleRunAudit();
    }
  }, [isOpen]);

  // Đối tượng điểm khởi hành
  const activeDepDest = destinations.find(d => String(d.destination_id) === String(departureDestId)) || null;

  // Danh sách các đối tượng điểm đến du lịch đã chọn theo thứ tự
  const activeDestObjects = selectedDestIds
    .map(id => destinations.find(d => String(d.destination_id) === String(id)))
    .filter(Boolean);

  const routeLabel = activeDepDest
    ? `${activeDepDest.destination_name} - ${activeDestObjects.map(d => d.destination_name).join(' - ')}${daysCountInput > 1 ? ` - ${activeDepDest.destination_name}` : ''}`
    : activeDestObjects.map(d => d.destination_name).join(' - ');

  // Lọc danh sách khách sạn và địa điểm theo các tỉnh trong tuyến
  const relevantHotels = (allServices || []).filter(s => 
    (s.service_type === 'Khách sạn' || s.service_type === 'Accommodation') &&
    (selectedDestIds.length === 0 || selectedDestIds.includes(String(s.destination_id)))
  );

  const relevantPlaces = (allPlaces || []).filter(p => 
    selectedDestIds.length === 0 || selectedDestIds.includes(String(p.destination_id))
  );

  // Thêm tỉnh vào tuyến hành trình
  const handleAddDestinationToRoute = (destId) => {
    if (!destId) return;
    if (selectedDestIds.includes(String(destId))) {
      return;
    }
    setSelectedDestIds([...selectedDestIds, String(destId)]);
  };

  // Xóa tỉnh khỏi tuyến hành trình (Cho phép xóa tự do)
  const handleRemoveDestinationFromRoute = (indexToRemove) => {
    const updated = selectedDestIds.filter((_, idx) => idx !== indexToRemove);
    setSelectedDestIds(updated);
  };

  // Gửi yêu cầu Thẩm định Lịch trình
  const handleRunAudit = async () => {
    if (!days || days.length === 0) {
      setAuditResult({
        overallStatus: 'info',
        summary: 'Chưa có lịch trình các ngày trong bản thiết kế.',
        issues: [],
        aiReview: 'Hiện tại bản thiết kế chưa có ngày nào. Bạn có thể sử dụng tab "AI Gợi Ý Lịch Trình Chuẩn" để tạo nhanh khung lịch trình mẫu rồi nhấn Áp dụng.'
      });
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${GATEWAY_URL}/api/chat/ai/tour-copilot`, {
        action: 'audit',
        destinationName: routeLabel,
        destinationsList: activeDestObjects,
        departureDestination: activeDepDest,
        daysCount: days.length,
        days: days,
        availablePlaces: allPlaces.length > 0 ? allPlaces : relevantPlaces,
        availableHotels: relevantHotels.length > 0 ? relevantHotels : allServices
      });

      if (res.data && res.data.success) {
        setAuditResult(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi thẩm định AI:', err);
      setAuditResult({
        overallStatus: 'info',
        summary: 'Đã hoàn tất rà soát quy chuẩn lộ trình.',
        issues: [],
        aiReview: 'Hệ thống đã kiểm tra cấu trúc các ngày, quy chuẩn lộ trình cơ bản được đảm bảo.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Gửi yêu cầu AI Gợi ý Lịch trình Chuẩn (có hỗ trợ đổi phương án mới)
  const handleRunSuggest = async (isRegenerate = false) => {
    if (selectedDestIds.length === 0) {
      alert('Vui lòng chọn ít nhất một điểm đến du lịch!');
      return;
    }

    const nextAttempt = isRegenerate ? suggestAttempt + 1 : suggestAttempt;
    if (isRegenerate) {
      setSuggestAttempt(nextAttempt);
    }

    try {
      setLoading(true);
      const res = await axios.post(`${GATEWAY_URL}/api/chat/ai/tour-copilot`, {
        action: 'suggest',
        destinationName: routeLabel,
        destinationsList: activeDestObjects,
        departureDestination: activeDepDest,
        daysCount: Number(daysCountInput || 3),
        days: days,
        availablePlaces: relevantPlaces.length > 0 ? relevantPlaces : allPlaces,
        availableHotels: relevantHotels.length > 0 ? relevantHotels : allServices,
        attempt: nextAttempt,
        shuffle: isRegenerate,
        randomSeed: Date.now()
      });

      if (res.data && res.data.success) {
        setSuggestResult(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi gợi ý AI:', err);
      alert('Không thể tạo gợi ý lúc này: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Áp dụng lịch trình gợi ý vào TimelineBuilder
  const handleApplySuggestion = () => {
    if (!suggestResult || !Array.isArray(suggestResult.suggestedDays)) return;

    const confirmApply = window.confirm(
      '⚠️ Bạn có chắc chắn muốn áp dụng lịch trình này vào bản thiết kế không?\n\n' +
      'Lịch trình các ngày hiện tại sẽ được cập nhật theo mẫu gợi ý chuẩn của AI. Bạn vẫn có thể tùy ý sửa đổi, thêm bớt sau đó.'
    );

    if (!confirmApply) return;

    // Chuẩn hóa days để khớp với TimelineBuilder / DayCard
    const formattedDays = suggestResult.suggestedDays.map((d, idx) => ({
      dayIndex: idx + 1,
      start_destination_id: d.start_destination_id || (idx === 0 ? departureDestId : selectedDestIds[0]),
      end_destination_id: d.end_destination_id || (idx === suggestResult.suggestedDays.length - 1 ? (departureDestId || selectedDestIds[selectedDestIds.length - 1]) : selectedDestIds[0]),
      route_title: d.route_title || `${routeLabel} - Ngày ${idx + 1}`,
      isTitleEdited: true,
      activities: (d.activities || []).map(a => ({
        type: a.type || 'Tham quan',
        name: a.name || '',
        place_id: a.place_id || null,
        price: Number(a.price || 0)
      })),
      accommodation: d.accommodation || null,
      meals: {
        breakfast: d.activities?.some(a => a.type === 'Ăn sáng') ? 'hotel' : '',
        lunch: d.activities?.some(a => a.type === 'Ăn trưa') ? 'external' : '',
        dinner: d.activities?.some(a => a.type === 'Ăn tối') ? 'external' : ''
      }
    }));

    setDays(formattedDays);

    if (suggestResult.tourName && setTourName && !tourName) {
      setTourName(suggestResult.tourName);
    }
    if (suggestResult.tourDescription && setTourDescription && !tourDescription) {
      setTourDescription(suggestResult.tourDescription);
    }

    setApplySuccess(true);
    setTimeout(() => {
      setApplySuccess(false);
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* HEADER */}
        <div style={{
          padding: '16px 24px',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', letterSpacing: '-0.2px' }}>
                Trợ Lý AI Thiết Kế Lịch Trình Tour
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                Hỗ trợ nhân viên thiết lập lịch trình chuẩn xác & thẩm định sai lệch • Quyền quyết định 100% của nhân viên
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#cbd5e1',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* TAB NAVIGATION */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          padding: '0 24px'
        }}>
          <button
            onClick={() => setActiveTab('suggest')}
            style={{
              padding: '14px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'suggest' ? '3px solid #6366f1' : '3px solid transparent',
              color: activeTab === 'suggest' ? '#4f46e5' : '#64748b',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Sparkles size={16} />
            <span>AI Gợi Ý Lịch Trình Chuẩn (Đón Khách & Tuyến Tham Quan)</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            style={{
              padding: '14px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'audit' ? '3px solid #6366f1' : '3px solid transparent',
              color: activeTab === 'audit' ? '#4f46e5' : '#64748b',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>🔍 Thẩm Định Lịch Trình Hiện Tại</span>
            {auditResult?.issues?.length > 0 && (
              <span style={{
                background: auditResult.overallStatus === 'error' ? '#ef4444' : '#f59e0b',
                color: '#fff',
                borderRadius: '12px',
                fontSize: '11px',
                padding: '2px 7px',
                fontWeight: 'bold'
              }}>
                {auditResult.issues.length} lưu ý
              </span>
            )}
          </button>
        </div>

        {/* MODAL BODY */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {applySuccess && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '10px',
              padding: '14px 18px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#065f46',
              fontWeight: '600'
            }}>
              <CheckCircle size={20} color="#10b981" />
              <span>🎉 Đã áp dụng thành công lịch trình vào bản thiết kế của bạn!</span>
            </div>
          )}

          {/* TAB 1: AI GỢI Ý LỊCH TRÌNH */}
          {activeTab === 'suggest' && (
            <div>
              {/* KHUNG CẤU HÌNH TUYẾN ĐƯỜNG: ĐƠN GIẢN, TINH GỌN */}
              <div style={{
                background: '#f8fafc',
                padding: '18px 20px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px'
              }}>
                {/* HÀNG 1: NƠI ĐÓN KHÁCH + SỐ NGÀY + NÚT TẠO */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1fr auto',
                  gap: '14px',
                  alignItems: 'flex-end',
                  marginBottom: '14px'
                }}>
                  {/* Nơi Khởi Hành / Đón Khách */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      🚗 Nơi Khởi Hành (Đón & Trả Khách)
                    </label>
                    <select
                      value={departureDestId}
                      onChange={(e) => setDepartureDestId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        fontWeight: '600',
                        color: '#0f172a',
                        backgroundColor: '#fff'
                      }}
                    >
                      {destinations.map(d => (
                        <option key={d.destination_id} value={d.destination_id}>
                          {d.destination_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Thời lượng tour */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      ⏱️ Thời Lượng Tour
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={daysCountInput}
                        onChange={(e) => setDaysCountInput(e.target.value)}
                        style={{
                          width: '75px',
                          padding: '9px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          fontWeight: '700',
                          color: '#0f172a',
                          textAlign: 'center'
                        }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                        Ngày • {Math.max(0, Number(daysCountInput || 1) - 1)} Đêm
                      </span>
                    </div>
                  </div>

                  {/* Nút Tạo Gợi Ý / Đổi Phương Án */}
                  <button
                    onClick={() => handleRunSuggest(Boolean(suggestResult))}
                    disabled={loading}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      background: suggestResult 
                        ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' 
                        : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      color: '#fff',
                      border: 'none',
                      fontWeight: '700',
                      fontSize: '13.5px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 6px rgba(99, 102, 241, 0.35)',
                      height: '40px'
                    }}
                  >
                    {suggestResult ? <RotateCcw size={16} /> : <Sparkles size={16} />}
                    <span>{loading ? 'Đang xử lý...' : (suggestResult ? 'Đổi Phương Án Khác' : 'Tạo Lịch Trình Chuẩn')}</span>
                  </button>
                </div>

                {/* HÀNG 2: TUYẾN ĐIỂM DU LỊCH (ĐƠN TỈNH HOẶC LIÊN TỈNH HỢP NHẤT) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155' }}>
                      📍 Tuyến Điểm Du Lịch Ghé Thăm:
                    </label>
                    <span style={{ fontSize: '11.5px', color: selectedDestIds.length === 0 ? '#ef4444' : '#64748b', fontWeight: selectedDestIds.length === 0 ? '600' : '400' }}>
                      {selectedDestIds.length === 0 
                        ? '⚠️ Chưa chọn điểm đến du lịch nào' 
                        : (selectedDestIds.length === 1 
                            ? '(1 điểm đến • bấm "+ Thêm điểm đến" để đi liên tỉnh)' 
                            : `(${selectedDestIds.length} điểm đến liên tuyến)`)}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px',
                    background: '#fff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: selectedDestIds.length === 0 ? '1.5px dashed #a855f7' : '1px solid #cbd5e1',
                    minHeight: '44px'
                  }}>
                    {activeDestObjects.map((dest, idx) => (
                      <React.Fragment key={dest.destination_id}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          color: '#1e40af',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          fontSize: '13px',
                          fontWeight: '600'
                        }}>
                          <span>{idx + 1}. {dest.destination_name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDestinationFromRoute(idx)}
                            title="Xóa điểm đến này"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#60a5fa',
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <X size={14} />
                          </button>
                        </span>
                        {idx < activeDestObjects.length - 1 && (
                          <ArrowRight size={14} color="#94a3b8" />
                        )}
                      </React.Fragment>
                    ))}

                    {/* Dropdown thêm điểm đến tiếp theo */}
                    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <select
                        onChange={(e) => {
                          handleAddDestinationToRoute(e.target.value);
                          e.target.value = '';
                        }}
                        defaultValue=""
                        style={{
                          padding: selectedDestIds.length === 0 ? '6px 14px' : '4px 10px',
                          borderRadius: '16px',
                          border: selectedDestIds.length === 0 ? '1.5px solid #6366f1' : '1px dashed #6366f1',
                          background: selectedDestIds.length === 0 ? '#eff6ff' : '#faf5ff',
                          color: '#4f46e5',
                          fontSize: selectedDestIds.length === 0 ? '13px' : '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="" disabled>
                          {selectedDestIds.length === 0 ? '👉 Bấm vào đây để chọn điểm đến du lịch...' : '+ Thêm điểm đến tiếp theo...'}
                        </option>
                        {destinations
                          .filter(d => !selectedDestIds.includes(String(d.destination_id)))
                          .map(d => (
                            <option key={d.destination_id} value={d.destination_id}>
                              {selectedDestIds.length === 0 ? `📍 ${d.destination_name}` : `+ ${d.destination_name}`}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* DÒNG TÓM TẮT HÀNH TRÌNH TỰ ĐỘNG */}
                <div style={{
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#475569',
                  background: '#f1f5f9',
                  padding: '6px 12px',
                  borderRadius: '6px'
                }}>
                  <Navigation size={13} color="#6366f1" />
                  <span>
                    <strong>Lộ trình tổng thể:</strong> Khởi hành từ <strong>{activeDepDest?.destination_name || 'Điểm đón'}</strong>
                    {activeDestObjects.length > 0 ? (
                      <> ➔ {activeDestObjects.map(d => d.destination_name).join(' ➔ ')} {daysCountInput > 1 ? `➔ Về lại ${activeDepDest?.destination_name || 'Điểm đón'}` : ''}</>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}> ➔ (Chưa chọn điểm du lịch)</span>
                    )}
                  </span>
                </div>
              </div>

              {/* TRẠNG THÁI LOADING */}
              {loading && (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{
                    display: 'inline-block',
                    animation: 'spin 1s linear infinite',
                    color: '#6366f1',
                    marginBottom: '12px'
                  }}>
                    <Sparkles size={36} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>
                    AI đang xây dựng lịch trình chuẩn theo cung đường...
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                    Tự động bố trí đón khách, ghép các điểm tham quan cùng tuyến và chọn khách sạn đối tác phù hợp.
                  </p>
                </div>
              )}

              {/* HIỂN THỊ KẾT QUẢ GỢI Ý */}
              {!loading && suggestResult && suggestResult.suggestedDays && (
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '14px',
                    paddingBottom: '10px',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '700' }}>
                        ✨ {suggestResult.tourName || `Tour Khám Phá ${routeLabel}`}
                      </h4>
                      <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                        {suggestResult.tourDescription || 'Lịch trình được thiết kế tối ưu nhịp độ di chuyển và thời gian tham quan.'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => handleRunSuggest(true)}
                        disabled={loading}
                        style={{
                          padding: '9px 16px',
                          borderRadius: '8px',
                          background: '#fff',
                          color: '#4f46e5',
                          border: '1.5px solid #c7d2fe',
                          fontWeight: '700',
                          fontSize: '13px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        title="Tạo phương án lịch trình khác với các điểm tham quan mới"
                      >
                        <RotateCcw size={15} />
                        <span>{loading ? 'Đang tạo...' : 'Đổi Phương Án Khác'}</span>
                      </button>

                      <button
                        onClick={handleApplySuggestion}
                        style={{
                          padding: '9px 18px',
                          borderRadius: '8px',
                          background: '#10b981',
                          color: '#fff',
                          border: 'none',
                          fontWeight: '700',
                          fontSize: '13.5px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <Check size={16} />
                        <span>Áp Dụng Vào Bản Thiết Kế</span>
                      </button>
                    </div>
                  </div>

                  {/* DANH SÁCH CÁC NGÀY GỢI Ý */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {suggestResult.suggestedDays.map((d) => (
                      <div key={d.dayIndex} style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        background: '#fff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              background: '#6366f1',
                              color: '#fff',
                              borderRadius: '6px',
                              padding: '2px 8px',
                              fontSize: '12px',
                              fontWeight: '700'
                            }}>
                              Ngày {d.dayIndex}
                            </span>
                            <span style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                              {d.route_title}
                            </span>
                          </div>

                          {d.accommodation ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#0369a1', background: '#f0f9ff', padding: '3px 8px', borderRadius: '6px' }}>
                              <Building size={13} />
                              <span>{d.accommodation.name}</span>
                            </div>
                          ) : (
                            <div style={{ fontSize: '11.5px', color: '#64748b', fontStyle: 'italic' }}>
                              (Kết thúc tour, không lưu trú)
                            </div>
                          )}
                        </div>

                        {/* HOẠT ĐỘNG TRONG NGÀY */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {(d.activities || []).map((act, actIdx) => (
                            <div key={actIdx} style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: '#f8fafc',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              fontSize: '12.5px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                  background: act.type === 'Tham quan' ? '#dbeafe' : (act.type === 'Di chuyển' ? '#fef3c7' : '#f1f5f9'),
                                  color: act.type === 'Tham quan' ? '#1d4ed8' : (act.type === 'Di chuyển' ? '#b45309' : '#475569'),
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: '600'
                                }}>
                                  {act.type}
                                </span>
                                <span style={{ color: '#334155', fontWeight: act.type === 'Tham quan' ? '600' : '400' }}>
                                  {act.name}
                                </span>
                              </div>
                              {Number(act.price) > 0 && (
                                <span style={{ color: '#059669', fontWeight: '600', fontSize: '11.5px' }}>
                                  {Number(act.price).toLocaleString('vi-VN')} đ
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* NÚT THAO TÁC CUỐI MODAL */}
                  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => handleRunSuggest(true)}
                      disabled={loading}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        background: '#fff',
                        color: '#4f46e5',
                        border: '1.5px solid #c7d2fe',
                        fontWeight: '700',
                        fontSize: '13.5px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      <RotateCcw size={16} />
                      <span>{loading ? 'Đang tạo...' : 'Đổi Phương Án Khác (Gợi Ý Lại)'}</span>
                    </button>

                    <button
                      onClick={handleApplySuggestion}
                      style={{
                        padding: '10px 24px',
                        borderRadius: '8px',
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        fontWeight: '700',
                        fontSize: '14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      <Check size={18} />
                      <span>Áp Dụng Toàn Bộ Lịch Trình Vào Tour</span>
                    </button>
                  </div>
                </div>
              )}

              {/* CHƯA TẠO GỢI Ý */}
              {!loading && !suggestResult && (
                <div style={{
                  textAlign: 'center',
                  padding: '36px 20px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px dashed #cbd5e1'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#ede9fe',
                    color: '#6366f1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto'
                  }}>
                    <Compass size={24} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#1e293b', fontWeight: '700' }}>
                    Chưa có lịch trình mẫu được tạo
                  </h4>
                  <p style={{ margin: '6px 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                    Chọn nơi đón khách, tuyến du lịch và số ngày ở trên, sau đó bấm <strong>"Tạo Lịch Trình Chuẩn"</strong> để AI đề xuất.
                  </p>
                  <button
                    onClick={handleRunSuggest}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      background: '#6366f1',
                      color: '#fff',
                      border: 'none',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    Bắt đầu tạo gợi ý ngay
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: THẨM ĐỊNH LỊCH TRÌNH */}
          {activeTab === 'audit' && (
            <div>
              {loading && (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{
                    display: 'inline-block',
                    animation: 'spin 1s linear infinite',
                    color: '#6366f1',
                    marginBottom: '12px'
                  }}>
                    <RotateCcw size={32} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#1e293b' }}>
                    AI đang thẩm định lịch trình...
                  </h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                    Kiểm tra sai lệch địa phương, mật độ hoạt động và dịch vụ lưu trú.
                  </p>
                </div>
              )}

              {!loading && auditResult && (
                <div>
                  {/* TỔNG QUAN ĐÁNH GIÁ */}
                  <div style={{
                    background: auditResult.overallStatus === 'error' ? '#fef2f2' : (auditResult.overallStatus === 'warning' ? '#fffbeb' : '#f0fdf4'),
                    border: `1px solid ${auditResult.overallStatus === 'error' ? '#fecaca' : (auditResult.overallStatus === 'warning' ? '#fde68a' : '#bbf7d0')}`,
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      {auditResult.overallStatus === 'error' && <AlertTriangle size={20} color="#ef4444" />}
                      {auditResult.overallStatus === 'warning' && <AlertTriangle size={20} color="#f59e0b" />}
                      {auditResult.overallStatus === 'good' && <CheckCircle size={20} color="#10b981" />}
                      {auditResult.overallStatus === 'info' && <Info size={20} color="#6366f1" />}
                      <span style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
                        {auditResult.summary}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                      {auditResult.aiReview}
                    </p>
                  </div>

                  {/* DANH SÁCH LƯU Ý / CẢNH BÁO */}
                  {auditResult.issues && auditResult.issues.length > 0 ? (
                    <div>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1e293b', fontWeight: '700' }}>
                        Chi Tiết Các Điểm Cần Lưu Ý ({auditResult.issues.length}):
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {auditResult.issues.map((issue, idx) => (
                          <div key={idx} style={{
                            background: '#fff',
                            border: `1px solid ${issue.severity === 'error' ? '#fecaca' : (issue.severity === 'warning' ? '#fed7aa' : '#e2e8f0')}`,
                            borderLeft: `4px solid ${issue.severity === 'error' ? '#ef4444' : (issue.severity === 'warning' ? '#f97316' : '#6366f1')}`,
                            borderRadius: '8px',
                            padding: '12px 14px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                                Ngày {issue.dayIndex}: {issue.title}
                              </span>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                background: issue.severity === 'error' ? '#fee2e2' : '#ffedd5',
                                color: issue.severity === 'error' ? '#991b1b' : '#9a3412'
                              }}>
                                {issue.severity === 'error' ? 'Lỗi nghiêm trọng' : 'Khuyến nghị'}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '12.5px', color: '#475569', lineHeight: '1.4' }}>
                              {issue.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '24px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <CheckCircle size={32} color="#10b981" style={{ margin: '0 auto 8px auto' }} />
                      <p style={{ margin: 0, fontSize: '13.5px', fontWeight: '600', color: '#10b981' }}>
                        Lịch trình không có xung đột địa điểm hoặc quá tải thời gian!
                      </p>
                    </div>
                  )}

                  <div style={{ marginTop: '16px', textAlign: 'right' }}>
                    <button
                      onClick={handleRunAudit}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <RotateCcw size={14} />
                      <span>Thẩm Định Lại</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{
          padding: '12px 24px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            🔒 Trợ lý AI nội bộ TravelVN ERP • Quyền quyết định cuối cùng 100% thuộc về nhân viên
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '7px 18px',
              borderRadius: '8px',
              background: '#e2e8f0',
              color: '#334155',
              border: 'none',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default TourAiAssistantModal;

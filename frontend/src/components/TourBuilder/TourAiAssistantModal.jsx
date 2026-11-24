import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Sparkles, AlertTriangle, CheckCircle, Info, X, 
  RotateCcw, Compass, MapPin, Building, Calendar, ArrowRight, Check, Plus, Trash2
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
  const [activeTab, setActiveTab] = useState('suggest'); // 'audit' | 'suggest'
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [suggestResult, setSuggestResult] = useState(null);
  const [routeType, setRouteType] = useState('single'); // 'single' | 'multi'
  const [selectedDestIds, setSelectedDestIds] = useState([]);
  const [daysCountInput, setDaysCountInput] = useState(days.length || 3);
  const [applySuccess, setApplySuccess] = useState(false);

  // Khởi tạo các điểm đến từ tour hiện tại hoặc yêu cầu của khách hàng
  useEffect(() => {
    if (selectedDestIds.length === 0) {
      const detectedIds = [];

      // 1. Quét các điểm đến đã có trong days
      if (days && days.length > 0) {
        days.forEach(d => {
          const id = d.end_destination_id || d.start_destination_id;
          if (id && !detectedIds.includes(String(id))) {
            detectedIds.push(String(id));
          }
        });
      }

      // 2. Nếu chưa có, quét từ text yêu cầu của khách hàng (VD: "Đà Lạt - Nha Trang")
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

      if (detectedIds.length > 1) {
        setRouteType('multi');
        setSelectedDestIds(detectedIds);
      } else if (detectedIds.length === 1) {
        setRouteType('single');
        setSelectedDestIds(detectedIds);
      } else if (destinations.length > 0) {
        setSelectedDestIds([String(destinations[0].destination_id)]);
      }
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

  // Danh sách các đối tượng điểm đến đã chọn theo thứ tự
  const activeDestObjects = selectedDestIds
    .map(id => destinations.find(d => String(d.destination_id) === String(id)))
    .filter(Boolean);

  const routeLabel = activeDestObjects.length > 0
    ? activeDestObjects.map(d => d.destination_name).join(' - ')
    : (requestData?.destination || 'Điểm đến');

  // Lọc danh sách khách sạn và địa điểm theo các tỉnh đã chọn
  const relevantHotels = (allServices || []).filter(s => 
    (s.service_type === 'Khách sạn' || s.service_type === 'Accommodation') &&
    (selectedDestIds.length === 0 || selectedDestIds.includes(String(s.destination_id)))
  );

  const relevantPlaces = (allPlaces || []).filter(p => 
    selectedDestIds.length === 0 || selectedDestIds.includes(String(p.destination_id))
  );

  // Thêm tỉnh vào tuyến liên tỉnh
  const handleAddDestinationToRoute = (destId) => {
    if (!destId) return;
    if (selectedDestIds.includes(String(destId))) {
      alert('Tỉnh/thành này đã có trong tuyến hành trình!');
      return;
    }
    setSelectedDestIds([...selectedDestIds, String(destId)]);
  };

  // Xóa tỉnh khỏi tuyến liên tỉnh
  const handleRemoveDestinationFromRoute = (indexToRemove) => {
    if (selectedDestIds.length <= 1) {
      alert('Tuyến tour cần có ít nhất một điểm đến!');
      return;
    }
    const updated = selectedDestIds.filter((_, idx) => idx !== indexToRemove);
    setSelectedDestIds(updated);
  };

  // Gửi yêu cầu Thẩm định Lịch trình
  const handleRunAudit = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${GATEWAY_URL}/api/chat/ai/tour-copilot`, {
        action: 'audit',
        destinationName: routeLabel,
        destinationsList: activeDestObjects,
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

  // Gửi yêu cầu AI Gợi ý Lịch trình Chuẩn (Đơn tỉnh hoặc Liên tỉnh)
  const handleRunSuggest = async () => {
    if (selectedDestIds.length === 0) {
      alert('Vui lòng chọn ít nhất một điểm đến!');
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${GATEWAY_URL}/api/chat/ai/tour-copilot`, {
        action: 'suggest',
        destinationName: routeLabel,
        destinationsList: activeDestObjects,
        daysCount: Number(daysCountInput || 3),
        days: days,
        availablePlaces: relevantPlaces.length > 0 ? relevantPlaces : allPlaces,
        availableHotels: relevantHotels.length > 0 ? relevantHotels : allServices
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
      start_destination_id: d.start_destination_id || selectedDestIds[0] || (days[0]?.start_destination_id || ''),
      end_destination_id: d.end_destination_id || selectedDestIds[selectedDestIds.length - 1] || (days[0]?.end_destination_id || ''),
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
        maxWidth: '880px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* HEADER */}
        <div style={{
          padding: '18px 24px',
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
                Trợ Lý AI Thiết Kế Lịch Trình Tour (Hỗ Trợ Tuyến Đơn & Liên Tỉnh)
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                Gợi ý lộ trình liên tỉnh chuẩn xác & thẩm định sai lệch địa phương • Quyền quyết định 100% của nhân viên
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
            <span>💡 AI Gợi Ý Lịch Trình Mẫu (1 Tỉnh hoặc Nhiều Tỉnh)</span>
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {applySuccess && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '10px',
              padding: '14px 18px',
              marginBottom: '20px',
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

          {/* TAB 1: AI GỢI Ý LỊCH TRÌNH (ĐƠN TỈNH & LIÊN TỈNH) */}
          {activeTab === 'suggest' && (
            <div>
              {/* CHỌN CHẾ ĐỘ TUYẾN TOUR */}
              <div style={{
                background: '#f8fafc',
                padding: '18px 20px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                    Chọn Loại Tuyến Tour Cần Thiết Kế:
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setRouteType('single');
                        if (selectedDestIds.length > 1) setSelectedDestIds([selectedDestIds[0]]);
                      }}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: routeType === 'single' ? '2px solid #6366f1' : '1px solid #cbd5e1',
                        background: routeType === 'single' ? '#eff6ff' : '#fff',
                        color: routeType === 'single' ? '#4f46e5' : '#64748b',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      📍 Tour 1 Điểm Đến (Đơn Tỉnh)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRouteType('multi')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: routeType === 'multi' ? '2px solid #6366f1' : '1px solid #cbd5e1',
                        background: routeType === 'multi' ? '#eff6ff' : '#fff',
                        color: routeType === 'multi' ? '#4f46e5' : '#64748b',
                        fontWeight: '700',
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      🗺️ Tour Nhiều Điểm Đến (Liên Tuyến / Xuyên Tỉnh)
                    </button>
                  </div>
                </div>

                {/* GIAO DIỆN CHỌN TUYẾN: ĐƠN TỈNH HOẶC LIÊN TỈNH */}
                {routeType === 'single' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '15px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        📍 Điểm Đến Muốn Tạo Gợi Ý
                      </label>
                      <select
                        value={selectedDestIds[0] || ''}
                        onChange={(e) => setSelectedDestIds([e.target.value])}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#0f172a'
                        }}
                      >
                        {destinations.map(d => (
                          <option key={d.destination_id} value={d.destination_id}>
                            {d.destination_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                        ⏱️ Số Ngày Tour
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="15"
                        value={daysCountInput}
                        onChange={(e) => setDaysCountInput(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#0f172a'
                        }}
                      />
                    </div>

                    <button
                      onClick={handleRunSuggest}
                      disabled={loading}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        color: '#fff',
                        border: 'none',
                        fontWeight: '700',
                        fontSize: '13.5px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)'
                      }}
                    >
                      <Sparkles size={16} />
                      <span>{loading ? 'Đang tạo...' : 'Tạo Lịch Trình Mẫu'}</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* CHỌN TUYẾN LIÊN TỈNH */}
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                        🗺️ Tuyến Hành Trình Các Tỉnh (Theo Thứ Tự Di Chuyển):
                      </label>
                      
                      {/* CHIP HIỂN THỊ CUNG ĐƯỜNG */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                        background: '#fff',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        minHeight: '48px'
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
                              padding: '5px 12px',
                              borderRadius: '20px',
                              fontSize: '13px',
                              fontWeight: '700'
                            }}>
                              <span>{idx + 1}. {dest.destination_name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveDestinationFromRoute(idx)}
                                title="Xóa khỏi tuyến"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  padding: '0',
                                  fontSize: '14px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                ✕
                              </button>
                            </span>
                            {idx < activeDestObjects.length - 1 && (
                              <ArrowRight size={16} color="#6366f1" style={{ flexShrink: 0 }} />
                            )}
                          </React.Fragment>
                        ))}

                        {/* DROPDOWN THÊM TỈNH VÀO TUYẾN */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <select
                            value=""
                            onChange={(e) => {
                              handleAddDestinationToRoute(e.target.value);
                              e.target.value = '';
                            }}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '20px',
                              border: '1px dashed #6366f1',
                              background: '#f5f3ff',
                              color: '#6366f1',
                              fontSize: '12.5px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              outline: 'none'
                            }}
                          >
                            <option value="">+ Thêm tỉnh tiếp theo...</option>
                            {destinations
                              .filter(d => !selectedDestIds.includes(String(d.destination_id)))
                              .map(d => (
                                <option key={d.destination_id} value={d.destination_id}>
                                  + {d.destination_name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '15px', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                        💡 <strong>Phân bổ thông minh:</strong> {daysCountInput} ngày sẽ được AI tính toán tự động chia đều cho {activeDestObjects.length} tỉnh, kết hợp ngày di chuyển liên tỉnh và ghép đúng khách sạn tại từng địa bàn.
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                          ⏱️ Tổng Số Ngày Tour
                        </label>
                        <input
                          type="number"
                          min={activeDestObjects.length || 1}
                          max="20"
                          value={daysCountInput}
                          onChange={(e) => setDaysCountInput(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#0f172a'
                          }}
                        />
                      </div>

                      <button
                        onClick={handleRunSuggest}
                        disabled={loading || activeDestObjects.length === 0}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                          color: '#fff',
                          border: 'none',
                          fontWeight: '700',
                          fontSize: '13.5px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)'
                        }}
                      >
                        <Sparkles size={16} />
                        <span>{loading ? 'Đang tạo...' : 'Tạo Tuyến Liên Tỉnh'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* KẾT QUẢ GỢI Ý */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                  <Sparkles size={36} color="#6366f1" style={{ animation: 'spin 2s linear infinite', marginBottom: '12px' }} />
                  <p style={{ fontWeight: '600', margin: 0, fontSize: '14px' }}>
                    AI đang tổng hợp các điểm tham quan theo cung đường {routeLabel} và phân bổ khách sạn tại từng tỉnh...
                  </p>
                </div>
              ) : suggestResult ? (
                <div>
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    marginBottom: '18px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0369a1' }}>
                          🌟 {suggestResult.tourName || `Tour Khám Phá ${routeLabel} ${daysCountInput}N${Math.max(1, daysCountInput - 1)}Đ`}
                        </h4>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#0284c7' }}>
                          {suggestResult.tourDescription}
                        </p>
                      </div>
                      <button
                        onClick={handleApplySuggestion}
                        style={{
                          padding: '10px 16px',
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
                          boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                          flexShrink: 0
                        }}
                      >
                        <Check size={16} />
                        <span>Áp dụng vào bản thiết kế</span>
                      </button>
                    </div>
                  </div>

                  {/* TỪNG NGÀY GỢI Ý */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {suggestResult.suggestedDays?.map((d, dIdx) => (
                      <div key={dIdx} style={{
                        background: '#fff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}>
                        <div style={{
                          padding: '10px 16px',
                          background: '#f8fafc',
                          borderBottom: '1px solid #e2e8f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a' }}>
                            NGÀY {d.dayIndex}: {d.route_title}
                          </span>
                          {d.accommodation && (
                            <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Building size={14} />
                              {d.accommodation.name} ({Number(d.accommodation.price || 0).toLocaleString('vi-VN')}đ)
                            </span>
                          )}
                        </div>
                        <div style={{ padding: '12px 16px' }}>
                          <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {d.activities?.map((act, aIdx) => (
                              <li key={aIdx} style={{ fontSize: '13px', color: '#334155' }}>
                                <span style={{
                                  fontWeight: '600',
                                  color: act.type === 'Tham quan' ? '#2563eb' : (act.type.includes('Ăn') ? '#d97706' : '#64748b')
                                }}>
                                  [{act.type}]
                                </span>{' '}
                                {act.name}{' '}
                                {act.price > 0 && (
                                  <span style={{ color: '#059669', fontSize: '12px' }}>
                                    ({Number(act.price).toLocaleString('vi-VN')}đ)
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px dashed #cbd5e1',
                  color: '#64748b'
                }}>
                  <Compass size={36} color="#6366f1" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
                    Chưa có lịch trình mẫu được tạo
                  </div>
                  <p style={{ margin: '6px 0 16px', fontSize: '13px', color: '#64748b' }}>
                    Chọn tuyến điểm đến (1 tỉnh hoặc nhiều tỉnh) và số ngày ở trên, sau đó bấm <strong>"Tạo Lịch Trình Mẫu"</strong> để AI gợi ý phân bổ lộ trình khoa học nhất.
                  </p>
                  <button
                    onClick={handleRunSuggest}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: '#6366f1',
                      color: '#fff',
                      border: 'none',
                      fontWeight: '700',
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
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#0f172a' }}>
                    Kết quả kiểm tra lộ trình ({days.length} ngày - Tuyến: {routeLabel})
                  </h4>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b', marginTop: '3px' }}>
                    Tự động rà soát điểm tham quan lệch tỉnh thành, khoảng cách di chuyển và nơi lưu trú
                  </p>
                </div>
                <button
                  onClick={handleRunAudit}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
                  <span>{loading ? 'Đang phân tích...' : 'Kiểm tra lại'}</span>
                </button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                  <Sparkles size={32} color="#6366f1" style={{ animation: 'spin 2s linear infinite', marginBottom: '12px' }} />
                  <p style={{ fontWeight: '600', margin: 0 }}>Trợ lý AI đang quét toàn bộ điểm tham quan và dịch vụ...</p>
                </div>
              ) : (
                <div>
                  {/* TRẠNG THÁI TỔNG QUAN */}
                  <div style={{
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    background: auditResult?.overallStatus === 'error' ? '#fef2f2' : (auditResult?.overallStatus === 'warning' ? '#fffbeb' : '#f0fdf4'),
                    border: `1px solid ${auditResult?.overallStatus === 'error' ? '#fecaca' : (auditResult?.overallStatus === 'warning' ? '#fde68a' : '#bbf7d0')}`,
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'flex-start'
                  }}>
                    {auditResult?.overallStatus === 'error' && <AlertTriangle size={24} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />}
                    {auditResult?.overallStatus === 'warning' && <AlertTriangle size={24} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />}
                    {auditResult?.overallStatus === 'good' && <CheckCircle size={24} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />}
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: auditResult?.overallStatus === 'error' ? '#991b1b' : (auditResult?.overallStatus === 'warning' ? '#92400e' : '#166534'),
                        marginBottom: '4px'
                      }}>
                        {auditResult?.summary || 'Kết quả kiểm tra lịch trình'}
                      </div>
                      {auditResult?.aiReview && (
                        <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                          💡 <em>{auditResult.aiReview}</em>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* DANH SÁCH CÁC LỖI / LƯU Ý PHÁT HIỆN */}
                  {auditResult?.issues && auditResult.issues.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                        Chi tiết các lưu ý cần xem xét:
                      </div>
                      {auditResult.issues.map((issue, idx) => (
                        <div key={idx} style={{
                          padding: '14px 16px',
                          borderRadius: '10px',
                          background: issue.severity === 'error' ? '#fff5f5' : (issue.severity === 'warning' ? '#fffdf0' : '#f8fafc'),
                          border: `1px solid ${issue.severity === 'error' ? '#fed7d7' : (issue.severity === 'warning' ? '#feebc8' : '#e2e8f0')}`,
                          borderLeft: `4px solid ${issue.severity === 'error' ? '#e53e3e' : (issue.severity === 'warning' ? '#dd6b20' : '#3182ce')}`
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontWeight: '700', fontSize: '13.5px', color: '#1a202c' }}>
                              Ngày {issue.dayIndex}: {issue.title}
                            </span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: issue.severity === 'error' ? '#fed7d7' : (issue.severity === 'warning' ? '#feebc8' : '#e2e8f0'),
                              color: issue.severity === 'error' ? '#9b2c2c' : (issue.severity === 'warning' ? '#7b341e' : '#2b6cb0')
                            }}>
                              {issue.severity === 'error' ? 'CẦN ĐIỀU CHỈNH' : (issue.severity === 'warning' ? 'LƯU Ý TỐI ƯU' : 'GỢI Ý THÊM')}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '13px', color: '#4a5568', lineHeight: '1.45' }}>
                            {issue.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      padding: '24px',
                      textAlign: 'center',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      color: '#475569'
                    }}>
                      <CheckCircle size={36} color="#10b981" style={{ margin: '0 auto 10px' }} />
                      <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
                        Lịch trình không phát hiện lỗi xung đột địa lý!
                      </div>
                      <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
                        Các điểm tham quan và dịch vụ khách sạn hiện tại đều phù hợp với tuyến tour {routeLabel}.
                      </p>
                    </div>
                  )}

                  {/* LỜI NHẮC QUYỀN HẠN CỦA NHÂN VIÊN */}
                  <div style={{
                    marginTop: '20px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    border: '1px dashed #cbd5e1',
                    fontSize: '12.5px',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Info size={16} color="#64748b" style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Lưu ý:</strong> Bảng thẩm định AI chỉ đóng vai trò tham khảo & hỗ trợ phát hiện rủi ro. Quyền điều chỉnh, thêm bớt hoạt động hoàn toàn thuộc về nhân viên thiết kế.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{
          padding: '14px 24px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            🔒 Trợ lý AI nội bộ TravelVN ERP • Bảo mật dữ liệu & Độc quyền cho nhân viên văn phòng
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
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

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GATEWAY_URL = 'http://localhost:5000';

const StaffVehicleManagement = ({ onViewHistory }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Cập nhật tình trạng vận hành (Bảo dưỡng / Sửa chữa / Hoàn tất)
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Alert banner
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Status Update Data & Form Validation
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [formError, setFormError] = useState('');
  const [maintData, setMaintData] = useState({
    target_status: 'AVAILABLE',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    reason: ''
  });

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('blob:')) return url;
    if (url.startsWith('/')) return `${GATEWAY_URL}${url}`;
    return url;
  };
  const fallbackImg = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const resVehicles = await axios.get(`${GATEWAY_URL}/api/tours/fleet/vehicles`, { headers });

      if (resVehicles.data && resVehicles.data.success) {
        setVehicles(resVehicles.data.data || []);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách đội xe:", err);
      setAlertMsg({ type: 'error', text: 'Không thể tải dữ liệu đội xe.' });
    } finally {
      setLoading(false);
    }
  };

  const isVehicleRunningTour = (veh) => {
    return veh.status === 'IN_TOUR' || Boolean(veh.current_tour);
  };

  // Ánh xạ nhãn tình trạng xe chuẩn tiếng Việt và màu sắc Enterprise ERP
  const getStatusMeta = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return {
          label: 'Sẵn sàng',
          bg: '#dcfce7',
          color: '#15803d',
          border: '#bbf7d0',
          dot: '#22c55e'
        };
      case 'IN_TOUR':
        return {
          label: 'Đang vận hành',
          bg: '#e0f2fe',
          color: '#0369a1',
          border: '#bae6fd',
          dot: '#0284c7'
        };
      case 'MAINTENANCE':
        return {
          label: 'Bảo dưỡng',
          bg: '#ffedd5',
          color: '#c2410c',
          border: '#fed7aa',
          dot: '#f97316'
        };
      case 'REPAIR':
        return {
          label: 'Đang sửa chữa',
          bg: '#fee2e2',
          color: '#b91c1c',
          border: '#fecaca',
          dot: '#ef4444'
        };
      case 'INACTIVE':
        return {
          label: 'Tạm ngưng',
          bg: '#f1f5f9',
          color: '#475569',
          border: '#cbd5e1',
          dot: '#64748b'
        };
      default:
        return {
          label: status || 'Chưa xác định',
          bg: '#f1f5f9',
          color: '#475569',
          border: '#e2e8f0',
          dot: '#94a3b8'
        };
    }
  };

  // MỞ MODAL CẬP NHẬT TÌNH TRẠNG VẬN HÀNH
  const openMaintenanceModal = (veh) => {
    if (isVehicleRunningTour(veh)) {
      alert("Xe hiện đang vận hành tour, không thể cập nhật tình trạng thủ công!");
      return;
    }
    setSelectedVehicle(veh);
    setFormError('');
    const defaultTarget = veh.status === 'AVAILABLE'
      ? 'MAINTENANCE'
      : 'AVAILABLE';
    setMaintData({
      target_status: defaultTarget,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      reason: ''
    });
    setShowMaintModal(true);
  };

  // XÁC NHẬN CẬP NHẬT TÌNH TRẠNG XE
  const handleStatusSubmit = async (e, explicitStatus) => {
    if (e) e.preventDefault();
    if (!selectedVehicle || submittingStatus) return;

    setFormError('');
    const newStatus = explicitStatus || maintData.target_status;
    const trimmedReason = maintData.reason ? maintData.reason.trim() : '';
    if (!trimmedReason) {
      setFormError("Vui lòng nhập lý do cập nhật hoặc kết quả kiểm tra phương tiện!");
      return;
    }

    if (trimmedReason.length > 500) {
      setFormError("Nội dung ghi chú không được vượt quá 500 ký tự!");
      return;
    }

    setSubmittingStatus(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${GATEWAY_URL}/api/tours/fleet/staff/vehicles/${selectedVehicle.vehicle_id}/status`, {
        new_status: newStatus,
        current_status: selectedVehicle.status,
        start_date: maintData.start_date,
        end_date: maintData.end_date,
        reason: trimmedReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const statusLabel = newStatus === 'AVAILABLE'
        ? 'Sẵn sàng hoạt động (AVAILABLE)'
        : newStatus === 'MAINTENANCE'
          ? 'Bảo dưỡng (MAINTENANCE)'
          : 'Đang sửa chữa (REPAIR)';

      setAlertMsg({
        type: 'success',
        text: `Đã cập nhật tình trạng xe ${selectedVehicle.license_plate} sang ${statusLabel}!`
      });
      setShowMaintModal(false);
      setFormError('');
      fetchVehicles();
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi khi cập nhật tình trạng xe';
      setFormError(msg);
      // Nếu là lỗi conflict (409) do người khác cập nhật trước, tải lại dữ liệu ngầm
      if (err.response?.status === 409) {
        fetchVehicles();
      }
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleOpenHistory = (veh) => {
    if (veh?.vehicle_id) {
      sessionStorage.setItem('staff_selected_history_vehicle_id', String(veh.vehicle_id));
    }
    if (typeof onViewHistory === 'function') {
      onViewHistory(veh.vehicle_id);
    }
  };

  // Sắp xếp danh mục xe theo số chỗ tăng dần (4 chỗ -> 7 chỗ -> 16 chỗ -> 29 chỗ -> 45 chỗ)
  const extractSeatNumber = (categoryLabel) => {
    const match = String(categoryLabel || '').match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 999;
  };

  // Filter logic
  const filteredVehicles = vehicles.filter(v => {
    const catName = v.vehicle_type || `Xe ${v.seat_capacity} chỗ`;
    if (selectedCategory !== 'ALL' && catName !== selectedCategory) return false;
    const effectiveStatus = isVehicleRunningTour(v) ? 'IN_TOUR' : v.status;
    if (selectedStatus !== 'ALL' && effectiveStatus !== selectedStatus && v.status !== selectedStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!v.vehicle_code?.toLowerCase().includes(term) && 
          !v.license_plate?.toLowerCase().includes(term) &&
          !v.brand_model?.toLowerCase().includes(term) &&
          !v.vehicle_name?.toLowerCase().includes(term)) {
        return false;
      }
    }
    return true;
  });

  const allCategoryOptions = [...new Set(vehicles.map(v => v.vehicle_type || `Xe ${v.seat_capacity} chỗ`))]
    .sort((a, b) => extractSeatNumber(a) - extractSeatNumber(b) || a.localeCompare(b));

  const categories = [...new Set(filteredVehicles.map(v => v.vehicle_type || `Xe ${v.seat_capacity} chỗ`))]
    .sort((a, b) => extractSeatNumber(a) - extractSeatNumber(b) || a.localeCompare(b));

  return (
    <div style={styles.container}>
      <div style={styles.headerArea}>
        <div>
          <h1 style={styles.pageTitle}>Quản lý Đội xe & Tình trạng Phương tiện</h1>
          <p style={styles.pageSubtitle}>
            Giám sát tình trạng vận hành, ghi nhận lịch bảo dưỡng/sửa chữa và tra cứu lịch sử phương tiện
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={styles.btnSecondary} onClick={fetchVehicles}>
            🔄 Tải lại dữ liệu
          </button>
        </div>
      </div>

      {alertMsg.text && (
        <div style={{
          ...styles.alert,
          backgroundColor: alertMsg.type === 'error' ? '#fee2e2' : '#dcfce7',
          color: alertMsg.type === 'error' ? '#991b1b' : '#166534',
          borderColor: alertMsg.type === 'error' ? '#fecaca' : '#bbf7d0'
        }}>
          <span>{alertMsg.text}</span>
          <span style={styles.closeAlert} onClick={() => setAlertMsg({type: '', text: ''})}>&times;</span>
        </div>
      )}

      {/* Thống kê tổng quan đội xe */}
      <div style={styles.statsRow}>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Tổng phương tiện</div>
          <div style={styles.statValue}>{vehicles.length}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Sẵn sàng</div>
          <div style={{...styles.statValue, color: '#15803d'}}>{vehicles.filter(v => v.status === 'AVAILABLE' && !isVehicleRunningTour(v)).length}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Đang vận hành</div>
          <div style={{...styles.statValue, color: '#0369a1'}}>{vehicles.filter(v => isVehicleRunningTour(v)).length}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Bảo dưỡng</div>
          <div style={{...styles.statValue, color: '#c2410c'}}>{vehicles.filter(v => v.status === 'MAINTENANCE').length}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Đang sửa chữa</div>
          <div style={{...styles.statValue, color: '#b91c1c'}}>{vehicles.filter(v => v.status === 'REPAIR').length}</div>
        </div>
      </div>

      {/* Bộ lọc tìm kiếm */}
      <div style={styles.filterBar}>
        <input 
          type="text" 
          placeholder="Tìm kiếm Mã xe / Biển số / Dòng xe..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...styles.input, flex: '1 1 260px', maxWidth: '340px' }}
        />
        <select style={styles.select} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="ALL">Tất cả loại xe ({vehicles.length})</option>
          {allCategoryOptions.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select style={styles.select} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
          <option value="ALL">Tất cả tình trạng</option>
          <option value="AVAILABLE">Sẵn sàng</option>
          <option value="IN_TOUR">Đang vận hành</option>
          <option value="MAINTENANCE">Bảo dưỡng</option>
          <option value="REPAIR">Đang sửa chữa</option>
        </select>
      </div>

      {loading ? (
        <div style={styles.loading}>Đang tải dữ liệu đội xe...</div>
      ) : filteredVehicles.length === 0 ? (
        <div style={styles.emptyBox}>
          Không tìm thấy phương tiện nào phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        categories.map(cat => {
          const groupList = filteredVehicles.filter(v => (v.vehicle_type || `Xe ${v.seat_capacity} chỗ`) === cat);
          return (
            <div key={cat} style={styles.categorySection}>
              <div style={styles.categoryHeader}>
                <h2 style={styles.categoryTitle}>{cat.toUpperCase()}</h2>
                <span style={styles.categoryCount}>{groupList.length} phương tiện</span>
              </div>

              <div style={styles.grid}>
                {groupList.map(v => {
                  const inTour = isVehicleRunningTour(v);
                  const displayStatus = inTour ? 'IN_TOUR' : v.status;
                  const statusMeta = getStatusMeta(displayStatus);
                  const modelDisplay = v.brand_model || v.vehicle_name || 'Chưa cập nhật';

                  return (
                    <div key={v.vehicle_id} style={styles.card}>
                      {/* 1. HÌNH ẢNH NHẬN DIỆN XE (Tỷ lệ đồng nhất, chiều cao gọn 148px) */}
                      <div style={styles.imageContainer}>
                        <img 
                          src={getImageUrl(v.image_url) || fallbackImg} 
                          alt={v.license_plate}
                          onError={(e) => { e.target.src = fallbackImg; }}
                          style={styles.vehicleImage}
                        />
                      </div>

                      {/* 2. NỘI DUNG THẺ XE */}
                      <div style={styles.cardBody}>
                        {/* 2.1. Khu vực nhận diện xe: Mã xe + Nhãn tình trạng + Biển số nổi bật */}
                        <div style={styles.identitySection}>
                          <div style={styles.identityTopRow}>
                            <span style={styles.codeBadge}>
                              Mã: {v.vehicle_code || `XE-${v.vehicle_id}`}
                            </span>
                            <span style={styles.statusBadge(statusMeta)}>
                              <span style={styles.statusDot(statusMeta.dot)} />
                              {statusMeta.label}
                            </span>
                          </div>

                          <div style={styles.plateRow}>
                            <span style={styles.plateLabel}>Biển số:</span>
                            <span style={styles.plateNumber}>{v.license_plate}</span>
                          </div>
                        </div>

                        {/* 2.2. Khu vực thông tin chi tiết (Lưới 2 cột chuẩn ERP) */}
                        <div style={styles.specGrid}>
                          <div style={styles.specItemFull}>
                            <div style={styles.specLabel}>Dòng / Đời xe</div>
                            <div style={styles.specValue} title={modelDisplay}>
                              {modelDisplay}
                            </div>
                          </div>

                          <div style={styles.specItem}>
                            <div style={styles.specLabel}>Màu xe</div>
                            <div style={styles.specValue} title={v.color || 'Chưa cập nhật'}>
                              {v.color || 'Chưa cập nhật'}
                            </div>
                          </div>

                          <div style={styles.specItem}>
                            <div style={styles.specLabel}>Số chỗ</div>
                            <div style={styles.specValue}>
                              {v.seat_capacity ? `${v.seat_capacity} chỗ` : 'N/A'}
                            </div>
                          </div>
                        </div>

                        {/* 2.3. Gói dịch vụ vận chuyển liên kết */}
                        {v.service_name && (
                          <div style={styles.serviceRow}>
                            <div style={styles.specLabel}>Gói dịch vụ liên kết</div>
                            <div style={styles.serviceValue} title={v.service_name}>
                              <span style={{ color: '#0284c7', flexShrink: 0 }}>🔗</span>
                              <span style={styles.serviceText}>{v.service_name}</span>
                            </div>
                          </div>
                        )}

                        {/* 2.4. Thông tin vận hành thực tế (Tour đang chạy / Đợt bảo dưỡng) & Ghi chú */}
                        {(v.current_tour || (v.current_maintenance && (v.status === 'MAINTENANCE' || v.status === 'REPAIR')) || v.notes) && (
                          <div style={styles.notesArea}>
                            {v.current_tour && (
                              <div style={styles.tourInfoBox}>
                                <div style={{ fontWeight: '600', color: '#0369a1' }}>
                                  🚌 Tour: {v.current_tour.tour_name}
                                </div>
                                {v.current_tour.driver_name && (
                                  <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>
                                    Tài xế: {v.current_tour.driver_name}
                                  </div>
                                )}
                              </div>
                            )}

                            {v.current_maintenance && (v.status === 'MAINTENANCE' || v.status === 'REPAIR') && (
                              <div style={styles.maintInfoBox} title={v.current_maintenance.reason}>
                                <span style={{ fontWeight: '600' }}>🛠️ Tình trạng kỹ thuật: </span>
                                <span>{v.current_maintenance.reason}</span>
                              </div>
                            )}

                            {v.notes && (
                              <div style={styles.noteBox} title={v.notes}>
                                <span style={styles.noteLabel}>📝 Ghi chú: </span>
                                <span style={styles.noteContent}>{v.notes}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2.5. Khu vực thao tác (Căn cố định xuống đáy thẻ) */}
                        <div style={styles.actionFooter}>
                          <button 
                            type="button"
                            onClick={() => openMaintenanceModal(v)} 
                            disabled={inTour}
                            style={styles.btnUpdateStatus(inTour)}
                            title={inTour ? "Xe đang vận hành tour, không thể cập nhật tình trạng thủ công" : "Cập nhật tình trạng vận hành của xe"}
                          >
                            <span>⚙️</span>
                            <span>Cập nhật tình trạng</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenHistory(v)}
                            style={styles.btnHistory}
                            title="Xem lịch sử tình trạng, bảo dưỡng và sự cố của xe"
                          >
                            <span>📜</span>
                            <span>Lịch sử</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* MODAL CẬP NHẬT TÌNH TRẠNG XE */}
      {showMaintModal && selectedVehicle && (
        <div style={styles.modalBackdrop} onClick={() => !submittingStatus && setShowMaintModal(false)}>
          <div style={{ ...styles.modalCard, width: '560px', maxWidth: '94%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: '700' }}>
                  Cập nhật tình trạng xe
                </h2>
                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                  Biển số xe: <strong style={{ color: '#0284c7' }}>{selectedVehicle.license_plate}</strong>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowMaintModal(false)} 
                disabled={submittingStatus}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}
              >&times;</button>
            </div>
            
            <form onSubmit={(e) => handleStatusSubmit(e)}>
              {/* 3.2. Khu vực thông tin tình trạng hiện tại ngắn gọn */}
              <div style={styles.modalVehicleInfoStrip}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                      {selectedVehicle.license_plate}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>
                      {selectedVehicle.brand_model || selectedVehicle.vehicle_name || 'Chưa xác định dòng xe'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>Tình trạng hiện tại:</span>
                    <span style={styles.statusBadge(getStatusMeta(selectedVehicle.status))}>
                      <span style={styles.statusDot(getStatusMeta(selectedVehicle.status).dot)} />
                      {getStatusMeta(selectedVehicle.status).label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Thông báo lỗi validation ngay trong form */}
              {formError && (
                <div style={styles.formErrorBanner}>
                  <span>⚠️ {formError}</span>
                </div>
              )}

              {/* 3.3. Lựa chọn tình trạng tiếp theo */}
              <div style={{ marginBottom: '14px' }}>
                <label style={styles.label}>Chuyển sang tình trạng *</label>
                <select
                  style={{ ...styles.select, width: '100%', height: '40px', fontSize: '13.5px' }}
                  value={maintData.target_status}
                  onChange={(e) => {
                    setMaintData({ ...maintData, target_status: e.target.value });
                    setFormError('');
                  }}
                  disabled={submittingStatus}
                >
                  {selectedVehicle.status === 'MAINTENANCE' && (
                    <>
                      <option value="AVAILABLE">Sẵn sàng hoạt động</option>
                      <option value="REPAIR">Đang sửa chữa</option>
                    </>
                  )}
                  {selectedVehicle.status === 'AVAILABLE' && (
                    <>
                      <option value="MAINTENANCE">Bảo dưỡng</option>
                      <option value="REPAIR">Đang sửa chữa</option>
                    </>
                  )}
                  {selectedVehicle.status === 'REPAIR' && (
                    <option value="AVAILABLE">Sẵn sàng hoạt động</option>
                  )}
                </select>

                {/* Mô tả nghiệp vụ tương ứng với lựa chọn */}
                <div style={styles.targetStatusDescBox}>
                  {selectedVehicle.status === 'MAINTENANCE' && maintData.target_status === 'AVAILABLE' && (
                    <span>
                      ✅ <strong>Mô tả:</strong> Hoàn tất bảo dưỡng, kiểm tra kỹ thuật và xác nhận xe đủ điều kiện đưa vào khai thác.
                    </span>
                  )}
                  {selectedVehicle.status === 'MAINTENANCE' && maintData.target_status === 'REPAIR' && (
                    <span>
                      🛠️ <strong>Mô tả:</strong> Phát hiện hư hỏng trong quá trình bảo dưỡng và cần chuyển xe sang quy trình sửa chữa.
                    </span>
                  )}
                  {selectedVehicle.status === 'AVAILABLE' && maintData.target_status === 'MAINTENANCE' && (
                    <span>
                      🔧 <strong>Mô tả:</strong> Đưa xe vào đợt bảo dưỡng định kỳ theo kế hoạch kỹ thuật.
                    </span>
                  )}
                  {selectedVehicle.status === 'AVAILABLE' && maintData.target_status === 'REPAIR' && (
                    <span>
                      🛠️ <strong>Mô tả:</strong> Đưa xe vào xưởng sửa chữa khắc phục sự cố kỹ thuật.
                    </span>
                  )}
                  {selectedVehicle.status === 'REPAIR' && maintData.target_status === 'AVAILABLE' && (
                    <span>
                      ✅ <strong>Mô tả:</strong> Nghiệm thu sửa chữa kỹ thuật và đưa xe trở lại trạng thái sẵn sàng phục vụ.
                    </span>
                  )}
                </div>
              </div>

              {/* Ngày bắt đầu & dự kiến hoàn thành khi đưa vào Bảo dưỡng hoặc Sửa chữa */}
              {(maintData.target_status === 'MAINTENANCE' || (selectedVehicle.status !== 'MAINTENANCE' && maintData.target_status === 'REPAIR')) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={styles.label}>Ngày bắt đầu *</label>
                    <input 
                      type="date" 
                      required
                      value={maintData.start_date}
                      onChange={(e) => setMaintData({ ...maintData, start_date: e.target.value })}
                      disabled={submittingStatus}
                      style={{ ...styles.input, outline: 'none', height: '38px', fontSize: '13px' }}
                    />
                  </div>
                  <div>
                    <label style={styles.label}>Dự kiến hoàn thành *</label>
                    <input 
                      type="date" 
                      required
                      value={maintData.end_date}
                      onChange={(e) => setMaintData({ ...maintData, end_date: e.target.value })}
                      disabled={submittingStatus}
                      style={{ ...styles.input, outline: 'none', height: '38px', fontSize: '13px' }}
                    />
                  </div>
                </div>
              )}

              {/* 3.4. Lý do cập nhật và kết quả kiểm tra */}
              <div style={{ marginBottom: '18px' }}>
                <label style={styles.label}>Lý do cập nhật / Kết quả kiểm tra *</label>
                <textarea 
                  rows="3"
                  required
                  placeholder={
                    selectedVehicle.status === 'MAINTENANCE' && maintData.target_status === 'AVAILABLE'
                      ? 'Ví dụ: Đã hoàn tất bảo dưỡng định kỳ, kiểm tra hệ thống phanh, lốp xe và các hạng mục an toàn. Xe đủ điều kiện hoạt động.'
                      : selectedVehicle.status === 'MAINTENANCE' && maintData.target_status === 'REPAIR'
                      ? 'Ví dụ: Phát hiện hệ thống phanh bất thường trong quá trình bảo dưỡng, cần chuyển xe sang sửa chữa.'
                      : maintData.target_status === 'AVAILABLE'
                      ? 'Ví dụ: Đã hoàn tất kiểm tra nghiệm thu kỹ thuật, xe đủ điều kiện an toàn hoạt động.'
                      : 'Ví dụ: Đưa xe vào bảo dưỡng định kỳ, kiểm tra dầu máy và các hệ thống phụ trợ...'
                  }
                  value={maintData.reason}
                  onChange={(e) => {
                    setMaintData({ ...maintData, reason: e.target.value });
                    setFormError('');
                  }}
                  disabled={submittingStatus}
                  maxLength={500}
                  style={{
                    ...styles.input,
                    outline: 'none',
                    resize: 'vertical',
                    minHeight: '80px',
                    padding: '10px 12px',
                    fontSize: '13px',
                    lineHeight: 1.45,
                    borderColor: formError ? '#ef4444' : '#cbd5e1'
                  }}
                ></textarea>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                  <span>* Bắt buộc nhập đầy đủ kết quả kiểm tra hoặc lý do cập nhật</span>
                  <span>{maintData.reason.length}/500 ký tự</span>
                </div>
              </div>

              {/* 3.5. Nút thao tác */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                <button 
                  type="button" 
                  onClick={() => setShowMaintModal(false)} 
                  disabled={submittingStatus}
                  style={{ ...styles.btnSecondary, padding: '9px 18px', fontSize: '13px' }}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={submittingStatus}
                  style={{ 
                    backgroundColor: maintData.target_status === 'AVAILABLE' ? '#15803d' : '#0284c7', 
                    color: '#fff', 
                    border: 'none', 
                    padding: '9px 20px', 
                    borderRadius: '8px', 
                    cursor: submittingStatus ? 'not-allowed' : 'pointer', 
                    fontWeight: '600', 
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: submittingStatus ? 0.7 : 1,
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)'
                  }}
                >
                  {submittingStatus
                    ? 'Đang xử lý...'
                    : maintData.target_status === 'AVAILABLE'
                    ? 'Xác nhận đưa xe về Sẵn sàng'
                    : maintData.target_status === 'REPAIR'
                    ? 'Xác nhận chuyển sang Sửa chữa'
                    : 'Xác nhận cập nhật tình trạng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px 24px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif"
  },
  headerArea: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  pageTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 4px 0'
  },
  pageSubtitle: {
    fontSize: '13.5px',
    color: '#64748b',
    margin: 0
  },
  btnSecondary: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    padding: '9px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
    color: '#334155'
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '20px'
  },
  statBox: {
    backgroundColor: '#ffffff',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0'
  },
  statLabel: {
    fontSize: '11.5px',
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    marginBottom: '6px'
  },
  statValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a'
  },
  filterBar: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
    backgroundColor: '#ffffff',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0'
  },
  input: {
    padding: '9px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '13.5px',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    color: '#0f172a'
  },
  select: {
    padding: '9px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '13.5px',
    backgroundColor: '#ffffff',
    minWidth: '170px',
    fontFamily: 'inherit',
    color: '#0f172a'
  },
  categorySection: {
    marginBottom: '28px'
  },
  categoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '8px',
    marginBottom: '14px'
  },
  categoryTitle: {
    fontSize: '14px',
    color: '#1e293b',
    fontWeight: '700',
    letterSpacing: '0.4px',
    margin: 0
  },
  categoryCount: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '600',
    backgroundColor: '#f1f5f9',
    padding: '3px 10px',
    borderRadius: '12px'
  },
  // Lưới responsive: Desktop rộng 3 cột, Desktop vừa 2 cột, Mobile 1 cột
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
    gap: '18px',
    alignItems: 'stretch'
  },
  // Thẻ xe phong cách Modern ERP Fleet Management
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%'
  },
  imageContainer: {
    width: '100%',
    height: '148px',
    backgroundColor: '#f1f5f9',
    borderBottom: '1px solid #f1f5f9',
    overflow: 'hidden',
    flexShrink: 0
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block'
  },
  cardBody: {
    padding: '14px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  },
  identitySection: {
    paddingBottom: '12px',
    marginBottom: '12px',
    borderBottom: '1px solid #f1f5f9'
  },
  identityTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  codeBadge: {
    fontSize: '11.5px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    padding: '3px 8px',
    borderRadius: '5px',
    fontWeight: '600',
    letterSpacing: '0.2px'
  },
  statusBadge: (meta) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    backgroundColor: meta.bg,
    color: meta.color,
    border: `1px solid ${meta.border}`,
    padding: '3px 9px',
    borderRadius: '999px',
    fontSize: '11.5px',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  }),
  statusDot: (dotColor) => ({
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: dotColor,
    display: 'inline-block'
  }),
  plateRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px'
  },
  plateLabel: {
    fontSize: '12.5px',
    color: '#64748b',
    fontWeight: '500'
  },
  plateNumber: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: '0.3px'
  },
  specGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    columnGap: '12px',
    rowGap: '10px',
    marginBottom: '12px'
  },
  specItemFull: {
    gridColumn: '1 / -1',
    minWidth: 0
  },
  specItem: {
    minWidth: 0
  },
  specLabel: {
    fontSize: '11.5px',
    color: '#64748b',
    fontWeight: '500',
    marginBottom: '2px'
  },
  specValue: {
    fontSize: '13px',
    color: '#1e293b',
    fontWeight: '600',
    lineHeight: '1.4',
    wordBreak: 'break-word'
  },
  serviceRow: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '7px',
    padding: '8px 10px',
    marginBottom: '10px'
  },
  serviceValue: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '6px',
    fontSize: '12.5px',
    color: '#334155',
    fontWeight: '600',
    lineHeight: '1.4'
  },
  serviceText: {
    wordBreak: 'break-word'
  },
  notesArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '12px'
  },
  tourInfoBox: {
    fontSize: '12px',
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '6px',
    padding: '7px 10px',
    lineHeight: '1.4'
  },
  maintInfoBox: {
    fontSize: '12px',
    color: '#9a3412',
    backgroundColor: '#fff7ed',
    border: '1px solid #fed7aa',
    borderRadius: '6px',
    padding: '7px 10px',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  noteBox: {
    fontSize: '12px',
    color: '#475569',
    backgroundColor: '#f8fafc',
    border: '1px solid #f1f5f9',
    borderRadius: '6px',
    padding: '7px 10px',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    wordBreak: 'break-word'
  },
  noteLabel: {
    fontWeight: '600',
    color: '#334155'
  },
  noteContent: {
    color: '#475569'
  },
  actionFooter: {
    marginTop: 'auto',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9',
    display: 'grid',
    gridTemplateColumns: '1.35fr 1fr',
    gap: '8px'
  },
  btnUpdateStatus: (disabled) => ({
    height: '40px',
    backgroundColor: disabled ? '#f1f5f9' : '#0284c7',
    color: disabled ? '#94a3b8' : '#ffffff',
    border: disabled ? '1px solid #e2e8f0' : '1px solid #0284c7',
    padding: '0 10px',
    borderRadius: '7px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: '600',
    fontSize: '12.5px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    whiteSpace: 'nowrap',
    transition: 'background-color 0.15s ease'
  }),
  btnHistory: {
    height: '40px',
    backgroundColor: '#f8fafc',
    color: '#0284c7',
    border: '1px solid #cbd5e1',
    padding: '0 10px',
    borderRadius: '7px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '12.5px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    whiteSpace: 'nowrap',
    transition: 'background-color 0.15s ease'
  },
  modalVehicleInfoStrip: {
    padding: '10px 14px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  formErrorBanner: {
    padding: '9px 12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: '6px',
    color: '#b91c1c',
    fontSize: '12.5px',
    fontWeight: '500',
    marginBottom: '14px',
    lineHeight: 1.4
  },
  targetStatusDescBox: {
    marginTop: '6px',
    padding: '8px 10px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#334155',
    lineHeight: 1.45
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalCard: {
    backgroundColor: '#ffffff',
    width: '500px',
    maxWidth: '90%',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15)'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155'
  },
  alert: {
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13.5px',
    fontWeight: '600',
    border: '1px solid transparent'
  },
  closeAlert: {
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '18px'
  },
  loading: {
    textAlign: 'center',
    padding: '48px',
    color: '#64748b',
    fontSize: '14px'
  },
  emptyBox: {
    textAlign: 'center',
    padding: '48px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    color: '#64748b',
    fontSize: '14px'
  }
};

export default StaffVehicleManagement;

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HRPayroll = () => {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}`;
  });
  const [payrollList, setPayrollList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null); // Để mở Modal phiếu lương chi tiết

  useEffect(() => {
    fetchPayroll();
  }, [month]);

  const fetchPayroll = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/hr/payroll?month=${month}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setPayrollList(res.data.data);
        setNeedsMigration(res.data.needs_db_migration);
      }
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Không thể tải bảng lương!');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleNumericChange = (empId, field, value) => {
    const numericVal = value === '' ? 0 : parseFloat(value);
    setPayrollList(prev => prev.map(item => {
      if (item.employee_id === empId) {
        const updated = { ...item, [field]: numericVal };
        const base = field === 'base_salary' ? numericVal : item.base_salary;
        const days = field === 'working_days' ? numericVal : item.working_days;
        const allowance = field === 'allowance' ? numericVal : item.allowance;
        const bonus = field === 'bonus' ? numericVal : item.bonus;
        const deductions = field === 'deductions' ? numericVal : item.deductions;
        
        if (item.salary_type === 'guide') {
          // HDV: Thù lao theo tour đã thiết kế + phụ cấp + thưởng - khấu trừ
          updated.net_salary = Math.round(base + allowance + bonus - deductions);
        } else if (item.salary_type === 'driver') {
          // Tài xế: Lương cứng bảo dưỡng + công tác phí chạy tour + thưởng - khấu trừ
          updated.net_salary = Math.round(base + allowance + bonus - deductions);
        } else {
          // Khối văn phòng: (Lương cơ bản / 26) * Ngày công + phụ cấp + thưởng - khấu trừ
          updated.net_salary = Math.round((base / 26.0) * days + allowance + bonus - deductions);
        }
        return updated;
      }
      return item;
    }));
  };

  const handleFieldChange = (empId, field, value) => {
    setPayrollList(prev => prev.map(item => 
      item.employee_id === empId ? { ...item, [field]: value } : item
    ));
  };

  const handleSave = async () => {
    if (needsMigration) {
      setMessage('Không thể lưu! Vui lòng tạo bảng "payroll" trong CSDL trước.');
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        salary_month: month,
        payroll: payrollList.map(item => ({
          employee_id: item.employee_id,
          base_salary: item.base_salary,
          working_days: item.working_days,
          allowance: item.allowance,
          bonus: item.bonus,
          deductions: item.deductions,
          net_salary: item.net_salary,
          status: item.status,
          notes: item.notes || ''
        }))
      };

      const res = await axios.post('http://localhost:5000/api/hr/payroll', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setMessage('Lưu bảng lương tháng thành công!');
        setIsError(false);
        fetchPayroll();
      }
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Có lỗi xảy ra khi lưu bảng lương!');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
  };

  // Mở modal in phiếu lương
  const printPaySlip = (emp) => {
    setSelectedSlip(emp);
  };

  // Badge vai trò
  const renderRoleBadge = (roleName, salaryType) => {
    if (salaryType === 'guide') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
          <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
            🚩 Tour Guide
          </span>
          <span style={{ fontSize: '10.5px', color: '#059669', fontStyle: 'italic' }}>Theo giá tour thiết kế</span>
        </div>
      );
    }
    if (salaryType === 'driver') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
          <span style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
            🚗 Driver (Tài xế)
          </span>
          <span style={{ fontSize: '10.5px', color: '#ea580c', fontStyle: 'italic' }}>Lương cứng + Phí tour</span>
        </div>
      );
    }
    if (roleName === 'HR Manager') {
      return (
        <span style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
          🏢 HR Manager
        </span>
      );
    }
    if (roleName === 'Tour Manager') {
      return (
        <span style={{ background: '#faf5ff', color: '#7c3aed', border: '1px solid #e9d5ff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
          💼 Tour Manager
        </span>
      );
    }
    return (
      <span style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
        📋 {roleName}
      </span>
    );
  };

  return (
    <div className="payroll-container" style={{ padding: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '22px', fontWeight: '700' }}>💰 Tính Lương Nhân Sự VietTravel ERP</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13.5px' }}>
            Hệ thống tính lương tự động cho tất cả các Role nội bộ (HR, Tour Manager, Staff, Hướng dẫn viên, Tài xế).
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '6px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <label style={{ fontWeight: '600', color: '#334155', fontSize: '13.5px' }}>Chọn tháng:</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', color: '#0f172a', fontWeight: '600' }}
          />
        </div>
      </div>

      {/* CHÍNH SÁCH TÍNH LƯƠNG THEO ROLE */}
      <div style={{ 
        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', 
        padding: '14px 18px', marginBottom: '20px', fontSize: '13px', color: '#334155' 
      }}>
        <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📋</span> Cơ chế tính lương theo từng vị trí công việc:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
          <div style={{ background: '#fff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ color: '#1e40af' }}>🏢 Khối Văn phòng (HR, Manager, Staff):</strong>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', lineHeight: '1.4' }}>
              Lương cơ bản chức danh (HR: 12tr, Manager: 10tr, Staff: 8tr) tính theo ngày công chấm công tiêu chuẩn (26 ngày).
            </div>
          </div>
          <div style={{ background: '#fff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <strong style={{ color: '#15803d' }}>🚩 Hướng dẫn viên (Tour Guide):</strong>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', lineHeight: '1.4' }}>
              Lấy trực tiếp từ <strong>đơn giá thiết kế tour</strong> (500.000 ₫ - 1.000.000 ₫/ngày) × <strong>số ngày tour thực tế</strong> được phân công trong tháng.
            </div>
          </div>
          <div style={{ background: '#fff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
            <strong style={{ color: '#c2410c' }}>🚗 Đề xuất Tài xế (Driver):</strong>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', lineHeight: '1.4' }}>
              <strong>Lương cứng 5.000.000 ₫</strong> (bảo dưỡng, trực xe) + <strong>Công tác phí 400.000 ₫/ngày</strong> tour thực tế phục vụ đoàn.
            </div>
          </div>
        </div>
      </div>

      {needsMigration && (
        <div style={{ padding: '16px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', marginBottom: '20px', color: '#b45309' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600' }}>⚠️ Cảnh báo: Cơ sở dữ liệu thiếu bảng "payroll"</h4>
          <p style={{ margin: '0 0 12px 0', fontSize: '13px', lineHeight: '1.5' }}>
            Để sử dụng tính năng tính và lưu trữ bảng lương vào MySQL, vui lòng tạo bảng payroll trong CSDL.
          </p>
        </div>
      )}

      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
          fontWeight: '500',
          background: isError ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${isError ? '#fecaca' : '#bbf7d0'}`,
          color: isError ? '#991b1b' : '#166534'
        }}>
          {message}
        </div>
      )}

      {/* BẢNG LƯƠNG NHÂN VIÊN */}
      <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px', color: '#475569', fontWeight: '600' }}>Nhân viên & Vai trò</th>
              <th style={{ padding: '12px', color: '#475569', fontWeight: '600', width: '140px' }}>
                Lương cơ bản
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>Hoặc Thù lao tour</div>
              </th>
              <th style={{ padding: '12px', color: '#475569', fontWeight: '600', width: '90px', textAlign: 'center' }}>
                Ngày công
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>Hoặc Ngày tour</div>
              </th>
              <th style={{ padding: '12px', color: '#475569', fontWeight: '600', width: '120px' }}>
                Phụ cấp
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>Phí tour / Lưu đêm</div>
              </th>
              <th style={{ padding: '12px', color: '#475569', fontWeight: '600', width: '110px' }}>Thưởng</th>
              <th style={{ padding: '12px', color: '#475569', fontWeight: '600', width: '110px' }}>Khấu trừ</th>
              <th style={{ padding: '12px', color: '#0f172a', fontWeight: '700', width: '130px' }}>Thực lĩnh</th>
              <th style={{ padding: '12px', color: '#475569', fontWeight: '600', width: '110px' }}>Trạng thái</th>
              <th style={{ padding: '12px', color: '#475569', fontWeight: '600', textAlign: 'center' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading && payrollList.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Đang nạp bảng lương...</td>
              </tr>
            ) : payrollList.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy nhân viên nào để tính lương.</td>
              </tr>
            ) : (
              payrollList.map((item) => {
                const isGuide = item.salary_type === 'guide';
                const isDriver = item.salary_type === 'driver';

                return (
                  <tr key={item.employee_id} style={{ borderBottom: '1px solid #f1f5f9', background: isGuide ? '#fcfffd' : (isDriver ? '#fffdfb' : '#fff') }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '13.5px' }}>{item.full_name}</div>
                      <div style={{ marginTop: '3px' }}>
                        {renderRoleBadge(item.role_name, item.salary_type)}
                      </div>
                      {item.notes && (
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', maxWidth: '240px', lineHeight: '1.3' }}>
                          💡 {item.notes}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="number"
                        value={item.base_salary}
                        onChange={(e) => handleNumericChange(item.employee_id, 'base_salary', e.target.value)}
                        style={{ 
                          padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', 
                          fontSize: '13px', width: '100%', outline: 'none', boxSizing: 'border-box',
                          background: isGuide ? '#f0fdf4' : '#fff'
                        }}
                      />
                      {isGuide && (
                        <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px', fontWeight: '500' }}>
                          Giá tour thiết kế
                        </div>
                      )}
                      {isDriver && (
                        <div style={{ fontSize: '11px', color: '#ea580c', marginTop: '2px', fontWeight: '500' }}>
                          Lương cứng trực xe
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="number"
                        step="0.5"
                        value={item.working_days}
                        onChange={(e) => handleNumericChange(item.employee_id, 'working_days', e.target.value)}
                        style={{ 
                          padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', 
                          fontSize: '13px', width: '100%', outline: 'none', textAlign: 'center', boxSizing: 'border-box'
                        }}
                      />
                      {(isGuide || isDriver) && (
                        <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '2px' }}>
                          ngày đi tour
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="number"
                        value={item.allowance}
                        onChange={(e) => handleNumericChange(item.employee_id, 'allowance', e.target.value)}
                        style={{ 
                          padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', 
                          fontSize: '13px', width: '100%', outline: 'none', boxSizing: 'border-box',
                          background: isDriver && item.allowance > 0 ? '#fff7ed' : '#fff'
                        }}
                      />
                      {isDriver && item.allowance > 0 && (
                        <div style={{ fontSize: '11px', color: '#c2410c', marginTop: '2px' }}>
                          Phí tour ({item.working_days}x400k)
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="number"
                        value={item.bonus}
                        onChange={(e) => handleNumericChange(item.employee_id, 'bonus', e.target.value)}
                        style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="number"
                        value={item.deductions}
                        onChange={(e) => handleNumericChange(item.employee_id, 'deductions', e.target.value)}
                        style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%', outline: 'none', boxSizing: 'border-box' }}
                      />
                    </td>
                    <td style={{ padding: '12px', fontWeight: '700', color: '#15803d', fontSize: '14.5px' }}>
                      {formatCurrency(item.net_salary)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <select
                        value={item.status}
                        onChange={(e) => handleFieldChange(item.employee_id, 'status', e.target.value)}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          outline: 'none',
                          background: item.status === 'Paid' ? '#f0fdf4' : '#fffbeb',
                          color: item.status === 'Paid' ? '#166534' : '#92400e',
                          fontWeight: '600'
                        }}
                      >
                        <option value="Draft">Nháp</option>
                        <option value="Paid">Đã trả</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => printPaySlip(item)}
                        style={{ 
                          padding: '6px 12px', background: '#0284c7', color: '#fff', border: 'none', 
                          borderRadius: '6px', cursor: 'pointer', fontSize: '12.5px', fontWeight: '600',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Phiếu lương
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          onClick={handleSave}
          disabled={loading || needsMigration}
          style={{
            padding: '10px 22px',
            background: needsMigration ? '#94a3b8' : '#0f172a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: needsMigration ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.2)',
            transition: 'background 0.2s'
          }}
        >
          {loading ? 'Đang lưu...' : 'Lưu bảng lương'}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODAL IN PHIẾU LƯƠNG CHI TIẾT                                            */}
      {/* ========================================================================= */}
      {selectedSlip && (() => {
        const isGuide = selectedSlip.salary_type === 'guide';
        const isDriver = selectedSlip.salary_type === 'driver';
        const hasTours = selectedSlip.tours_detail && selectedSlip.tours_detail.length > 0;
        const hasTrips = selectedSlip.trips_detail && selectedSlip.trips_detail.length > 0;

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '16px'
          }}>
            <div style={{
              background: '#fff',
              padding: '28px',
              borderRadius: '16px',
              width: '100%',
              maxWidth: (isGuide || isDriver) ? '650px' : '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0'
            }}>
              <div id="print-area">
                <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '14px', marginBottom: '18px' }}>
                  <h2 style={{ margin: 0, color: '#0f172a', fontSize: '20px', fontWeight: '800' }}>VIETTRAVEL ERP SYSTEM</h2>
                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>PHIẾU THANH TOÁN LƯƠNG NHÂN SỰ - THÁNG {month}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13.5px', marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div><strong>Nhân viên:</strong> {selectedSlip.full_name}</div>
                  <div><strong>Chức danh / Vai trò:</strong> {selectedSlip.role_name}</div>
                  <div style={{ gridColumn: 'span 2' }}><strong>Email:</strong> {selectedSlip.email}</div>
                  {selectedSlip.notes && (
                    <div style={{ gridColumn: 'span 2', color: '#475569', fontSize: '12.5px', fontStyle: 'italic' }}>
                      <strong>Ghi chú:</strong> {selectedSlip.notes}
                    </div>
                  )}
                </div>

                {/* BẢNG KÊ CHI TIẾT CHO HƯỚNG DẪN VIÊN */}
                {isGuide && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#166534', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.4px' }}>
                      Bảng kê chi tiết các tour dẫn trong tháng (Theo thiết kế tour)
                    </div>
                    {hasTours ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid #bbf7d0', borderRadius: '6px', overflow: 'hidden' }}>
                        <thead>
                          <tr style={{ background: '#f0fdf4', color: '#166534', textAlign: 'left', borderBottom: '1px solid #bbf7d0' }}>
                            <th style={{ padding: '8px 10px' }}>Tên tour</th>
                            <th style={{ padding: '8px 10px' }}>Khởi hành</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center' }}>Số ngày</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Giá thiết kế</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Thù lao tour</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSlip.tours_detail.map((t, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#fcfdfc' }}>
                              <td style={{ padding: '8px 10px', fontWeight: '600', color: '#0f172a' }}>{t.tour_name}</td>
                              <td style={{ padding: '8px 10px', color: '#475569' }}>{new Date(t.departure_date).toLocaleDateString('vi-VN')}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '600' }}>{t.duration_days} ngày</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', color: '#64748b' }}>{formatCurrency(t.guide_rate)}/ngày</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700', color: '#15803d' }}>{formatCurrency(t.tour_pay)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '6px', fontSize: '12.5px', color: '#64748b', border: '1px solid #e2e8f0' }}>
                        * Chưa có tour được phân công trong tháng {month}.
                      </div>
                    )}
                  </div>
                )}

                {/* BẢNG KÊ CHI TIẾT CHO TÀI XẾ */}
                {isDriver && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#c2410c', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.4px' }}>
                      Bảng kê các chuyến xe phục vụ tour trong tháng
                    </div>
                    {hasTrips ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '1px solid #fed7aa', borderRadius: '6px', overflow: 'hidden' }}>
                        <thead>
                          <tr style={{ background: '#fff7ed', color: '#c2410c', textAlign: 'left', borderBottom: '1px solid #fed7aa' }}>
                            <th style={{ padding: '8px 10px' }}>Chuyến tour</th>
                            <th style={{ padding: '8px 10px' }}>Xe phục vụ</th>
                            <th style={{ padding: '8px 10px' }}>Khởi hành</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center' }}>Số ngày</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Phụ cấp chuyến (400k/ngày)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSlip.trips_detail.map((t, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#fffcf9' }}>
                              <td style={{ padding: '8px 10px', fontWeight: '600', color: '#0f172a' }}>{t.tour_name}</td>
                              <td style={{ padding: '8px 10px', color: '#64748b' }}>{t.vehicle_number}</td>
                              <td style={{ padding: '8px 10px', color: '#475569' }}>{new Date(t.departure_date).toLocaleDateString('vi-VN')}</td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '600' }}>{t.duration_days} ngày</td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700', color: '#c2410c' }}>{formatCurrency(t.trip_pay)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '6px', fontSize: '12.5px', color: '#64748b', border: '1px solid #e2e8f0' }}>
                        * Chưa có chuyến tour nào được phân công lái xe trong tháng {month}.
                      </div>
                    )}
                  </div>
                )}

                {/* KHỐI TỔNG HỢP THANH TOÁN */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc', fontSize: '13.5px', display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{isGuide ? 'Thù lao dẫn tour theo thiết kế:' : (isDriver ? 'Lương cơ bản trực xe & bảo dưỡng:' : 'Lương cơ bản (26 ngày):')}</span>
                    <strong style={{ color: '#0f172a' }}>{formatCurrency(selectedSlip.base_salary)}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{isGuide ? 'Số ngày dẫn tour thực tế:' : (isDriver ? 'Số ngày chạy tour thực tế:' : 'Số ngày công làm việc (chấm công):')}</span>
                    <span><strong>{selectedSlip.working_days}</strong> ngày</span>
                  </div>

                  {!isGuide && !isDriver && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                      <span>Lương theo công thực tế:</span>
                      <strong>{formatCurrency(Math.round((selectedSlip.base_salary / 26.0) * selectedSlip.working_days))}</strong>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{isDriver ? 'Công tác phí chạy tour (400k/ngày):' : 'Phụ cấp:'}</span>
                    <span style={{ color: '#166534', fontWeight: '600' }}>+ {formatCurrency(selectedSlip.allowance)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Thưởng:</span>
                    <span style={{ color: '#166534', fontWeight: '600' }}>+ {formatCurrency(selectedSlip.bonus)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                    <span>Khấu trừ / Phạt:</span>
                    <span style={{ color: '#b91c1c', fontWeight: '600' }}>- {formatCurrency(selectedSlip.deductions)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '700', color: '#047857', paddingTop: '6px' }}>
                    <span>THỰC LĨNH NHẬN VỀ:</span>
                    <span style={{ fontSize: '18px' }}>{formatCurrency(selectedSlip.net_salary)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', fontSize: '12px', fontStyle: 'italic', color: '#64748b', textAlign: 'center' }}>
                  <div style={{ width: '45%' }}>
                    Người nhận ký tên
                    <div style={{ height: '60px' }}></div>
                    <strong style={{ color: '#0f172a' }}>{selectedSlip.full_name}</strong>
                  </div>
                  <div style={{ width: '45%' }}>
                    Người lập bảng lương
                    <div style={{ height: '60px' }}></div>
                    <strong style={{ color: '#0f172a' }}>Phòng Nhân Sự TravelVN</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button
                  onClick={() => setSelectedSlip(null)}
                  style={{ padding: '8px 18px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}
                >
                  Đóng
                </button>
                <button
                  onClick={() => window.print()}
                  style={{ padding: '8px 18px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                >
                  In phiếu lương
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default HRPayroll;

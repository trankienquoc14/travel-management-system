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
        // Tính toán lại thực lĩnh trên giao diện ngay lập tức
        const base = field === 'base_salary' ? numericVal : item.base_salary;
        const days = field === 'working_days' ? numericVal : item.working_days;
        const allowance = field === 'allowance' ? numericVal : item.allowance;
        const bonus = field === 'bonus' ? numericVal : item.bonus;
        const deductions = field === 'deductions' ? numericVal : item.deductions;
        
        updated.net_salary = Math.round((base / 26.0) * days + allowance + bonus - deductions);
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
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Mở modal in phiếu lương
  const printPaySlip = (emp) => {
    setSelectedSlip(emp);
  };

  return (
    <div className="payroll-container" style={{ padding: '24px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px', fontWeight: '700' }}>💰 Tính lương Nhân viên</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Tính toán lương tự động dựa trên số ngày công, phụ cấp, thưởng và khấu trừ.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontWeight: '600', color: '#475569', fontSize: '14px' }}>Chọn tháng:</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', color: '#334155' }}
          />
        </div>
      </div>

      {needsMigration && (
        <div style={{ padding: '16px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', marginBottom: '20px', color: '#b45309' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600' }}>⚠️ Cảnh báo: Cơ sở dữ liệu thiếu bảng "payroll"</h4>
          <p style={{ margin: '0 0 12px 0', fontSize: '13px', lineHeight: '1.5' }}>
            Để sử dụng tính năng tính và lưu trữ bảng lương vào MySQL, vui lòng chạy lệnh SQL sau trên cơ sở dữ liệu của bạn:
          </p>
          <pre style={{ margin: 0, padding: '12px', background: '#1e293b', color: '#f8fafc', borderRadius: '6px', fontSize: '12px', overflowX: 'auto', fontFamily: 'monospace' }}>
{`CREATE TABLE IF NOT EXISTS \`payroll\` (
  \`payroll_id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`employee_id\` INT NOT NULL,
  \`salary_month\` VARCHAR(7) NOT NULL,
  \`base_salary\` DECIMAL(12,2) NOT NULL DEFAULT 8000000.00,
  \`working_days\` DECIMAL(4,1) NOT NULL DEFAULT 0.0,
  \`allowance\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`bonus\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`deductions\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`net_salary\` DECIMAL(12,2) NOT NULL,
  \`status\` ENUM('Draft', 'Calculated', 'Paid') DEFAULT 'Draft',
  \`payment_date\` DATE NULL,
  \`notes\` VARCHAR(255) NULL,
  UNIQUE KEY \`unique_emp_month\` (\`employee_id\`, \`salary_month\`),
  FOREIGN KEY (\`employee_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`}
          </pre>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', fontStyle: 'italic' }}>
            *Hệ thống vẫn hỗ trợ tính toán lương trên giao diện bằng dữ liệu công của chấm công, nhưng sẽ không lưu được cho đến khi có bảng.*
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

      <div style={{ overflowX: 'auto', border: '1px solid #f1f5f9', borderRadius: '8px', marginBottom: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '14px 12px', color: '#627d98', fontWeight: '600' }}>Nhân viên</th>
              <th style={{ padding: '14px 12px', color: '#627d98', fontWeight: '600', width: '120px' }}>Lương cơ bản</th>
              <th style={{ padding: '14px 12px', color: '#627d98', fontWeight: '600', width: '80px' }}>Ngày công</th>
              <th style={{ padding: '14px 12px', color: '#627d98', fontWeight: '600', width: '110px' }}>Phụ cấp</th>
              <th style={{ padding: '14px 12px', color: '#627d98', fontWeight: '600', width: '110px' }}>Thưởng</th>
              <th style={{ padding: '14px 12px', color: '#627d98', fontWeight: '600', width: '110px' }}>Khấu trừ</th>
              <th style={{ padding: '14px 12px', color: '#627d98', fontWeight: '700', color: '#1e3a8a' }}>Thực lĩnh</th>
              <th style={{ padding: '14px 12px', color: '#627d98', fontWeight: '600', width: '110px' }}>Trạng thái</th>
              <th style={{ padding: '14px 12px', color: '#627d98', fontWeight: '600' }}>Hành động</th>
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
              payrollList.map((item) => (
                <tr key={item.employee_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.full_name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{item.role_name}</div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <input
                      type="number"
                      value={item.base_salary}
                      onChange={(e) => handleNumericChange(item.employee_id, 'base_salary', e.target.value)}
                      style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%', outline: 'none' }}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <input
                      type="number"
                      step="0.5"
                      value={item.working_days}
                      onChange={(e) => handleNumericChange(item.employee_id, 'working_days', e.target.value)}
                      style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%', outline: 'none', textAlign: 'center' }}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <input
                      type="number"
                      value={item.allowance}
                      onChange={(e) => handleNumericChange(item.employee_id, 'allowance', e.target.value)}
                      style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%', outline: 'none' }}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <input
                      type="number"
                      value={item.bonus}
                      onChange={(e) => handleNumericChange(item.employee_id, 'bonus', e.target.value)}
                      style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%', outline: 'none' }}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <input
                      type="number"
                      value={item.deductions}
                      onChange={(e) => handleNumericChange(item.employee_id, 'deductions', e.target.value)}
                      style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '100%', outline: 'none' }}
                    />
                  </td>
                  <td style={{ padding: '12px', fontWeight: '700', color: '#166534', fontSize: '14px' }}>
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
                      <option value="Draft">📝 Nháp</option>
                      <option value="Paid">💳 Đã trả</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => printPaySlip(item)}
                      style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                    >
                      📄 Phiếu lương
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          onClick={handleSave}
          disabled={loading || needsMigration}
          style={{
            padding: '12px 24px',
            background: needsMigration ? '#94a3b8' : '#1e3a8a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: needsMigration ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(30, 58, 138, 0.2)',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => { if(!needsMigration) e.target.style.background = '#172554'; }}
          onMouseOut={(e) => { if(!needsMigration) e.target.style.background = '#1e3a8a'; }}
        >
          {loading ? 'Đang lưu...' : '💾 Lưu bảng lương'}
        </button>
      </div>

      {/* MODAL IN PHIẾU LƯƠNG CHI TIẾT */}
      {selectedSlip && (
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
          zIndex: 9999
        }}>
          <div style={{
            background: '#fff',
            padding: '30px',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div id="print-area">
              <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#1e3a8a', fontSize: '22px' }}>TRAVEL ERP CO., LTD</h2>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>PHIẾU LƯƠNG NHÂN VIÊN - THÁNG {month}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px', marginBottom: '20px' }}>
                <div><strong>Nhân viên:</strong> {selectedSlip.full_name}</div>
                <div><strong>Vai trò:</strong> {selectedSlip.role_name}</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Email:</strong> {selectedSlip.email}</div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc', fontSize: '14px', display: 'grid', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Lương cơ bản (26 ngày):</span>
                  <span>{formatCurrency(selectedSlip.base_salary)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Số ngày công làm việc:</span>
                  <span>{selectedSlip.working_days} ngày</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <span>Lương theo công thực tế:</span>
                  <strong>{formatCurrency(Math.round((selectedSlip.base_salary / 26.0) * selectedSlip.working_days))}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Phụ cấp:</span>
                  <span style={{ color: '#166534' }}>+ {formatCurrency(selectedSlip.allowance)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Thưởng:</span>
                  <span style={{ color: '#166534' }}>+ {formatCurrency(selectedSlip.bonus)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                  <span>Khấu trừ/Phạt:</span>
                  <span style={{ color: '#991b1b' }}>- {formatCurrency(selectedSlip.deductions)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '700', color: '#1e3a8a', paddingTop: '6px' }}>
                  <span>Thực lĩnh nhận về:</span>
                  <span>{formatCurrency(selectedSlip.net_salary)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', fontSize: '12px', fontStyle: 'italic', color: '#64748b', textAlign: 'center' }}>
                <div style={{ width: '45%' }}>
                  Người nhận ký tên
                  <div style={{ height: '60px' }}></div>
                </div>
                <div style={{ width: '45%' }}>
                  Người lập bảng lương
                  <div style={{ height: '60px' }}></div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button
                onClick={() => setSelectedSlip(null)}
                style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
              >
                🖨️ In phiếu lương
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRPayroll;

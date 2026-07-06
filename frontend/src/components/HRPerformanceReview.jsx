import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/partner.css';

const HRPerformanceReview = () => {
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Trạng thái Form thêm mới
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    score: '',
    comment: '',
    review_date: new Date().toISOString().slice(0, 10)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchEmployees();
  }, []);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/hr/performance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setReviews(res.data.data);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách đánh giá:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/hr/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setEmployees(res.data.data);
        if (res.data.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            employee_id: res.data.data[0].user_id
          }));
        }
      }
    } catch (error) {
      console.error('Lỗi tải nhân viên cho dropdown:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const scoreNum = Number(formData.score);
    if (!formData.employee_id) return alert('Vui lòng chọn nhân viên cần đánh giá.');
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      return alert('Điểm đánh giá phải là số từ 0 đến 100.');
    }
    if (!formData.comment.trim()) return alert('Vui lòng nhập nhận xét.');

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/hr/performance',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        alert('Thêm đánh giá nhân sự thành công!');
        setShowAddForm(false);
        setFormData(prev => ({
          ...prev,
          score: '',
          comment: '',
          review_date: new Date().toISOString().slice(0, 10)
        }));
        fetchReviews();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreRatingClass = (score) => {
    if (score >= 85) return 'success';
    if (score >= 65) return 'warning';
    return 'danger';
  };

  const getScoreRatingText = (score) => {
    if (score >= 90) return 'Xuất sắc';
    if (score >= 80) return 'Tốt';
    if (score >= 65) return 'Khá (Đạt)';
    if (score >= 50) return 'Trung bình';
    return 'Yếu (Cần cải thiện)';
  };

  if (loading && reviews.length === 0) {
    return <div style={{ padding: 20 }}>Đang tải danh sách đánh giá hiệu suất...</div>;
  }

  if (showAddForm) {
    return (
      <div className="form-page-container">
        <div className="form-page-header">
          <button className="btn-back" type="button" onClick={() => setShowAddForm(false)}>
            ⬅ Quay lại danh sách
          </button>
          <h2>Thêm Phiếu Đánh giá Hiệu suất Nhân viên</h2>
        </div>

        <form className="full-page-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Chọn Nhân viên cần đánh giá *</label>
              <select name="employee_id" value={formData.employee_id} onChange={handleChange} required>
                {employees.map(emp => (
                  <option key={emp.user_id} value={emp.user_id}>
                    {emp.full_name} — {emp.role_name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Điểm hiệu suất (Thang điểm 100) *</label>
              <input 
                type="number" 
                name="score" 
                value={formData.score} 
                onChange={handleChange} 
                placeholder="Ví dụ: 85"
                min="0"
                max="100"
                required 
              />
            </div>

            <div className="form-group">
              <label>Ngày đánh giá *</label>
              <input 
                type="date" 
                name="review_date" 
                value={formData.review_date} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group full-width">
              <label>Nhận xét chi tiết & Đánh giá năng lực *</label>
              <textarea 
                name="comment" 
                value={formData.comment} 
                onChange={handleChange} 
                rows="4" 
                placeholder="Nhập ý kiến đánh giá về tác phong, thái độ làm việc, hiệu quả công việc..."
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel-lg" onClick={() => setShowAddForm(false)}>
              Hủy bỏ
            </button>
            <button type="submit" className="btn-save-lg" disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi...' : 'Đăng phiếu đánh giá'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="management-container">
      <div className="management-header">
        <div>
          <h2>Đánh giá Hiệu suất Nhân viên</h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Xem lịch sử đánh giá năng lực, điểm số KPI và nhận xét công việc của nhân sự nội bộ.
          </p>
        </div>
        <button className="btn-add-new" onClick={() => setShowAddForm(true)}>
          + Thêm Đánh giá
        </button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nhân viên</th>
              <th>Chức vụ</th>
              <th>Điểm số</th>
              <th>Xếp loại</th>
              <th>Nhận xét của HR</th>
              <th>Người đánh giá (HR)</th>
              <th>Ngày đánh giá</th>
            </tr>
          </thead>
          <tbody>
            {reviews.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                  Chưa có phiếu đánh giá hiệu suất nào.
                </td>
              </tr>
            ) : (
              reviews.map(rev => (
                <tr key={rev.performance_id}>
                  <td>#{rev.performance_id}</td>
                  <td style={{ fontWeight: '600', color: '#0f172a' }}>{rev.employee_name}</td>
                  <td>
                    <span 
                      style={{ 
                        padding: '2px 6px', 
                        background: '#f1f5f9', 
                        borderRadius: '4px', 
                        fontSize: '11px' 
                      }}
                    >
                      {rev.employee_role}
                    </span>
                  </td>
                  <td style={{ fontWeight: 'bold' }}>
                    <span style={{ fontSize: '15px' }}>{rev.score}</span> / 100
                  </td>
                  <td>
                    <span className={`status-badge ${getScoreRatingClass(rev.score)}`}>
                      {getScoreRatingText(rev.score)}
                    </span>
                  </td>
                  <td style={{ maxWidth: '300px', wordBreak: 'break-word', color: '#475569' }}>
                    {rev.comment}
                  </td>
                  <td style={{ color: '#475569', fontSize: '13px' }}>{rev.reviewer_name || 'HR Manager'}</td>
                  <td>{rev.review_date ? new Date(rev.review_date).toLocaleDateString('vi-VN') : '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HRPerformanceReview;

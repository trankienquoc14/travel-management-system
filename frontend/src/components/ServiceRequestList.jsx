import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ServiceRequestList = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/service-requests/groups', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) setGroups(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#1e293b' }}>📄 Danh sách Yêu cầu Dịch vụ</h2>
            {loading ? <p>Đang tải...</p> : (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                                <th style={{ padding: '12px 8px' }}>Mã YC</th>
                                <th style={{ padding: '12px 8px' }}>Tour</th>
                                <th style={{ padding: '12px 8px' }}>Khởi hành</th>
                                <th style={{ padding: '12px 8px' }}>Loại YC</th>
                                <th style={{ padding: '12px 8px' }}>Số lượng Phiếu</th>
                                <th style={{ padding: '12px 8px' }}>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map(g => (
                                <tr key={g.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px 8px', fontWeight: '600', color: '#0194f3' }}>{g.code}</td>
                                    <td style={{ padding: '12px 8px' }}>{g.tour_name}</td>
                                    <td style={{ padding: '12px 8px' }}>{new Date(g.departure_date).toLocaleDateString('vi-VN')}</td>
                                    <td style={{ padding: '12px 8px' }}>
                                        <span style={{ background: g.request_type === 'INITIAL' ? '#e0f2fe' : '#fef08a', color: g.request_type === 'INITIAL' ? '#0369a1' : '#854d0e', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
                                            {g.request_type === 'INITIAL' ? 'Cung cấp' : 'Bổ sung'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 8px', fontWeight: '500' }}>{g.request_count}</td>
                                    <td style={{ padding: '12px 8px' }}>
                                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>{g.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ServiceRequestList;

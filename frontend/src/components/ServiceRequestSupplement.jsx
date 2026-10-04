import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const ServiceRequestSupplement = () => {
    const [departures, setDepartures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDep, setSelectedDep] = useState(null);
    const [supplementServices, setSupplementServices] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDiff, setFilterDiff] = useState('HAS_DIFF'); // ALL, HAS_DIFF, NO_DIFF

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            const [gRes, dRes] = await Promise.all([
                axios.get('http://localhost:5000/api/service-requests/groups', { headers }),
                axios.get('http://localhost:5000/api/tours/operations/departures', { headers })
            ]);
            
            if (gRes.data.success && dRes.data.success) {
                const groups = gRes.data.data;
                const deps = dRes.data.data;
                
                // Lọc những nhóm Yêu cầu chính
                const initialGroups = groups.filter(g => g.request_type === 'INITIAL');
                
                // Chỉ lấy những lịch khởi hành đã có Yêu cầu chính
                const eligibleDeps = deps.filter(d => initialGroups.some(g => g.departure_id === d.departure_id));
                
                const data = eligibleDeps.map(d => {
                    // Tìm tất cả các group (cả chính và bổ sung) của lịch này
                    const allGroups = groups.filter(g => g.departure_id === d.departure_id && g.status !== 'Rejected');
                    const mainGroup = initialGroups.find(g => g.departure_id === d.departure_id);
                    
                    const totalRequestedPax = allGroups.reduce((sum, g) => sum + (g.passenger_count || 0), 0);
                    const diff = (d.current_pax || 0) - totalRequestedPax;
                    
                    return {
                        ...d,
                        totalRequestedPax,
                        diff,
                        mainGroup,
                        allGroups
                    };
                });
                
                // Sort by diff descending
                data.sort((a,b) => new Date(a.departure_date) - new Date(b.departure_date));
                setDepartures(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDep = async (dep) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            // Lấy chi tiết các request của tất cả groups thuộc departure này
            const groupPromises = dep.allGroups.map(g => axios.get(`http://localhost:5000/api/service-requests/groups/${g.id}`, { headers }));
            const groupResponses = await Promise.all(groupPromises);
            
            const allReqs = groupResponses.flatMap(res => res.data.data.requests);
            
            const partnerStats = {};
            for (const r of allReqs) {
                if (r.status === 'Rejected') continue; // Bỏ qua nếu bị từ chối
                
                const key = r.partner_id + '_' + r.service_type;
                if (!partnerStats[key]) {
                    partnerStats[key] = {
                        partner_id: r.partner_id,
                        partner_name: r.partner_name,
                        service_type: r.service_type,
                        requested_quantity: 0,
                        original_content: r.request_content
                    };
                }
                partnerStats[key].requested_quantity += r.quantity;
            }
            
            const services = [];
            for (const key in partnerStats) {
                const stat = partnerStats[key];
                const currentNeed = stat.service_type === 'HOTEL' ? dep.total_required_rooms : dep.current_pax;
                const diff = currentNeed - stat.requested_quantity;
                
                services.push({
                    id: key,
                    partner_id: stat.partner_id,
                    partner_name: stat.partner_name,
                    service_type: stat.service_type,
                    requested_quantity: stat.requested_quantity,
                    current_need: currentNeed,
                    diff: diff > 0 ? diff : 0,
                    request_content: stat.original_content
                });
            }
            
            setSupplementServices(services);
            setSelectedDep(dep);
        } catch (error) {
            console.error(error);
            alert('Lỗi tải dữ liệu chi tiết');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedDep) return;
        
        const servicesToSubmit = supplementServices.filter(s => s.diff > 0);
        if (servicesToSubmit.length === 0) {
            return alert('Không có dịch vụ nào phát sinh chênh lệch để gửi yêu cầu bổ sung.');
        }
        
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                passenger_count: selectedDep.diff > 0 ? selectedDep.diff : 0,
                services: servicesToSubmit.map(s => ({
                    partner_id: s.partner_id,
                    service_type: s.service_type,
                    quantity: s.diff,
                    details: s.request_content
                }))
            };
            
            const res = await axios.post(`http://localhost:5000/api/service-requests/groups/${selectedDep.mainGroup.id}/supplement`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.data.success) {
                alert('Tạo yêu cầu bổ sung thành công!');
                setSelectedDep(null);
                fetchInitialData();
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi: ' + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const filteredDepartures = useMemo(() => {
        return departures.filter(dep => {
            if (searchTerm && !dep.tour_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            if (filterDiff === 'HAS_DIFF' && dep.diff <= 0) return false;
            if (filterDiff === 'NO_DIFF' && dep.diff > 0) return false;
            return true;
        });
    }, [departures, searchTerm, filterDiff]);

    return (
        <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#4f46e5' }}>✦</span> Tạo Yêu cầu Bổ sung
            </h2>

            {!selectedDep ? (
                <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Danh sách Lịch khởi hành đã có Yêu cầu chính</h3>
                        <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b' }}>Chọn một lịch khởi hành để xem phần phát sinh và tạo yêu cầu bổ sung cho các dịch vụ.</p>
                    </div>
                    
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1', minWidth: '250px' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>Tìm kiếm</div>
                            <input 
                                type="text"
                                placeholder="🔍 Tìm tên tour..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                            />
                        </div>
                        <div style={{ minWidth: '200px' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>Trạng thái phát sinh</div>
                            <select 
                                value={filterDiff}
                                onChange={e => setFilterDiff(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', background: '#fff' }}
                            >
                                <option value="ALL">Tất cả</option>
                                <option value="HAS_DIFF">Có phát sinh</option>
                                <option value="NO_DIFF">Không phát sinh</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button 
                                onClick={() => { setSearchTerm(''); setFilterDiff('HAS_DIFF'); }}
                                style={{ padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                            >
                                Đặt lại
                            </button>
                        </div>
                    </div>
                    
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu...</div>
                    ) : filteredDepartures.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy lịch khởi hành nào phù hợp với bộ lọc.</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', minWidth: '800px' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                                    <tr>
                                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Lịch trình</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', whiteSpace: 'nowrap' }}>Khởi hành</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', whiteSpace: 'nowrap' }}>Số khách hiện tại</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', whiteSpace: 'nowrap' }}>Phát sinh</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', whiteSpace: 'nowrap' }}>Trạng thái</th>
                                        <th style={{ padding: '12px 16px', fontWeight: '600', whiteSpace: 'nowrap' }}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDepartures.map((dep, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s', background: dep.diff > 0 ? '#fffbeb' : '#fff' }}>
                                            <td style={{ padding: '16px', color: '#0f172a', fontWeight: '600' }}>{dep.tour_name}</td>
                                            <td style={{ padding: '16px', color: '#475569', whiteSpace: 'nowrap' }}>{new Date(dep.departure_date).toLocaleDateString('vi-VN')}</td>
                                            <td style={{ padding: '16px', color: '#0369a1', fontWeight: '700', whiteSpace: 'nowrap' }}>{dep.current_pax} khách</td>
                                            <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                                                {dep.diff > 0 ? (
                                                    <span style={{ color: '#b45309', fontWeight: '700' }}>+{dep.diff}</span>
                                                ) : (
                                                    <span style={{ color: '#64748b' }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                                                {dep.diff > 0 ? (
                                                    <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>Có phát sinh</span>
                                                ) : (
                                                    <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>Không phát sinh</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px', whiteSpace: 'nowrap' }}>
                                                <button 
                                                    onClick={() => handleSelectDep(dep)}
                                                    style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                                                >
                                                    Xem
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <button 
                        onClick={() => setSelectedDep(null)} 
                        style={{ background: 'none', border: 'none', color: '#475569', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}
                    >
                        ← Quay lại danh sách
                    </button>
                    
                    {/* THÔNG TIN ĐẦU TRANG */}
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '600' }}>Tour</div>
                            <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '16px' }}>{selectedDep.tour_name}</div>
                        </div>
                        <div>
                            <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '600' }}>Khởi hành</div>
                            <div style={{ fontWeight: '700', color: '#334155', fontSize: '16px' }}>{new Date(selectedDep.departure_date).toLocaleDateString('vi-VN')}</div>
                        </div>
                        <div>
                            <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '600' }}>Số khách hiện tại</div>
                            <div style={{ fontWeight: '700', color: '#0369a1', fontSize: '16px' }}>{selectedDep.current_pax} khách</div>
                        </div>
                        <div>
                            <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '600' }}>Đã yêu cầu trước đó</div>
                            <div style={{ fontWeight: '700', color: '#475569', fontSize: '16px' }}>{selectedDep.totalRequestedPax} khách</div>
                        </div>
                        <div style={{ gridColumn: 'span 5', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', color: '#475569', fontWeight: '600' }}>Tổng hành khách phát sinh mới:</span>
                            <span style={{ fontSize: '20px', fontWeight: '800', color: selectedDep.diff > 0 ? '#b45309' : '#166534' }}>
                                {selectedDep.diff > 0 ? `+${selectedDep.diff} khách` : 'Không phát sinh'}
                            </span>
                        </div>
                    </div>

                    {/* PHẦN NHU CẦU DỊCH VỤ BỔ SUNG */}
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '16px' }}>Nhu cầu dịch vụ bổ sung</h3>
                    
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tính toán dịch vụ...</div>
                    ) : supplementServices.length === 0 ? (
                        <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#64748b' }}>
                            Không tìm thấy dịch vụ nào đã được yêu cầu.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '20px' }}>
                            {supplementServices.map(svc => (
                                <div key={svc.id} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: `4px solid ${svc.service_type === 'HOTEL' ? '#0369a1' : '#b45309'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                                                {svc.service_type === 'HOTEL' ? '🏨 Khách sạn' : '🍽 Nhà hàng'}
                                            </h4>
                                            <div style={{ color: '#475569', fontSize: '14px' }}>Nhà cung cấp: <strong style={{ color: '#0f172a' }}>{svc.partner_name}</strong></div>
                                        </div>
                                        <div style={{ background: svc.diff > 0 ? '#fef3c7' : '#f1f5f9', color: svc.diff > 0 ? '#b45309' : '#64748b', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                                            Phát sinh: {svc.diff > 0 ? `+${svc.diff}` : '0'} {svc.service_type === 'HOTEL' ? 'phòng' : 'suất'}
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                                        <div>
                                            <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Số {svc.service_type === 'HOTEL' ? 'phòng' : 'suất'} đã yêu cầu</div>
                                            <div style={{ fontWeight: '700', color: '#475569', fontSize: '16px' }}>{svc.requested_quantity}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Nhu cầu hiện tại</div>
                                            <div style={{ fontWeight: '700', color: '#0369a1', fontSize: '16px' }}>{svc.current_need}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>Chênh lệch cần bổ sung</div>
                                            <div style={{ fontWeight: '800', color: svc.diff > 0 ? '#b45309' : '#166534', fontSize: '16px' }}>
                                                {svc.diff > 0 ? `+${svc.diff}` : '0'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || supplementServices.every(s => s.diff === 0)}
                                    style={{
                                        background: supplementServices.every(s => s.diff === 0) ? '#cbd5e1' : '#1e3a8a',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '14px 32px',
                                        borderRadius: '8px',
                                        fontSize: '15px',
                                        fontWeight: '700',
                                        cursor: supplementServices.every(s => s.diff === 0) ? 'not-allowed' : 'pointer',
                                        boxShadow: supplementServices.every(s => s.diff === 0) ? 'none' : '0 4px 6px -1px rgba(30, 58, 138, 0.3)'
                                    }}
                                >
                                    {submitting ? 'Đang xử lý...' : 'Gửi Yêu cầu Bổ sung'}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ServiceRequestSupplement;

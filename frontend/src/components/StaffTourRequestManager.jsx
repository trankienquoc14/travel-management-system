import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FormattedMoneyInput = ({ value, onChange, placeholder, style, disabled }) => {
    const inputRef = React.useRef(null);
    const [cursor, setCursor] = React.useState(null);
    const displayValue = (value !== null && value !== '') ? Number(value).toLocaleString('vi-VN') : '';

    React.useLayoutEffect(() => {
        if (inputRef.current && cursor !== null) {
            inputRef.current.setSelectionRange(cursor, cursor);
        }
    }, [displayValue, cursor]);

    const handleChange = (e) => {
        const input = e.target;
        const currentCursor = input.selectionStart;
        
        // Count dots before cursor in the typed string
        const dotsBefore = (input.value.substring(0, currentCursor).match(/\./g) || []).length;
        
        const raw = input.value.replace(/\D/g, '');
        const newVal = raw ? Number(raw) : '';
        const newFormatted = newVal ? Number(newVal).toLocaleString('vi-VN') : '';
        
        // Count dots before cursor in the new formatted string (roughly)
        // We know how many digits are before the cursor
        const rawBeforeCursor = input.value.substring(0, currentCursor).replace(/\D/g, '');
        let newCursor = 0;
        let digitsPassed = 0;
        for (let i = 0; i < newFormatted.length; i++) {
            if (digitsPassed === rawBeforeCursor.length) break;
            if (newFormatted[i] >= '0' && newFormatted[i] <= '9') digitsPassed++;
            newCursor++;
        }
        
        setCursor(newCursor);
        onChange(newVal);
    };

    return (
        <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            style={style}
            disabled={disabled}
        />
    );
};

const StaffTourRequestManager = ({ onStartDesign, defaultFilter = 'Tất cả', mode = 'tour_requests' }) => {
    const [requests, setRequests] = useState([]);
    const [selectedReq, setSelectedReq] = useState(null);
    const [tempMarkup, setTempMarkup] = useState(20);
    const [customPrice, setCustomPrice] = useState(null);
    const [manualGrandTotal, setManualGrandTotal] = useState(null);
    const [consultationNote, setConsultationNote] = useState('');
    const [mealPrices, setMealPrices] = useState({ breakfast: 200000, lunch: 200000, dinner: 200000 });
    const [guidePricePerDay, setGuidePricePerDay] = useState(500000);
    const [adjHotelCost, setAdjHotelCost] = useState(null);
    const [adjTransportCost, setAdjTransportCost] = useState(null);
    const [policyType, setPolicyType] = useState('Custom');
    const [childPolicy, setChildPolicy] = useState({
        child: { percent: 75, surcharge: 0 },
        toddler: { percent: 50, surcharge: 0 },
        infant: { percent: 0, surcharge: 0 }
    });
    const [filterStatus, setFilterStatus] = useState(defaultFilter);

    useEffect(() => {
        setFilterStatus(defaultFilter);
    }, [defaultFilter, mode]);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/custom-tours/requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) setRequests(res.data.data);
        } catch (error) { console.error('Lỗi tải dữ liệu', error); }
    };

    const startDesignDirectly = async (req) => {
        try {
            const token = localStorage.getItem('token');
            // Gửi API update trạng thái sang Designing
            await axios.put(`http://localhost:5000/api/custom-tours/requests/${req.request_id}/start-design`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Chuyển sang màn hình thiết kế
            if (onStartDesign) {
                onStartDesign({
                    ...req,
                    markup_percent: req.markup_percent || 20,
                    staff_note: req.staff_note || '',
                    quote_price: req.quoted_price || 0,
                    base_cost: req.base_cost || 0
                });
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi khi vào phòng thiết kế!');
        }
    };

    const handleSelect = (req) => {
        if (mode === 'tour_requests') {
            startDesignDirectly(req);
            return;
        }

        setSelectedReq(req);
        setTempMarkup(req.markup_percent || 20);
        setManualGrandTotal(null);
        setCustomPrice(null);
        setConsultationNote(req.staff_note || '');
        setMealPrices({ breakfast: 200000, lunch: 200000, dinner: 200000 });
        setGuidePricePerDay(500000);
        
        const durationDays = Math.round((new Date(req.return_date) - new Date(req.departure_date)) / (1000 * 60 * 60 * 24)) + 1;
        const nights = Math.max(0, durationDays - 1);
        const pax = req.people_count || 1;
        
        setAdjHotelCost(nights > 0 ? Math.round(((req.preferences?.hotelPrice || 0) * pax) / nights) : 0);
        setAdjTransportCost(durationDays > 0 ? Math.round(((req.preferences?.transportPrice || 0) * pax) / durationDays) : 0);
    };

    const formatMoney = (amount) => Number(amount).toLocaleString('vi-VN');

    const durationDays = selectedReq ? Math.round((new Date(selectedReq.return_date) - new Date(selectedReq.departure_date)) / (1000 * 60 * 60 * 24)) + 1 : 0;
    const durationNights = Math.max(0, durationDays - 1);
    const totalPax = selectedReq ? selectedReq.people_count : 1;
    
    const autoBreakfastQty = durationNights;
    const autoLunchQty = durationDays;
    const autoDinnerQty = durationNights;
    
    const mealCostPerPerson = (Number(mealPrices.breakfast) * autoBreakfastQty) + 
                              (Number(mealPrices.lunch) * autoLunchQty) + 
                              (Number(mealPrices.dinner) * autoDinnerQty);
    const guideCostPerPerson = totalPax > 0 ? (Number(guidePricePerDay) * durationDays) / totalPax : 0;

    const totalHotelPerPerson = totalPax > 0 ? ((adjHotelCost || 0) * durationNights) / totalPax : 0;
    const totalTransportPerPerson = totalPax > 0 ? ((adjTransportCost || 0) * durationDays) / totalPax : 0;

    const totalCost = totalHotelPerPerson +
        totalTransportPerPerson +
        (selectedReq?.preferences?.selectedPlaces?.reduce((sum, p) => sum + Number(p.price), 0) || 0) +
        mealCostPerPerson + guideCostPerPerson;

    const suggestedPrice = customPrice !== null ? customPrice : Math.round(totalCost * (1 + Number(tempMarkup) / 100));
    const budgetDiff = (selectedReq?.budget || 0) - suggestedPrice;

    const handleMarkupChange = (e) => {
        setTempMarkup(e.target.value);
        setManualGrandTotal(null);
        setCustomPrice(null);
    };

    const handlePriceChange = (val) => {
        const numericVal = Number(val);
        setCustomPrice(numericVal);
        setManualGrandTotal(null);
        if (totalCost > 0) {
            setTempMarkup((((numericVal / totalCost) - 1) * 100).toFixed(1));
        }
    };

    const childPrice = Math.round(suggestedPrice * (childPolicy.child.percent / 100) + Number(childPolicy.child.surcharge));
    const toddlerPrice = Math.round(suggestedPrice * (childPolicy.toddler.percent / 100) + Number(childPolicy.toddler.surcharge));
    const infantPrice = Math.round(suggestedPrice * (childPolicy.infant.percent / 100) + Number(childPolicy.infant.surcharge));

    const numAdults = selectedReq?.preferences?.participantBreakdown?.adults || selectedReq?.people_count || 1;
    const numChildren = selectedReq?.preferences?.participantBreakdown?.children || 0;
    const numToddlers = selectedReq?.preferences?.participantBreakdown?.toddlers || 0;
    const numInfants = selectedReq?.preferences?.participantBreakdown?.infants || 0;

    const calculatedGrandTotal = (numAdults * suggestedPrice) + (numChildren * childPrice) + (numToddlers * toddlerPrice) + (numInfants * infantPrice);
    const grandTotalPrice = manualGrandTotal !== null ? manualGrandTotal : calculatedGrandTotal;

    const handleGrandTotalChange = (val) => {
        const numericVal = Number(val);
        setManualGrandTotal(numericVal);
        
        const C_pct = childPolicy.child.percent / 100;
        const T_pct = childPolicy.toddler.percent / 100;
        const I_pct = childPolicy.infant.percent / 100;
        
        const C_sur = Number(childPolicy.child.surcharge);
        const T_sur = Number(childPolicy.toddler.surcharge);
        const I_sur = Number(childPolicy.infant.surcharge);
        
        const totalMultiplier = numAdults + (numChildren * C_pct) + (numToddlers * T_pct) + (numInfants * I_pct);
        const totalSurcharge = (numChildren * C_sur) + (numToddlers * T_sur) + (numInfants * I_sur);
        
        if (totalMultiplier > 0) {
            const newSuggestedPrice = Math.round((numericVal - totalSurcharge) / totalMultiplier);
            setCustomPrice(newSuggestedPrice);
            if (totalCost > 0) {
                setTempMarkup((((newSuggestedPrice / totalCost) - 1) * 100).toFixed(1));
            }
        }
    };

    const updatePolicy = (type, field, value) => {
        setPolicyType('Custom');
        setManualGrandTotal(null);
        setChildPolicy(prev => ({
            ...prev,
            [type]: { ...prev[type], [field]: Number(value) }
        }));
    };

    const handlePolicyTemplateChange = (e) => {
        setManualGrandTotal(null);
        const val = e.target.value;
        setPolicyType(val);
        if (val === 'Template1') {
            setChildPolicy({
                child: { percent: 50, surcharge: 0 },
                toddler: { percent: 0, surcharge: 0 },
                infant: { percent: 0, surcharge: 0 }
            });
        } else if (val === 'Template2') {
            setChildPolicy({
                child: { percent: 85, surcharge: 0 },
                toddler: { percent: 50, surcharge: 0 },
                infant: { percent: 0, surcharge: 0 }
            });
        }
    };

    // Tích hợp API mới: Gửi Báo Giá Sơ Bộ
    const handleSendInitialQuote = async () => {
        if (!selectedReq) return;
        try {
            const token = localStorage.getItem('token');
            const breakdown = {
                adult: suggestedPrice,
                child: childPrice,
                toddler: toddlerPrice,
                infant: infantPrice
            };
            
            await axios.post(`http://localhost:5000/api/custom-tours/requests/${selectedReq.request_id}/initial-quote`, {
                quote_price: grandTotalPrice,
                note: consultationNote,
                price_breakdown: JSON.stringify(breakdown)
            }, { headers: { Authorization: `Bearer ${token}` } });

            alert('✅ Đã gửi báo giá sơ bộ cho khách hàng!');
            fetchRequests();
            setSelectedReq(null);
        } catch (error) {
            console.error(error);
            alert('Lỗi gửi báo giá sơ bộ!');
        }
    };

    // Tích hợp API mới: Chuyển sang Trạng thái Thiết kế
    const handleStartDesign = async () => {
        if (!selectedReq) return;
        try {
            const token = localStorage.getItem('token');
            // Gửi API update trạng thái sang Designing
            await axios.put(`http://localhost:5000/api/custom-tours/requests/${selectedReq.request_id}/start-design`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Gọi prop để chuyển view (Vào màn hình thiết kế kéo thả)
            if (onStartDesign) {
                onStartDesign({ ...selectedReq, markup_percent: tempMarkup, staff_note: consultationNote, quote_price: suggestedPrice, base_cost: totalCost });
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi khi vào phòng thiết kế!');
        }
    };

    const handleSendToCustomer = async () => {
        try {
            if (!selectedReq.quote_id) {
                alert('Không tìm thấy ID báo giá!');
                return;
            }
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/custom-tours/quotes/${selectedReq.quote_id}/send-to-customer`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Đã gửi bản thiết kế cho khách hàng!');
            fetchRequests();
            setSelectedReq({ ...selectedReq, status: 'Sent_To_Customer' });
        } catch (error) {
            console.error('Lỗi khi gửi cho khách:', error);
            alert('Có lỗi xảy ra khi gửi cho khách hàng');
        }
    };

    const getStatusUI = (req) => {
        switch (req.status) {
            case 'Pending': return { bg: '#dcfce7', color: '#16a34a', text: 'MỚI YÊU CẦU' };
            case 'Initial_Quoted': return { bg: '#e0e7ff', color: '#4338ca', text: 'ĐÃ BÁO GIÁ' };
            case 'Initial_Accepted': return { bg: '#dcfce7', color: '#15803d', text: 'KHÁCH CHỐT GIÁ' };
            case 'Designing': return { bg: '#fef3c7', color: '#d97706', text: 'ĐANG THIẾT KẾ' };
            case 'Pending_Manager_Approval': return { bg: '#fef08a', color: '#854d0e', text: 'CHỜ DUYỆT' };
            case 'Manager_Rejected': return { bg: '#fee2e2', color: '#dc2626', text: 'QUẢN LÝ TỪ CHỐI' };
            case 'Manager_Approved': return { bg: '#dbeafe', color: '#2563eb', text: 'QUẢN LÝ ĐÃ DUYỆT' };
            case 'Sent_To_Customer': return { bg: '#e0e7ff', color: '#4f46e5', text: 'ĐÃ GỬI KHÁCH' };
            case 'Customer_Revision': return { bg: '#fee2e2', color: '#dc2626', text: 'KHÁCH YÊU CẦU SỬA' };
            case 'Customer_Accepted': return { bg: '#dcfce7', color: '#15803d', text: 'KHÁCH ĐÃ CHỐT' };
            case 'Completed': return { bg: '#dcfce7', color: '#16a34a', text: 'ĐÃ TẠO TOUR' };
            case 'Canceled': return { bg: '#f3f4f6', color: '#9ca3af', text: 'ĐÃ HỦY' };
            default: return { bg: '#f1f5f9', color: '#64748b', text: req.status };
        }
    };


    const filteredRequests = requests.filter(req => {
        if (filterStatus === 'Tất cả') return true;
        if (filterStatus === 'Mới') return req.status === 'Pending';
        if (filterStatus === 'Đã báo giá') return req.status === 'Initial_Quoted';
        if (filterStatus === 'Đang thiết kế') return ['Initial_Accepted', 'Designing'].includes(req.status);
        if (filterStatus === 'Khách đã chốt giá') return req.status === 'Initial_Accepted';
        if (filterStatus === 'Cần chỉnh sửa') return req.status === 'Customer_Revision' || req.status === 'Manager_Rejected';
        if (filterStatus === 'Tất cả cần sửa') return ['Customer_Revision', 'Manager_Rejected'].includes(req.status);
        if (filterStatus === 'Sửa từ khách') return req.status === 'Customer_Revision';
        if (filterStatus === 'Sửa từ quản lý') return req.status === 'Manager_Rejected';
        if (filterStatus === 'Đang xử lý') return ['Initial_Quoted', 'Initial_Accepted', 'Designing'].includes(req.status);
        if (filterStatus === 'Chờ duyệt') return ['Pending_Manager_Approval', 'Manager_Approved', 'Manager_Rejected', 'Sent_To_Customer'].includes(req.status);
        if (filterStatus === 'Hoàn tất') return ['Customer_Accepted', 'Completed'].includes(req.status);
        if (filterStatus === 'Đã hủy') return req.status === 'Canceled';
        return true;
    });

    return (
        <div className="request-manager-container">
            {!selectedReq ? (
                /* MASTER VIEW: DANH SÁCH YÊU CẦU TRÀN VIỀN */
                <div className="master-view-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>Quản lý Yêu cầu Thiết kế</h2>
                            <p style={{ color: '#64748b', margin: 0 }}>Đang hiển thị {filteredRequests.length} yêu cầu từ khách hàng</p>
                        </div>
                        <div style={{ width: '250px' }}>
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', background: '#f8fafc', cursor: 'pointer' }}
                            >
                                {mode === 'tour_requests_pending' ? (
                                    <>
                                        <option value="Mới">Mới yêu cầu</option>
                                        <option value="Đã báo giá">Đã báo giá sơ bộ</option>
                                        <option value="Đang thiết kế">Đang được thiết kế</option>
                                    </>
                                ) : mode === 'tour_requests_revision' ? (
                                    <>
                                        <option value="Tất cả cần sửa">Tất cả yêu cầu cần sửa</option>
                                        <option value="Sửa từ khách">Khách yêu cầu chỉnh sửa</option>
                                        <option value="Sửa từ quản lý">Quản lý yêu cầu chỉnh sửa</option>
                                    </>
                                ) : mode === 'tour_requests' ? (
                                    <>
                                        <option value="Khách đã chốt giá">Đã chốt giá sơ bộ (Chờ thiết kế)</option>
                                        <option value="Đang thiết kế">Đang được thiết kế</option>
                                        <option value="Chờ duyệt">Đã thiết kế (Chờ duyệt/Gửi)</option>
                                        <option value="Tất cả">Tất cả trạng thái</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="Tất cả">Tất cả yêu cầu</option>
                                        <option value="Mới">Mới yêu cầu</option>
                                        <option value="Đã báo giá">Đã báo giá sơ bộ</option>
                                        <option value="Đang thiết kế">Đang được thiết kế</option>
                                        <option value="Đang xử lý">Đang xử lý (Gộp)</option>
                                        <option value="Cần chỉnh sửa">Cần chỉnh sửa</option>
                                        <option value="Chờ duyệt">Chờ duyệt (Gộp)</option>
                                        <option value="Hoàn tất">Đã chốt/Hoàn tất</option>
                                        <option value="Đã hủy">Đã hủy</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>

                    {filteredRequests.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                            <h3 style={{ margin: '0 0 8px 0', color: '#334155', fontSize: '16px' }}>
                                {filterStatus === 'Mới' ? 'Không có yêu cầu mới nào chờ xử lý.' :
                                 ['Cần chỉnh sửa', 'Tất cả cần sửa', 'Sửa từ khách', 'Sửa từ quản lý'].includes(filterStatus) ? 'Không có yêu cầu nào cần chỉnh sửa.' :
                                 filterStatus === 'Khách đã chốt giá' ? 'Không có yêu cầu nào khách đã chốt giá để thiết kế.' :
                                 'Không có yêu cầu nào phù hợp với bộ lọc.'}
                            </h3>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Các yêu cầu mới của khách hàng sẽ xuất hiện tại đây.</p>
                        </div>
                    ) : (
                        <div className="request-inbox-grid">
                            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr 2fr 2fr 1fr', padding: '0 20px 12px 20px', color: '#64748b', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #f1f5f9' }}>
                                <div>Khách hàng</div>
                                <div>Điểm đến</div>
                                <div>Thời gian</div>
                                <div>Số thành viên</div>
                                <div style={{ textAlign: 'right' }}>Trạng thái</div>
                            </div>
                            {filteredRequests.map(req => {
                            const statusUI = getStatusUI(req);
                            return (
                                <div key={req.request_id} className="request-inbox-row" onClick={() => handleSelect(req)}>
                                    <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                                        <div className="request-avatar" style={{ backgroundColor: statusUI.bg, color: statusUI.color, border: `1px solid ${statusUI.color}` }}>
                                            {(req.customer_name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                                            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.customer_name}</div>
                                            <div style={{ fontSize: '13px', color: '#64748b' }}>{req.customer_phone}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: '600', color: '#334155' }}>📍 {req.destination}</div>
                                    <div style={{ fontSize: '14px', color: '#475569' }}>
                                        📅 {new Date(req.departure_date).toLocaleDateString('vi-VN')}
                                    </div>
                                    <div style={{ color: '#0f172a', fontWeight: '700' }}>👥 {req.people_count} người</div>
                                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                                        <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', backgroundColor: statusUI.bg, color: statusUI.color, whiteSpace: 'nowrap' }}>
                                            {statusUI.text}
                                        </span>
                                        {mode === 'tour_requests_revision' && (
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleSelect(req); }}
                                                    style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                >
                                                    👁️ Xem
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); startDesignDirectly(req); }}
                                                    style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', backgroundColor: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)' }}
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                                                >
                                                    ✏️ Sửa
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Hiển thị lý do chỉnh sửa trực tiếp ngoài danh sách */}
                                    {mode === 'tour_requests_revision' && (req.status === 'Manager_Rejected' || req.status === 'Customer_Revision') && (
                                        <div style={{ gridColumn: '1 / -1', marginTop: '16px', padding: '12px 16px', backgroundColor: '#fee2e2', borderLeft: '4px solid #ef4444', borderRadius: '0 8px 8px 0', fontSize: '14px', color: '#991b1b', lineHeight: '1.5' }}>
                                            <strong style={{ color: '#b91c1c' }}>⚠️ Lý do yêu cầu chỉnh sửa: </strong> 
                                            <span style={{ whiteSpace: 'pre-wrap' }}>
                                                {req.status === 'Manager_Rejected' ? (req.manager_note || 'Không có ghi chú') : (req.customer_note || 'Không có ghi chú')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        </div>
                    )}
                </div>
            ) : (
                /* DETAIL VIEW: CHI TIẾT YÊU CẦU TRÀN VIỀN */
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div className="detail-view-card" style={{ flex: 1, overflowY: 'auto', marginBottom: 0, borderRadius: '20px 20px 0 0', paddingBottom: '40px' }}>
                        <button 
                            onClick={() => setSelectedReq(null)}
                            style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: 0, marginBottom: '24px' }}
                        >
                            ❮ Quay lại danh sách
                        </button>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div className="request-avatar" style={{ width: '64px', height: '64px', fontSize: '24px', backgroundColor: getStatusUI(selectedReq).bg, color: getStatusUI(selectedReq).color, border: `2px solid ${getStatusUI(selectedReq).color}` }}>
                                {(selectedReq.customer_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>Đơn: {selectedReq.destination}</h2>
                                <div style={{ fontSize: '15px', color: '#64748b' }}>
                                    Khách hàng: <strong style={{ color: '#334155' }}>{selectedReq.customer_name}</strong> &nbsp;•&nbsp; SĐT: <strong>{selectedReq.customer_phone}</strong>
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: '250px' }}>
                            <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600' }}>Ngân sách khách báo</div>
                            <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981' }}>{formatMoney(selectedReq.budget)}<span style={{ fontSize: '16px' }}>đ/người</span></div>
                            
                            {/* Budget Progress Bar */}
                            <div className="budget-progress-container">
                                <div 
                                    className="budget-progress-fill" 
                                    style={{ 
                                        width: `${Math.min((suggestedPrice / selectedReq.budget) * 100, 100)}%`,
                                        backgroundColor: budgetDiff >= 0 ? '#10b981' : '#ef4444'
                                    }}
                                ></div>
                            </div>
                            <div style={{ fontSize: '12px', marginTop: '6px', color: budgetDiff >= 0 ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                                {budgetDiff >= 0 ? `Trong ngân sách (Dư ${formatMoney(budgetDiff)}đ)` : `Vượt ngân sách ${formatMoney(Math.abs(budgetDiff))}đ`}
                            </div>
                        </div>
                    </div>

                    {(selectedReq.status === 'Manager_Rejected' || selectedReq.status === 'Customer_Revision') && (
                        <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '12px', backgroundColor: '#fee2e2', border: '1px solid #fecaca', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                            <div style={{ fontSize: '24px' }}>⚠️</div>
                            <div>
                                <h4 style={{ margin: '0 0 8px 0', color: '#b91c1c', fontSize: '15px' }}>
                                    {selectedReq.status === 'Manager_Rejected' ? 'Lý do Quản lý từ chối / Yêu cầu chỉnh sửa:' : 'Lý do Khách hàng yêu cầu chỉnh sửa:'}
                                </h4>
                                <p style={{ margin: 0, color: '#991b1b', fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                    {selectedReq.status === 'Manager_Rejected' ? (selectedReq.manager_note || 'Không có ghi chú') : (selectedReq.customer_note || 'Không có ghi chú')}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="bento-grid">
                        <div className="bento-box">
                            <span className="bento-icon-bg">📅</span>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Thời gian <span style={{ color: '#1d4ed8', textTransform: 'none', marginLeft: '4px' }}>({durationDays} Ngày {durationNights} Đêm)</span></div>
                            <div style={{ fontSize: '15px', color: '#0f172a', fontWeight: '600', lineHeight: '1.5' }}>
                                Đi: {new Date(selectedReq.departure_date).toLocaleDateString('vi-VN')}<br/>
                                Về: {new Date(selectedReq.return_date).toLocaleDateString('vi-VN')}
                            </div>
                        </div>
                        <div className="bento-box">
                            <span className="bento-icon-bg">👥</span>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Thành viên</div>
                            <div style={{ fontSize: '24px', color: '#0f172a', fontWeight: '800' }}>{selectedReq.people_count}</div>
                            <div style={{ fontSize: '13px', color: '#475569' }}>
                                {selectedReq.preferences?.participantBreakdown?.adults || 0} Lớn, {selectedReq.preferences?.participantBreakdown?.children || 0} Trẻ em
                                {(selectedReq.preferences?.participantBreakdown?.toddlers > 0) && `, ${selectedReq.preferences.participantBreakdown.toddlers} Trẻ nhỏ`}
                                {(selectedReq.preferences?.participantBreakdown?.infants > 0) && `, ${selectedReq.preferences.participantBreakdown.infants} Em bé`}
                            </div>
                        </div>
                        {selectedReq.preferences?.note && (
                            <div className="bento-box" style={{ background: '#fffbeb', borderColor: '#fde68a', gridColumn: '1 / -1' }}>
                                <span className="bento-icon-bg" style={{ color: '#f59e0b', opacity: 0.1 }}>📝</span>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Ghi chú đặc biệt</div>
                                <div style={{ fontSize: '15px', color: '#92400e', fontWeight: '500' }}>{selectedReq.preferences.note}</div>
                            </div>
                        )}
                    </div>

                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '40px 0 20px 0' }}>📦 Bóc tách Dịch vụ Tạm tính</h3>
                    
                    <div className="bento-grid">
                        <div className="bento-box" style={{ background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                            <span className="bento-icon-bg" style={{ opacity: 0.03 }}>📍</span>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Đón khách</div>
                            <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: '700', marginBottom: '4px' }}>{selectedReq.preferences?.pickup_location || 'Tự túc'}</div>
                            {selectedReq.preferences?.departure_time && (
                                <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>⏰ {selectedReq.preferences.departure_time}</div>
                            )}
                        </div>
                        <div className="bento-box" style={{ background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                            <span className="bento-icon-bg" style={{ opacity: 0.03 }}>🚐</span>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Phương tiện</div>
                            <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: '700', marginBottom: '10px' }}>{selectedReq.preferences?.transportName || 'Chưa chọn'}</div>
                            <div style={{ marginTop: 'auto' }}>
                                <div style={{ marginTop: '12px', borderTop: '1px dashed #cbd5e1', paddingTop: '12px' }}>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>Đơn giá xe / Ngày</div>
                                    <div style={{ position: 'relative' }}>
                                        <FormattedMoneyInput value={adjTransportCost} onChange={val => setAdjTransportCost(val || 0)} style={{ width: '100%', padding: '6px 24px 6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', fontWeight: '700', color: '#1d4ed8', boxSizing: 'border-box' }} />
                                        <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8' }}>đ</span>
                                    </div>
                                </div>
                                {totalTransportPerPerson > 0 && (
                                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Chi phí/Khách:</span>
                                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#1d4ed8' }}>{formatMoney(totalTransportPerPerson)} đ</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bento-box" style={{ background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                            <span className="bento-icon-bg" style={{ opacity: 0.03 }}>🏨</span>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Lưu trú</div>
                            <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: '700', marginBottom: '10px' }}>{selectedReq.preferences?.hotelName || 'Chưa chọn'}</div>
                            <div style={{ marginTop: 'auto' }}>
                                <div style={{ marginTop: '12px', borderTop: '1px dashed #cbd5e1', paddingTop: '12px' }}>
                                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>Đơn giá phòng / Đêm</div>
                                    <div style={{ position: 'relative' }}>
                                        <FormattedMoneyInput value={adjHotelCost} onChange={val => setAdjHotelCost(val || 0)} style={{ width: '100%', padding: '6px 24px 6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', fontWeight: '700', color: '#1d4ed8', boxSizing: 'border-box' }} />
                                        <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8' }}>đ</span>
                                    </div>
                                </div>
                                {totalHotelPerPerson > 0 && (
                                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Chi phí/Khách:</span>
                                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#1d4ed8' }}>{formatMoney(totalHotelPerPerson)} đ</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {selectedReq.preferences?.meal && selectedReq.preferences.meal !== 'Khách tự túc' && (
                            <div className="bento-box" style={{ background: '#f8fafc' }}>
                                <span className="bento-icon-bg" style={{ opacity: 0.03 }}>🍽️</span>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Ăn uống</div>
                                <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: '700', marginBottom: '10px' }}>{selectedReq.preferences?.meal}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginTop: '12px', borderTop: '1px dashed #cbd5e1', paddingTop: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>Bữa sáng (Số lượng / Đơn giá)</div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input type="text" value={`Tự động: ${autoBreakfastQty}`} disabled style={{ width: '85px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#64748b', fontSize: '13px', boxSizing: 'border-box', textAlign: 'center' }} />
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <FormattedMoneyInput value={mealPrices.breakfast} onChange={val => setMealPrices({...mealPrices, breakfast: val || 0})} placeholder="Đơn giá" style={{ width: '100%', padding: '6px 24px 6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                                                <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8' }}>đ</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>Bữa trưa (Số lượng / Đơn giá)</div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input type="text" value={`Tự động: ${autoLunchQty}`} disabled style={{ width: '85px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#64748b', fontSize: '13px', boxSizing: 'border-box', textAlign: 'center' }} />
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <FormattedMoneyInput value={mealPrices.lunch} onChange={val => setMealPrices({...mealPrices, lunch: val || 0})} placeholder="Đơn giá" style={{ width: '100%', padding: '6px 24px 6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                                                <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8' }}>đ</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>Bữa tối (Số lượng / Đơn giá)</div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input type="text" value={`Tự động: ${autoDinnerQty}`} disabled style={{ width: '85px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#64748b', fontSize: '13px', boxSizing: 'border-box', textAlign: 'center' }} />
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <FormattedMoneyInput value={mealPrices.dinner} onChange={val => setMealPrices({...mealPrices, dinner: val || 0})} placeholder="Đơn giá" style={{ width: '100%', padding: '6px 24px 6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                                                <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8' }}>đ</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: 'auto' }}>
                                    {mealCostPerPerson > 0 && (
                                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Tổng/Khách:</span>
                                            <span style={{ fontSize: '16px', fontWeight: '800', color: '#10b981' }}>{formatMoney(mealCostPerPerson)} đ</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {selectedReq.preferences?.guide && selectedReq.preferences.guide !== 'Khách tự túc' && (
                            <div className="bento-box" style={{ background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                                <span className="bento-icon-bg" style={{ opacity: 0.03 }}>🗣️</span>
                                <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Hướng dẫn viên</div>
                                <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: '700', marginBottom: '10px' }}>{selectedReq.preferences?.guide}</div>
                                <div style={{ marginTop: 'auto' }}>
                                    <div style={{ marginTop: '12px', borderTop: '1px dashed #cbd5e1', paddingTop: '12px' }}>
                                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>Đơn giá HDV / Ngày</div>
                                        <div style={{ position: 'relative' }}>
                                            <FormattedMoneyInput placeholder="500000" value={guidePricePerDay || ''} onChange={val => setGuidePricePerDay(val || 0)} style={{ width: '100%', padding: '6px 24px 6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }} />
                                            <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#94a3b8' }}>đ</span>
                                        </div>
                                    </div>
                                    {guideCostPerPerson > 0 && (
                                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Chia đều/Khách:</span>
                                            <span style={{ fontSize: '16px', fontWeight: '800', color: '#10b981' }}>{formatMoney(guideCostPerPerson)} đ</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="bento-box" style={{ background: '#f8fafc', gridColumn: 'span 3' }}>
                            <span className="bento-icon-bg" style={{ opacity: 0.03 }}>🎫</span>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Điểm tham quan</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {selectedReq.preferences?.selectedPlaces?.length > 0 ? selectedReq.preferences.selectedPlaces.map(p => (
                                    <div key={p.place_id} style={{ background: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', fontWeight: '600', color: '#334155', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        📍 {p.name} <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'normal' }}>({formatMoney(p.price)}đ)</span>
                                    </div>
                                )) : <div style={{ fontSize: '14px', color: '#94a3b8' }}>Không có điểm tham quan nào</div>}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '30px', padding: '20px 30px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', display: 'inline-flex', gap: '24px', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Cost Gốc/Khách</div>
                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap' }}>{formatMoney(totalCost)} đ</div>
                        </div>
                        <div style={{ fontSize: '24px', color: '#cbd5e1' }}>+</div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Markup (%)</div>
                            <input 
                                type="number" 
                                value={tempMarkup} 
                                onChange={handleMarkupChange}
                                style={{ width: "70px", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "16px", fontWeight: "700", textAlign: "center", outline: 'none' }}
                            />
                        </div>
                        <div style={{ fontSize: '24px', color: '#cbd5e1' }}>=</div>
                        <div style={{ paddingLeft: '24px', borderLeft: '2px solid #e2e8f0' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Giá Báo Khách</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FormattedMoneyInput 
                                    value={suggestedPrice} 
                                    onChange={handlePriceChange}
                                    style={{ width: "140px", padding: "10px 14px", borderRadius: "8px", border: "1px solid #93c5fd", fontSize: "18px", fontWeight: "800", color: "#1d4ed8", outline: 'none', background: '#eff6ff' }}
                                />
                                <span style={{ fontSize: '18px', fontWeight: '800', color: '#1d4ed8', whiteSpace: 'nowrap' }}>đ</span>
                            </div>
                        </div>
                    </div>

                    {/* CHÍNH SÁCH GIÁ TRẺ EM */}
                    <div style={{ marginTop: '30px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1d4ed8' }}>Chính sách giá trẻ em</h3>
                            <select 
                                value={policyType} 
                                onChange={handlePolicyTemplateChange}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }}
                            >
                                <option value="Custom">Tùy chỉnh</option>
                                <option value="Template1">Mẫu 1 (Đường bộ): 50% - 0% - 0%</option>
                                <option value="Template2">Mẫu 2 (Hàng không): 85% - 50% - (0% + Phụ thu)</option>
                            </select>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                            {/* Trẻ em */}
                            <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Trẻ em (5 - 11 tuổi)</div>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Tỷ lệ % giá người lớn</div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <input type="text" value={childPolicy.child.percent} onChange={(e) => {
                                            let val = e.target.value.replace(/\D/g, '');
                                            updatePolicy('child', 'percent', val === '' ? 0 : parseInt(val, 10));
                                        }} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }} />
                                        <span style={{ marginLeft: '8px', color: '#64748b' }}>%</span>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Phụ thu cố định</div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <FormattedMoneyInput value={childPolicy.child.surcharge} onChange={(val) => updatePolicy('child', 'surcharge', val)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }} />
                                        <span style={{ marginLeft: '8px', color: '#64748b' }}>đ</span>
                                    </div>
                                </div>
                                <div style={{ paddingTop: '12px', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Giá bán:</span>
                                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#1d4ed8' }}>{formatMoney(childPrice)} đ</span>
                                </div>
                            </div>

                            {/* Trẻ nhỏ */}
                            <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Trẻ nhỏ (2 - 4 tuổi)</div>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Tỷ lệ % giá người lớn</div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <input type="text" value={childPolicy.toddler.percent} onChange={(e) => {
                                            let val = e.target.value.replace(/\D/g, '');
                                            updatePolicy('toddler', 'percent', val === '' ? 0 : parseInt(val, 10));
                                        }} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }} />
                                        <span style={{ marginLeft: '8px', color: '#64748b' }}>%</span>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Phụ thu cố định</div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <FormattedMoneyInput value={childPolicy.toddler.surcharge} onChange={(val) => updatePolicy('toddler', 'surcharge', val)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }} />
                                        <span style={{ marginLeft: '8px', color: '#64748b' }}>đ</span>
                                    </div>
                                </div>
                                <div style={{ paddingTop: '12px', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Giá bán:</span>
                                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#1d4ed8' }}>{formatMoney(toddlerPrice)} đ</span>
                                </div>
                            </div>

                            {/* Em bé */}
                            <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>Em bé (&lt; 2 tuổi)</div>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Tỷ lệ % giá người lớn</div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <input type="text" value={childPolicy.infant.percent} onChange={(e) => {
                                            let val = e.target.value.replace(/\D/g, '');
                                            updatePolicy('infant', 'percent', val === '' ? 0 : parseInt(val, 10));
                                        }} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }} />
                                        <span style={{ marginLeft: '8px', color: '#64748b' }}>%</span>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Phụ thu cố định</div>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <FormattedMoneyInput value={childPolicy.infant.surcharge} onChange={(val) => updatePolicy('infant', 'surcharge', val)} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }} />
                                        <span style={{ marginLeft: '8px', color: '#64748b' }}>đ</span>
                                    </div>
                                </div>
                                <div style={{ paddingTop: '12px', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Giá bán:</span>
                                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#1d4ed8' }}>{formatMoney(infantPrice)} đ</span>
                                </div>
                            </div>
                        </div>

                        {/* TỔNG KẾT CHI PHÍ */}
                        <div style={{ marginTop: '20px', padding: '16px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #93c5fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1d4ed8' }}>Tổng kết chi phí cho đoàn:</div>
                                <div style={{ fontSize: '13px', color: '#3b82f6', marginTop: '4px' }}>
                                    {numAdults} Lớn, {numChildren} Trẻ em, {numToddlers} Trẻ nhỏ, {numInfants} Em bé
                                </div>
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: '800', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FormattedMoneyInput 
                                    value={grandTotalPrice} 
                                    onChange={handleGrandTotalChange}
                                    style={{ fontSize: '24px', fontWeight: '800', color: '#1d4ed8', border: '1px solid #bfdbfe', background: '#fff', textAlign: 'right', width: '200px', outline: 'none', borderRadius: '6px', padding: '4px 8px' }}
                                />
                                <span>đ</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '30px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Ghi chú tư vấn (Chỉ nội bộ)</div>
                        <textarea
                            value={consultationNote}
                            onChange={(e) => setConsultationNote(e.target.value)}
                            placeholder="Ghi chú lại các thỏa thuận, yêu cầu đặc biệt sau khi trao đổi với khách..."
                            style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>
                
                {/* FIXED ACTION BAR DƯỚI CÙNG */}
                <div style={{ padding: '20px 30px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', boxShadow: '0 -4px 10px rgba(0,0,0,0.03)', flexShrink: 0, zIndex: 10, borderRadius: '0 0 20px 20px' }}>
                    <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
                        {['Pending', 'Customer_Revision', 'Manager_Rejected'].includes(selectedReq.status) && (
                            <button 
                                onClick={handleSendInitialQuote} 
                                style={{ padding: "12px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: 'pointer', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                            >
                                📤 {selectedReq.status === 'Pending' ? 'Gửi Báo Giá Cho Khách' : 'Gửi Lại Báo Giá Mới'}
                            </button>
                        )}
                        {selectedReq.status === 'Manager_Approved' && (
                            <button
                                onClick={handleSendToCustomer}
                                style={{ padding: "12px 20px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "14px", cursor: "pointer", boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)', whiteSpace: 'nowrap' }}
                            >
                                🚀 Gửi Bản Thiết Kế
                            </button>
                        )}
                    </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffTourRequestManager;

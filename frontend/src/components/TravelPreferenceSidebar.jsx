import React, { useState } from 'react';

const TravelPreferenceSidebar = ({ preferences, onPreferenceChange }) => {
    const [openSections, setOpenSections] = useState({
        destinations: true,
        duration: true,
        budget: true,
        purposes: true,
        companions: false,
        interests: false,
        transport: false,
        pace: false,
        accommodation: false,
        priorities: false
    });

    const toggleSection = (key) => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Destination options (100% matched with active tours DB)
    const destinationOptions = [
        { id: 'Đà Nẵng', name: '🌉 Đà Nẵng - Bà Nà - Hội An' },
        { id: 'Phú Quốc', name: '🏝️ Đảo Ngọc Phú Quốc' },
        { id: 'Đà Lạt', name: '🌲 Đà Lạt Mộng Mơ' },
        { id: 'Hạ Long', name: '🛳️ Vịnh Hạ Long' },
        { id: 'Sapa', name: '🏔️ Sapa - Đỉnh Fansipan' },
        { id: 'Nha Trang', name: '🏖️ Nha Trang - Vĩnh Hy' },
        { id: 'Hà Giang', name: '⛰️ Hà Giang - Sông Nho Quế' },
        { id: 'Quy Nhơn', name: '🌊 Quy Nhơn - Kỳ Co Eo Gió' },
        { id: 'Phú Yên', name: '🌾 Phú Yên - Gành Đá Đĩa' },
        { id: 'Hà Nội', name: '⛩️ Hà Nội - Tam Chúc - Tràng An' },
        { id: 'Tây Nguyên', name: '🐘 Tây Nguyên - Măng Đen' },
        { id: 'Cần Thơ', name: '🚣 Miền Tây - Cần Thơ - Sa Đéc' },
        { id: 'Tây Ninh', name: '⛰️ Tây Ninh - Núi Bà Đen' }
    ];

    // Duration options
    const durationOptions = [
        { id: 'All', label: 'Tất cả thời lượng' },
        { id: '1D', label: '⚡ Tour 1 Ngày (Đi trong ngày)' },
        { id: '2_3D', label: '🌤️ Tour 2 - 3 Ngày (Cuối tuần)' },
        { id: '4_5D', label: '🌿 Tour 4 - 5 Ngày (Kỳ nghỉ dài)' },
        { id: 'Long', label: '🗺️ Tour Dài Ngày (> 5 Ngày / Xuyên Việt)' }
    ];

    // Budget options
    const budgetOptions = [
        { id: 'All', label: 'Tất cả ngân sách' },
        { id: 'Under3M', label: '💵 Dưới 3.000.000đ' },
        { id: '3M_5M', label: '💳 3.000.000đ - 5.000.000đ' },
        { id: '5M_8M', label: '💎 5.000.000đ - 8.000.000đ' },
        { id: 'Above8M', label: '👑 Trên 8.000.000đ' }
    ];

    // Trip Purpose options
    const purposeOptions = [
        '🏝️ Du lịch Biển & Đảo',
        '🌲 Nghỉ dưỡng & Thư giãn',
        '⛰️ Khám phá thiên nhiên & Núi đèo',
        '⛩️ Văn hóa, Tâm linh & Di sản',
        '🚣 Sông nước & Sinh thái Miền Tây',
        '🏢 Teambuilding & Doanh nghiệp'
    ];

    // Companions options
    const companionOptions = [
        '👤 Đi một mình (Solo / Phượt)',
        '👩‍❤️‍👨 Cặp đôi & Đôi bạn',
        '👨‍👩‍👧‍👦 Gia đình có trẻ nhỏ',
        '👴 Gia đình người lớn tuổi',
        '👯 Nhóm bạn trẻ & Check-in',
        '💼 Đoàn công ty & Tập thể'
    ];

    // Interest options
    const interestOptions = [
        '🏊 Tắm biển & Lặn ngắm san hô',
        '🥾 Chinh phục đỉnh núi & Săn mây',
        '📸 Check-in & Chụp ảnh địa danh',
        '🚢 Du thuyền 5★ & Thuyền sông',
        '🍲 Thưởng thức Ẩm thực & Buffet',
        '🎢 Công viên giải trí & VinWonders / Safari'
    ];

    // Trip Pace options
    const paceOptions = [
        { id: 'All', label: 'Tất cả nhịp độ' },
        { id: 'Relaxed', label: '🍃 Thư thả & Thong dong' },
        { id: 'Moderate', label: '⚖️ Cân bằng & Vừa sức' },
        { id: 'Active', label: '⚡ Dày đặc & Năng động' }
    ];

    // Accommodation options
    const accommodationOptions = [
        { id: 'All', label: 'Tất cả hạng sao' },
        { id: '3Star', label: '⭐ 3★ Tiêu chuẩn' },
        { id: '4Star', label: '⭐⭐ 4★ Cao cấp' },
        { id: '5Star', label: '⭐⭐⭐ 5★ Sang trọng / Resort' },
        { id: 'Homestay', label: '🏡 Homestay / Villa trải nghiệm' }
    ];

    // Transport options
    const transportOptions = [
        '✈️ Máy bay khứ hồi',
        '🚌 Xe du lịch giường nằm / Limousine',
        '🚢 Du thuyền 5★ / Thuyền du lịch',
        '🚠 Cáp treo ngắm cảnh'
    ];

    // Priority options
    const priorityOptions = [
        '💰 Giá ưu đãi tốt nhất',
        '🏆 Dịch vụ cao cấp & 5 sao',
        '📅 Lịch trình linh hoạt',
        '🏙️ Khách sạn trung tâm',
        '🍽️ Trọn gói bữa ăn & Buffet'
    ];

    // Multi-select toggle helper
    const handleMultiToggle = (key, val) => {
        const arr = preferences[key] || [];
        const exists = arr.includes(val);
        const updated = exists ? arr.filter(i => i !== val) : [...arr, val];
        const newPrefs = { ...preferences, [key]: updated };
        onPreferenceChange(newPrefs);
    };

    // Single select helper
    const handleSingleSelect = (key, val) => {
        const newPrefs = { ...preferences, [key]: val };
        onPreferenceChange(newPrefs);
    };

    // Reset all filters
    const handleReset = () => {
        const resetObj = {
            destinations: [],
            duration: 'All',
            budgetRange: 'All',
            tripPurposes: [],
            companions: [],
            interests: [],
            pace: 'All',
            accommodationLevel: 'All',
            transportTypes: [],
            keyPriorities: [],
            searchTerm: '',
            departureDate: ''
        };
        onPreferenceChange(resetObj);
    };

    const countSelected = 
        (preferences.destinations?.length || 0) +
        (preferences.duration && preferences.duration !== 'All' ? 1 : 0) +
        (preferences.budgetRange && preferences.budgetRange !== 'All' ? 1 : 0) +
        (preferences.tripPurposes?.length || 0) +
        (preferences.companions?.length || 0) +
        (preferences.interests?.length || 0) +
        (preferences.transportTypes?.length || 0) +
        (preferences.keyPriorities?.length || 0) +
        (preferences.pace && preferences.pace !== 'All' ? 1 : 0) +
        (preferences.accommodationLevel && preferences.accommodationLevel !== 'All' ? 1 : 0);

    return (
        <aside style={{
            background: '#ffffff',
            borderRadius: '20px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
            padding: '20px',
            fontFamily: '"Outfit", "Inter", sans-serif',
            position: 'sticky',
            top: '90px',
            maxHeight: 'calc(100vh - 110px)',
            overflowY: 'auto'
        }}>
            {/* SIDEBAR HEADER */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '14px',
                marginBottom: '14px',
                borderBottom: '1.5px solid #f1f5f9'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🎛️</span>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Bộ Lọc Tiêu Chí</h3>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Tùy chọn chuyến đi phù hợp</span>
                    </div>
                </div>

                {countSelected > 0 && (
                    <button 
                        onClick={handleReset}
                        style={{
                            border: 'none',
                            background: '#fef2f2',
                            color: '#ef4444',
                            fontSize: '11.5px',
                            fontWeight: '700',
                            padding: '4px 10px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        🔄 Đặt lại
                    </button>
                )}
            </div>

            {countSelected > 0 && (
                <div style={{
                    background: '#e0f2fe',
                    color: '#0284c7',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <span>Đã chọn {countSelected} tiêu chí</span>
                    <span style={{ fontSize: '10px', background: '#0284c7', color: '#fff', padding: '2px 6px', borderRadius: '8px' }}>Active</span>
                </div>
            )}

            {/* SECTION 1: ĐIỂM ĐẾN */}
            <div style={{ marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <div 
                    onClick={() => toggleSection('destinations')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}
                >
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>📍 Điểm đến yêu thích</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{openSections.destinations ? '▼' : '▶'}</span>
                </div>

                {openSections.destinations && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {destinationOptions.map(d => {
                            const isChecked = preferences.destinations?.includes(d.id);
                            return (
                                <label key={d.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px',
                                    color: isChecked ? '#0194f3' : '#334155', fontWeight: isChecked ? '700' : '500',
                                    cursor: 'pointer', padding: '4px 8px', borderRadius: '8px',
                                    background: isChecked ? '#f0f9ff' : 'transparent', transition: 'all 0.15s'
                                }}>
                                    <input 
                                        type="checkbox"
                                        checked={isChecked || false}
                                        onChange={() => handleMultiToggle('destinations', d.id)}
                                        style={{ accentColor: '#0194f3', width: '15px', height: '15px', cursor: 'pointer' }}
                                    />
                                    <span>{d.name}</span>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* SECTION 2: THỜI LƯỢNG CHUYẾN ĐI */}
            <div style={{ marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <div 
                    onClick={() => toggleSection('duration')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}
                >
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>⏱️ Thời lượng chuyến đi</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{openSections.duration ? '▼' : '▶'}</span>
                </div>

                {openSections.duration && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {durationOptions.map(dur => (
                            <label key={dur.id} style={{
                                display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px',
                                color: (preferences.duration || 'All') === dur.id ? '#0284c7' : '#334155', fontWeight: (preferences.duration || 'All') === dur.id ? '700' : '500',
                                cursor: 'pointer', padding: '4px 8px', borderRadius: '8px',
                                background: (preferences.duration || 'All') === dur.id ? '#f0f9ff' : 'transparent'
                            }}>
                                <input 
                                    type="radio"
                                    name="duration_sidebar"
                                    checked={(preferences.duration || 'All') === dur.id}
                                    onChange={() => handleSingleSelect('duration', dur.id)}
                                    style={{ accentColor: '#0284c7', cursor: 'pointer' }}
                                />
                                <span>{dur.label}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* SECTION 3: MỨC NGÂN SÁCH */}
            <div style={{ marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <div 
                    onClick={() => toggleSection('budget')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}
                >
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>💰 Mức ngân sách / người</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{openSections.budget ? '▼' : '▶'}</span>
                </div>

                {openSections.budget && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {budgetOptions.map(b => (
                            <label key={b.id} style={{
                                display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px',
                                color: (preferences.budgetRange || 'All') === b.id ? '#0284c7' : '#334155', fontWeight: (preferences.budgetRange || 'All') === b.id ? '700' : '500',
                                cursor: 'pointer', padding: '4px 8px', borderRadius: '8px',
                                background: (preferences.budgetRange || 'All') === b.id ? '#f0f9ff' : 'transparent'
                            }}>
                                <input 
                                    type="radio"
                                    name="budget_sidebar"
                                    checked={(preferences.budgetRange || 'All') === b.id}
                                    onChange={() => handleSingleSelect('budgetRange', b.id)}
                                    style={{ accentColor: '#0284c7', cursor: 'pointer' }}
                                />
                                <span>{b.label}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* SECTION 4: MỤC ĐÍCH CHUYẾN ĐI */}
            <div style={{ marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <div 
                    onClick={() => toggleSection('purposes')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}
                >
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>🎯 Mục đích chuyến đi</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{openSections.purposes ? '▼' : '▶'}</span>
                </div>

                {openSections.purposes && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {purposeOptions.map(p => {
                            const isChecked = preferences.tripPurposes?.includes(p);
                            return (
                                <label key={p} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px',
                                    color: isChecked ? '#10b981' : '#334155', fontWeight: isChecked ? '700' : '500',
                                    cursor: 'pointer', padding: '4px 8px', borderRadius: '8px',
                                    background: isChecked ? '#f0fdf4' : 'transparent', transition: 'all 0.15s'
                                }}>
                                    <input 
                                        type="checkbox"
                                        checked={isChecked || false}
                                        onChange={() => handleMultiToggle('tripPurposes', p)}
                                        style={{ accentColor: '#10b981', width: '15px', height: '15px', cursor: 'pointer' }}
                                    />
                                    <span>{p}</span>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* SECTION 5: ĐỐI TƯỢNG ĐI CÙNG */}
            <div style={{ marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <div 
                    onClick={() => toggleSection('companions')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}
                >
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>👥 Đối tượng đi cùng</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{openSections.companions ? '▼' : '▶'}</span>
                </div>

                {openSections.companions && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {companionOptions.map(c => {
                            const isChecked = preferences.companions?.includes(c);
                            return (
                                <label key={c} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px',
                                    color: isChecked ? '#8b5cf6' : '#334155', fontWeight: isChecked ? '700' : '500',
                                    cursor: 'pointer', padding: '4px 8px', borderRadius: '8px',
                                    background: isChecked ? '#f5f3ff' : 'transparent', transition: 'all 0.15s'
                                }}>
                                    <input 
                                        type="checkbox"
                                        checked={isChecked || false}
                                        onChange={() => handleMultiToggle('companions', c)}
                                        style={{ accentColor: '#8b5cf6', width: '15px', height: '15px', cursor: 'pointer' }}
                                    />
                                    <span>{c}</span>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* SECTION 6: SỞ THÍCH & TRẢI NGHIỆM */}
            <div style={{ marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <div 
                    onClick={() => toggleSection('interests')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}
                >
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>🎨 Trải nghiệm & Sở thích</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{openSections.interests ? '▼' : '▶'}</span>
                </div>

                {openSections.interests && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {interestOptions.map(i => {
                            const isChecked = preferences.interests?.includes(i);
                            return (
                                <label key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px',
                                    color: isChecked ? '#f59e0b' : '#334155', fontWeight: isChecked ? '700' : '500',
                                    cursor: 'pointer', padding: '4px 8px', borderRadius: '8px',
                                    background: isChecked ? '#fffbeb' : 'transparent', transition: 'all 0.15s'
                                }}>
                                    <input 
                                        type="checkbox"
                                        checked={isChecked || false}
                                        onChange={() => handleMultiToggle('interests', i)}
                                        style={{ accentColor: '#f59e0b', width: '15px', height: '15px', cursor: 'pointer' }}
                                    />
                                    <span>{i}</span>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* SECTION 7: PHƯƠNG TIỆN DI CHUYỂN */}
            <div style={{ marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <div 
                    onClick={() => toggleSection('transport')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}
                >
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>✈️ Phương tiện di chuyển</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{openSections.transport ? '▼' : '▶'}</span>
                </div>

                {openSections.transport && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {transportOptions.map(t => {
                            const isChecked = preferences.transportTypes?.includes(t);
                            return (
                                <label key={t} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px',
                                    color: isChecked ? '#0284c7' : '#334155', fontWeight: isChecked ? '700' : '500',
                                    cursor: 'pointer', padding: '4px 8px', borderRadius: '8px',
                                    background: isChecked ? '#f0f9ff' : 'transparent'
                                }}>
                                    <input 
                                        type="checkbox"
                                        checked={isChecked || false}
                                        onChange={() => handleMultiToggle('transportTypes', t)}
                                        style={{ accentColor: '#0284c7', width: '15px', height: '15px', cursor: 'pointer' }}
                                    />
                                    <span>{t}</span>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* SECTION 8: NHỊP ĐỘ CHUYẾN ĐI */}
            <div style={{ marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <div 
                    onClick={() => toggleSection('pace')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}
                >
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>⏱️ Nhịp độ lịch trình</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{openSections.pace ? '▼' : '▶'}</span>
                </div>

                {openSections.pace && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {paceOptions.map(p => (
                            <label key={p.id} style={{
                                display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px',
                                color: preferences.pace === p.id ? '#0284c7' : '#334155', fontWeight: preferences.pace === p.id ? '700' : '500',
                                cursor: 'pointer', padding: '4px 8px', borderRadius: '8px',
                                background: preferences.pace === p.id ? '#f0f9ff' : 'transparent'
                            }}>
                                <input 
                                    type="radio"
                                    name="pace_sidebar"
                                    checked={preferences.pace === p.id}
                                    onChange={() => handleSingleSelect('pace', p.id)}
                                    style={{ accentColor: '#0284c7', cursor: 'pointer' }}
                                />
                                <span>{p.label}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* SECTION 9: HẠNG LƯU TRÚ */}
            <div style={{ marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <div 
                    onClick={() => toggleSection('accommodation')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}
                >
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>🏨 Hạng Khách sạn</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{openSections.accommodation ? '▼' : '▶'}</span>
                </div>

                {openSections.accommodation && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {accommodationOptions.map(a => (
                            <label key={a.id} style={{
                                display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px',
                                color: preferences.accommodationLevel === a.id ? '#0284c7' : '#334155', fontWeight: preferences.accommodationLevel === a.id ? '700' : '500',
                                cursor: 'pointer', padding: '4px 8px', borderRadius: '8px',
                                background: preferences.accommodationLevel === a.id ? '#f0f9ff' : 'transparent'
                            }}>
                                <input 
                                    type="radio"
                                    name="acc_sidebar"
                                    checked={preferences.accommodationLevel === a.id}
                                    onChange={() => handleSingleSelect('accommodationLevel', a.id)}
                                    style={{ accentColor: '#0284c7', cursor: 'pointer' }}
                                />
                                <span>{a.label}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* SECTION 10: ƯU TIÊN QUAN TRỌNG */}
            <div style={{ marginBottom: '8px' }}>
                <div 
                    onClick={() => toggleSection('priorities')}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '4px 0' }}
                >
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>⭐ Ưu tiên quan trọng</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{openSections.priorities ? '▼' : '▶'}</span>
                </div>

                {openSections.priorities && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {priorityOptions.map(p => {
                            const isChecked = preferences.keyPriorities?.includes(p);
                            return (
                                <label key={p} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px',
                                    color: isChecked ? '#ef4444' : '#334155', fontWeight: isChecked ? '700' : '500',
                                    cursor: 'pointer', padding: '4px 8px', borderRadius: '8px',
                                    background: isChecked ? '#fef2f2' : 'transparent'
                                }}>
                                    <input 
                                        type="checkbox"
                                        checked={isChecked || false}
                                        onChange={() => handleMultiToggle('keyPriorities', p)}
                                        style={{ accentColor: '#ef4444', width: '15px', height: '15px', cursor: 'pointer' }}
                                    />
                                    <span>{p}</span>
                                </label>
                            );
                        })}
                    </div>
                )}
            </div>
        </aside>
    );
};

export default TravelPreferenceSidebar;

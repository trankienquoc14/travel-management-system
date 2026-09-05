import React from 'react';
import axios from 'axios';

// Helper function to get or generate persistent session ID
const getSessionId = () => {
    let sid = localStorage.getItem('ai_session_id');
    if (!sid) {
        sid = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('ai_session_id', sid);
    }
    return sid;
};

// Global Behavioral Tracker Function for Recommendation Engine
export const trackBehavior = async (eventType, tourId = null, metadata = {}) => {
    try {
        const sessionId = getSessionId();
        await axios.post('http://localhost:5000/api/tours/behavior-log', {
            session_id: sessionId,
            event_type: eventType,
            tour_id: tourId,
            metadata
        });
    } catch (e) {
        console.warn('Behavior Logger Warning:', e.message);
    }
};

const TravelPreferenceFilter = ({ preferences, onPreferenceChange, onSearchSubmit }) => {
    const budgetOptions = [
        { id: 'All', label: 'Tất cả ngân sách' },
        { id: 'Under3M', label: '💵 Phổ thông (< 3 Triệu)' },
        { id: '3M_6M', label: '💳 Tiêu chuẩn (3 - 6 Triệu)' },
        { id: '6M_12M', label: '💎 Cao cấp (6 - 12 Triệu)' },
        { id: 'Above12M', label: '👑 Sang trọng / VIP (> 12 Triệu)' }
    ];

    const handleApply = async () => {
        try {
            localStorage.setItem('user_travel_preferences', JSON.stringify(preferences));
            const sessionId = getSessionId();

            // Post structured preferences payload to backend API for recommendation training
            await axios.post('http://localhost:5000/api/tours/preferences', {
                session_id: sessionId,
                destinations: preferences.destinations || [],
                trip_purposes: preferences.tripPurposes || [],
                companions: preferences.companions || [],
                budget_range: preferences.budgetRange || 'All',
                interests: preferences.interests || [],
                pace_preference: preferences.pace || 'All',
                accommodation_level: preferences.accommodationLevel || 'All',
                transport_type: preferences.transportTypes || [],
                key_priorities: preferences.keyPriorities || []
            });

            // Log behavior event
            trackBehavior('SEARCH', null, { preferences });

            if (onSearchSubmit) onSearchSubmit();
        } catch (e) {
            console.warn('Lỗi đồng bộ Preference Profile:', e.message);
            if (onSearchSubmit) onSearchSubmit();
        }
    };

    return (
        <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12), 0 1px 3px rgba(0,0,0,0.05)',
            border: '1.5px solid #e2e8f0',
            maxWidth: '1140px',
            margin: '0 auto',
            overflow: 'hidden',
            fontFamily: '"Outfit", "Inter", sans-serif'
        }}>
            {/* HEADER BANNER */}
            <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#ffffff',
                padding: '14px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0194f3 0%, #0066cc 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', boxShadow: '0 0 12px rgba(1, 148, 243, 0.5)'
                    }}>
                        🧳
                    </div>
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>Bộ Lọc Tìm Kiếm Chuyến Đi Thông Minh</span>
                            <span style={{ fontSize: '10px', background: '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>CÁ NHÂN HÓA</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                            Nhập từ khóa, thời gian và mức ngân sách mong muốn để tìm kiếm chuyến đi phù hợp nhất
                        </div>
                    </div>
                </div>
            </div>

            {/* QUICK SEARCH BAR (4 FIELDS) */}
            <div style={{ padding: '20px 24px', background: '#ffffff', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'center' }}>
                <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                        📍 Từ khóa / Điểm đến
                    </label>
                    <input
                        type="text"
                        placeholder="Nhập Đà Lạt, Phú Quốc, Sapa..."
                        value={preferences.searchTerm || ''}
                        onChange={(e) => onPreferenceChange({ ...preferences, searchTerm: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '600', outline: 'none' }}
                    />
                </div>

                <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                        📅 Ngày khởi hành mong muốn
                    </label>
                    <input
                        type="date"
                        value={preferences.departureDate || ''}
                        onChange={(e) => onPreferenceChange({ ...preferences, departureDate: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '600', outline: 'none' }}
                    />
                </div>

                <div>
                    <label style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                        💰 Mức ngân sách / người
                    </label>
                    <select
                        value={preferences.budgetRange || 'All'}
                        onChange={(e) => onPreferenceChange({ ...preferences, budgetRange: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '600', background: '#fff', outline: 'none' }}
                    >
                        {budgetOptions.map(b => (
                            <option key={b.id} value={b.id}>{b.label}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
                    <button
                        onClick={handleApply}
                        style={{
                            flex: 1,
                            padding: '12px 20px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #0194f3 0%, #0066cc 100%)',
                            color: '#fff',
                            fontWeight: '800',
                            fontSize: '14px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(1, 148, 243, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                        }}
                    >
                        🔍 Tìm Tour Phù Hợp
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TravelPreferenceFilter;

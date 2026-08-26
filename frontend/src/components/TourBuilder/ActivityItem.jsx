
import React, { useState } from 'react';

const ActivityItem = ({ places, activities, disabled, onAdd, startPlaces, endPlaces, startDestName, endDestName, requestData }) => {
    const [selectedValue, setSelectedValue] = useState('');

    const handleSelect = (e) => {
        const placeId = e.target.value;
        if (!placeId) return;

        const place = places.find(p => String(p.place_id) === String(placeId));
        if (place) {
            onAdd({
                type: 'Tham quan',
                name: place.auto_text || place.place_name,
                price: place.estimated_price || 0,
                place_id: place.place_id
            });
        }
        setSelectedValue(''); // Reset after adding
    };

    let customerSelectedPlaceNames = [];
    if (requestData && requestData.preferences) {
        try {
            const prefs = typeof requestData.preferences === 'string' ? JSON.parse(requestData.preferences) : requestData.preferences;
            if (prefs.selectedPlaces && Array.isArray(prefs.selectedPlaces)) {
                customerSelectedPlaceNames = prefs.selectedPlaces.map(p => p.name);
            }
        } catch(e) {}
    }

    // Lọc ra các place chưa được thêm vào activities
    const availableStartPlaces = startPlaces ? startPlaces.filter(p => !activities.some(act => act.place_id && String(act.place_id) === String(p.place_id))) : [];
    const availableEndPlaces = endPlaces ? endPlaces.filter(p => !activities.some(act => act.place_id && String(act.place_id) === String(p.place_id))) : [];

    const isSelectedByCustomer = (p) => customerSelectedPlaceNames.includes(p.place_name) || customerSelectedPlaceNames.includes(p.auto_text);

    const customerStartPlaces = availableStartPlaces.filter(isSelectedByCustomer);
    const remainingStartPlaces = availableStartPlaces.filter(p => !isSelectedByCustomer(p));

    const customerEndPlaces = availableEndPlaces.filter(isSelectedByCustomer);
    const remainingEndPlaces = availableEndPlaces.filter(p => !isSelectedByCustomer(p));

    const uniqueCustomerPlaces = Array.from(new Map([...customerStartPlaces, ...customerEndPlaces].map(p => [p.place_id, p])).values());

    return (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
            <select 
                value={selectedValue}
                onChange={handleSelect}
                disabled={disabled}
                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px dashed #3b82f6', background: disabled ? '#f1f5f9' : '#eff6ff', color: '#2563eb', fontWeight: 'bold' }}
            >
                <option value="">{disabled ? 'Chọn Điểm xuất phát/Điểm đến để tải...' : '+ Chọn Nhanh Địa Điểm / Hoạt động'}</option>
                
                {uniqueCustomerPlaces.length > 0 && (
                    <optgroup label="⭐ LỰA CHỌN CỦA KHÁCH">
                        {uniqueCustomerPlaces.map(p => (
                            <option key={p.place_id} value={p.place_id}>⭐ {p.auto_text || p.place_name}</option>
                        ))}
                    </optgroup>
                )}

                {remainingStartPlaces.length > 0 && (
                    <optgroup label={`Tại Điểm xuất phát: ${startDestName || 'Không xác định'}`}>
                        {remainingStartPlaces.map(p => (
                            <option key={p.place_id} value={p.place_id}>{p.auto_text || p.place_name} (Giá: {p.estimated_price || 0}đ)</option>
                        ))}
                    </optgroup>
                )}

                {remainingEndPlaces.length > 0 && (
                    <optgroup label={`Tại Điểm đến: ${endDestName || 'Không xác định'}`}>
                        {remainingEndPlaces.map(p => (
                            <option key={p.place_id} value={p.place_id}>{p.auto_text || p.place_name} (Giá: {p.estimated_price || 0}đ)</option>
                        ))}
                    </optgroup>
                )}
            </select>
        </div>
    );
};

export default ActivityItem;

/**
 * Helper chuẩn hóa hiển thị xe trong toàn hệ thống:
 * "Tên xe kèm số chỗ" (ví dụ: Toyota Fortuner / Innova Cross (7 chỗ), Ford Transit / Solati (16 chỗ)...)
 */
export const formatVehicleDisplayName = (t) => {
    if (!t) return '';
    let name = '';
    let seats = null;

    if (typeof t === 'object') {
        seats = t.capacity || t.seat_capacity || t.seats;
        name = t.vehicle_name || t.vehicle_model || t.brand_model || t.service_vehicle_model;
        if (!name) {
            name = t.service_name || t.name || t.title || t.vehicle_type || 'Xe du lịch';
        }
    } else {
        name = String(t);
    }

    // Làm sạch từ khóa thừa
    name = name.replace(/\s*\(Nội bộ\)\s*\/\s*Ngày/gi, '')
               .replace(/\s*\(Nội bộ\)/gi, '')
               .replace(/\s*Nội bộ/gi, '')
               .replace(/\s*\/\s*Ngày/gi, '')
               .trim();

    // 1. Dạng có tên model trong ngoặc: 'Xe ... 16 chỗ (Ford Transit / Solati)'
    const matchWithParen = name.match(/^Xe\s+.*?\s*(\d+)\s*chỗ(?:\s+VIP)?\s*\((.+?)\)/i);
    if (matchWithParen) {
        const extractedModel = matchWithParen[2].replace(/\s*Nội bộ/gi, '').trim();
        const extractedSeats = matchWithParen[1];
        return extractedModel ? `${extractedModel} (${extractedSeats} chỗ)` : name;
    }

    // 2. Dạng 'Xe Limousine 11 chỗ Hạng Thượng Đỉnh'
    const matchSpecial = name.match(/^Xe\s+(.+?)\s*(\d+)\s*chỗ(?:\s+(.+?))?$/i);
    if (matchSpecial) {
        const typeName = matchSpecial[1].trim();
        const extractedSeats = matchSpecial[2];
        const extraDesc = matchSpecial[3] ? matchSpecial[3].replace(/[()]/g, '').trim() : '';
        const fullTitle = extraDesc ? `${typeName} ${extraDesc}` : typeName;
        return `${fullTitle} (${extractedSeats} chỗ)`;
    }

    // 3. Nếu tên đã có số chỗ (ví dụ: 'Innova (7 chỗ)' hoặc 'Toyota Fortuner 7 chỗ')
    if (name.includes('chỗ')) {
        return name;
    }

    // 4. Nếu có seats từ object
    const matchSeats = name.match(/(\d+)\s*chỗ/i);
    const finalSeats = seats || (matchSeats ? matchSeats[1] : null);

    if (finalSeats) {
        return `${name} (${finalSeats} chỗ)`;
    }

    return name;
};

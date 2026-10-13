const fs = require('fs');

let content = fs.readFileSync('microservices/tour-service/controllers/vehicleController.js', 'utf8');

const replacement = `
    if (!departure_id || !vehicle_id || !driver_id || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ: Chuyến đi, Chiếc xe (Biển số), Tài xế và Ngày bắt đầu/kết thúc!' });
    }

    // 1. Kiểm tra trạng thái kỹ thuật (INACTIVE, REPAIR, MAINTENANCE)
    const [vehicles] = await sequelize.query('SELECT status, seat_capacity FROM vehicles WHERE vehicle_id = ?', { replacements: [vehicle_id] });
    if (vehicles.length > 0) {
      const v = vehicles[0];
      if (v.status === 'INACTIVE') {
        return res.status(400).json({ success: false, message: '❌ Xe này đang tạm ngưng hoạt động!' });
      }
      
      // Kiểm tra sức chứa
      const [deps] = await sequelize.query('SELECT max_slots FROM departures WHERE departure_id = ?', { replacements: [departure_id] });
      if (deps.length > 0 && deps[0].max_slots > v.seat_capacity) {
         return res.status(400).json({ success: false, message: \`❌ Sức chứa của xe (\${v.seat_capacity} chỗ) không đủ đáp ứng số chỗ của tour (\${deps[0].max_slots} chỗ)!\` });
      }
    }

    // 2. Kiểm tra xem có vướng lịch bảo dưỡng/sửa chữa không
    const [maintenance] = await sequelize.query(\`
      SELECT maintenance_id FROM vehicle_maintenances
      WHERE vehicle_id = ? AND status = 'IN_PROGRESS'
        AND (start_date <= ? AND end_date >= ?)
      LIMIT 1
    \`, { replacements: [vehicle_id, end_date, start_date] });
    
    if (maintenance && maintenance.length > 0) {
      return res.status(400).json({ success: false, message: '❌ Xe này đang có lịch bảo dưỡng/sửa chữa trong thời gian tour diễn ra!' });
    }

    // Kiểm tra xe có bị trùng lịch không`;

content = content.replace(
`    if (!departure_id || !vehicle_id || !driver_id || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ: Chuyến đi, Chiếc xe (Biển số), Tài xế và Ngày bắt đầu/kết thúc!' });
    }

    // Kiểm tra xe có bị trùng lịch không`,
replacement);

fs.writeFileSync('microservices/tour-service/controllers/vehicleController.js', content);
console.log('Dispatch updated');

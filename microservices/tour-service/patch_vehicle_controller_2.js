const fs = require('fs');

let content = fs.readFileSync('controllers/vehicleController.js', 'utf8');

const newCode = `

// ==========================================
// OFFICE STAFF FUNCTIONS
// ==========================================

exports.updateVehicleStatusStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_status, reason, start_date, end_date } = req.body;
    const userId = req.user.id;

    // Check current status
    const [vehicles] = await sequelize.query('SELECT status, license_plate FROM vehicles WHERE vehicle_id = ?', {
      replacements: [id]
    });

    if (vehicles.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy xe' });
    }

    const currentStatus = vehicles[0].status;

    if (new_status === 'IN_TOUR' || currentStatus === 'IN_TOUR') {
      return res.status(403).json({ success: false, message: 'Không thể chuyển thủ công trạng thái Đang đi tour' });
    }

    await sequelize.query('UPDATE vehicles SET status = ? WHERE vehicle_id = ?', {
      replacements: [new_status, id]
    });

    await sequelize.query(\`
      INSERT INTO vehicle_status_history (vehicle_id, old_status, new_status, reason, updated_by)
      VALUES (?, ?, ?, ?, ?)
    \`, {
      replacements: [id, currentStatus, new_status, reason || '', userId]
    });

    if (new_status === 'MAINTENANCE' || new_status === 'REPAIR') {
      await sequelize.query(\`
        INSERT INTO vehicle_maintenances (vehicle_id, start_date, end_date, reason, status)
        VALUES (?, ?, ?, ?, 'IN_PROGRESS')
      \`, {
        replacements: [id, start_date || new Date(), end_date || new Date(), reason || '']
      });
    }

    res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
  } catch (error) {
    console.error('Lỗi updateVehicleStatusStaff:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDriverIncidentsStaff = async (req, res) => {
  try {
    const [incidents] = await sequelize.query(\`
      SELECT d.*, v.license_plate, v.brand_model, v.status as vehicle_status
      FROM driver_incidents d
      LEFT JOIN vehicles v ON d.vehicle_number = v.license_plate
      ORDER BY d.created_at DESC
    \`);
    res.json({ success: true, data: incidents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDriverIncidentStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, action, reason } = req.body;
    const userId = req.user.id;

    await sequelize.query('UPDATE driver_incidents SET status = ? WHERE incident_id = ?', {
      replacements: [status, id]
    });

    if (action === 'REPAIR') {
      // Find the vehicle
      const [incs] = await sequelize.query('SELECT vehicle_number FROM driver_incidents WHERE incident_id = ?', { replacements: [id] });
      if (incs.length > 0) {
        const lp = incs[0].vehicle_number;
        const [vehs] = await sequelize.query('SELECT vehicle_id, status FROM vehicles WHERE license_plate = ?', { replacements: [lp] });
        if (vehs.length > 0) {
          const v = vehs[0];
          await sequelize.query('UPDATE vehicles SET status = ? WHERE vehicle_id = ?', { replacements: ['REPAIR', v.vehicle_id] });
          await sequelize.query(\`
            INSERT INTO vehicle_status_history (vehicle_id, old_status, new_status, reason, updated_by)
            VALUES (?, ?, ?, ?, ?)
          \`, {
            replacements: [v.vehicle_id, v.status, 'REPAIR', reason || 'Chuyển từ báo cáo sự cố', userId]
          });
          await sequelize.query(\`
            INSERT INTO vehicle_maintenances (vehicle_id, start_date, end_date, reason, status)
            VALUES (?, ?, ?, ?, 'IN_PROGRESS')
          \`, {
            replacements: [v.vehicle_id, new Date(), new Date(), reason || '']
          });
        }
      }
    }

    res.json({ success: true, message: 'Đã cập nhật sự cố' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVehicleHistoryStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const [history] = await sequelize.query(\`
      SELECT h.*, u.full_name as user_name
      FROM vehicle_status_history h
      LEFT JOIN users u ON h.updated_by = u.user_id
      WHERE h.vehicle_id = ?
      ORDER BY h.created_at DESC
    \`, { replacements: [id] });
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

`;

if (!content.includes('updateVehicleStatusStaff')) {
  fs.writeFileSync('controllers/vehicleController.js', content + newCode);
  console.log("Added new methods to vehicleController.js");
}


exports.getOperationalDepartures = async (req, res) => {
    try {
        const query = `
            SELECT 
                d.departure_id, d.tour_id, d.departure_date, d.return_date, 
                d.max_slots, d.available_slots, d.status, 
                d.operational_status, d.decision_history,
                t.tour_name, t.duration_days, t.design_data, t.tour_type, t.destination
            FROM departures d
            JOIN tours t ON d.tour_id = t.tour_id
            ORDER BY d.departure_date ASC
        `;
        const [rows] = await sequelize.query(query);
        
        const departures = rows.map(r => {
            let minPax = 15;
            let destName = r.destination;
            if (r.design_data) {
                try {
                    const parsed = typeof r.design_data === 'string' ? JSON.parse(r.design_data) : r.design_data;
                    if (parsed?.costConfig?.minimumPax) minPax = parsed.costConfig.minimumPax;
                } catch(e) {}
            }
            
            // Calculate current pax: max_slots - available_slots
            const currentPax = (r.max_slots || 0) - (r.available_slots || 0);
            
            // Calculate days until departure
            const today = new Date();
            today.setHours(0,0,0,0);
            const depDate = new Date(r.departure_date);
            depDate.setHours(0,0,0,0);
            const diffTime = depDate - today;
            const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let milestone = null;
            if (daysUntil <= 7 && daysUntil > 0) milestone = 'T-7';
            else if (daysUntil <= 14 && daysUntil > 7) milestone = 'T-14';
            else if (daysUntil <= 21 && daysUntil > 14) milestone = 'T-21';
            
            let decHistory = [];
            if (r.decision_history) {
                decHistory = typeof r.decision_history === 'string' ? JSON.parse(r.decision_history) : r.decision_history;
            }

            return {
                ...r,
                min_pax: minPax,
                current_pax: currentPax,
                days_until: daysUntil,
                milestone: milestone,
                decision_history: decHistory
            };
        });
        
        res.status(200).json({ success: true, data: departures });
    } catch (err) {
        console.error('Error getOperationalDepartures:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.makeOperationalDecision = async (req, res) => {
    const { id } = req.params;
    const { action, note, user_id, user_name } = req.body;
    
    try {
        const [depRows] = await sequelize.query('SELECT * FROM departures WHERE departure_id = ?', {
            replacements: [id]
        });
        
        if (!depRows || depRows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đợt khởi hành' });
        }
        
        const dep = depRows[0];
        
        let newOperationalStatus = dep.operational_status;
        let newStatus = dep.status;
        
        if (action === 'Xác nhận vận hành') {
            newOperationalStatus = 'Confirmed';
        } else if (action === 'Tiếp tục xem xét') {
            newOperationalStatus = 'Reviewing';
        } else if (action === 'Đóng tour') {
            newOperationalStatus = 'Cancelled';
            newStatus = 'Closed';
        } else if (action === 'Đóng booking') {
            newStatus = 'Closed';
        }
        
        let decHistory = [];
        if (dep.decision_history) {
            decHistory = typeof dep.decision_history === 'string' ? JSON.parse(dep.decision_history) : dep.decision_history;
        }
        
        const currentPax = (dep.max_slots || 0) - (dep.available_slots || 0);
        
        decHistory.push({
            timestamp: new Date().toISOString(),
            user_id: user_id || req.user?.id || 'System',
            user_name: user_name || req.user?.full_name || 'System',
            action: action,
            pax_at_time: currentPax + '/' + dep.max_slots,
            note: note || ''
        });
        
        await sequelize.query(`
            UPDATE departures 
            SET operational_status = ?, status = ?, decision_history = ?
            WHERE departure_id = ?
        `, {
            replacements: [newOperationalStatus, newStatus, JSON.stringify(decHistory), id]
        });
        
        res.status(200).json({ success: true, message: 'Đã lưu quyết định thành công.' });
    } catch (err) {
        console.error('Error makeOperationalDecision:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

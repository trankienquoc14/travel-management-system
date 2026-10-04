const sequelize = require('../config/database');

exports.getGroups = async (req, res) => {
    try {
        const query = `
            SELECT 
                g.*, 
                d.departure_date, t.tour_name, t.tour_id,
                (SELECT COUNT(*) FROM service_requests sr WHERE sr.group_id = g.id) as request_count,
                (SELECT COUNT(*) FROM service_requests sr WHERE sr.group_id = g.id AND sr.status = 'Accepted') as accepted_count,
                (SELECT COUNT(*) FROM service_requests sr WHERE sr.group_id = g.id AND sr.status = 'Pending') as pending_count,
                (SELECT COUNT(*) FROM service_requests sr WHERE sr.group_id = g.id AND sr.status = 'Rejected') as rejected_count,
                p.code as parent_code
            FROM service_request_groups g
            JOIN departures d ON g.departure_id = d.departure_id
            JOIN tours t ON d.tour_id = t.tour_id
            LEFT JOIN service_request_groups p ON g.parent_id = p.id
            ORDER BY g.created_at DESC
        `;
        const [rows] = await sequelize.query(query);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.getGroupById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const groupQuery = `
            SELECT 
                g.*, 
                d.departure_date, t.tour_name, t.tour_id
            FROM service_request_groups g
            JOIN departures d ON g.departure_id = d.departure_id
            JOIN tours t ON d.tour_id = t.tour_id
            WHERE g.id = ?
        `;
        const [groupRows] = await sequelize.query(groupQuery, { replacements: [id] });
        if (groupRows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        
        const group = groupRows[0];
        
        const reqQuery = `
            SELECT 
                sr.*, p.partner_name 
            FROM service_requests sr
            JOIN partners p ON sr.partner_id = p.partner_id
            WHERE sr.group_id = ?
        `;
        const [reqRows] = await sequelize.query(reqQuery, { replacements: [id] });
        
        group.requests = reqRows.map(r => ({
            ...r,
            request_content: typeof r.request_content === 'string' ? JSON.parse(r.request_content) : r.request_content
        }));
        
        res.status(200).json({ success: true, data: group });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.createGroup = async (req, res) => {
    const { departure_id, passenger_count, services } = req.body;
    // services is an array of objects: { partner_id, service_type, quantity, details: {} }
    
    try {
        const userId = req.user ? (req.user.user_id || req.user.id || 1) : 1;
        const [existing] = await sequelize.query(
            "SELECT id FROM service_request_groups WHERE departure_id = ? AND request_type = 'INITIAL'",
            { replacements: [departure_id] }
        );
        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Lịch khởi hành này đã có Yêu cầu cung cấp dịch vụ. Vui lòng sử dụng chức năng Yêu cầu bổ sung nếu có nhu cầu phát sinh.' 
            });
        }

        
        // Generate code
        const code = 'YCT-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        
        const [groupRes] = await sequelize.query(
            `INSERT INTO service_request_groups (code, departure_id, request_type, passenger_count, created_by, status)
            VALUES (?, ?, 'INITIAL', ?, ?, 'PROCESSING')`,
            { replacements: [code, departure_id, passenger_count, userId] }
        );
        
        const groupId = groupRes;
        
        // Split into child requests
        for (let i = 0; i < services.length; i++) {
            const svc = services[i];
            const childCode = `YC-${groupId}-${i+1}`;
            const content = JSON.stringify(svc.details);
            
            await sequelize.query(
                `INSERT INTO service_requests (departure_id, group_id, partner_id, requested_by, service_type, quantity, request_content, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
                { replacements: [departure_id, groupId, svc.partner_id, userId, svc.service_type, svc.quantity, content] }
            );
        }
        
        res.status(201).json({ success: true, message: 'Tạo yêu cầu thành công', data: { id: groupId } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.createSupplement = async (req, res) => {
    const { id } = req.params; // base group id
    const { passenger_count, services } = req.body;
    
    try {
        const userId = req.user ? (req.user.user_id || req.user.id || 1) : 1;
        
        // Get base group
        const [groupRows] = await sequelize.query('SELECT * FROM service_request_groups WHERE id = ?', { replacements: [id] });
        if (groupRows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        
        const baseGroup = groupRows[0];
        
        // Count how many supplements already exist for this parent to format code YCB-XXXX-01
        const [supplements] = await sequelize.query('SELECT count(*) as count FROM service_request_groups WHERE parent_id = ?', { replacements: [id] });
        const supplementCount = supplements[0].count + 1;
        const codeNum = supplementCount.toString().padStart(2, '0');
        
        const baseCodeNumber = baseGroup.code.replace('YCT-', '');
        const code = `YCB-${baseCodeNumber}-${codeNum}`;
        
        const [groupRes] = await sequelize.query(
            `INSERT INTO service_request_groups (code, departure_id, request_type, passenger_count, created_by, status, parent_id)
            VALUES (?, ?, 'SUPPLEMENT', ?, ?, 'PROCESSING', ?)`,
            { replacements: [code, baseGroup.departure_id, passenger_count, userId, baseGroup.id] }
        );
        
        const groupId = groupRes;
        
        for (let i = 0; i < services.length; i++) {
            const svc = services[i];
            const content = JSON.stringify(svc.details);
            
            await sequelize.query(
                `INSERT INTO service_requests (departure_id, group_id, partner_id, requested_by, service_type, quantity, request_content, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
                { replacements: [baseGroup.departure_id, groupId, svc.partner_id, userId, svc.service_type, svc.quantity, content] }
            );
        }
        
        res.status(201).json({ success: true, message: 'Tạo yêu cầu bổ sung thành công', data: { id: groupId } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

exports.getMyPartnerRequests = async (req, res) => {
    try {
        const userId = req.user.user_id || req.user.id;
        const [u] = await sequelize.query('SELECT partner_group FROM users WHERE user_id = ?', { replacements: [userId] });
        const partnerType = u[0]?.partner_group;
        
        if (!partnerType) {
            return res.status(403).json({ success: false, message: 'You do not have a partner group assigned.' });
        }
        
        const q = `
            SELECT 
                sr.*, 
                g.code as group_code, g.created_at as group_created_at, g.request_type,
                d.departure_date, t.tour_name, p.partner_name, p.partner_type,
                pg.code as parent_code
            FROM service_requests sr
            JOIN service_request_groups g ON sr.group_id = g.id
            JOIN departures d ON sr.departure_id = d.departure_id
            JOIN tours t ON d.tour_id = t.tour_id
            JOIN partners p ON sr.partner_id = p.partner_id
            LEFT JOIN service_request_groups pg ON g.parent_id = pg.id
            WHERE sr.service_type = ?
            ORDER BY sr.created_at DESC
        `;
        
        const [rows] = await sequelize.query(q, { replacements: [partnerType] });
        
        const mapped = rows.map(r => ({
            ...r,
            request_content: typeof r.request_content === 'string' ? JSON.parse(r.request_content) : r.request_content
        }));
        
        res.status(200).json({ success: true, data: mapped });
    } catch(err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.acceptRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id || req.user.id;
        
        // Verify ownership/role
        const [u] = await sequelize.query('SELECT partner_group FROM users WHERE user_id = ?', { replacements: [userId] });
        const partnerType = u[0]?.partner_group;
        
        const [sr] = await sequelize.query('SELECT service_type FROM service_requests WHERE request_id = ?', { replacements: [id] });
        if (sr.length === 0) return res.status(404).json({ success: false, message: 'Request not found' });
        
        if (sr[0].service_type !== partnerType) {
            return res.status(403).json({ success: false, message: 'Unauthorized for this service type' });
        }
        
        await sequelize.query(
            'UPDATE service_requests SET status = "Accepted", responded_by = ?, responded_at = NOW(), response_note = "" WHERE request_id = ?',
            { replacements: [userId, id] }
        );
        
        res.status(200).json({ success: true, message: 'Accepted successfully' });
    } catch(err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

exports.rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user.user_id || req.user.id;
        
        if (!reason) return res.status(400).json({ success: false, message: 'Lý do từ chối là bắt buộc' });
        
        // Verify ownership/role
        const [u] = await sequelize.query('SELECT partner_group FROM users WHERE user_id = ?', { replacements: [userId] });
        const partnerType = u[0]?.partner_group;
        
        const [sr] = await sequelize.query('SELECT service_type FROM service_requests WHERE request_id = ?', { replacements: [id] });
        if (sr.length === 0) return res.status(404).json({ success: false, message: 'Request not found' });
        
        if (sr[0].service_type !== partnerType) {
            return res.status(403).json({ success: false, message: 'Unauthorized for this service type' });
        }
        
        await sequelize.query(
            'UPDATE service_requests SET status = "Rejected", responded_by = ?, responded_at = NOW(), response_note = ? WHERE request_id = ?',
            { replacements: [userId, reason, id] }
        );
        
        res.status(200).json({ success: true, message: 'Rejected successfully' });
    } catch(err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};


exports.getPartnerSummary = async (req, res) => {
    try {
        const userId = req.user.user_id || req.user.id;
        const [u] = await sequelize.query('SELECT partner_group FROM users WHERE user_id = ?', { replacements: [userId] });
        const partnerType = u[0]?.partner_group;
        
        if (!partnerType) {
            return res.status(403).json({ success: false, message: 'You do not have a partner group assigned.' });
        }
        
        const q = `
            SELECT 
                sr.*, 
                g.code as group_code, g.request_type,
                d.departure_date, t.tour_name, p.partner_name
            FROM service_requests sr
            JOIN service_request_groups g ON sr.group_id = g.id
            JOIN departures d ON sr.departure_id = d.departure_id
            JOIN tours t ON d.tour_id = t.tour_id
            JOIN partners p ON sr.partner_id = p.partner_id
            WHERE sr.service_type = ?
        `;
        const [rows] = await sequelize.query(q, { replacements: [partnerType] });
        
        const summaryMap = {};
        const serviceIds = new Set();
        
        for (const r of rows) {
            if (r.status === 'Rejected') continue;
            
            let content;
            try {
                content = typeof r.request_content === 'string' ? JSON.parse(r.request_content) : r.request_content;
            } catch (e) { continue; }
            
            if (partnerType === 'HOTEL' && content && content.items) {
                for (const item of content.items) {
                    if (item.service_id) serviceIds.add(item.service_id);
                }
            }
            
            const groupKey = `${r.departure_id}_${r.partner_id}`;
            
            if (!summaryMap[groupKey]) {
                summaryMap[groupKey] = {
                    id: groupKey,
                    departure_id: r.departure_id,
                    tour_name: r.tour_name,
                    departure_date: r.departure_date,
                    partner_id: r.partner_id,
                    partner_name: r.partner_name,
                    requests: []
                };
            }
            
            summaryMap[groupKey].requests.push({
                request_id: r.request_id,
                code: r.group_code,
                request_type: r.request_type,
                quantity: r.quantity || 0,
                status: r.status,
                created_at: r.created_at,
                items: content?.items || []
            });
        }
        
        if (partnerType === 'HOTEL' && serviceIds.size > 0) {
            const [rooms] = await sequelize.query(`SELECT service_id, service_name FROM services WHERE service_id IN (?)`, { replacements: [[...serviceIds]] });
            const roomMap = {};
            for (const rm of rooms) roomMap[rm.service_id] = rm.service_name;
            
            for (const key in summaryMap) {
                for (const req of summaryMap[key].requests) {
                    for (const item of req.items) {
                        if (item.service_id && roomMap[item.service_id]) {
                            item.service_name = roomMap[item.service_id];
                        }
                    }
                }
            }
        }
        
        const result = Object.values(summaryMap).sort((a,b) => new Date(a.departure_date) - new Date(b.departure_date));
        
        res.status(200).json({ success: true, partnerType, data: result });
    } catch(err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

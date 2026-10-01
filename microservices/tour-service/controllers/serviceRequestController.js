const { sequelize } = require('../models');

exports.getGroups = async (req, res) => {
    try {
        const query = `
            SELECT 
                g.*, 
                d.departure_date, t.tour_name, t.tour_id,
                (SELECT COUNT(*) FROM service_requests sr WHERE sr.group_id = g.id) as request_count
            FROM service_request_groups g
            JOIN departures d ON g.departure_id = d.departure_id
            JOIN tours t ON d.tour_id = t.tour_id
            ORDER BY g.created_at DESC
        `;
        const [rows] = await sequelize.query(query);
        res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
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
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createGroup = async (req, res) => {
    const { departure_id, passenger_count, services } = req.body;
    // services is an array of objects: { partner_id, service_type, quantity, details: {} }
    
    try {
        const userId = req.user ? req.user.id : 1;
        
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
                VALUES (?, ?, ?, ?, ?, ?, ?, 'SENT')`,
                { replacements: [departure_id, groupId, svc.partner_id, userId, svc.service_type, svc.quantity, content] }
            );
        }
        
        res.status(201).json({ success: true, message: 'Tạo yêu cầu thành công', data: { id: groupId } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.createSupplement = async (req, res) => {
    const { id } = req.params; // base group id
    const { passenger_count, services } = req.body;
    
    try {
        const userId = req.user ? req.user.id : 1;
        
        // Get base group
        const [groupRows] = await sequelize.query('SELECT * FROM service_request_groups WHERE id = ?', { replacements: [id] });
        if (groupRows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        
        const baseGroup = groupRows[0];
        
        const code = baseGroup.code + '-BS' + Math.floor(Math.random() * 100).toString().padStart(2, '0');
        
        const [groupRes] = await sequelize.query(
            `INSERT INTO service_request_groups (code, departure_id, request_type, passenger_count, created_by, status)
            VALUES (?, ?, 'SUPPLEMENT', ?, ?, 'PROCESSING')`,
            { replacements: [code, baseGroup.departure_id, passenger_count, userId] }
        );
        
        const groupId = groupRes;
        
        for (let i = 0; i < services.length; i++) {
            const svc = services[i];
            const content = JSON.stringify(svc.details);
            
            await sequelize.query(
                `INSERT INTO service_requests (departure_id, group_id, partner_id, requested_by, service_type, quantity, request_content, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'SENT')`,
                { replacements: [baseGroup.departure_id, groupId, svc.partner_id, userId, svc.service_type, svc.quantity, content] }
            );
        }
        
        res.status(201).json({ success: true, message: 'Tạo yêu cầu bổ sung thành công', data: { id: groupId } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

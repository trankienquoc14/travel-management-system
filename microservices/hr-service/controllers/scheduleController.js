const sequelize = require('../config/database');

exports.getTasks = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { start_date, end_date } = req.query;

    let query = 'SELECT * FROM personal_work_tasks WHERE user_id = ?';
    let replacements = [userId];

    if (start_date && end_date) {
        query += ' AND work_date BETWEEN ? AND ?';
        replacements.push(start_date, end_date);
    }
    
    query += ' ORDER BY work_date ASC, start_time ASC';

    const [tasks] = await sequelize.query(query, { replacements });

    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { title, description, work_date, start_time, end_time, priority, related_type, related_id } = req.body;

    const [result] = await sequelize.query(`
      INSERT INTO personal_work_tasks 
      (user_id, title, description, work_date, start_time, end_time, priority, status, related_type, related_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Chưa làm', ?, ?)
    `, {
      replacements: [userId, title, description || '', work_date, start_time, end_time, priority || 'Trung bình', related_type || null, related_id || null]
    });

    res.status(201).json({ success: true, message: 'Thêm công việc thành công', data: { task_id: result.insertId } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const taskId = req.params.id;
    const { title, description, work_date, start_time, end_time, priority, status } = req.body;

    // Verify ownership
    const [tasks] = await sequelize.query('SELECT * FROM personal_work_tasks WHERE task_id = ? AND user_id = ?', { replacements: [taskId, userId] });
    if (tasks.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy công việc' });

    let completed_at = tasks[0].completed_at;
    if (status === 'Hoàn thành' && tasks[0].status !== 'Hoàn thành') {
        completed_at = new Date();
    } else if (status !== 'Hoàn thành') {
        completed_at = null;
    }

    await sequelize.query(`
      UPDATE personal_work_tasks 
      SET title = ?, description = ?, work_date = ?, start_time = ?, end_time = ?, priority = ?, status = ?, completed_at = ?
      WHERE task_id = ? AND user_id = ?
    `, {
      replacements: [title, description || '', work_date, start_time, end_time, priority, status, completed_at, taskId, userId]
    });

    res.status(200).json({ success: true, message: 'Cập nhật công việc thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
    try {
      const userId = req.user.user_id;
      const taskId = req.params.id;
      const { status } = req.body;
  
      const [tasks] = await sequelize.query('SELECT * FROM personal_work_tasks WHERE task_id = ? AND user_id = ?', { replacements: [taskId, userId] });
      if (tasks.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy công việc' });
  
      let completed_at = tasks[0].completed_at;
      if (status === 'Hoàn thành' && tasks[0].status !== 'Hoàn thành') {
          completed_at = new Date();
      } else if (status !== 'Hoàn thành') {
          completed_at = null;
      }
  
      await sequelize.query(`
        UPDATE personal_work_tasks 
        SET status = ?, completed_at = ?
        WHERE task_id = ? AND user_id = ?
      `, {
        replacements: [status, completed_at, taskId, userId]
      });
  
      res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

exports.deleteTask = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const taskId = req.params.id;

    // Verify ownership
    const [tasks] = await sequelize.query('SELECT * FROM personal_work_tasks WHERE task_id = ? AND user_id = ?', { replacements: [taskId, userId] });
    if (tasks.length === 0) return res.status(404).json({ success: false, message: 'Không tìm thấy công việc' });

    await sequelize.query('DELETE FROM personal_work_tasks WHERE task_id = ? AND user_id = ?', { replacements: [taskId, userId] });

    res.status(200).json({ success: true, message: 'Xóa công việc thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getHolidays = async (req, res) => {
    try {
      const [holidays] = await sequelize.query('SELECT * FROM holidays ORDER BY holiday_date ASC');
      res.status(200).json({ success: true, data: holidays });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

const sequelize = require('../config/database');

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Tính tổng doanh thu (Những booking đã thanh toán)
    const [revenueResult] = await sequelize.query(`
      SELECT SUM(total_amount) as totalRevenue 
      FROM bookings 
      WHERE payment_status = 'Paid'
    `);

    // 2. Đếm số tour đang mở (Sẵn sàng nhận khách)
    const [activeToursResult] = await sequelize.query(`
      SELECT COUNT(*) as activeTours 
      FROM departures 
      WHERE status = 'Open'
    `);

    // 3. Đếm số yêu cầu cần xử lý (Gộp cả yêu cầu tư vấn và thiết kế tour riêng)
    const [pendingRequestsResult] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM consultation_requests WHERE status = 'Pending') + 
        (SELECT COUNT(*) FROM custom_tour_requests WHERE status = 'Pending') AS pendingRequests
    `);

    res.status(200).json({
      success: true,
      data: {
        revenue: revenueResult[0].totalRevenue || 0,
        activeTours: activeToursResult[0].activeTours || 0,
        pendingRequests: pendingRequestsResult[0].pendingRequests || 0
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const nodemailer = require('nodemailer');
const sequelize = require('../config/database');

// Cấu hình ngân hàng SePay mặc định (đồng bộ từ .env)
const SEPAY_CONFIG = {
  accountNumber: process.env.SEPAY_ACCOUNT_NUMBER || '00000419627',
  accountName: process.env.SEPAY_ACCOUNT_NAME || 'DOAN THI TRAM',
  bankName: process.env.SEPAY_BANK_NAME || 'TPBank',
  bankCode: process.env.SEPAY_BANK_CODE || 'TPB',
  bankBin: process.env.SEPAY_BANK_BIN || '970423'
};

let cachedTransporter = null;
let isEthereal = false;

/**
 * Khởi tạo hoặc lấy Transporter gửi mail
 */
async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (emailUser && emailPass) {
    // Có cấu hình SMTP thật (Gmail / Outlook / Custom SMTP)
    cachedTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true' || Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });
    isEthereal = false;
    console.log(`📧 [EmailService] Đã kích hoạt SMTP thật qua tài khoản: ${emailUser}`);
  } else {
    // Chưa có tài khoản SMTP trong .env -> Tự động dùng Ethereal Test Account để test và preview URL
    try {
      const testAccount = await nodemailer.createTestAccount();
      cachedTransporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      isEthereal = true;
      console.log(`📧 [EmailService] Đã tạo Ethereal Test Transporter (${testAccount.user}) để kiểm thử.`);
    } catch (err) {
      console.warn('⚠️ [EmailService] Không thể tạo Ethereal test account, dùng JSON transporter fallback:', err.message);
      cachedTransporter = nodemailer.createTransport({ jsonTransport: true });
      isEthereal = false;
    }
  }

  return cachedTransporter;
}

/**
 * Định dạng tiền tệ VNĐ
 */
function formatVND(amount) {
  return Number(amount || 0).toLocaleString('vi-VN') + ' đ';
}

/**
 * Định dạng ngày DD/MM/YYYY
 */
function formatDateVN(dateStr) {
  if (!dateStr) return 'Chưa xác định';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch (e) {
    return String(dateStr);
  }
}

/**
 * Bóc tách điểm xuất phát chuẩn xác từ thông tin tour
 */
function resolveDeparturePlace(tour, firstDay, destinations = []) {
  let routeOrigin = '';
  if (firstDay?.route_title) {
    const rawFirst = firstDay.route_title.split(/[-–]/)[0]?.trim();
    if (rawFirst) {
      const low = rawFirst.toLowerCase();
      if (low.includes('tp.hcm') || low.includes('tphcm') || low.includes('hồ chí minh') || low.includes('sài gòn')) {
        routeOrigin = 'TP.HCM';
      } else if (low.includes('hà nội')) {
        routeOrigin = 'Hà Nội';
      } else if (low.includes('đà nẵng')) {
        routeOrigin = 'Đà Nẵng';
      } else if (low.includes('cần thơ')) {
        routeOrigin = 'Cần Thơ';
      }
    }
  }

  let actOrigin = '';
  const firstActStr = (firstDay?.activities?.[0]?.name || firstDay?.activities?.[0]?.title || '').toLowerCase();
  if (firstActStr.includes('tp.hcm') || firstActStr.includes('tphcm') || firstActStr.includes('hồ chí minh') || firstActStr.includes('sài gòn')) {
    actOrigin = 'TP.HCM';
  } else if (firstActStr.includes('hà nội')) {
    actOrigin = 'Hà Nội';
  } else if (firstActStr.includes('đà nẵng')) {
    actOrigin = 'Đà Nẵng';
  } else if (firstActStr.includes('cần thơ')) {
    actOrigin = 'Cần Thơ';
  }

  let startLocD = destinations.find(x => String(x.destination_id) === String(firstDay?.start_destination_id))?.destination_name;
  if (startLocD === 'Hồ Chí Minh') startLocD = 'TP.HCM';

  const tourDestName = destinations.find(x => String(x.destination_id) === String(tour?.destination))?.destination_name || tour?.destination;
  if ((routeOrigin || actOrigin) && (startLocD === tourDestName || !startLocD)) {
    startLocD = routeOrigin || actOrigin;
  } else if (routeOrigin && !startLocD) {
    startLocD = routeOrigin;
  } else if (actOrigin && !startLocD) {
    startLocD = actOrigin;
  }

  if (!startLocD && (tour?.departure_location || tour?.start_point)) {
    startLocD = tour.departure_location || tour.start_point;
  }
  if (!startLocD) startLocD = 'TP.HCM';
  if (startLocD === 'Hồ Chí Minh') startLocD = 'TP.HCM';
  return startLocD;
}

/**
 * Lấy toàn bộ thông tin chi tiết của một Booking
 */
async function getBookingFullDetails(bookingId) {
  const [rows] = await sequelize.query(`
    SELECT 
      b.booking_id,
      b.customer_id,
      b.departure_id,
      b.quote_id,
      b.num_people,
      b.booking_date,
      b.total_amount,
      b.booking_status,
      b.payment_status,
      b.notes,
      b.breakdown,
      b.contact_name,
      b.contact_email,
      b.contact_phone,
      b.contact_address,
      
      COALESCE(t.tour_name, CONCAT('Tour thiết kế riêng: ', cr.destination), 'Tour du lịch') AS tour_name,
      COALESCE(t.destination, cr.destination, 'Việt Nam') AS destination,
      COALESCE(d.departure_date, cr.departure_date) AS departure_date,
      COALESCE(d.return_date, cr.return_date) AS return_date,
      t.duration_days,
      t.design_data,
      
      u.full_name AS user_full_name,
      u.email AS user_email,
      u.phone AS user_phone,
      
      p.payment_method,
      p.transaction_code,
      p.paid_at
    FROM bookings b
    LEFT JOIN users u ON b.customer_id = u.user_id
    LEFT JOIN departures d ON b.departure_id = d.departure_id
    LEFT JOIN tours t ON d.tour_id = t.tour_id
    LEFT JOIN custom_tour_quotes q ON b.quote_id = q.quote_id
    LEFT JOIN custom_tour_requests cr ON q.request_id = cr.request_id
    LEFT JOIN (SELECT booking_id, MAX(payment_method) as payment_method, MAX(transaction_code) as transaction_code, MAX(paid_at) as paid_at FROM payments GROUP BY booking_id) p ON b.booking_id = p.booking_id
    WHERE b.booking_id = ?
  `, { replacements: [bookingId] });

  if (rows.length === 0) return null;
  const booking = rows[0];

  // Lấy danh sách hành khách
  const [passengers] = await sequelize.query(`
    SELECT full_name, gender, birth_date, identity_number, passenger_type, single_room 
    FROM booking_passengers 
    WHERE booking_id = ? 
    ORDER BY passenger_id ASC
  `, { replacements: [bookingId] });
  booking.passengers = passengers || [];

  // Lấy danh mục điểm đến để tra cứu tên xuất phát
  const [dests] = await sequelize.query(`SELECT destination_id, destination_name FROM destinations`);
  booking.destinationsList = dests || [];

  return booking;
}

/**
 * Gửi email xác nhận ĐẶT VÉ THÀNH CÔNG
 * @param {number|string} bookingId 
 */
async function sendBookingConfirmationEmail(bookingId) {
  try {
    const booking = await getBookingFullDetails(bookingId);
    if (!booking) {
      console.warn(`[EmailService] Không tìm thấy booking #${bookingId} để gửi email xác nhận.`);
      return { success: false, message: 'Booking not found' };
    }

    // Email nhận thông tin: ưu tiên email điền trong form (contact_email), fallback là email tài khoản
    const recipientEmail = (booking.contact_email || booking.user_email || '').trim();
    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.warn(`[EmailService] Booking #${bookingId} không có địa chỉ email hợp lệ để gửi: "${recipientEmail}"`);
      return { success: false, message: 'No valid recipient email' };
    }

    const recipientName = booking.contact_name || booking.user_full_name || 'Quý khách';
    const recipientPhone = booking.contact_phone || booking.user_phone || 'Chưa cập nhật';
    const recipientAddress = booking.contact_address || 'Theo thỏa thuận';

    // Parse design_data để lấy chặng và điểm xuất phát
    let parsedDesign = null;
    try {
      parsedDesign = typeof booking.design_data === 'string' ? JSON.parse(booking.design_data) : booking.design_data;
    } catch (e) {}

    const firstDay = parsedDesign?.days?.[0] || parsedDesign?.itinerary?.[0];
    const departurePlace = resolveDeparturePlace(booking, firstDay, booking.destinationsList);

    // Tính toán số ngày tour
    let durationText = `${booking.duration_days || 1} Ngày`;
    if (booking.departure_date && booking.return_date) {
      const d1 = new Date(booking.departure_date);
      const d2 = new Date(booking.return_date);
      const diffTime = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 1) {
        durationText = `${diffDays}N${diffDays - 1}Đ`;
      }
    }

    // Cơ cấu số khách
    let breakdownObj = null;
    try {
      breakdownObj = typeof booking.breakdown === 'string' ? JSON.parse(booking.breakdown) : booking.breakdown;
    } catch (e) {}

    const paxParts = [];
    if (breakdownObj) {
      if (breakdownObj.adults) paxParts.push(`${breakdownObj.adults} Người lớn`);
      if (breakdownObj.children) paxParts.push(`${breakdownObj.children} Trẻ em (5-11T)`);
      if (breakdownObj.toddlers) paxParts.push(`${breakdownObj.toddlers} Trẻ nhỏ (2-4T)`);
      if (breakdownObj.infants) paxParts.push(`${breakdownObj.infants} Em bé (<2T)`);
    }
    const paxSummary = paxParts.length > 0 ? paxParts.join(' • ') : `${booking.num_people} Khách`;

    // Thông tin thanh toán SePay QR
    const totalAmount = Math.round(Number(booking.total_amount || 0));
    const transferContent = `THANHTOAN${booking.booking_id}`;
    const sepayQrUrl = `https://qr.sepay.vn/img?acc=${SEPAY_CONFIG.accountNumber}&bank=${SEPAY_CONFIG.bankName}&amount=${totalAmount}&des=${encodeURIComponent(transferContent)}&template=compact`;

    const isPaid = booking.payment_status === 'Paid';
    const isCash = booking.payment_method === 'Cash';

    // Bảng danh sách hành khách HTML
    let passengersHtml = '';
    if (booking.passengers && booking.passengers.length > 0) {
      passengersHtml = `
        <div style="margin-top: 24px;">
          <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
            👥 Danh Sách Hành Khách Đi Cùng
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left;">
            <thead>
              <tr style="background-color: #f8fafc; color: #475569; border-bottom: 1px solid #cbd5e1;">
                <th style="padding: 10px 12px; width: 40px;">STT</th>
                <th style="padding: 10px 12px;">Họ và Tên</th>
                <th style="padding: 10px 12px;">Giới tính</th>
                <th style="padding: 10px 12px;">Loại vé</th>
              </tr>
            </thead>
            <tbody>
              ${booking.passengers.map((p, idx) => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 12px; color: #64748b; font-weight: 600;">${idx + 1}</td>
                  <td style="padding: 10px 12px; font-weight: 600; color: #0f172a;">${p.full_name}</td>
                  <td style="padding: 10px 12px; color: #475569;">${p.gender === 'Female' ? 'Nữ' : (p.gender === 'Male' ? 'Nam' : 'Khác')}</td>
                  <td style="padding: 10px 12px; color: #2563eb; font-weight: 500;">
                    ${p.passenger_type === 'CHILD' ? 'Trẻ em' : (p.passenger_type === 'TODDLER' ? 'Trẻ nhỏ' : (p.passenger_type === 'INFANT' ? 'Em bé' : 'Người lớn'))}
                    ${p.single_room ? ' <span style="background: #fef3c7; color: #92400e; font-size: 11px; padding: 2px 6px; border-radius: 4px;">Phòng đơn</span>' : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // Khối hướng dẫn thanh toán
    let paymentInstructionHtml = '';
    if (!isPaid && !isCash) {
      paymentInstructionHtml = `
        <div style="background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 12px; padding: 20px; margin-top: 24px; text-align: center;">
          <h3 style="color: #15803d; font-size: 18px; margin-top: 0; margin-bottom: 8px;">💳 Hướng Dẫn Thanh Toán Chuyển Khoản QR</h3>
          <p style="color: #166534; font-size: 14px; margin-bottom: 16px;">
            Quét mã VietQR bên dưới bằng bất kỳ ứng dụng ngân hàng nào (App Mobile Banking). Hệ thống sẽ tự động xác nhận đơn hàng ngay khi nhận được tiền!
          </p>
          <div style="display: inline-block; background: #fff; padding: 12px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); margin-bottom: 16px;">
            <img src="${sepayQrUrl}" alt="VietQR SePay" style="max-width: 240px; height: auto; display: block;" />
          </div>
          <table style="max-width: 400px; margin: 0 auto; text-align: left; font-size: 14px; color: #166534; line-height: 1.8;">
            <tr>
              <td style="font-weight: 600;">Ngân hàng:</td>
              <td><strong>TPBank</strong> (Ngân hàng Tiên Phong)</td>
            </tr>
            <tr>
              <td style="font-weight: 600;">Số tài khoản:</td>
              <td><strong style="font-size: 16px; color: #047857; letter-spacing: 1px;">${SEPAY_CONFIG.accountNumber}</strong></td>
            </tr>
            <tr>
              <td style="font-weight: 600;">Chủ tài khoản:</td>
              <td><strong>${SEPAY_CONFIG.accountName}</strong></td>
            </tr>
            <tr>
              <td style="font-weight: 600;">Số tiền:</td>
              <td><strong style="color: #dc2626; font-size: 16px;">${formatVND(totalAmount)}</strong></td>
            </tr>
            <tr>
              <td style="font-weight: 600;">Nội dung CK:</td>
              <td><span style="background: #dcfce7; color: #166534; font-weight: 700; padding: 2px 8px; border-radius: 4px; border: 1px solid #86efac;">${transferContent}</span></td>
            </tr>
          </table>
          <p style="font-size: 12px; color: #65a30d; margin-top: 12px; margin-bottom: 0;">
            * Vui lòng giữ nguyên nội dung chuyển khoản để đơn hàng được cập nhật tự động trong vòng 30 giây.
          </p>
        </div>
      `;
    } else if (isCash && !isPaid) {
      paymentInstructionHtml = `
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 18px; margin-top: 24px;">
          <h4 style="color: #b45309; margin: 0 0 8px 0; font-size: 16px;">💵 Thanh Toán Bằng Tiền Mặt Tại Văn Phòng</h4>
          <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
            Quý khách vui lòng đến trực tiếp văn phòng TravelERP trước ngày khởi hành để hoàn tất thủ tục thanh toán và nhận hợp đồng/vé du lịch chính thức.
          </p>
        </div>
      `;
    }

    // HTML Email Template hoàn chỉnh
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác nhận đặt tour thành công - #${booking.booking_id}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
        <div style="max-width: 650px; margin: 24px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
            <div style="display: inline-block; background: rgba(255, 255, 255, 0.15); border-radius: 9999px; padding: 6px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
              HỆ THỐNG QUẢN LÝ DU LỊCH TRAVELERP
            </div>
            <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">🎉 ĐẶT TOUR THÀNH CÔNG!</h1>
            <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.9;">
              Cảm ơn quý khách <strong>${recipientName}</strong> đã đặt tour du lịch cùng chúng tôi.
            </p>
          </div>

          <div style="padding: 28px;">
            
            <!-- Thông tin đơn hàng tóm tắt -->
            <div style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
              <div>
                <span style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; display: block;">MÃ ĐẶT CHỖ</span>
                <strong style="font-size: 20px; color: #1e3a8a;">#BKG-${String(booking.booking_id).padStart(4, '0')}</strong>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; display: block;">TRẠNG THÁI</span>
                <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 700; background: ${isPaid ? '#dcfce7' : '#fef3c7'}; color: ${isPaid ? '#15803d' : '#b45309'};">
                  ${isPaid ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN'}
                </span>
              </div>
            </div>

            <!-- Chi tiết chuyến đi -->
            <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-top: 0; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
              🗺️ Thông Tin Chuyến Đi
            </h3>
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
              <h2 style="font-size: 18px; color: #1e3a8a; margin: 0 0 14px 0; font-weight: 700;">
                ${booking.tour_name}
              </h2>
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 140px;">📍 Điểm xuất phát:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${departurePlace}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">🎯 Điểm đến:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${booking.destination}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">🗓️ Ngày khởi hành:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #2563eb;">${formatDateVN(booking.departure_date)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">🏁 Ngày kết thúc:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${formatDateVN(booking.return_date)} (${durationText})</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">👥 Số lượng khách:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${paxSummary}</td>
                </tr>
              </table>
            </div>

            <!-- Thông tin liên hệ người đặt -->
            <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-top: 0; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
              👤 Thông Tin Khách Hàng Liên Hệ
            </h3>
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px 0; color: #64748b; width: 140px;">Họ và tên:</td>
                  <td style="padding: 5px 0; font-weight: 600; color: #0f172a;">${recipientName}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Số điện thoại:</td>
                  <td style="padding: 5px 0; font-weight: 600; color: #0f172a;">${recipientPhone}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Email nhận tin:</td>
                  <td style="padding: 5px 0; font-weight: 600; color: #2563eb;">${recipientEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Địa chỉ:</td>
                  <td style="padding: 5px 0; color: #0f172a;">${recipientAddress}</td>
                </tr>
                ${booking.notes ? `
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Ghi chú:</td>
                  <td style="padding: 5px 0; color: #e11d48; font-style: italic;">${booking.notes}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <!-- Danh sách hành khách -->
            ${passengersHtml}

            <!-- Tổng kết chi phí -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 18px 20px; margin-top: 24px; border: 1px solid #cbd5e1;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 14px; color: #64748b;">Phương thức thanh toán:</span>
                <span style="font-size: 14px; font-weight: 600; color: #0f172a;">
                  ${booking.payment_method === 'Cash' ? '💵 Tiền mặt tại văn phòng' : '💳 Chuyển khoản QR (VietQR / SePay)'}
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #cbd5e1; padding-top: 12px;">
                <strong style="font-size: 16px; color: #0f172a;">TỔNG TIỀN THANH TOÁN:</strong>
                <strong style="font-size: 24px; color: #dc2626;">${formatVND(totalAmount)}</strong>
              </div>
            </div>

            <!-- Khối hướng dẫn thanh toán -->
            ${paymentInstructionHtml}

            <!-- Nút truy cập đơn hàng -->
            <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
              <a href="http://localhost:5173/my-bookings?pay=${booking.booking_id}&type=tour" 
                 style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                Xem Chi Tiết Đơn Hàng & Vé Điện Tử
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center; font-size: 13px; color: #64748b;">
            <p style="margin: 0 0 6px 0;">Cần hỗ trợ về lịch trình hoặc thanh toán? Đội ngũ CSKH luôn sẵn sàng đồng hành cùng bạn 24/7:</p>
            <p style="margin: 0 0 12px 0;">
              📞 Hotline: <strong style="color: #2563eb;">1900 1800</strong> • 📧 Email: <strong style="color: #2563eb;">support@travelerp.vn</strong>
            </p>
            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
              © ${new Date().getFullYear()} TravelERP Tourism & Travel Management System. Mọi quyền được bảo lưu.
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    const transporter = await getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"TravelERP Du Lịch" <no-reply@travelerp.vn>',
      to: recipientEmail,
      subject: `[TravelERP] 🎉 Xác nhận đặt tour thành công #${booking.booking_id} - ${booking.tour_name}`,
      text: `Kính chào ${recipientName},\n\nĐơn đặt tour #${booking.booking_id} (${booking.tour_name}) của bạn đã được ghi nhận thành công!\nTổng tiền: ${formatVND(totalAmount)}\nKhởi hành: ${formatDateVN(booking.departure_date)} từ ${departurePlace}.\n\nCảm ơn bạn đã lựa chọn TravelERP!`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log(`✅ [EmailService] Đã gửi email xác nhận đặt tour #${booking.booking_id} tới <${recipientEmail}> (MsgID: ${info.messageId})`);
    if (previewUrl) {
      console.log(`🔗 [EmailService] Xem trước Email (Ethereal Preview): ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId, previewUrl, recipient: recipientEmail };
  } catch (error) {
    console.error(`❌ [EmailService] Lỗi khi gửi email xác nhận đặt tour #${bookingId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Gửi email xác nhận THANH TOÁN THÀNH CÔNG & VÉ ĐIỆN TỬ (E-TICKET)
 * @param {number|string} bookingId 
 */
async function sendPaymentSuccessEmail(bookingId) {
  try {
    const booking = await getBookingFullDetails(bookingId);
    if (!booking) {
      console.warn(`[EmailService] Không tìm thấy booking #${bookingId} để gửi email thanh toán thành công.`);
      return { success: false, message: 'Booking not found' };
    }

    const recipientEmail = (booking.contact_email || booking.user_email || '').trim();
    if (!recipientEmail || !recipientEmail.includes('@')) {
      return { success: false, message: 'No valid recipient email' };
    }

    const recipientName = booking.contact_name || booking.user_full_name || 'Quý khách';
    const totalAmount = Math.round(Number(booking.total_amount || 0));

    let parsedDesign = null;
    try {
      parsedDesign = typeof booking.design_data === 'string' ? JSON.parse(booking.design_data) : booking.design_data;
    } catch (e) {}
    const firstDay = parsedDesign?.days?.[0] || parsedDesign?.itinerary?.[0];
    const departurePlace = resolveDeparturePlace(booking, firstDay, booking.destinationsList);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vé Điện Tử - Đơn #${booking.booking_id}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
        <div style="max-width: 650px; margin: 24px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
          
          <div style="background: linear-gradient(135deg, #15803d 0%, #16a34a 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
            <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); border-radius: 9999px; padding: 6px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
              VÉ ĐIỆN TỬ CHÍNH THỨC (E-TICKET)
            </div>
            <h1 style="margin: 0; font-size: 26px; font-weight: 800;">✅ THANH TOÁN THÀNH CÔNG!</h1>
            <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.95;">
              Đơn hàng của quý khách <strong>${recipientName}</strong> đã được thanh toán hoàn tất.
            </p>
          </div>

          <div style="padding: 28px;">
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
              <div>
                <span style="font-size: 12px; color: #166534; font-weight: 600; text-transform: uppercase; display: block;">MÃ VÉ ĐIỆN TỬ</span>
                <strong style="font-size: 20px; color: #15803d;">#BKG-${String(booking.booking_id).padStart(4, '0')}</strong>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 12px; color: #166534; font-weight: 600; text-transform: uppercase; display: block;">SỐ TIỀN ĐÃ TRẢ</span>
                <strong style="font-size: 18px; color: #15803d;">${formatVND(totalAmount)}</strong>
              </div>
            </div>

            <h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin-top: 0; margin-bottom: 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
              🎫 Thông Tin Vé Du Lịch
            </h3>
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
              <h2 style="font-size: 18px; color: #1e3a8a; margin: 0 0 12px 0; font-weight: 700;">
                ${booking.tour_name}
              </h2>
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; width: 140px;">📍 Xuất phát tại:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${departurePlace}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">🗓️ Ngày khởi hành:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #16a34a;">${formatDateVN(booking.departure_date)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">🏁 Ngày kết thúc:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${formatDateVN(booking.return_date)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b;">👥 Số hành khách:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${booking.num_people} Khách</td>
                </tr>
              </table>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 18px; border: 1px solid #e2e8f0; font-size: 14px; line-height: 1.7;">
              <strong style="color: #0f172a; display: block; margin-bottom: 6px;">📌 Lưu ý quan trọng trước ngày đi:</strong>
              • Quý khách vui lòng có mặt tại điểm đón trước giờ khởi hành ít nhất <strong>30 phút</strong>.<br>
              • Mang theo CCCD/Hộ chiếu bản gốc đối với người lớn và Giấy khai sinh đối với trẻ em.<br>
              • Mở ứng dụng TravelERP hoặc mang theo email này khi làm thủ tục lên xe / máy bay.
            </div>

            <div style="text-align: center; margin-top: 28px; margin-bottom: 12px;">
              <a href="http://localhost:5173/my-bookings" 
                 style="display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);">
                Mở Vé Điện Tử & Mã QR Check-in
              </a>
            </div>
          </div>

          <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 13px; color: #64748b;">
            <p style="margin: 0 0 6px 0;">Chúc quý khách có một chuyến du lịch tràn ngập niềm vui và trải nghiệm tuyệt vời!</p>
            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
              Hotline 24/7: 1900 1800 • Email: support@travelerp.vn
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    const transporter = await getTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"TravelERP Du Lịch" <no-reply@travelerp.vn>',
      to: recipientEmail,
      subject: `[TravelERP] ✅ Xác nhận thanh toán & Vé điện tử #${booking.booking_id} - ${booking.tour_name}`,
      text: `Kính chào ${recipientName},\n\nĐơn hàng #${booking.booking_id} (${booking.tour_name}) đã được thanh toán thành công!\nSố tiền: ${formatVND(totalAmount)}\nKhởi hành: ${formatDateVN(booking.departure_date)}.\n\nChúc bạn có một chuyến đi tuyệt vời!`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`✅ [EmailService] Đã gửi email xác nhận thanh toán #${booking.booking_id} tới <${recipientEmail}> (MsgID: ${info.messageId})`);
    if (previewUrl) {
      console.log(`🔗 [EmailService] Xem trước Email (Ethereal Preview): ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId, previewUrl, recipient: recipientEmail };
  } catch (error) {
    console.error(`❌ [EmailService] Lỗi khi gửi email thanh toán #${bookingId}:`, error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendBookingConfirmationEmail,
  sendPaymentSuccessEmail,
  getBookingFullDetails
};

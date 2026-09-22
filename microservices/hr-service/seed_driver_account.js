const sequelize = require('./config/database');
const bcrypt = require('bcryptjs');

async function seedDriverAccount() {
  try {
    console.log("🚀 Đang khởi tạo tài khoản Tài xế và gán chuyến xe...");

    // 0. Đảm bảo role_id = 8 tồn tại trong bảng roles
    await sequelize.query(`
      INSERT INTO roles (role_id, role_name)
      VALUES (8, 'Driver')
      ON DUPLICATE KEY UPDATE role_name = 'Driver';
    `);
    console.log("  + Đã đảm bảo Role 8 (Driver) tồn tại trong bảng roles.");

    // 1. Tạo password hash bằng bcryptjs cho mật khẩu '123456'
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('123456', salt);

    // 2. Kiểm tra/Tạo tài khoản Tài xế 1
    const [driver1] = await sequelize.query(`SELECT user_id FROM users WHERE email = 'taixe@travelvn.com';`);
    let driverId1;

    if (driver1.length === 0) {
      const [res] = await sequelize.query(`
        INSERT INTO users (role_id, full_name, email, password_hash, phone, status)
        VALUES (8, 'Nguyễn Văn Tài (Tài xế)', 'taixe@travelvn.com', :hash, '0912345678', 'Active');
      `, { replacements: { hash: passwordHash } });
      driverId1 = res;
      console.log("  + Đã tạo tài khoản tài xế: taixe@travelvn.com (Password: 123456)");
    } else {
      driverId1 = driver1[0].user_id;
      await sequelize.query(`
        UPDATE users 
        SET role_id = 8, password_hash = :hash, status = 'Active', full_name = 'Nguyễn Văn Tài (Tài xế)'
        WHERE user_id = :userId;
      `, { replacements: { hash: passwordHash, userId: driverId1 } });
      console.log("  + Đã cập nhật mật khẩu 123456 cho tài xế: taixe@travelvn.com");
    }

    // 3. Kiểm tra/Tạo tài khoản Tài xế 2 (Trần Văn Lái)
    const [driver2] = await sequelize.query(`SELECT user_id FROM users WHERE email = 'tranvanlai@travelvn.com';`);
    let driverId2;

    if (driver2.length === 0) {
      const [res] = await sequelize.query(`
        INSERT INTO users (role_id, full_name, email, password_hash, phone, status)
        VALUES (8, 'Trần Văn Lái (Tài xế Cao Cấp)', 'tranvanlai@travelvn.com', :hash, '0987654321', 'Active');
      `, { replacements: { hash: passwordHash } });
      driverId2 = res;
      console.log("  + Đã tạo tài khoản tài xế 2: tranvanlai@travelvn.com (Password: 123456)");
    } else {
      driverId2 = driver2[0].user_id;
      await sequelize.query(`
        UPDATE users 
        SET role_id = 8, password_hash = :hash, status = 'Active'
        WHERE user_id = :userId;
      `, { replacements: { hash: passwordHash, userId: driverId2 } });
    }

    // 4. Gán tài xế vào một số chuyến khởi hành (departures) có sẵn
    const [departures] = await sequelize.query(`SELECT departure_id, vehicle_number, driver_id FROM departures LIMIT 5;`);
    if (departures.length > 0) {
      await sequelize.query(`
        UPDATE departures 
        SET driver_id = :driverId, vehicle_number = IFNULL(vehicle_number, '29B-987.65')
        WHERE departure_id = :deptId;
      `, { replacements: { driverId: driverId1, deptId: departures[0].departure_id } });
      console.log(`  + Đã gán Tài xế #${driverId1} vào Chuyến đi #${departures[0].departure_id}`);

      if (departures.length > 1) {
        await sequelize.query(`
          UPDATE departures 
          SET driver_id = :driverId, vehicle_number = IFNULL(vehicle_number, '45B-123.89')
          WHERE departure_id = :deptId;
        `, { replacements: { driverId: driverId1, deptId: departures[1].departure_id } });
        console.log(`  + Đã gán Tài xế #${driverId1} vào Chuyến đi #${departures[1].departure_id}`);
      }

      if (departures.length > 2) {
        await sequelize.query(`
          UPDATE departures 
          SET driver_id = :driverId, vehicle_number = IFNULL(vehicle_number, '35B-555.66')
          WHERE departure_id = :deptId;
        `, { replacements: { driverId: driverId2, deptId: departures[2].departure_id } });
        console.log(`  + Đã gán Tài xế #${driverId2} vào Chuyến đi #${departures[2].departure_id}`);
      }
    }

    console.log("✅ THÀNH CÔNG! TÀI KHOẢN TÀI XẾ ĐÃ SẴN SÀNG ĐĂNG NHẬP!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi seed tài khoản:", error);
    process.exit(1);
  }
}

seedDriverAccount();

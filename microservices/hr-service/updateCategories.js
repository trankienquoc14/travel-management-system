const db = require('./config/database');

async function run() {
  try {
    await db.query("UPDATE services SET service_type = 'Khách sạn' WHERE service_type = 'Hotel'");
    await db.query("UPDATE services SET service_type = 'Xe vận chuyển' WHERE service_type = 'Transport'");
    await db.query("UPDATE services SET service_type = 'Vé máy bay' WHERE service_type = 'Flight'");
    await db.query("UPDATE services SET service_type = 'Nhà hàng' WHERE service_type = 'Restaurant'");
    await db.query("UPDATE services SET service_type = 'Vé tham quan' WHERE service_type = 'Ticket'");
    await db.query("UPDATE services SET service_type = 'Khác' WHERE service_type = 'Other'");
    console.log('Categories updated successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

run();

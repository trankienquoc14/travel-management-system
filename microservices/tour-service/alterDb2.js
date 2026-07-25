const db = require('./config/database');

async function run() {
  try {
    await db.query('ALTER TABLE places ADD COLUMN image_url VARCHAR(500)');
    console.log('Added image_url column to places.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
       console.log('image_url already exists');
    } else {
       console.error('Error:', error);
    }
  } finally {
    process.exit(0);
  }
}

run();

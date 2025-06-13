const { sequelize } = require('../models');

async function initDB() {
  try {
    await sequelize.sync({ alter: true }); // or force: true for full reset
    console.log('✅ All tables created');
  } catch (err) {
    console.error('❌ Failed to create tables:', err);
  } finally {
    await sequelize.close();
  }
}

initDB();

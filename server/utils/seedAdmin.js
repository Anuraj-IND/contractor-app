const User = require('../models/User.model');

const seedAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create default admin
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@fieldbook.com',
      password: 'admin123',
      role: 'admin',
      phone: '',
      address: '',
      defaultDailyWage: 0,
      isActive: true
    });

    console.log(`Default admin created: ${admin.email} / Password: admin123`);
  } catch (error) {
    console.error('Error seeding admin:', error.message);
  }
};

module.exports = seedAdmin;

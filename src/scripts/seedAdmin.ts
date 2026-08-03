import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model';
import { UserRole, UserStatus } from '../interfaces/user.interface';

dotenv.config();

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/freelance_olx';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@olx.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123';

    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      admin.password = adminPassword;
      admin.role = UserRole.ADMIN;
      admin.status = UserStatus.ACTIVE;
      admin.isEmailVerified = true;
      admin.isPhoneVerified = true;
      await admin.save();
      console.log(`User ${adminEmail} updated to ADMIN role successfully.`);
    } else {
      admin = await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: adminPassword,
        phone: '+201000000000',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        isPhoneVerified: true,
      });
      console.log(`Admin user created successfully with email: ${adminEmail}`);
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
};

seedAdmin();

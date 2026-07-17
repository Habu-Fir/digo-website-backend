// backend/src/utils/seed.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/database.js';

dotenv.config();

const seedDatabase = async () => {
    try {
        await connectDB();

        // Check if super admin exists
        const existing = await User.findOne({ email: 'superadmin@digotsion.com' });
        if (existing) {
            console.log('✅ Super Admin already exists!');
            console.log(`   Email: ${existing.email}`);
            console.log(`   Role: ${existing.role}`);
            process.exit(0);
        }

        // Create super admin - password will be auto-hashed by the model
        await User.create({
            name: 'Super Admin',
            email: 'superadmin@digotsion.com',
            password: 'superadmin123', // Auto-hashed by pre('save') hook
            role: 'super_admin',
            department: 'Administration',
            isActive: true,
            mustChangePassword: false,
        });

        console.log('✅ Super Admin created successfully!');
        console.log('   📧 Email: superadmin@digotsion.com');
        console.log('   🔑 Password: superadmin123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

seedDatabase();
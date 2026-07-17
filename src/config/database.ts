// backend/src/config/database.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('🔄 Connecting to MongoDB Atlas...');
    console.log(`📦 Database: ${mongoURI.split('/').pop()?.split('?')[0] || 'unknown'}`);

    const options = {
      serverSelectionTimeoutMS: 30000, // Increased timeout
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10,
      minPoolSize: 2,
      connectTimeoutMS: 30000,
    };

    const conn = await mongoose.connect(mongoURI, options);
    
    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Host: ${conn.connection.host}`);

    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error: any) {
    console.error('❌ MongoDB Connection Error Details:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    
    if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
      console.error('\n🔍 Troubleshooting Steps:');
      console.error('   1. Check your internet connection');
      console.error('   2. Whitelist your IP in MongoDB Atlas Network Access');
      console.error('   3. Verify your username and password are correct');
      console.error('   4. Check if your cluster is active (not paused)');
      console.error('   5. Try using your local MongoDB instead of Atlas');
    }
    
    // Don't exit in development - retry connection
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Fatal: Unable to connect to database. Exiting...');
      process.exit(1);
    } else {
      console.warn('\n⚠️  Development: Will retry connection...');
      // Retry after 5 seconds
      setTimeout(() => {
        console.log('🔄 Retrying connection...');
        connectDB();
      }, 5000);
    }
  }
};

export default connectDB;
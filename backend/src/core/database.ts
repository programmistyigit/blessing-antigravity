import mongoose from 'mongoose';
import config from './config';

export const connectDatabase = async (): Promise<void> => {
    try {
        mongoose.set('strictQuery', false);

        await mongoose.connect(config.mongodb.uri);

        console.log('✅ MongoDB connected successfully');
        console.log(`📦 Database: ${mongoose.connection.name}`);

        // Handle connection events
        mongoose.connection.on('error', (error) => {
            console.error('❌ MongoDB connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
        });

    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};

export const disconnectDatabase = async (): Promise<void> => {
    try {
        await mongoose.disconnect();
        console.log('👋 MongoDB disconnected gracefully');
    } catch (error) {
        console.error('❌ Error disconnecting from MongoDB:', error);
    }
};

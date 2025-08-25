import mongoose from 'mongoose';

// MongoDB connection string - prefer MONGODB_URL, fallback to local MongoDB
let mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/autoheal';

// If DATABASE_URL is PostgreSQL, don't use it for MongoDB
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
  console.log('PostgreSQL DATABASE_URL detected, using local MongoDB instead');
  mongoUrl = 'mongodb://localhost:27017/autoheal';
} else if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mongodb')) {
  mongoUrl = process.env.DATABASE_URL;
}

let isConnected = false;

export async function connectToMongoDB() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(mongoUrl, {
      // Modern MongoDB connection options
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 3000, // Keep trying to send operations for 3 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
    isConnected = true;
    console.log('Connected to MongoDB database');
  } catch (error) {
    console.warn('Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

export async function disconnectFromMongoDB() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('Disconnected from MongoDB');
  }
}

export { mongoose };
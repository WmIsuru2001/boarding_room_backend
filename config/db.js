const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`❌ Default MongoDB Connect Failed: ${error.message}`);
    console.log('🔄 Attempting to start local in-memory MongoDB...');
    try {
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      const conn = await mongoose.connect(mongoUri);
      console.log(`✅ In-Memory MongoDB Connected: ${conn.connection.host} (Note: Data will be lost on restart)`);
    } catch (memError) {
      console.error(`❌ In-Memory MongoDB Error: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;

// Configuration utility to access environment variables
const config = {
  // API URL for server communication
  API_URL: process.env.API_URL || 'http://127.0.0.1:5000/api',
  
  // JWT Secret for token generation and verification
  JWT_SECRET: process.env.JWT_SECRET || 'nazdeeq_secure_jwt_secret_key',
  
  // MongoDB connection string
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nazdeeq',
  
  // Server port
  PORT: process.env.PORT || 5000
};

module.exports = config;
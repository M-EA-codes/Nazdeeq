// React Native compatible configuration
// This file provides configuration values without using Node.js modules

const config = {
  // API URL for server communication
  API_URL: 'http://192.168.100.137:5000/api',
  
  // JWT Secret for token generation and verification
  JWT_SECRET: 'nazdeeq_secure_jwt_secret_key',
  
  // MongoDB connection string (only used on server side)
  MONGODB_URI: 'mongodb://127.0.0.1:27017/nazdeeq',
  
  // Server port
  PORT: 5000
}; module.exports = config;
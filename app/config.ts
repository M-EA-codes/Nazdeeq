// React Native compatible configuration
// This file provides configuration values without using Node.js modules

import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

const config = {
  // API URL for server communication
  API_URL: isWeb ? 'http://localhost:5000/api' : 'http://10.215.128.153:5000/api',
  CHATBOT_API_URL: isWeb ? 'http://localhost:8000/api/v1' : 'http://10.215.128.153:8000/api/v1',
};

export default config;

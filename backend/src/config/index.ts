import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export const config = {
  port: process.env.PORT || '8080',
  nodeEnv: process.env.NODE_ENV || 'development',
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    isMock: !process.env.GEMINI_API_KEY,
  },
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    isMock: !process.env.GOOGLE_MAPS_API_KEY,
  },
  weather: {
    apiKey: process.env.WEATHER_API_KEY || '',
    isMock: !process.env.WEATHER_API_KEY,
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'travel-planner-mock',
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
    isMock: !process.env.FIREBASE_SERVICE_ACCOUNT_JSON && !process.env.FIREBASE_PROJECT_ID,
  },
};

// Log config modes for ease of local validation
console.log('--- Travel Planner AI Backend Config Mode ---');
console.log(`Environment: ${config.nodeEnv}`);
console.log(`Gemini API Service: ${config.gemini.isMock ? 'MOCK/SIMULATION' : 'LIVE'}`);
console.log(`Google Maps API Service: ${config.googleMaps.isMock ? 'MOCK/SIMULATION' : 'LIVE'}`);
console.log(`Weather API Service: ${config.weather.isMock ? 'MOCK/SIMULATION' : 'LIVE'}`);
console.log(`Firebase Service Account: ${config.firebase.isMock ? 'MOCK/EMULATOR' : 'LIVE (' + config.firebase.projectId + ')'}`);
console.log('---------------------------------------------');

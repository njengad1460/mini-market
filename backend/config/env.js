import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,

  // MongoDB
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mini-market',

  // AWS Cognito
  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
  COGNITO_REGION: process.env.COGNITO_REGION || 'us-east-1',
};

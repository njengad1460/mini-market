import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,

  // MongoDB
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mini-market',

  // AWS Cognito
  COGNITO_USER_POOL_ID: (process.env.COGNITO_USER_POOL_ID || process.env.VITE_COGNITO_USER_POOL_ID || '').trim(),
  COGNITO_CLIENT_ID: (process.env.COGNITO_CLIENT_ID || process.env.VITE_COGNITO_CLIENT_ID || '').trim(),
  COGNITO_REGION: (process.env.COGNITO_REGION || (process.env.COGNITO_USER_POOL_ID || '').split('_')[0] || process.env.AWS_REGION || 'af-south-1').trim(),

  // AWS credentials for Cognito admin operations
  AWS_ACCESS_KEY_ID:     process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION || process.env.COGNITO_REGION || 'us-east-1',

  // AWS S3
  S3_REGION: (process.env.S3_REGION || process.env.AWS_REGION || process.env.COGNITO_REGION || 'us-east-1').trim(),
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME?.trim(),
  S3_PUBLIC_BASE_URL: process.env.S3_PUBLIC_BASE_URL?.trim(),

  // WhatsApp
  WHATSAPP_API_URL:   process.env.WHATSAPP_API_URL,
  WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN,
  BUSINESS_WHATSAPP_PHONE: process.env.BUSINESS_WHATSAPP_PHONE,
};

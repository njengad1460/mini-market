import { S3Client } from '@aws-sdk/client-s3';
import { ENV } from '../config/env.js';

const hasCredentials = ENV.AWS_ACCESS_KEY_ID && ENV.AWS_SECRET_ACCESS_KEY;

const clientConfig = {
  region: ENV.S3_REGION,
};

if (hasCredentials) {
  clientConfig.credentials = {
    accessKeyId: ENV.AWS_ACCESS_KEY_ID,
    secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
  };
}

const s3Client = new S3Client(clientConfig);

export default s3Client;

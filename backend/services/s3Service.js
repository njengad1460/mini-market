import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';
import s3Client from '../utils/s3Client.js';
import { ENV } from '../config/env.js';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const getPublicUrl = (key) => {
  if (ENV.S3_PUBLIC_BASE_URL) {
    return `${ENV.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
  }

  return `https://${ENV.S3_BUCKET_NAME}.s3.${ENV.S3_REGION}.amazonaws.com/${key}`;
};

const getExtensionFromMimeType = (mimeType) => {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'bin';
  }
};

const ensureS3Config = () => {
  if (!ENV.S3_BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME is not configured');
  }
};

const getKeyFromUrl = (url) => {
  try {
    const parsed = new URL(url);
    return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
  } catch {
    return null;
  }
};

export const uploadImageBuffer = async ({ buffer, mimeType, folder = 'uploads' }) => {
  ensureS3Config();

  if (!buffer?.length) {
    throw new Error('Image buffer is required');
  }

  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
    throw new Error('Unsupported image type');
  }

  if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Image size exceeds the 5MB limit');
  }

  const extension = getExtensionFromMimeType(mimeType);
  const key = `${folder.replace(/^\/+|\/+$/g, '')}/${Date.now()}-${nanoid(10)}.${extension}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: ENV.S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }));

  return {
    key,
    url: getPublicUrl(key),
  };
};

export const getSignedImageUrl = async (value, expiresIn = 3600) => {
  ensureS3Config();

  if (!value) return value;

  const key = value.startsWith('http://') || value.startsWith('https://')
    ? getKeyFromUrl(value)
    : value;

  if (!key) return value;

  return getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: ENV.S3_BUCKET_NAME,
      Key: key,
    }),
    { expiresIn }
  );
};

export const signImageList = async (values = []) => Promise.all(
  values.map((value) => getSignedImageUrl(value))
);

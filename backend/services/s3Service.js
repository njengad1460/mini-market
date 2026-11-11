import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';
import s3Client from '../utils/s3Client.js';
import { ENV } from '../config/env.js';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const getPublicUrl = (key) => {
  const cleanKey = (key || '').replace(/^\/+/, '');
  if (ENV.S3_PUBLIC_BASE_URL && !ENV.S3_PUBLIC_BASE_URL.startsWith('arn:')) {
    return `${ENV.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${cleanKey}`;
  }

  return `https://${ENV.S3_BUCKET_NAME}.s3.${ENV.S3_REGION}.amazonaws.com/${cleanKey}`;
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
  if (!url || typeof url !== 'string') return null;

  // Handle ARN format: arn:aws:s3:::bucket-name/uploads/photo.jpg
  if (url.startsWith('arn:aws:s3:::')) {
    const withoutArn = url.replace('arn:aws:s3:::', '');
    const firstSlash = withoutArn.indexOf('/');
    return firstSlash !== -1 ? withoutArn.slice(firstSlash + 1) : null;
  }

  try {
    const parsed = new URL(url);

    // If it's an external URL (e.g. unsplash, cloudinary, imgur) and NOT an S3 bucket URL, do not extract as S3 key
    const isS3 = parsed.hostname.includes('s3') ||
                 (ENV.S3_BUCKET_NAME && parsed.hostname.includes(ENV.S3_BUCKET_NAME)) ||
                 (ENV.S3_PUBLIC_BASE_URL && url.includes(ENV.S3_PUBLIC_BASE_URL));

    if (!isS3) {
      return null;
    }

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
  // If the value is already a full S3 URL or an ARN, we may need to transform it.
  // For public product images stored under the `products/` prefix we can return a plain
  // public URL without signing – the bucket is meant to be openly readable.
  // This avoids extra presigned‑URL overhead and guarantees the URL works from the
  // static‑website domain.
  // NOTE: `ENV.S3_PUBLIC_BASE_URL` can also be used for all public objects, but we add
  // an explicit guard for the `products/` folder to be safe if the env var is missing.

  if (!value || typeof value !== 'string') return value;

  // Ignore local assets, placeholders, data URIs
  if (value.startsWith('/') || value.startsWith('data:') || value.includes('placeholder')) {
    return value;
  }

  // If S3 is not configured, return value as-is
  if (!ENV.S3_BUCKET_NAME) return value;

  // If a public base URL is configured, return a plain public URL (no presigning needed)
  if (ENV.S3_PUBLIC_BASE_URL && !ENV.S3_PUBLIC_BASE_URL.startsWith('arn:')) {
    const key = getKeyFromUrl(value) || value;
    return getPublicUrl(key);
  }

  let key = value;

  if (value.startsWith('http://') || value.startsWith('https://')) {
    const extractedKey = getKeyFromUrl(value);
    if (!extractedKey) {
      // External image URL (Unsplash, etc.) - return directly
      return value;
    }
    // If the key points to a public product image, just return the public URL
    if (extractedKey.startsWith('products/')) {
      return getPublicUrl(extractedKey);
    }
    key = extractedKey;
  } else if (value.startsWith('arn:aws:s3:::')) {
    const extractedKey = getKeyFromUrl(value);
    if (!extractedKey) {
      return value;
    }
    if (extractedKey.startsWith('products/')) {
      return getPublicUrl(extractedKey);
    }
    key = extractedKey;
  }


  if (!key || key === '/' || (key === value && key.startsWith('arn:'))) {
    return value;
  }

  try {
    return await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: ENV.S3_BUCKET_NAME,
        Key: key,
      }),
      { expiresIn }
    );
  } catch (err) {
    console.warn(`[WARN] Failed to generate presigned S3 URL for key "${key}":`, err.message);
    return getPublicUrl(key) || value;
  }
};

export const signImageList = async (values = []) => {
  if (!Array.isArray(values)) return [];
  return Promise.all(
    values.map((value) => getSignedImageUrl(value).catch(() => value))
  );
};

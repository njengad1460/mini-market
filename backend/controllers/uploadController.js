import { uploadImageBuffer } from '../services/s3Service.js';

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const folder = typeof req.body?.folder === 'string' && req.body.folder.trim()
      ? req.body.folder.trim()
      : 'uploads';

    const uploaded = await uploadImageBuffer({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      folder,
    });

    res.status(201).json(uploaded);
  } catch (err) {
    const message = err.message || 'Image upload failed';
    const statusCode = /required|unsupported|limit/i.test(message) ? 400 : 500;
    res.status(statusCode).json({ message });
  }
};

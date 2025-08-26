import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION
});

const sanitizeFilename = (originalName) => {
  const name = path.basename(originalName, path.extname(originalName)).replace(/\s+/g, '_');
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  return `products/${name}-${timestamp}${ext}`;
};

const storage = multerS3({
  s3,
  bucket: process.env.AWS_BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: function (req, file, cb) {
    cb(null, sanitizeFilename(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

export const uploadProductImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
}).array('images', 10);

export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError || error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'UPLOAD_ERROR'
    });
  }
  next(error);
};

export const getS3ImageUrl = (key) => {
  if (!key) return null;
  if (typeof key === 'string' && (key.startsWith('http://') || key.startsWith('https://'))) {
    return key;
  }
  const bucket = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};



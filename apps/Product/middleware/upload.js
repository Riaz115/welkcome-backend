import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  } : undefined
});

const sanitizeFilename = (originalName, folder = 'products') => {
  const name = path.basename(originalName, path.extname(originalName)).replace(/\s+/g, '_');
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  return `${folder}/${name}-${timestamp}${ext}`;
};

const storage = multerS3({
  s3,
  bucket: process.env.AWS_BUCKET_NAME,
  acl: 'public-read',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: function (req, file, cb) {
    cb(null, sanitizeFilename(file.originalname));
  }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// File filter for videos
const videoFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'), false);
  }
};

// File filter for both images and videos
const mediaFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'), false);
  }
};

// Upload product images only
export const uploadProductImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).array('images', 10);

// Upload product videos only
export const uploadProductVideos = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
}).array('videos', 5);

// Upload both images and videos
export const uploadProductMedia = multer({
  storage,
  fileFilter: mediaFileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
}).fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 5 }
]);

// Upload single video
export const uploadProductVideo = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
}).single('video');

// Upload single image
export const uploadProductImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).single('image');

export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError || 
      error.message === 'Only image files are allowed' ||
      error.message === 'Only video files are allowed' ||
      error.message === 'Only image and video files are allowed') {
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

// Helper function to get S3 URL for any file type
export const getS3Url = (key) => {
  return getS3ImageUrl(key);
};



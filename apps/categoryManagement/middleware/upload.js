// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';

import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();


// AWS S3 setup
const s3 = new S3Client({
  // accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  // secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});


const getS3Key = (originalName) => {
  const name = path.basename(originalName, path.extname(originalName)).replace(/\s+/g, '_');
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  return `category_management/${name}-${timestamp}${ext}`;
};


// Multer S3 storage setup
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    // acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const key = getS3Key(file.originalname);
      cb(null, key);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});


// Middlewares
export const uploadCategoryImage = upload.single('image');

// Accept either 'image' or legacy 'document' field
export const uploadImageEither = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'document', maxCount: 1 }
]);

export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError || error.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'UPLOAD_ERROR',
    });
  }
  next(error);
};

// Optional utility (if needed)
export const getS3ImageUrl = (key) => {
  return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};








// Create uploads directory if it doesn't exist
// const uploadsDir = path.join(process.cwd(), 'uploads', 'categories');
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }

// Configure multer storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadsDir);
//   },
//   filename: (req, file, cb) => {
//     // Generate unique filename: timestamp-random-originalname
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const ext = path.extname(file.originalname);
//     const name = path.basename(file.originalname, ext);
//     cb(null, `${name}-${uniqueSuffix}${ext}`);
//   }
// });

// File filter for images only
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Multer configuration
// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB limit
//     files: 1 // Only one file allowed
//   }
// });

// Single image upload middleware
// export const uploadCategoryImage = upload.single('image');

// Multiple specific image uploads (for future use)
// export const uploadCategoryImages = upload.fields([
//   { name: 'image', maxCount: 1 },
//   { name: 'thumbnail', maxCount: 1 }
// ]);

// Error handling middleware for multer
// export const handleUploadError = (error, req, res, next) => {
//   if (error instanceof multer.MulterError) {
//     switch (error.code) {
//       case 'LIMIT_FILE_SIZE':
//         return res.status(400).json({
//           success: false,
//           message: 'File size too large. Maximum size is 5MB.',
//           error: 'FILE_SIZE_LIMIT'
//         });
//       case 'LIMIT_FILE_COUNT':
//         return res.status(400).json({
//           success: false,
//           message: 'Too many files. Only one image is allowed.',
//           error: 'FILE_COUNT_LIMIT'
//         });
//       case 'LIMIT_UNEXPECTED_FILE':
//         return res.status(400).json({
//           success: false,
//           message: 'Unexpected field name. Use "image" as field name.',
//           error: 'UNEXPECTED_FIELD'
//         });
//       default:
//         return res.status(400).json({
//           success: false,
//           message: 'File upload error',
//           error: 'UPLOAD_ERROR'
//         });
//     }
//   }
//
//   if (error.message === 'Only image files are allowed') {
//     return res.status(400).json({
//       success: false,
//       message: 'Only image files (JPEG, PNG, GIF, WebP) are allowed.',
//       error: 'INVALID_FILE_TYPE'
//     });
//   }
//
//   next(error);
// };

// Utility function to delete file
// export const deleteFile = (filePath) => {
//   try {
//     if (fs.existsSync(filePath)) {
//       fs.unlinkSync(filePath);
//       console.log(`Deleted file: ${filePath}`);
//     }
//   } catch (error) {
//     console.error(`Error deleting file ${filePath}:`, error);
//   }
// };


export const deleteFileFromS3 = async (key) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key, // e.g., 'category_management/category/my-image.jpg'
  };

  try {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await s3.send(new DeleteObjectCommand(params));
    console.log(`Deleted from S3: ${key}`);
  } catch (error) {
    console.error(`Error deleting S3 object: ${error.message}`);
  }
};

// Get full image URL from filename
// export const getImageUrl = (filename) => {
//   if (!filename) return null;
//
//   const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
//   return `${baseUrl}/uploads/categories/${filename}`;
// };

export const getImageUrl = (key) => {
  if (!key) return null;
  if (typeof key === 'string' && (key.startsWith('http://') || key.startsWith('https://'))) {
    return key;
  }
  const bucket = process.env.AWS_BUCKET_NAME || 'monkmaze-s3';
  const region = process.env.AWS_REGION || 'ap-south-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

// Extract filename from full path or URL
// export const extractFilename = (imagePath) => {
//   if (!imagePath) return null;
//
//   // If it's a full URL, extract filename
//   if (imagePath.includes('/uploads/categories/')) {
//     return path.basename(imagePath);
//   }
//
//   // If it's a local path, extract filename
//   return path.basename(imagePath);
// };

// Validate image file middleware
export const validateImageFile = (req, res, next) => {
  // Support either single (req.file) or fields (req.files)
  const uploaded = req.file || (req.files && (req.files.image?.[0] || req.files.document?.[0]));

  if (!uploaded) {
    return next();
  }

  if (uploaded.size && uploaded.size > 5 * 1024 * 1024) {
    console.log("Image file size is greater than 5MB");
    return res.status(400).json({
      success: false,
      message: 'Image file size must be less than 5MB',
      error: 'FILE_SIZE_LIMIT'
    });
  }

  next();
};
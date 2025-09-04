import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  } : undefined
});

const getS3Key = (originalName) => {
  const name = path.basename(originalName, path.extname(originalName)).replace(/\s+/g, '_');
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  return `seller_documents/${name}-${timestamp}${ext}`;
};

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const key = getS3Key(file.originalname);
      cb(null, key);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, PDF, and Word documents are allowed.'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 6
  }
});

export const uploadSellerDocs = upload.fields([
  { name: 'businessRegistrationCertificate', maxCount: 1 },
  { name: 'bankStatement', maxCount: 1 },
  { name: 'idProof', maxCount: 1 },
  { name: 'tradingLicense', maxCount: 1 }
]);

export const uploadProductImages = upload.array('images', 5);

export const uploadSingleDoc = upload.single('document');

export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 10MB per file.'
      });
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 6 files allowed.'
      });
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field. Please check field names.'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`
    });
  } else if (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next();
};

export const deleteFile = async (fileKey) => {
  try {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey
    });
    await s3.send(command);
    return true;
  } catch (error) {
    return false;
  }
};

export const validateRequiredFiles = (req, res, next) => {
  const requiredDocs = ['businessRegistrationCertificate', 'idProof'];
  const missingDocs = [];
  
  requiredDocs.forEach(docType => {
    if (!req.files || !req.files[docType]) {
      missingDocs.push(docType);
    }
  });
  
  if (missingDocs.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required documents: ${missingDocs.join(', ')}`
    });
  }
  next();
};
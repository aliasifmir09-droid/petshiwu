/// <reference types="node" />
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';

// Directory for JSON uploads
const uploadsDir = path.join(__dirname, '../../uploads/json');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const jsonStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'json-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const jsonFileFilter = (req: any, file: { fieldname: string; originalname: string; mimetype: string }, cb: FileFilterCallback) => {
  // Allow JSON files
  const extname = path.extname(file.originalname).toLowerCase();
  const isJson = extname === '.json' || file.mimetype === 'application/json' || file.mimetype === 'text/json';
  
  if (isJson) {
    return cb(null, true);
  } else {
    cb(new Error('Only JSON files are allowed'));
  }
};

export const jsonUpload = multer({
  storage: jsonStorage,
  fileFilter: jsonFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size for JSON
  }
});



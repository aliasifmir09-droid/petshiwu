/// <reference types="node" />
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';

// Directory for CSV uploads
const uploadsDir = path.join(__dirname, '../../uploads/csv');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const csvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'csv-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const csvFileFilter = (req: any, file: { fieldname: string; originalname: string; mimetype: string }, cb: FileFilterCallback) => {
  // Allow CSV files
  const extname = path.extname(file.originalname).toLowerCase();
  const isCsv = extname === '.csv' || file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel';
  
  if (isCsv) {
    return cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'));
  }
};

export const csvUpload = multer({
  storage: csvStorage,
  fileFilter: csvFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size for CSV
  }
});


/**
 * Multer middleware for local product image uploads.
 * Files are saved to backend/public/uploads/ and served as static assets.
 */

import fs     from 'fs';
import multer from 'multer';
import path   from 'path';
import { fileURLToPath } from 'url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
// Use /tmp on Vercel (read-only bundle); local public/uploads otherwise.
export const UPLOADS_DIR = process.env.VERCEL
  ? '/tmp/naneka/uploads'
  : path.join(__dirname, '../../public/uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename:    (_req, file,  cb) => {
    const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error('Only image files are accepted.'), { status: 400 }));
    }
  },
}).single('image');  // field name expected in the multipart form

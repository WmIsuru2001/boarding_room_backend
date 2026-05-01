const multer = require('multer');
const path = require('path');

const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();

/**
 * File filter for image uploads
 * Supports: JPEG, JPG, PNG, WebP, GIF, SVG, BMP, TIFF, ICO
 * Also supports: PDF (for documents)
 */
const fileFilter = (req, file, cb) => {
  // Allowed image formats: jpeg, jpg, png, webp, gif, svg, bmp, tiff, tif, ico
  const allowedImageTypes = /jpeg|jpg|png|webp|gif|svg|bmp|tiff|tif|ico/;
  // Allowed document formats: pdf, doc, docx, txt
  const allowedDocTypes = /pdf|doc|docx|txt/;
  
  const ext = path.extname(file.originalname).toLowerCase().slice(1); // Remove the dot
  const mimeType = file.mimetype.toLowerCase();
  
  // Check if it's an allowed image format
  const isValidImage = allowedImageTypes.test(ext) && 
    (mimeType.startsWith('image/') || mimeType === 'image/svg+xml');
  
  // Check if it's an allowed document format
  const isValidDocument = allowedDocTypes.test(ext) || 
    mimeType === 'application/pdf' ||
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'text/plain';
  
  if (isValidImage || isValidDocument) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Supported formats: JPEG, JPG, PNG, WebP, GIF, SVG, BMP, TIFF, ICO, PDF, DOC, DOCX, TXT`));
  }
};

exports.uploadPhotos = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter
}).array('photos', 10); // Max 10 photos

exports.uploadVerificationDocs = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter
}).fields([
  { name: 'nic', maxCount: 1 },    // National ID Card
  { name: 'bill', maxCount: 1 }    // Utility Bill/Proof of Address
]);

exports.uploadAvatar = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
}).single('avatar');

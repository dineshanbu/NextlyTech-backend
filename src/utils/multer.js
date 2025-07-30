const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDirectoryExistence = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const baseDir = path.resolve(process.cwd(), 'public/uploads');
    let folder = '';
    
    // More flexible folder structure
    if (file.fieldname.includes('review')) {
      folder = path.join(baseDir, 'review');
    } else if (file.fieldname.includes('tech-news')) {
      folder = path.join(baseDir, 'tech-news');
    } else if (file.fieldname.includes('blog')) {
      folder = path.join(baseDir, 'blog');
    } else if (file.fieldname.includes('comparison')) {
      folder = path.join(baseDir, 'comparison');
    } else {
      folder = path.join(baseDir, 'others');
    }
    
    ensureDirectoryExistence(folder);
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1E9)}`;
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}_${sanitizedName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    video: ['video/mp4', 'video/mov', 'video/avi', 'video/webm']
  };
  
  const allAllowed = [...allowedTypes.image, ...allowedTypes.video];
  
  if (allAllowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (JPEG, PNG, WebP) and videos (MP4, MOV, AVI, WebM) are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 10 // max 10 files at once
  },
  fileFilter: fileFilter
}).fields([
  { name: 'review-featured', maxCount: 1 },
  { name: 'review-gallery', maxCount: 10 },
  { name: 'tech-news-featured', maxCount: 1 },
  { name: 'tech-news-gallery', maxCount: 10 },
  { name: 'blog-featured', maxCount: 1 },
  { name: 'blog-gallery', maxCount: 10 },
  { name: 'comparison-featured', maxCount: 1 },
  { name: 'comparison-gallery', maxCount: 10 }
]);

module.exports = upload;
import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return cb(new ApiError('Only JPEG, PNG or WebP images are allowed', 400));
    }
    cb(null, true);
  },
});

export default upload.single('avatar');

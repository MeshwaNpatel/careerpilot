import multer from 'multer';
import ApiError from '../utils/ApiError.js';

// Upper bound across all plans (10MB for Premium); the actual per-plan
// limit is enforced in resumes.service.js once we know the user's plan.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new ApiError('Only PDF files are allowed', 400));
    }
    cb(null, true);
  },
});

export default upload.single('resume');

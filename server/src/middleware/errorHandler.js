import multer from 'multer';
import logger from '../utils/logger.js';

const MULTER_ERROR_STATUS = {
  LIMIT_FILE_SIZE: 413,
  LIMIT_UNEXPECTED_FILE: 400,
};

/**
 * Global error handler — must be registered last, after all routes.
 */
export default function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const status = MULTER_ERROR_STATUS[err.code] || 400;
    return res.status(status).json({ error: err.message });
  }

  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    logger.error(err.stack || err.message);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${status}: ${err.message}`);
  }

  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
  });
}

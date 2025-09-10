import rateLimit from 'express-rate-limit';

// Rate limiter for login endpoint
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // Max 15 requests per IP
  message: 'Too many login attempts, please try again later.',
});

// Rate limiter for studentExtractData
export const extractDataLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Lower limit due to processing cost
  message: 'Too many image extraction requests, please try again later.',
});

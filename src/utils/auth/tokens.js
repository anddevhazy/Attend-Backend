import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const createAccessToken = ({ id, email, role, userType }) => {
  return jwt.sign(
    { id, email, role, userType, type: 'access' },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m' }
  );
};

export const createRefreshToken = ({ id, userType, deviceId, jti }) => {
  return jwt.sign(
    { id, userType, deviceId: deviceId || null, jti, type: 'refresh' },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d' }
  );
};

export const getRefreshExpiryDate = () => {
  // match 30d default; you can compute from env if you want.
  const days = 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

export const newJti = () => crypto.randomUUID();

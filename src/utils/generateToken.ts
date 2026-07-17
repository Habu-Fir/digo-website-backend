// src/utils/generateToken.ts
import jwt, { SignOptions } from 'jsonwebtoken';

/**
 * Signs a JWT containing the user's id.
 * Expects JWT_SECRET and (optionally) JWT_EXPIRE in the environment.
 */
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in the environment.');
  }

  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRE || '30d') as SignOptions['expiresIn'],
  };

  return jwt.sign({ id: userId }, secret, options);
};

export default generateToken;

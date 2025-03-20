// lib/utils.js
import jwt from 'jsonwebtoken';

export const generate_token = (userId, res) => {
  if (!userId) {
    throw new Error('No userId provided to generate_token');
  }
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'development',
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    path: '/',
  });
  console.log('Token set in cookie:', token);
  return token;
};
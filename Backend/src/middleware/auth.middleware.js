import jwt from 'jsonwebtoken';
import User from '../models/user.models.js';

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      console.log('No token found in cookies');
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
  

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log('User not found for ID:', decoded.id);
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log('Error in protectRoute middleware:', error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Token expired' });
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
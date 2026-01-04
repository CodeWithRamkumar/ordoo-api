const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validate token in database
    const user = await User.validateJWT(decoded.userId, token);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    if (user.status !== 'A') {
      return res.status(403).json({ message: 'Account is inactive or banned.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

module.exports = auth;
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  generateToken,
  generateOTP,
  generateResetToken
};
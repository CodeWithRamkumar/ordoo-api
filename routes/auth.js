const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// Signup route
router.post('/signup', [
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('phone_number').optional().isMobilePhone().withMessage('Please provide a valid phone number')
], authController.signup);

// Login route
router.post('/login', [
  body('password').optional().notEmpty().withMessage('Password is required'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('phone_number').optional().isMobilePhone().withMessage('Please provide a valid phone number')
], authController.login);

// Send OTP route
router.post('/send-otp', [
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('phone_number').optional().isMobilePhone().withMessage('Please provide a valid phone number')
], authController.sendOTP);

// Verify OTP route
router.post('/verify-otp', [
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('phone_number').optional().isMobilePhone().withMessage('Please provide a valid phone number')
], authController.verifyOTP);

// Forgot password route
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please provide a valid email')
], authController.forgotPassword);

// Reset password route
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], authController.resetPassword);

// Validate reset token route
router.post('/validate-reset-token', [
  body('token').notEmpty().withMessage('Reset token is required')
], authController.validateResetToken);

// Logout route (requires authentication)
router.post('/logout', auth, authController.logout);

module.exports = router;
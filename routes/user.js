const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user profile (protected route)
router.get('/profile', auth, userController.getProfile);

// Update user profile (protected route)
router.put('/profile/setup', auth, [
  body('full_name').optional().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('dob').optional().isISO8601().withMessage('Invalid date format'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
], userController.updateProfile);

module.exports = router;
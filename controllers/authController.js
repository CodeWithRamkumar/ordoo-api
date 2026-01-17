const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const { generateToken, generateOTP, generateResetToken } = require('../utils/helpers');
const { sendOTPEmail, sendPasswordResetEmail } = require('../services/emailService');
const supabase = require('../config/database');

// Helper function to construct Cloudinary URL from public_id
const getCloudinaryUrl = (publicId) => {
  if (!publicId) return null;
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_400,h_400,c_fill/${publicId}`;
};

const signup = async (req, res) => {
  try {
    const { email, phone_number, password, isSso, name, photoURL, provider, uid } = req.body;

    // Skip validation for SSO requests
    if (!isSso) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
    }

    // Check if user already exists
    const existingUser = email ? await User.findByEmail(email) : await User.findByPhone(phone_number);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    let userId;
    if (isSso) {
      // Create SSO user
      userId = await User.createSSO({ email, provider, uid });
      
      // Create profile for SSO user
      await UserProfile.create({
        user_id: userId,
        full_name: name,
        avatar_url: photoURL
      });
    } else {
      // Create regular user
      userId = await User.create({ email, phone_number, password });
    }

    const token = generateToken(userId);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await User.updateJWT(userId, token, expiresAt.toISOString());

    const profile = isSso ? await UserProfile.findByUserId(userId) : null;
    const formattedProfile = profile ? {
      ...profile,
      avatar_url_public_id: profile.avatar_url,
      avatar_url: getCloudinaryUrl(profile.avatar_url) || photoURL
    } : {};

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { user_id: userId, email, phone_number, role: 'user' },
      profile: formattedProfile
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, phone_number, password, isSso, name, photoURL, provider, uid } = req.body;

    // Skip validation for SSO requests
    if (!isSso) {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
    }

    // Find user
    const user = email ? await User.findByEmail(email) : await User.findByPhone(phone_number);
    
    if (isSso) {
      if (!user) {
        return res.status(404).json({ message: 'User not found. Please sign up first.' });
      }
    } else {
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check password for regular login
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid password' });
      }
    }

    // Check user status
    if (user.status !== 'A') {
      return res.status(403).json({ message: 'Account is inactive or banned' });
    }

    // Update last login
    await User.updateLastLogin(user.user_id);

    const token = generateToken(user.user_id);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await User.updateJWT(user.user_id, token, expiresAt.toISOString());

    // Get user profile
    const profile = await UserProfile.findByUserId(user.user_id);
    const formattedProfile = profile ? {
      ...profile,
      avatar_url_public_id: profile.avatar_url,
      avatar_url: getCloudinaryUrl(profile.avatar_url) || (isSso ? photoURL : profile.avatar_url)
    } : {};

    res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role
      },
      profile: formattedProfile
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const sendOTP = async (req, res) => {
  try {
    const { email, phone_number } = req.body;

    const user = email ? await User.findByEmail(email) : await User.findByPhone(phone_number);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + parseInt(process.env.OTP_EXPIRES_IN));

    await User.updateOTP(user.user_id, otp, expiresAt);

    if (email) {
      await sendOTPEmail(email, otp);
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, phone_number, otp } = req.body;

    const user = email ? await User.findByEmail(email) : await User.findByPhone(phone_number);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const validOTP = await User.verifyOTP(user.user_id, otp);
    if (!validOTP) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP after verification
    await User.updateOTP(user.user_id, null, null);

    const token = generateToken(user.user_id);
    
    // Store token in database
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await User.updateJWT(user.user_id, token, expiresAt.toISOString());

    res.json({
      message: 'OTP verified successfully',
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        phone_number: user.phone_number
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    const { error } = await supabase
      .from('password_resets')
      .insert({
        user_id: user.user_id,
        reset_token: resetToken,
        expires_at: expiresAt.toISOString()
      });

    if (error) throw error;

    await sendPasswordResetEmail(email, resetToken);

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send reset email', error: error.message });
  }
};

const validateResetToken = async (req, res) => {
  try {
    const { token } = req.body;

    const { data: resets, error } = await supabase
      .from('password_resets')
      .select('*')
      .eq('reset_token', token)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !resets) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    res.json({ message: 'Token is valid' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const { data: resets, error } = await supabase
      .from('password_resets')
      .select('*')
      .eq('reset_token', token)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !resets) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    await User.updatePassword(resets.user_id, newPassword);

    // Mark token as used
    const { error: updateError } = await supabase
      .from('password_resets')
      .update({ is_used: true })
      .eq('reset_id', resets.reset_id);

    if (updateError) throw updateError;

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    // Clear JWT token from database
    await User.updateJWT(userId, null, null);
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  signup,
  login,
  logout,
  sendOTP,
  verifyOTP,
  forgotPassword,
  resetPassword,
  validateResetToken
};
const { validationResult } = require('express-validator');
const UserProfile = require('../models/UserProfile');
const User = require('../models/User');

// Helper function to construct Cloudinary URL from public_id
const getCloudinaryUrl = (publicId) => {
  if (!publicId) return null;
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_400,h_400,c_fill/${publicId}`;
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const user = await User.findById(userId);
    const profile = await UserProfile.findByUserId(userId);

    // Format profile with correct avatar URL
    const formattedProfile = profile ? {
      ...profile,
      avatar_url_public_id: profile.avatar_url,
      avatar_url: getCloudinaryUrl(profile.avatar_url)
    } : {};

    res.json({
      user: {
        user_id: user.user_id,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        status: user.status,
        last_login_at: user.last_login_at
      },
      profile: formattedProfile
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.user_id;
    const { full_name, phone_number, gender, dob, bio , avatar_url} = req.body;
    
    const profileData = {
      full_name,
      gender,
      dob,
      bio,
      avatar_url
    };

    // Update phone_number in users table if provided
    if (phone_number) {
      await User.updatePhone(userId, phone_number);
    }

    const existingProfile = await UserProfile.findByUserId(userId);

    if (existingProfile) {
      await UserProfile.update(userId, profileData);
    } else {
      await UserProfile.create({ user_id: userId, ...profileData });
    }

    // Get updated profile data
    const updatedUser = await User.findById(userId);
    const updatedProfile = await UserProfile.findByUserId(userId);

    // Format profile with correct avatar URL
    const formattedProfile = updatedProfile ? {
      ...updatedProfile,
      avatar_url_public_id: updatedProfile.avatar_url,
      avatar_url: getCloudinaryUrl(updatedProfile.avatar_url)
    } : {};

    res.json({
      message: 'Profile updated successfully',
      user: {
        user_id: updatedUser.user_id,
        email: updatedUser.email,
        phone_number: updatedUser.phone_number,
        role: updatedUser.role,
        status: updatedUser.status
      },
      profile: formattedProfile
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const setupProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.user_id;
    const { full_name, gender, dob, bio, location } = req.body;

    await UserProfile.create({
      user_id: userId,
      full_name,
      gender,
      dob,
      bio,
      location
    });

    res.json({ message: 'Profile setup completed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  setupProfile
};
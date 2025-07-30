const User = require('../models/userModel');
const Role = require('../models/rolesModel');
const { generateToken,generateRefreshToken } = require('../../config/auth');
const { validationResult } = require('express-validator');

  // Register new user

exports.newRegister = async (req, res) => {
  try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { username, email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email or username'
        });
      }

      // Get default user role
      const userRole = await Role.findOne({ name: 'USER' });
      if (!userRole) {
        return res.status(500).json({
          success: false,
          message: 'Default user role not found'
        });
      }

      // Create new user
      const user = new User({
        username,
        email,
        password,
        firstName,
        lastName,
        role: userRole._id
      });

      await user.save();

      // Generate JWT token
      const token = generateToken({
        userId: user._id
      });

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: user.toPublicProfile(),
          token
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
};

  // Login user

exports.login = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user and populate role
      const user = await User.findOne({ email }).populate('role');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // ✅ Generate access and refresh tokens
    const token = generateToken({ userId: user._id });
    const refreshToken = generateRefreshToken({ userId: user._id });

    // ✅ Save refresh token in the database
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();


      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toPublicProfile(),
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
}

// Get current user profile

exports.profile = async (req, res) => {
  try {
      const user = req.user;
      console.log("req",req.user)
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: user.toPublicProfile()
        }
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
}


  // Update user profile

exports.updateProfile = async (req, res) => {
  try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { firstName, lastName, bio, avatar } = req.body;
      const userId = req.user._id;

      const user = await User.findById(userId).populate('role');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update allowed fields
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (bio !== undefined) user.bio = bio;
      if (avatar !== undefined) user.avatar = avatar;

      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.toPublicProfile()
        }
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
}

// Change password

exports.changePassword = async (req, res) => {
  try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user._id;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
}

// Logout (token invalidation would be handled on client side)


exports.logout = async (req, res) => {
  try {
    // Example: clear refreshToken in DB
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


// super admin

exports.createAccount = async (req, res) => {
  try {
    if (req.user.role.name !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only SUPER_ADMIN can create admin accounts'
      });
    }

    const { username, email, password, firstName, lastName, role } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const roleObj = await Role.findOne({ name: role.toUpperCase() });
    if (!roleObj) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const newUser = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      role: roleObj._id
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: `${role} account created successfully`
    });

  } catch (err) {
    console.error('Create account error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};










const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Role = require('../models/rolesModel');
const { verifyToken } = require('../../config/auth');

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.'
      });
    }

    try {
      const decoded = verifyToken(token);
      
      // Get user with role information
      const user = await User.findById(decoded.userId)
        .populate('role')
        .select('-password');
      console.log("user",user)
      
      if (!user || !user.refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Session expired or logged out.'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Account is deactivated.'
        });
      }

      req.user = user;
      console.log(user)
      next();
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Permission check middleware
const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user.role;

      if (!userRole) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Role not found.'
        });
      }

      // Check if role has the required permission
      const hasPermission = userRole.hasPermission(resource, action);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Missing permission: ${action} on ${resource}`
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    try {
      const userRole = req.user.role;

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient privileges.'
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

// Admin only middleware
const adminOnly = requireRole(['ADMIN', 'SUPER_ADMIN']);

// Super admin only middleware
const superAdminOnly = requireRole(['SUPER_ADMIN']);

module.exports = {
  auth,
  checkPermission,
  requireRole,
  adminOnly,
  superAdminOnly
};

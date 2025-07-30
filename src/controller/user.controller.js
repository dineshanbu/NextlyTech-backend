const User = require('../models/userModel');
const Role = require('../models/rolesModel');
const { validationResult } = require('express-validator');
const Category = require('../models/categoryModel')
const mediaModel = require('../models/mediaModel')
const reviewModel = require('../models/reviewModel')
const staticPageModel = require('../models/staticPageModel')
const techNewsModel = require('../models/techNews.Model')
const subCategoryModel = require('../models/subcategoryModel')
const { getEnumValues } = require('../utils/helpers');
  // Get all users (Admin only)
  exports.getAllUsers = async (req, res) => {
    try {
      const page = parseInt(req.body.page) || 1;
      const limit = parseInt(req.body.limit) || 10;
      const skip = (page - 1) * limit;
      const search = req.body.search || '';
      const roleFilter = req.body.role || '';
      const status = req.body.status || '';

      // Build query
      let query = {};
      
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } }
        ];
      }

      if (roleFilter) {
        const role = await Role.findOne({ name: roleFilter.toUpperCase() });
        if (role) {
          query.role = role._id;
        }
      }

      if (status) {
        query.isActive = status === 'active';
      }

      const users = await User.find(query)
        .populate('role', 'name description')
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalUsers: total,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user by ID
  exports.getUserById = async (req, res) => {
    try {
      const { id } = req.body;

      const user = await User.findById(id)
        .populate('role', 'name description permissions')
        .select('-password -refreshToken');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create new user (Admin only)
  exports.createUser = async (req, res) =>  {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { username, email, password, firstName, lastName, roleId, bio } = req.body;

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

      // Verify role exists
      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified'
        });
      }

      // Create user
      const user = new User({
        username,
        email,
        password,
        firstName,
        lastName,
        role: roleId,
        bio
      });

      await user.save();

      const populatedUser = await User.findById(user._id)
        .populate('role', 'name description')
        .select('-password -refreshToken');

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user: populatedUser }
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update user (Admin only)
  exports.updateUser = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { firstName, lastName, roleId, bio, isActive } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify role if provided
      if (roleId) {
        const role = await Role.findById(roleId);
        if (!role) {
          return res.status(400).json({
            success: false,
            message: 'Invalid role specified'
          });
        }
        user.role = roleId;
      }

      // Update fields
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (bio !== undefined) user.bio = bio;
      if (isActive !== undefined) user.isActive = isActive;

      await user.save();

      const updatedUser = await User.findById(id)
        .populate('role', 'name description')
        .select('-password -refreshToken');

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user: updatedUser }
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete user (Admin only)
  exports.deleteUser = async (req, res) =>  {
    try {
      const { id } = req.params;

      // Prevent deleting self
      if (id === req.user.userId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await User.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user stats (Admin only)
  exports.getUserStats = async (req, res) =>  {
    try {
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const inactiveUsers = await User.countDocuments({ isActive: false });

      // Users by role
      const roleStats = await User.aggregate([
        {
          $lookup: {
            from: 'roles',
            localField: 'role',
            foreignField: '_id',
            as: 'roleInfo'
          }
        },
        {
          $unwind: '$roleInfo'
        },
        {
          $group: {
            _id: '$roleInfo.name',
            count: { $sum: 1 }
          }
        }
      ]);

      // Recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentRegistrations = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });

      res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          roleStats,
          recentRegistrations
        }
      });
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  exports.appConfig = async (req, res) =>  {
    try{
      const allGroups = getEnumValues(Category, 'group');
      const mediaContentType = getEnumValues(mediaModel, 'usedIn.contentType');
      const mediaUsageType = getEnumValues(mediaModel, 'usedIn.usageType');
      const reviewStatus = getEnumValues(reviewModel, 'status');
      const reviewCurrency = getEnumValues(reviewModel, 'currency');
      const pageType = getEnumValues(staticPageModel, 'pageType');
      const techStatus = getEnumValues(techNewsModel, 'status');
      const categoriesList = await Category.find({}).sort({ sortOrder: 1, createdAt: -1 })
      const subCategoriesList = await subCategoryModel.find({}).sort({ sortOrder: 1, createdAt: -1 });
      const groupedCategoryData = await Category.aggregate([
            {
              $match: { isActive: true }
            },
            {
              $lookup: {
                from: 'subcategories',
                localField: '_id',
                foreignField: 'category',
                as: 'subcategories'
              }
            },
            {
              $sort: { sortOrder: 1 }
            },
            {
              $group: {
                _id: '$group',
                categories: {
                  $push: {
                    _id: '$_id',
                    name: '$name',
                    slug: '$slug',
                    icon: '$icon',
                    image: '$image',
                    color: '$color',
                    subcategories: {
                      $map: {
                        input: '$subcategories',
                        as: 'sub',
                        in: {
                          _id: '$$sub._id',
                          name: '$$sub.name',
                          slug: '$$sub.slug'
                        }
                      }
                    }
                  }
                }
              }
            },
            {
              $project: {
                _id: 0,
                group: '$_id',
                categories: 1
              }
            }
          ]);
      res.status(200).json({
        success: true,
        data: {
          allGroups,
          mediaContentType,
          mediaUsageType,
          reviewStatus,
          reviewCurrency,
          pageType,
          techStatus,
          categoriesList,
          subCategoriesList,
          groupedCategoryData
        }
      })
    }catch(err){
      res.status(500).json({
        success: false,
        statuscode:500,
        message: err.message || 'Invalid sort order'
      });
    }
  }


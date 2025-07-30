const StaticPage = require('../models/staticPageModel');
const { validationResult } = require('express-validator');
const { generateStaticPageContent } = require("../utils/aiHelpher");

  // Get all static pages
  exports.getAllStaticPages = async (req, res) =>{
    try {
      const page = parseInt(req.body.page) || 1;
      const limit = parseInt(req.body.limit) || 10;
      const skip = (page - 1) * limit;
      
      const pageType = req.body.pageType;
      const isPublished = req.body.isPublished;
      const showInFooter = req.body.showInFooter;
      const showInMenu = req.body.showInMenu;
      const search = req.body.search || '';

      // Build query
      let query = {};
      
      if (pageType) {
        query.pageType = pageType;
      }
      
      if (isPublished !== undefined) {
        query.isPublished = isPublished === 'true';
      }
      
      if (showInFooter !== undefined) {
        query.showInFooter = showInFooter === 'true';
      }
      
      if (showInMenu !== undefined) {
        query.showInMenu = showInMenu === 'true';
      }
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { excerpt: { $regex: search, $options: 'i' } },
          { pageType: { $regex: search, $options: 'i' } }
        ];
      }

      const staticPages = await StaticPage.find(query)
        .populate('createdBy', 'username firstName lastName')
        .populate('updatedBy', 'username firstName lastName')
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await StaticPage.countDocuments(query);

      res.status(200).json({
        success: true,
        statuscode: 200,
        data: {
          staticPages,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalPages: total,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get static pages error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get static page by ID or slug
  exports.getStaticPageById = async (req, res) =>{
    try {
      const { id } = req.body;
      let staticPage;

      // Check if it's an ObjectId or slug
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        staticPage = await StaticPage.findById(id);
      } else {
        staticPage = await StaticPage.findOne({ slug: id });
      }

      if (!staticPage) {
        return res.status(404).json({
          success: false,
          message: 'Static page not found'
        });
      }

      await staticPage.populate([
        { path: 'createdBy', select: 'username firstName lastName' },
        { path: 'updatedBy', select: 'username firstName lastName' }
      ]);

      res.json({
        success: true,
        data: { staticPage }
      });
    } catch (error) {
      console.error('Get static page by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get static page by type
  exports.getStaticPageByType = async (req, res) =>{
    try {
      const { pageType } = req.body;

      const staticPage = await StaticPage.findOne({ 
        pageType,
        isPublished: true
      })
        .populate('createdBy', 'username firstName lastName')
        .populate('updatedBy', 'username firstName lastName');

      if (!staticPage) {
        return res.status(404).json({
          success: false,
          message: 'Static page not found'
        });
      }

      res.json({
        success: true,
        data: { staticPage }
      });
    } catch (error) {
      console.error('Get static page by type error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create new static page
  exports.createStaticPage = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        title,
        content,
        excerpt,
        pageType,
        isPublished,
        showInFooter,
        showInMenu,
        sortOrder,
        featuredImage,
        metaTitle,
        metaDescription,
        contactInfo
      } = req.body;

      // Check if page with same type already exists
      const existingPage = await StaticPage.findOne({ pageType });
      if (existingPage) {
        return res.status(400).json({
          success: false,
          message: 'Static page with this type already exists'
        });
      }

   

      const staticPage = new StaticPage({
        title,
        content,
        excerpt,
        pageType,
        isPublished: isPublished !== undefined ? isPublished : true,
        showInFooter: showInFooter !== undefined ? showInFooter : true,
        showInMenu: showInMenu !== undefined ? showInMenu : false,
        sortOrder: sortOrder || 0,
        featuredImage,
        metaTitle,
        slug: title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-'),
        metaDescription,
        contactInfo,
        createdBy: req.user._id
      });

      await staticPage.save();

      const populatedStaticPage = await StaticPage.findById(staticPage._id)
        .populate('createdBy', 'username firstName lastName');

      res.status(200).json({
        success: true,
        statuscode:200,
        message: 'Static page created successfully',
        data: { staticPage: populatedStaticPage }
      });
    } catch (error) {
      console.error('Create static page error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Generate static page content using AI
  exports.previewStaticPageAI = async (req, res) => {
    try {
      const { pageType } = req.body;

      if (!pageType) {
        return res.status(400).json({
          success: false,
          message: 'Page type is required'
        });
      }

      const aiData = await generateStaticPageContent(pageType);

      return res.json({
        success: true,
        message: 'AI-generated static page content preview',
        data: aiData
      });
    } catch (err) {
      console.error('AI Preview Error:', err.message);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Update existing static page
   * @param {Object} req - Request object containing updated static page data
   * @param {Object} res - Response object to send the result
   */

  // Update static page
  exports.updateStaticPage = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.body;
      const updateData = req.body;

      const staticPage = await StaticPage.findById(id);
      if (!staticPage) {
        return res.status(404).json({
          success: false,
          message: 'Static page not found'
        });
      }

      // Check if pageType is being changed and already exists
      if (updateData.pageType && updateData.pageType !== staticPage.pageType) {
        const existingPage = await StaticPage.findOne({ 
          pageType: updateData.pageType,
          _id: { $ne: id }
        });
        if (existingPage) {
          return res.status(400).json({
            success: false,
            message: 'Static page with this type already exists'
          });
        }
      }

      // Update allowed fields
      const allowedUpdates = [
        'title', 'content', 'excerpt', 'pageType', 'isPublished',
        'showInFooter', 'showInMenu', 'sortOrder', 'featuredImage',
        'metaTitle', 'metaDescription', 'lastReviewedAt', 'contactInfo'
      ];

      allowedUpdates.forEach(field => {
        if (updateData[field] !== undefined) {
          staticPage[field] = updateData[field];
        }
      });

      staticPage.updatedBy = req.user._id;
      staticPage.slug =staticPage.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-'),
      await staticPage.save();

      const updatedStaticPage = await StaticPage.findById(id)
        .populate('createdBy', 'username firstName lastName')
        .populate('updatedBy', 'username firstName lastName');

      res.json({
        success: true,
        statuscode: 200,
        message: 'Static page updated successfully',
        data: { staticPage: updatedStaticPage }
      });
    } catch (error) {
      console.error('Update static page error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete static page
  exports.deleteStaticPage = async (req, res) => {
    try {
      const { id } = req.body;

      const staticPage = await StaticPage.findById(id);
      if (!staticPage) {
        return res.status(404).json({
          success: false,
          message: 'Static page not found'
        });
      }

      await StaticPage.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Static page deleted successfully'
      });
    } catch (error) {
      console.error('Delete static page error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get footer pages
  exports.getFooterPages = async (req, res) =>{
    try {
      const footerPages = await StaticPage.find({
        isPublished: true,
        showInFooter: true
      })
        .select('title slug pageType')
        .sort({ sortOrder: 1 });

      res.json({
        success: true,
        data: { footerPages }
      });
    } catch (error) {
      console.error('Get footer pages error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get menu pages
  exports.getMenuPages = async (req, res) => {
    try {
      const menuPages = await StaticPage.find({
        isPublished: true,
        showInMenu: true
      })
        .select('title slug pageType')
        .sort({ sortOrder: 1 });

      res.json({
        success: true,
        data: { menuPages }
      });
    } catch (error) {
      console.error('Get menu pages error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get static page stats
  exports.getStaticPageStats = async (req, res) =>{
    try {
      const totalPages = await StaticPage.countDocuments();
      const publishedPages = await StaticPage.countDocuments({ isPublished: true });
      const footerPages = await StaticPage.countDocuments({ showInFooter: true });
      const menuPages = await StaticPage.countDocuments({ showInMenu: true });

      // Pages by type
      const pagesByType = await StaticPage.aggregate([
        {
          $group: {
            _id: '$pageType',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      // Recently updated pages
      const recentlyUpdated = await StaticPage.find()
        .select('title pageType updatedAt')
        .sort({ updatedAt: -1 })
        .limit(5);

      res.json({
        success: true,
        data: {
          totalPages,
          publishedPages,
          footerPages,
          menuPages,
          pagesByType,
          recentlyUpdated
        }
      });
    } catch (error) {
      console.error('Get static page stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }


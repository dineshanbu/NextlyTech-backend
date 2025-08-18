const TechNews = require('../models/techNews.Model');
const Comment = require('../models/commentsModel');
const { validationResult } = require('express-validator');
const { getEnumValues,handleSortOrder,createSlug } = require('../utils/helpers');
  // Get all tech news
  exports.getAllTechNews = async (req, res) =>{
    try {
      const page = parseInt(req.body.page) || 1;
      const limit = parseInt(req.body.limit) || 10;
      const skip = (page - 1) * limit;
      
      const status = req.body.status || 'all';
      const category = req.body.category;
      const isFeatured = req.body.isFeatured;
      const isBreaking = req.body.isBreaking;
      const search = req.body.search || '';
      const sortBy = req.body.sortBy || 'publishedAt';
      const sortOrder = req.body.sortOrder === 'asc' ? 1 : -1;

      // Build query
      let query = {};
      
      if (status && status !== 'all') {
        query.status = status;
      }
      
      if (category) {
        query.category = category;
      }
      
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { excerpt: { $regex: search, $options: 'i' } }
        ];
      }

      // Build sort object
      let sort = {};
      sort[sortBy] = sortOrder;

      // Count totals in parallel
        const [totalAll, totalPublished, totalDraft, techNews] = await Promise.all([
            TechNews.countDocuments(),
            TechNews.countDocuments({ status: 'published' }),
            TechNews.countDocuments({ status: 'draft' }),
            TechNews.find(query)
              .populate('category', 'name slug group')
              .populate('subcategory', 'name slug')
              .populate('author', 'username firstName lastName avatar')
              .populate('commentsCount')
              .populate('updatedBy', 'username firstName lastName')
              .sort(sort)
              .skip(skip)
              .limit(limit)
        ]);
      const total = await TechNews.countDocuments(query);

      res.json({
        success: true,
        statuscode: 200,
        data: {
          counts: {
            totalAll,
            totalPublished,
            totalDraft
          },
          techNews,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalReviews: total,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      });
      
      
    } catch (error) {
      console.error('Get tech news error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get tech news by ID or slug
  exports.getTechNewsById = async (req, res) => {
    try {
      const { id } = req.body;
      const incrementView = req.body.incrementView === 'true';
      
      let techNews;

      // Check if it's an ObjectId or slug
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        techNews = await TechNews.findById(id);
      } else {
        techNews = await TechNews.findOne({ slug: id });
      }

      if (!techNews) {
        return res.status(404).json({
          success: false,
          message: 'Tech news not found'
        });
      }

      // Increment view count if requested
      if (incrementView) {
        techNews.viewCount += 1;
        await techNews.save();
      }

      await techNews.populate([
           { path: 'category', select: 'name slug' },
        { path: 'subcategory', select: 'name slug' },
        { path: 'author', select: 'username firstName lastName avatar bio' },
        { path: 'updatedBy', select: 'username firstName lastName' },
        { path: 'commentsCount' }
      ]);

      res.json({
        success: true,
        data: { techNews }
      });
    } catch (error) {
      console.error('Get tech news by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create new tech news
  exports.createTechNews = async (req, res) => {
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
        category,
        subcategory,
        tags,
        featuredImage,
        images,
        status,
        isFeatured,
        isBreaking,
        priority,
        source,
        metaTitle,
        metaDescription
      } = req.body;
        // 6️⃣ Slug generation
    const slug = createSlug(title);
      const techNews = new TechNews({
        title,
        content,
        excerpt,
        category,
        subcategory,
        tags,
        featuredImage,
        images,
        author: req.user._id,
        status: status || 'draft',
        publishedAt: status === 'published' ? new Date() : null,
        isFeatured: isFeatured || false,
        isBreaking: isBreaking || false,
        priority: priority || 0,
        source,
        metaTitle,
        metaDescription,
        slug
      });

      await techNews.save();

      const populatedTechNews = await TechNews.findById(techNews._id)
        .populate('author', 'username firstName lastName avatar');

      res.status(201).json({
        success: true,
        message: 'Tech news created successfully',
        data: { techNews: populatedTechNews }
      });
    } catch (error) {
      console.error('Create tech news error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update tech news
  exports.updateTechNews = async (req, res) => {
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

      const techNews = await TechNews.findById(id);
      if (!techNews) {
        return res.status(404).json({
          success: false,
          message: 'Tech news not found'
        });
      }

      // Check if user can edit this tech news
      // if (techNews.author.toString() !== req.user.userId && !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(req.user.role)) {
      //   return res.status(403).json({
      //     success: false,
      //     message: 'Not authorized to edit this tech news'
      //   });
      // }

      // Update allowed fields
      const allowedUpdates = [
        'title', 'content', 'excerpt', 'category', 'subcategory','tags', 'featuredImage',
        'images', 'status', 'isFeatured', 'isBreaking', 'priority', 'source',
        'metaTitle', 'metaDescription'
      ];

      allowedUpdates.forEach(field => {
        if (updateData[field] !== undefined) {
          techNews[field] = updateData[field];
        }
      });

      techNews.updatedBy = req.user._id;
      techNews.publishedAt= updateData['status'] === 'published' ? new Date() : null,
      await techNews.save();

      const updatedTechNews = await TechNews.findById(id)
        .populate('author', 'username firstName lastName avatar')
        .populate('updatedBy', 'username firstName lastName');

      res.json({
        success: true,
        statuscode:200,
        message: 'Tech news updated successfully',
        data: { techNews: updatedTechNews }
      });
    } catch (error) {
      console.error('Update tech news error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete tech news
  exports.deleteTechNews = async (req, res) => {
    try {
      const { id } = req.body;

      const techNews = await TechNews.findById(id);
      if (!techNews) {
        return res.status(404).json({
          success: false,
          message: 'Tech news not found'
        });
      }

      // Check if user can delete this tech news
      // if (techNews.author.toString() !== req.user._id && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      //   return res.status(403).json({
      //     success: false,
      //     message: 'Not authorized to delete this tech news'
      //   });
      // }

      // Delete associated comments
      await Comment.deleteMany({ techNews: id });

      await TechNews.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Tech news deleted successfully'
      });
    } catch (error) {
      console.error('Delete tech news error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get tech news by category
  exports.getTechNewsByCategory = async (req, res) => {
    try {
      const { category } = req.params;
      const limit = parseInt(req.query.limit) || 10;

      const techNews = await TechNews.find({
        category,
        status: 'published'
      })
        .populate('author', 'username firstName lastName avatar')
        .sort({ publishedAt: -1 })
        .limit(limit);

      res.json({
        success: true,
        data: { techNews }
      });
    } catch (error) {
      console.error('Get tech news by category error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get breaking news
  exports.getBreakingNews = async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;

      const breakingNews = await TechNews.find({
        status: 'published',
        isBreaking: true
      })
        .populate('author', 'username firstName lastName avatar')
        .sort({ priority: -1, publishedAt: -1 })
        .limit(limit);

      res.json({
        success: true,
        data: { breakingNews }
      });
    } catch (error) {
      console.error('Get breaking news error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get featured tech news
  exports.getFeaturedTechNews = async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;

      const featuredNews = await TechNews.find({
        status: 'published',
        isFeatured: true
      })
        .populate('author', 'username firstName lastName avatar')
        .sort({ priority: -1, publishedAt: -1 })
        .limit(limit);

      res.json({
        success: true,
        data: { featuredNews }
      });
    } catch (error) {
      console.error('Get featured tech news error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get trending tech news
  exports.getTrendingTechNews = async (req, res) =>  {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const days = parseInt(req.query.days) || 7;

      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      const trendingNews = await TechNews.find({
        status: 'published',
        publishedAt: { $gte: dateThreshold }
      })
        .populate('author', 'username firstName lastName avatar')
        .sort({ viewCount: -1, shareCount: -1, likesCount: -1 })
        .limit(limit);

      res.json({
        success: true,
        data: { trendingNews }
      });
    } catch (error) {
      console.error('Get trending tech news error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get tech news stats
  exports.getTechNewsStats = async (req, res) => {
    try {
      const totalNews = await TechNews.countDocuments();
      const publishedNews = await TechNews.countDocuments({ status: 'published' });
      const draftNews = await TechNews.countDocuments({ status: 'draft' });
      const featuredNews = await TechNews.countDocuments({ isFeatured: true });
      const breakingNews = await TechNews.countDocuments({ isBreaking: true });

      // News by category
      const newsByCategory = await TechNews.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      // Most viewed news
      const mostViewedNews = await TechNews.find({ status: 'published' })
        .select('title viewCount')
        .sort({ viewCount: -1 })
        .limit(5);

      // Recent news
      const recentNews = await TechNews.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });

      res.json({
        success: true,
        data: {
          totalNews,
          publishedNews,
          draftNews,
          featuredNews,
          breakingNews,
          newsByCategory,
          mostViewedNews,
          recentNews
        }
      });
    } catch (error) {
      console.error('Get tech news stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }


const Review = require('../models/reviewModel');
const Category = require('../models/categoryModel');
const Subcategory = require('../models/subcategoryModel');
const Comment = require('../models/commentsModel');
const { validationResult } = require('express-validator');


  // Get all reviews
 exports.getAllReviews = async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const skip = (page - 1) * limit;

    const status = req.body.status || 'all'; // Default to 'all' if not provided
    const categoryId = req.body.categoryId;
    const subcategoryId = req.body.subcategoryId;
    const isFeatured = req.body.isFeatured;
    const search = req.body.search || '';
    const sortBy = req.body.sortBy || 'publishedAt';
    const sortOrder = req.body.sortOrder === 'asc' ? 1 : -1;

    // Build query for main result
    let query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (categoryId) {
      query.category = categoryId;
    }

    if (subcategoryId) {
      query.subcategory = subcategoryId;
    }

    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === 'true';
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort logic
    let sort = {};
    sort[sortBy] = sortOrder;

    // Count totals in parallel
    const [totalAll, totalPublished, totalDraft, reviews] = await Promise.all([
      Review.countDocuments(),
      Review.countDocuments({ status: 'published' }),
      Review.countDocuments({ status: 'draft' }),
      Review.find(query)
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .populate('author', 'username firstName lastName avatar')
        .populate('commentsCount')
        .sort(sort)
        .skip(skip)
        .limit(limit)
    ]);

    const total = await Review.countDocuments(query);

    res.json({
      success: true,
      statuscode: 200,
      data: {
        counts: {
          totalAll,
          totalPublished,
          totalDraft
        },
        reviews,
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
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      statuscode: 500,
      message: 'Internal server error'
    });
  }
};


  // Get review by ID or slug
 exports.getReviewById = async (req, res) =>{
    try {
      const { id } = req.body;
      const incrementView = req.body.incrementView === 'true';
      
      let review;

      // Check if it's an ObjectId or slug
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        review = await Review.findById(id);
      } else {
        review = await Review.findOne({ slug: id });
      }

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // Increment view count if requested
      if (incrementView) {
        review.viewCount += 1;
        await review.save();
      }

      await review.populate([
        { path: 'category', select: 'name slug' },
        { path: 'subcategory', select: 'name slug' },
        { path: 'author', select: 'username firstName lastName avatar bio' },
        { path: 'updatedBy', select: 'username firstName lastName' },
        { path: 'commentsCount' }
      ]);

      res.json({
        success: true,
        statuscode:200,
        message: 'Review retrieved successfully',
        data: { review }
      });
    } catch (error) {
      console.error('Get review by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create new review
  exports.createReview = async (req, res) =>{
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
        categoryId,
        subcategoryId,
        productName,
        brand,
        model,
        price,
        images,
        featuredImage,
        specifications,
        ratings,
        prosAndCons,
        verdict,
        tags,
        status,
        isFeatured,
        metaTitle,
        metaDescription
      } = req.body;

      // Verify category and subcategory exist
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category specified'
        });
      }

      const subcategory = await Subcategory.findById(subcategoryId);
      if (!subcategory || subcategory.category.toString() !== categoryId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid subcategory specified'
        });
      }

      const review = new Review({
        title,
        content,
        excerpt,
        category: categoryId,
        subcategory: subcategoryId,
        productName,
        brand,
        model,
        price,
        images,
        featuredImage,
        specifications,
        ratings,
        prosAndCons,
        verdict,
        tags,
        author: req.user._id,
        status: status || 'draft',
        isFeatured: isFeatured || false,
        metaTitle,
        metaDescription
      });

      review.slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
      const { design, performance, battery, camera, display, valueForMoney } = ratings;

      // Convert to numbers and filter out invalid ones
      const ratingValues = [design, performance, battery, display, valueForMoney]
        .map(val => Number(val))
        .filter(val => !isNaN(val)); // removes null, undefined, or NaN

      // Optionally include camera if it's a number
      if (!isNaN(Number(camera))) {
        ratingValues.push(Number(camera));
      }

      if (ratingValues.length > 0) {
        review.overallRating = Math.round(
          (ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length) * 10
        ) / 10;
      } else {
        review.overallRating = 0; // or null, depending on your design
      }

      await review.save();

      const populatedReview = await Review.findById(review._id)
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .populate('author', 'username firstName lastName avatar');

      res.status(200).json({
        success: true,
        status: 201,
        message: 'Review created successfully',
        data: { review: populatedReview }
      });
    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update review
  exports.updateReview = async (req, res) => {
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

      const review = await Review.findById(id);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // Check if user can edit this review
      // if (review.author !== req.user._id && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      //   return res.status(403).json({
      //     success: false,
      //     message: 'Not authorized to edit this review'
      //   });
      // }

      // Verify category and subcategory if being updated
      if (updateData.categoryId) {
        const category = await Category.findById(updateData.categoryId);
        if (!category) {
          return res.status(400).json({
            success: false,
            message: 'Invalid category specified'
          });
        }
        review.category = updateData.categoryId;
      }

      if (updateData.subcategoryId) {
        const subcategory = await Subcategory.findById(updateData.subcategoryId);
        if (!subcategory) {
          return res.status(400).json({
            success: false,
            message: 'Invalid subcategory specified'
          });
        }
        review.subcategory = updateData.subcategoryId;
      }

      // Update allowed fields
      const allowedUpdates = [
        'title', 'content', 'excerpt', 'productName', 'brand', 'model',
        'price', 'images', 'featuredImage', 'specifications', 'ratings',
        'prosAndCons', 'verdict', 'tags', 'status', 'isFeatured',
        'metaTitle', 'metaDescription'
      ];

      allowedUpdates.forEach(field => {
        if (updateData[field] !== undefined) {
          review[field] = updateData[field];
        }
      });

      review.updatedBy = req.user._id;
      review.slug = updateData?.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
      const { design, performance, battery, camera, display, valueForMoney } = updateData?.ratings;
      const ratingValues = [design, performance, battery, display, valueForMoney];
      if (camera) ratingValues.push(camera);
      review.overallRating = Math.round((ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length) * 10) / 10;
      await review.save();

      const updatedReview = await Review.findById(id)
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .populate('author', 'username firstName lastName avatar')
        .populate('updatedBy', 'username firstName lastName');

      res.json({
        success: true,
        message: 'Review updated successfully',
        data: { review: updatedReview }
      });
    } catch (error) {
      console.error('Update review error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete review
   exports.deleteReview = async (req, res) => {
    try {
      const { id } = req.body;

      const review = await Review.findById(id);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // Check if user can delete this review
      // if (review.author.toString() !== req.user.userId && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      //   return res.status(403).json({
      //     success: false,
      //     message: 'Not authorized to delete this review'
      //   });
      // }

      // Delete associated comments
      await Comment.deleteMany({ review: id });

      await Review.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error) {
      console.error('Delete review error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get trending reviews
  exports.getTrendingReviews = async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const days = parseInt(req.query.days) || 7;

      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      const reviews = await Review.find({
        status: 'published',
        publishedAt: { $gte: dateThreshold }
      })
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .populate('author', 'username firstName lastName avatar')
        .sort({ viewCount: -1, likesCount: -1, shareCount: -1 })
        .limit(limit);

      res.json({
        success: true,
        data: { reviews }
      });
    } catch (error) {
      console.error('Get trending reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get featured reviews
  exports.getFeaturedReviews = async (req, res) =>{
    try {
      const limit = parseInt(req.query.limit) || 5;

      const reviews = await Review.find({
        status: 'published',
        isFeatured: true
      })
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .populate('author', 'username firstName lastName avatar')
        .sort({ publishedAt: -1 })
        .limit(limit);

      res.json({
        success: true,
        data: { reviews }
      });
    } catch (error) {
      console.error('Get featured reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get review stats
  exports.getReviewStats = async (req, res) =>{
    try {
      const totalReviews = await Review.countDocuments();
      const publishedReviews = await Review.countDocuments({ status: 'published' });
      const draftReviews = await Review.countDocuments({ status: 'draft' });
      const featuredReviews = await Review.countDocuments({ isFeatured: true });

      // Reviews by category
      const reviewsByCategory = await Review.aggregate([
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        {
          $unwind: '$categoryInfo'
        },
        {
          $group: {
            _id: '$categoryInfo.name',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      // Most viewed reviews
      const mostViewedReviews = await Review.find({ status: 'published' })
        .select('title viewCount')
        .sort({ viewCount: -1 })
        .limit(5);

      // Recent reviews
      const recentReviews = await Review.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });

      res.json({
        success: true,
        data: {
          totalReviews,
          publishedReviews,
          draftReviews,
          featuredReviews,
          reviewsByCategory,
          mostViewedReviews,
          recentReviews
        }
      });
    } catch (error) {
      console.error('Get review stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }




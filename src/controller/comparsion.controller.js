const Review = require('../models/reviewModel');
const Comparison  = require('../models/comparsionModel');
const Category = require('../models/categoryModel');
const mongoose = require('mongoose');
const { validateComparison } = require('express-validator');
const { getEnumValues,handleSortOrder,createSlug } = require('../utils/helpers');

const getComparisons = async (req, res) => {
   try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      status: req.query.status || 'published'
    };

    if (req.query.category) filter.category = req.query.category;
    if (req.query.subcategory) filter.subcategory = req.query.subcategory;
    if (req.query.comparisonType) filter.comparisonType = req.query.comparisonType;
    if (req.query.isFeatured !== undefined) filter.isFeatured = req.query.isFeatured === 'true';
    if (req.query.tags) filter.tags = { $in: req.query.tags.split(',') };
    if (req.query.search) filter.$text = { $search: req.query.search };

    let sortOptions = { publishedAt: -1 };
    if (req.query.sort === 'popular') sortOptions = { viewCount: -1 };
    if (req.query.sort === 'priority') sortOptions = { priority: -1, publishedAt: -1 };

    const comparisons = await Comparison.find(filter)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('author', 'name avatar')
      .populate({
        path: 'products',
        model: 'Review',
        select: 'productName brand model overallRating featuredImage price', // Minimal data for list view
        match: { status: 'published' }
      })
      .populate({
        path: 'winner.productId',
        model: 'Review',
        select: 'productName brand'
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select('-content'); // Exclude content for list view

    const total = await Comparison.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: comparisons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single comparison by ID or slug
// @route   GET /api/comparisons/:identifier
// @access  Public
const getComparisonById = async (req, res) => {
  try {
    const { identifier } = req.body;
    
    // Check if identifier is ObjectId or slug
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const query = isObjectId ? { _id: identifier } : { slug: identifier };

    const comparison = await Comparison.findOne(query)
      .populate('category', 'name slug description')
      .populate('subcategory', 'name slug description')
      .populate('author', 'name email avatar bio')
      .populate('products.productId', 'title slug');

    if (!comparison) {
      return res.status(404).json({
        success: false,
        message: 'Comparison not found'
      });
    }

    // Increment view count
    await Comparison.findByIdAndUpdate(comparison._id, {
      $inc: { viewCount: 1 }
    });

    res.status(200).json({
      success: true,
      data: comparison
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create new comparison
// @route   POST /api/comparisons
// @access  Private/Admin
const createComparison = async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      category,
      subcategory,
      comparisonType,
      products, // Array of review IDs
      winner,
      conclusion,
      featuredImage,
      images,
      tags,
      status,
      isFeatured,
      priority,
      metaTitle,
      metaDescription
    } = req.body;

    // Validate that all product IDs exist and are published
    const existingReviews = await Review.find({ 
      _id: { $in: products },
      status: 'published'
    });
    
    if (existingReviews.length !== products.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more product reviews not found or not published'
      });
    }

    // Validate winner product ID
    if (!products.includes(winner.productId.toString())) {
      return res.status(400).json({
        success: false,
        message: 'Winner must be one of the compared products'
      });
    }

    // Generate slug
    const slug = createSlug(title);

    const comparison = new Comparison({
      title,
      slug,
      content,
      excerpt,
      category,
      subcategory,
      comparisonType,
      products, // Just store the IDs
      winner,
      conclusion,
      featuredImage,
      images: images || [],
      tags: tags || [],
      author: req.user.id,
      status: status || 'draft',
      publishedAt: status === 'published' ? new Date() : null,
      isFeatured: isFeatured || false,
      priority: priority || 0,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt
    });

    const savedComparison = await comparison.save();
    
    // Populate before sending response
    await savedComparison.populate('category', 'name slug');
    await savedComparison.populate('subcategory', 'name slug');
    await savedComparison.populate('author', 'name email');
    await savedComparison.populate('products', 'productName brand model');

    res.status(200).json({
      statuscode:200,
      success: true,
      data: savedComparison,
      message: 'Comparison created successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update comparison
// @route   PUT /api/comparisons/:id
// @access  Private/Admin
const updateComparison = async (req, res) => {
  try {
    const { id } = req.body;
    const updateData = { ...req.body };

    // If title is being updated, generate new slug
    if (updateData.title) {
      const newSlug = createSlug(updateData?.title);

      
      // Check if new slug conflicts with existing comparison (except current one)
      const existingComparison = await Comparison.findOne({ 
        slug: newSlug, 
        _id: { $ne: id } 
      });
      
      if (existingComparison) {
        return res.status(400).json({
          success: false,
          message: 'Comparison with this title already exists'
        });
      }
      
      updateData.slug = newSlug;
    }

    // If status is being changed to published, set publishedAt
    if (updateData.status === 'published') {
      const currentComparison = await Comparison.findById(id);
      if (currentComparison.status !== 'published') {
        updateData.publishedAt = new Date();
      }
    }

    // If products are being updated, validate them
    if (updateData.products) {
      const productIds = updateData.products.map(p => p.productId);
      const existingReviews = await Review.find({ _id: { $in: productIds } });
      
      if (existingReviews.length !== productIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more product reviews not found'
        });
      }

      // Validate winner if provided
      if (updateData.winner && !productIds.includes(updateData.winner.productId.toString())) {
        return res.status(400).json({
          success: false,
          message: 'Winner must be one of the compared products'
        });
      }
    }

    updateData.updatedBy = req.user.id;

    const comparison = await Comparison.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('author', 'name email')
      .populate('updatedBy', 'name email');

    if (!comparison) {
      return res.status(404).json({
        success: false,
        message: 'Comparison not found'
      });
    }

    res.status(200).json({
      success: true,
      data: comparison,
      message: 'Comparison updated successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete comparison
// @route   DELETE /api/comparisons/:id
// @access  Private/Admin
const deleteComparison = async (req, res) => {
  try {
    const { id } = req.body;

    const comparison = await Comparison.findById(id);

    if (!comparison) {
      return res.status(404).json({
        success: false,
        message: 'Comparison not found'
      });
    }

    await Comparison.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Comparison deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get featured comparisons
// @route   GET /api/comparisons/featured
// @access  Public
const getFeaturedComparisons = async (req, res) => {
  try {
    const limit = parseInt(req.body.limit) || 5;

    const comparisons = await Comparison.find({
      status: 'published',
      isFeatured: true
    })
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('author', 'name avatar')
      .sort({ priority: -1, publishedAt: -1 })
      .limit(limit)
      .select('-content');

    res.status(200).json({
      success: true,
      data: comparisons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get comparisons by category
// @route   GET /api/comparisons/category/:categoryId
// @access  Public
const getComparisonsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.body;
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      category: categoryId,
      status: 'published'
    };

    if (req.body.subcategory) {
      filter.subcategory = req.body.subcategory;
    }

    const comparisons = await Comparison.find(filter)
      .populate('subcategory', 'name slug')
      .populate('author', 'name avatar')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content');

    const total = await Comparison.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: comparisons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Search comparisons
// @route   GET /api/comparisons/search
// @access  Public
const searchComparisons = async (req, res) => {
  try {
    const { q, category } = req.body;
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const filter = {
      status: 'published',
      $text: { $search: q }
    };

    if (category) {
      filter.category = category;
    }



    const comparisons = await Comparison.find(filter)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('author', 'name avatar')
      .sort({ score: { $meta: 'textScore' }, publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content');

    const total = await Comparison.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: comparisons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

module.exports = {
  getComparisons,
  getComparisonById,
  createComparison,
  updateComparison,
  deleteComparison,
  getFeaturedComparisons,
  getComparisonsByCategory,
  searchComparisons
};




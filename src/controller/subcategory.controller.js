const Subcategory = require('../models/subcategoryModel');
const Category = require('../models/categoryModel');
const Review = require('../models/reviewModel');
const { validationResult } = require('express-validator');
const { getEnumValues,handleSortOrder,createSlug } = require('../utils/helpers');
const { checkSimilarCategoryAI ,generateMetaForEntity,validateSubcategoryContextAI} = require("../utils/aiHelpher");
const {checkUsage} = require("../utils/checkUsageHelper")

  // Get all subcategories
  exports.getAllSubcategories = async (req, res) => {
    try {
      const page = parseInt(req.body.page) || 1;
      const limit = parseInt(req.body.limit) || 10;
      const skip = (page - 1) * limit;
      const categoryId = req.body.categoryId;
      const includeInactive = req.body.includeInactive === 'true';
      const search = req.body.search || '';

      // Build query
      let query = {};
      if (categoryId) {
        query.category = categoryId;
      }
      if (!includeInactive) {
        query.isActive = true;
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const subcategories = await Subcategory.find(query)
        .populate('category', 'name slug')
        .populate('createdBy', 'username firstName lastName')
        .populate('updatedBy', 'username firstName lastName')
        .populate('reviewsCount')
        .sort({ category: 1, sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Subcategory.countDocuments(query);

      res.json({
        success: true,
        data: {
          subcategories,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalSubcategories: total,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get subcategories error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get subcategory by ID or slug
  exports.getSubcategoryById = async (req, res) => {
    try {
      const { id } = req.body;
      let subcategory;

      // Check if it's an ObjectId or slug
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        subcategory = await Subcategory.findById(id);
      } else {
        // For slug, we need category context
        const categorySlug = req.query.category;
        if (categorySlug) {
          const category = await Category.findOne({ slug: categorySlug });
          if (category) {
            subcategory = await Subcategory.findOne({ 
              slug: id, 
              category: category._id 
            });
          }
        } else {
          subcategory = await Subcategory.findOne({ slug: id });
        }
      }

      if (!subcategory) {
        return res.status(404).json({
          success: false,
          message: 'Subcategory not found'
        });
      }

      await subcategory.populate([
        { path: 'category', select: 'name slug' },
        { path: 'createdBy', select: 'username firstName lastName' },
        { path: 'updatedBy', select: 'username firstName lastName' },
        { path: 'reviewsCount' }
      ]);

      res.json({
        success: true,
        data: { subcategory }
      });
    } catch (error) {
      console.error('Get subcategory by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get subcategories by category
  exports.getSubcategoriesByCategory = async (req, res) => {
    try {
      const { categoryId } = req.body;
      const includeInactive = req.body.includeInactive === 'true';

      // Verify category exists
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      let query = { category: categoryId };
      if (!includeInactive) {
        query.isActive = true;
      }

      const subcategories = await Subcategory.find(query)
        .populate('reviewsCount')
        .sort({ sortOrder: 1, createdAt: -1 });

      res.json({
        success: true,
        data: {
          category: {
            _id: category._id,
            name: category.name,
            slug: category.slug
          },
          subcategories
        }
      });
    } catch (error) {
      console.error('Get subcategories by category error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create new subcategory
  exports.createSubcategory = async (req, res) => {
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
        name,
        description,
        categoryId,
        icon,
        image,
        sortOrder,
        metaTitle,
        metaDescription
      } = req.body;

      // Verify category exists
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category specified'
        });
      }

      // Validate AI-based context
      const relevance = await validateSubcategoryContextAI(name, category.name);

      if (!relevance.isRelevant) {
        return res.status(400).json({
          success: false,
          message: `Subcategory seems irrelevant to the category. Reason: ${relevance.reason}`
        });
      }

      // Check if subcategory with same name exists in this category
      const sub_categories = await Subcategory.find().select("name -_id");
          const aiCheck = await checkSimilarCategoryAI(name,sub_categories);
          if (aiCheck.isDuplicate) {
            return res.status(400).json({
              success: false,
              message: `Similar category name "${aiCheck.similarName}" already exists. Please choose a more unique name.`
            });
          }
      
          // ✅ SortOrder handler with error catching
          let finalSortOrder;
          try {
            finalSortOrder = await handleSortOrder(Subcategory, sortOrder);
          } catch (err) {
            return res.status(400).json({
              success: false,
              message: err.message || 'Invalid sort order'
            });
          }
      
      const slug = createSlug(name);
      const subcategory = new Subcategory({
        name,
        slug : slug,
        description,
        category: categoryId,
        icon,
        image,
        sortOrder : finalSortOrder,
        metaTitle,
        metaDescription,
        createdBy: req.user._id
      });

      await subcategory.save();

      res.status(201).json({
        success: true,
        message: 'Subcategory created successfully',
        data: { subcategory: subcategory }
      });
    } catch (error) {
      console.error('Create subcategory error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update subcategory
 exports.updateSubcategory = async (req, res) => {
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
    const {
      name,
      description,
      categoryId,
      icon,
      image,
      isActive,
      sortOrder,
      metaTitle,
      metaDescription
    } = req.body;

    const subcategory = await Subcategory.findById(id);
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }
    

    let currentCategory = await Category.findById(subcategory.category);

    // Validate AI-based context
      const relevance = await validateSubcategoryContextAI(name, currentCategory.name);

      if (!relevance.isRelevant) {
        return res.status(400).json({
          success: false,
          message: `Subcategory seems irrelevant to the category. Reason: ${relevance.reason}`
        });
      }

    // Check if category is being changed
    if (categoryId && categoryId !== subcategory.category.toString()) {
      const newCategory = await Category.findById(categoryId);
      if (!newCategory) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category specified'
        });
      }
      currentCategory = newCategory; // update for AI check
      subcategory.category = categoryId;
    }

    // ✅ AI similarity check if name changes
    if (name && name !== subcategory.name) {
      const sub_categories = await Subcategory.find().select("name -_id");
      const aiCheck = await checkSimilarCategoryAI(name, sub_categories);
      if (aiCheck.isDuplicate) {
        return res.status(400).json({
          success: false,
          message: `Similar subcategory name "${aiCheck.similarName}" already exists. Please choose a more unique name.`
        });
      }
    }

    // ✅ AI relevance check if name or category changed
    const effectiveName = name || subcategory.name;
    if (
      (name && name !== subcategory.name) ||
      (categoryId && categoryId !== subcategory.category.toString())
    ) {
      const aiRelevance = await validateSubcategoryContextAI(effectiveName, currentCategory.name);
      if (!aiRelevance.isRelevant) {
        return res.status(400).json({
          success: false,
          message: `Subcategory is not relevant to the category. Reason: ${aiRelevance.reason}`
        });
      }
    }

    // ✅ Handle sort order only if changed
    let finalSortOrder = subcategory.sortOrder;
    if (sortOrder !== undefined && sortOrder !== subcategory.sortOrder) {
      try {
        finalSortOrder = await handleSortOrder(Subcategory, sortOrder);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Invalid sort order'
        });
      }
    }

    const slug = createSlug(name || subcategory.name);

    // 📝 Update fields
    if (name) subcategory.name = name;
    if (description) subcategory.description = description;
    if (icon !== undefined) subcategory.icon = icon;
    if (image !== undefined) subcategory.image = image;
    if (isActive !== undefined) subcategory.isActive = isActive;
    if (metaTitle !== undefined) subcategory.metaTitle = metaTitle;
    if (metaDescription !== undefined) subcategory.metaDescription = metaDescription;

    subcategory.sortOrder = finalSortOrder;
    subcategory.slug = slug;
    subcategory.updatedBy = req.user._id;

    await subcategory.save();

    const updatedSubcategory = await Subcategory.findById(id)
      .populate('category', 'name slug')
      .populate('createdBy', 'username firstName lastName')
      .populate('updatedBy', 'username firstName lastName');

    res.json({
      success: true,
      message: 'Subcategory updated successfully',
      data: { subcategory: updatedSubcategory }
    });
  } catch (error) {
    console.error('Update subcategory error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


  // Delete subcategory
  exports.deleteSubcategory = async (req, res) =>  {
    try {
      const { id } = req.body;

      const subcategory = await Subcategory.findById(id);
      if (!subcategory) {
        return res.status(404).json({
          success: false,
          message: 'Subcategory not found'
        });
      }

      // Check if subcategory has reviews
      const reviewsCount = await Review.countDocuments({ subcategory: id });
      if (reviewsCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete subcategory with existing reviews'
        });
      }

      await Subcategory.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Subcategory deleted successfully'
      });
    } catch (error) {
      console.error('Delete subcategory error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get subcategory stats
  exports.getSubcategoryStats = async (req, res) => {
    try {
      const totalSubcategories = await Subcategory.countDocuments();
      const activeSubcategories = await Subcategory.countDocuments({ isActive: true });
      const inactiveSubcategories = await Subcategory.countDocuments({ isActive: false });

      // Subcategories by category
      const subcategoriesByCategory = await Subcategory.aggregate([
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

      // Subcategories with most reviews
      const subcategoriesWithReviews = await Subcategory.aggregate([
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'subcategory',
            as: 'reviews'
          }
        },
        {
          $project: {
            name: 1,
            reviewsCount: { $size: '$reviews' }
          }
        },
        {
          $sort: { reviewsCount: -1 }
        },
        {
          $limit: 5
        }
      ]);

      res.json({
        success: true,
        data: {
          totalSubcategories,
          activeSubcategories,
          inactiveSubcategories,
          subcategoriesByCategory,
          subcategoriesWithReviews
        }
      });
    } catch (error) {
      console.error('Get subcategory stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }


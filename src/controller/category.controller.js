const Category = require('../models/categoryModel');
const Subcategory = require('../models/subcategoryModel');
const Review = require('../models/reviewModel');
const TechNewsModel = require("../models/techNews.Model")
const staticPageModel = require("../models/staticPageModel")
const { validationResult } = require('express-validator');
const { getEnumValues,handleSortOrder,createSlug } = require('../utils/helpers');
const { checkSimilarCategoryAI ,generateMetaForEntity,checkGroupIntentAI,checkCategoryNameQualityAI} = require("../utils/aiHelpher");
const {checkUsage} = require("../utils/checkUsageHelper")

 // Get all categories

exports.getAllCategories = async (req, res) => {
    try {
      const page = parseInt(req.body.page) || 1;
      const limit = parseInt(req.body.limit) || 10;
      const skip = (page - 1) * limit;
      const includeInactive = req.body.includeInactive === 'true';
      const search = req.body.search || '';

      // Build query
      let query = {};
      if (!includeInactive) {
        query.isActive = true;
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const categories = await Category.find(query)
        .populate('createdBy', 'username firstName lastName')
        .populate('updatedBy', 'username firstName lastName')
        .populate('subcategoriesCount')
        .populate('reviewsCount')
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Category.countDocuments(query);

      res.json({
        success: true,
        data: {
          categories,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalCategories: total,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
}

// Get all categories with their subcategories
exports.getCategoryWithSubcategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .select('name slug icon image color')
      .lean();

    const subcategories = await Subcategory.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .select('name slug category')
      .lean();

    const grouped = categories.map(cat => ({
      ...cat,
      subcategories: subcategories.filter(sub => String(sub.category) === String(cat._id))
    }));

    res.json({
      success: true,
      data: grouped
    });
  } catch (error) {
    console.error('Error fetching grouped categories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


 // Get category by ID or slug

exports.getCategoryById = async (req, res) => {
    try {
      const { id } = req.body;
      let category;

      // Check if it's an ObjectId or slug
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        category = await Category.findById(id);
      } else {
        category = await Category.findOne({ slug: id });
      }

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      await category.populate([
        { path: 'createdBy', select: 'username firstName lastName' },
        { path: 'updatedBy', select: 'username firstName lastName' },
        { path: 'subcategoriesCount' },
        { path: 'reviewsCount' }
      ]);

      res.json({
        success: true,
        data: { category }
      });
    } catch (error) {
      console.error('Get category by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
}

 // Create new category

exports.createCategory = async (req, res) => {
  try {
    // 1️⃣ Basic validation (from express-validator)
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
      icon,
      image,
      color,
      sortOrder,
      metaTitle,
      metaDescription,
      group
    } = req.body;

    // 2️⃣ AI Validation: Spelling / Typos / Quality of Name
    const nameQualityCheck = await checkCategoryNameQualityAI(name);
    if (!nameQualityCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: `Invalid category name: ${nameQualityCheck.reason}`
      });
    }

    // 3️⃣ AI Validation: Group Intent Check (does name match selected group?)
    const allGroups = getEnumValues(Category, 'group');
    const groupCheck = await checkGroupIntentAI(name, group, allGroups);
    if (!groupCheck.isCorrectGroup) {
      return res.status(400).json({
        success: false,
        message: `Selected group "${group}" may be incorrect for category "${name}". Suggested: "${groupCheck.suggestedGroup}".`
      });
    }

    // 4️⃣ AI Validation: Duplicate Name Check (within same group)
    const categories = await Category.find().select("name group -_id");
    const aiCheck = await checkSimilarCategoryAI(name, categories, group);
    if (aiCheck.isDuplicate) {
      return res.status(400).json({
        success: false,
        message: `Similar category name "${aiCheck.similarName}" already exists in this group. Please choose a more unique name.`
      });
    }

    // 5️⃣ Sort order validation and handling
    let finalSortOrder;
    try {
      finalSortOrder = await handleSortOrder(Category, sortOrder);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Invalid sort order'
      });
    }

    // 6️⃣ Slug generation
    const slug = createSlug(name);

    // 7️⃣ Save category
    const category = new Category({
      name,
      slug,
      description,
      icon,
      image,
      color,
      sortOrder: finalSortOrder,
      metaTitle,
      metaDescription,
      group,
      createdBy: req.user?._id
    });

    await category.save();

    const populatedCategory = await Category.findById(category._id)
      .populate('createdBy', 'username firstName lastName');

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category: populatedCategory }
    });

  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


// generte meta title and description for category
exports.generateMetaForCategory = async (req, res) => {
  try {
    const { name, group,type } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: Name'
      });
    }
    const aiData = await generateMetaForEntity(type, name, group);
    if (!aiData || !aiData.metaTitle) {
      return res.status(500).json({ success: false, message: 'Failed to generate AI meta content' });
    }
    res.status(200).json({
      success: true,
      message: 'AI meta content generated successfully',
      data: aiData
    });
  } catch (error) {
    console.error('💥 AI Meta Generation Error:', error?.response?.data || error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error while generating AI meta',
      error: error?.message || 'Unexpected error occurred'
    });
  } 
}


// Update category

exports.updateCategory = async (req, res) => {
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
      id,
      name,
      description,
      icon,
      image,
      color,
      group,
      isActive,
      sortOrder,
      metaTitle,
      metaDescription
    } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const nameQualityCheck = await checkCategoryNameQualityAI(name);
    if (!nameQualityCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: `Invalid category name: ${nameQualityCheck.reason}`
      });
    }

    // ✅ Check for similar name (exclude self)
    if (name && name !== category.name) {
      const categories = await Category.find({ _id: { $ne: id } }).select("name");
      const aiCheck = await checkSimilarCategoryAI(name, categories);
      if (aiCheck.isDuplicate) {
        return res.status(400).json({
          success: false,
          message: `Similar category name "${aiCheck.similarName}" already exists. Please choose a more unique name.`
        });
      }
    }

    // ✅ Handle sortOrder (only if changed)
    let finalSortOrder = category.sortOrder;

    if (sortOrder !== undefined && sortOrder !== category.sortOrder) {
      try {
        finalSortOrder = await handleSortOrder(Category, sortOrder);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Invalid sort order'
        });
      }
    }

    const slug = createSlug(name);

    // ✅ Update values
    category.name = name;
    category.slug = slug;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (image !== undefined) category.image = image;
    if (color !== undefined) category.color = color;
    if (group !== undefined) category.group = group;
    if (isActive !== undefined) category.isActive = isActive;
    if (metaTitle !== undefined) category.metaTitle = metaTitle;
    if (metaDescription !== undefined) category.metaDescription = metaDescription;
    category.sortOrder = finalSortOrder;
    category.updatedBy = req.user._id;

    await category.save();

    const updatedCategory = await Category.findById(id)
      .populate('createdBy', 'username firstName lastName')
      .populate('updatedBy', 'username firstName lastName');

    return res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category: updatedCategory }
    });

  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


// Delete category

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const usage = await checkUsage('Category', id);

    if (usage.isUsed) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is currently: ${usage.message}`,
        dependencies: usage.dependencies
      });
    }

    await Category.findByIdAndDelete(id);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get category stats

exports.getCategoryStats = async (req, res) => {
    try {
      const totalCategories = await Category.countDocuments();
      const activeCategories = await Category.countDocuments({ isActive: true });
      const inactiveCategories = await Category.countDocuments({ isActive: false });

      // Categories with most subcategories
      const categoriesWithSubcategories = await Category.aggregate([
        {
          $lookup: {
            from: 'subcategories',
            localField: '_id',
            foreignField: 'category',
            as: 'subcategories'
          }
        },
        {
          $project: {
            name: 1,
            subcategoriesCount: { $size: '$subcategories' }
          }
        },
        {
          $sort: { subcategoriesCount: -1 }
        },
        {
          $limit: 5
        }
      ]);

      // Categories with most reviews
      const categoriesWithReviews = await Category.aggregate([
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'category',
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
          totalCategories,
          activeCategories,
          inactiveCategories,
          categoriesWithSubcategories,
          categoriesWithReviews
        }
      });
    } catch (error) {
      console.error('Get category stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
}

exports.getGroupEnums = async (req, res) => {
  try {
    const groupEnums = getEnumValues(Category, 'group');
    res.status(200).json({
      success: true,
      data: groupEnums
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get group enums'
    });
  }
};

exports.getGroupedCategories = async (req, res) => {
  try {
    const groupedData = await Category.aggregate([
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

    res.json({
      success: true,
      data: groupedData
    });
  } catch (error) {
    console.error('Error in aggregation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

exports.getFullMenuStructure = async (req, res) => {
  try {
    // Step 1: Group → Categories → Subcategories
    const groupedCategories = await Category.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'subcategories',
          localField: '_id',
          foreignField: 'category',
          as: 'subcategories'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          icon: 1,
          image: 1,
          color: 1,
          group: 1,
          sortOrder: 1,
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
      },
      { $sort: { sortOrder: 1 } },
      {
        $group: {
          _id: '$group',
          categories: { $push: '$$ROOT' }
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

    // Step 2: Static Pages (like About, Privacy, etc.)
    const staticPages = await staticPageModel
      .find({ isPublished: true, showInMenu: true })
      .select('title slug pageType sortOrder')
      .sort({ sortOrder: 1 });

    // Step 3: Latest 4 Tech News for specific groups separately
    const targetGroups = ['News', 'AI Zone', 'Government Tech'];
    
    // Get latest 4 records for each group separately using aggregation
    const latestNewsByGroup = {};
    
    for (const group of targetGroups) {
      const latestNews = await TechNewsModel.aggregate([
        {
          $match: {
            status: 'published'
          }
        },
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
          $match: {
            'categoryInfo.group': group,
            'categoryInfo.isActive': true
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'authorInfo'
          }
        },
        {
          $unwind: '$authorInfo'
        },
        {
          $project: {
            title: 1,
            slug: 1,
            excerpt: 1,
            featuredImage: 1,
            publishedAt: 1,
            viewCount: 1,
            category: {
              _id: '$categoryInfo._id',
              name: '$categoryInfo.name',
              slug: '$categoryInfo.slug'
            },
            author: {
              _id: '$authorInfo._id',
              name: '$authorInfo.name'
            }
          }
        },
        {
          $sort: { publishedAt: -1 }
        },
        {
          $limit: 4
        }
      ]);
      
      latestNewsByGroup[group] = latestNews;
    }

    return res.json({
      success: true,
      data: {
        groups: groupedCategories,
        pages: staticPages,
        latestNewsByGroup: latestNewsByGroup
      }
    });

  } catch (err) {
    console.error('Error building menu structure:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};




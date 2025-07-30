const ReviewModel = require('../models/reviewModel');
const Category = require('../models/categoryModel');
const Subcategory = require('../models/subcategoryModel');
const TechNewsModel = require("../models/techNews.Model")


  // Get all reviews
exports.getLatestBannerPosts = async (req, res) => {
  try {
    const latestTech = await TechNewsModel.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('featuredImage title slug  excerpt author updatedBy publishedAt createdAt')
      .populate('category', 'group name ');

    const latestReviews = await ReviewModel.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('featuredImage title slug  excerpt author updatedBy publishedAt createdAt')
      .populate('category', 'group  name ');

    const allPosts = [...latestTech, ...latestReviews]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);

    res.json({statuscode:200, success: true, data: allPosts });
  } catch (err) {
    console.error('Latest banner posts error:', err);
    res.status(500).json({ statuscode:500, success: false, message: 'Internal server error' });
  }
};

exports.getGroupPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const typeFilter = req.query.type ? req.query.type.split(',') : null;
    
    // Get all active categories with their groups
    const categoryQuery = { isActive: true };
    if (typeFilter) {
      categoryQuery.group = { $in: typeFilter };
    }
    
    const categories = await Category.find(categoryQuery)
      .sort({ sortOrder: 1, name: 1 })
      .populate('createdBy', 'name email')
      .lean();

    // Group categories by their group field
    const groupedCategories = categories.reduce((acc, category) => {
      if (!acc[category.group]) {
        acc[category.group] = [];
      }
      acc[category.group].push(category);
      return acc;
    }, {});

    const data = {};
    const pagination = {};

    // Process each group
    for (const [groupName, groupCategories] of Object.entries(groupedCategories)) {
      const categoryIds = groupCategories.map(cat => cat._id);
      let records = [];
      let totalCount = 0;

      // Group-based model mapping
      if (groupName === 'Reviews') {
        // Only Reviews group fetches from Review model
        totalCount = await ReviewModel.countDocuments({
          category: { $in: categoryIds },
          status: 'published'
        });

        records = await ReviewModel.find({
          category: { $in: categoryIds },
          status: 'published'
        })
        .populate('category', 'name slug group')
        .populate('subcategory', 'name slug')
        .populate('author', 'name email')
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

        // Add type identifier
        records = records.map(record => ({
          ...record,
          type: 'review'
        }));

      } else if (groupName === 'Comparisons') {
        // Skip Comparisons for now as model is not implemented
        // TODO: Implement when Comparison model is ready
        // totalCount = await Comparison.countDocuments({
        //   category: { $in: categoryIds },
        //   status: 'published'
        // });
        // records = await Comparison.find({...}).populate(...).sort({...}).skip(...).limit(...).lean();
        
        data[groupName] = [];
        pagination[groupName] = {
          currentPage: page,
          totalPages: 0,
          totalRecords: 0,
          hasNext: false,
          hasPrev: false,
          limit,
          message: 'Comparison model not implemented yet'
        };
        continue;

      } else {
        // All other groups (News, Blog, AI Zone, Government Tech, Legal, Static, Other) 
        // fetch from TechNews model
        totalCount = await TechNewsModel.countDocuments({
          category: { $in: categoryIds },
          status: 'published'
        });

        records = await TechNewsModel.find({
          category: { $in: categoryIds },
          status: 'published'
        })
        .populate('category', 'name slug group')
        .populate('subcategory', 'name slug')
        .populate('author', 'name email')
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

        // Add type identifier
        records = records.map(record => ({
          ...record,
          type: 'news'
        }));
      }

      data[groupName] = records;
      
      // Calculate pagination for this group (skip if already set for Comparisons)
      if (!pagination[groupName]) {
        const totalPages = Math.ceil(totalCount / limit);
        pagination[groupName] = {
          currentPage: page,
          totalPages,
          totalRecords: totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          limit
        };
      }
    }

    res.status(200).json({
      success: true,
      statuscode:200,
      data,
      pagination,
      meta: {
        page,
        limit,
        typeFilter: typeFilter || 'all',
        totalGroups: Object.keys(data).length
      }
    });

  } catch (error) {
    console.error('Error fetching group-based data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


exports.getGroupedPosts  = async (req, res) => {
  let page = 1;
  let limit = 10;
   const skip = (page - 1) * limit;

    try {
        const techNewsPipeline = [
            { $match: { status: 'published' } },
            { $sort: { publishedAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'categories', // Mongoose usually pluralizes model names for collection names
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: '$category' },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    slug: 1,
                    excerpt: 1,
                    featuredImage: 1,
                    publishedAt: 1,
                    category: { name: '$category.name', slug: '$category.slug' },
                    type: { $literal: 'techNews' } // Add a type field
                }
            }
        ];

        const reviewPipeline = [
            { $match: { status: 'published' } },
            { $sort: { publishedAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: '$category' },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    slug: 1,
                    excerpt: 1,
                    featuredImage: 1,
                    publishedAt: 1,
                    category: { name: '$category.name', slug: '$category.slug' },
                    productName: 1,
                    brand: 1,
                    model: 1,
                    overallRating: 1,
                    type: { $literal: 'review' } // Add a type field
                }
            }
        ];

        const [techNewsCount, techNewsResults] = await Promise.all([
            TechNewsModel.countDocuments({ status: 'published' }),
            TechNewsModel.aggregate(techNewsPipeline)
        ]);

        const [reviewCount, reviewResults] = await Promise.all([
            ReviewModel.countDocuments({ status: 'published' }),
            ReviewModel.aggregate(reviewPipeline)
        ]);

        res.json({
        success: true,
        data: {
          techNews: {
                total: techNewsCount,
                page: page,
                limit: limit,
                data: techNewsResults
            },
            reviews: {
                total: reviewCount,
                page: page,
                limit: limit,
                data: reviewResults
            }
        },
   
      });


    } catch (error) {
        console.error('Error fetching grouped posts:', error);
        throw error;
    }
};


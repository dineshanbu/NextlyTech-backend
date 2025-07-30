const fs = require('fs');
const Media = require('../models/mediaModel');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const Subcategory = require('../models/subcategoryModel');
const Category = require('../models/categoryModel');
const { createSlug,extractUsageFromFieldName,
  extractMediaTypeFromFieldName,
  getMediaType
 } = require('../utils/helpers');

exports.uploadMedia = async (req, res) => {
  try {
      const { usage, category, subcategory, titleSlug, tags } = req.body;
      
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No files uploaded' 
        });
      }

      // Validate category and subcategory
      const [catDoc, subDoc] = await Promise.all([
        Category.findById(category).select('name'),
        Subcategory.findById(subcategory).select('name')
      ]);

      if (!catDoc || !subDoc) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid category or subcategory' 
        });
      }

      const uploadedMedia = [];
      const errors = [];

      // Process all uploaded files
      for (const [fieldName, files] of Object.entries(req.files)) {
        const usageType = extractUsageFromFieldName(fieldName);
        const mediaType = extractMediaTypeFromFieldName(fieldName);
        
        for (const file of files) {
          try {
            const result = await uploadToCloudinary(file.path, `uploads/${usageType}`);
            
            // Clean up local file
            fs.unlinkSync(file.path);

            const slug = createSlug(titleSlug || file.originalname);
            
            const mediaData = {
              url: result.secure_url,
              public_id: result.public_id,
              filename: file.filename,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              width: result.width,
              height: result.height,
              duration: result.duration,
              format: result.format,
              usage: usageType,
              type: getMediaType(file.mimetype),
              category,
              subcategory,
              titleSlug: slug,
              tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
              //uploadedBy: req.user._id
              uploadedBy:'685fa12ee7fc532d78d2522a'
            };

            const media = await Media.create(mediaData);
            uploadedMedia.push(media);
            
          } catch (error) {
            errors.push({
              filename: file.originalname,
              error: error.message
            });
            
            // Clean up local file even on error
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          }
        }
      }

      res.status(201).json({
        success: true,
        statuscode:200,
        message: `${uploadedMedia.length} files uploaded successfully`,
        data: uploadedMedia,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (err) {
      console.error('Upload error:', err);
      
      // Clean up any remaining files
      if (req.files) {
        for (const files of Object.values(req.files)) {
          for (const file of files) {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          }
        }
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Upload failed', 
        error: err.message 
      });
    }
};

exports.getAllMedia = async (req, res) => {
  try {
      const {
        page = 1,
        limit = 20,
        usage,
        type,
        category,
        subcategory,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        isActive = true
      } = req.query;

      const skip = (page - 1) * limit;
      const filter = { isActive };

      // Add filters
      if (usage) filter.usage = usage;
      if (type) filter.type = type;
      if (category) filter.category = category;
      if (subcategory) filter.subcategory = subcategory;
      
      // Search functionality
      if (search) {
        filter.$or = [
          { originalName: { $regex: search, $options: 'i' } },
          { titleSlug: { $regex: search, $options: 'i' } },
          { alt: { $regex: search, $options: 'i' } },
          { caption: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [mediaList, totalCount] = await Promise.all([
        Media.find(filter)
          .populate('category', 'name')
          .populate('subcategory', 'name')
          .populate('uploadedBy', 'name email')
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit)),
        Media.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: mediaList,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });

    } catch (err) {
      console.error('Get media error:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch media',
        error: err.message 
      });
    }
};

exports.getMediaById = async (req, res) => {
    try {
      const media = await Media.findById(req.body.id)
        .populate('category', 'name')
        .populate('subcategory', 'name')
        .populate('uploadedBy', 'name email');

      if (!media) {
        return res.status(404).json({ 
          success: false, 
          message: 'Media not found' 
        });
      }

      res.json({ success: true, data: media });
    } catch (err) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch media',
        error: err.message 
      });
    }
}

exports.updateMedia = async (req, res) => {
    try {
      const { alt, caption, tags, titleSlug } = req.body;
      const updates = {};

      if (alt !== undefined) updates.alt = alt;
      if (caption !== undefined) updates.caption = caption;
      if (tags !== undefined) updates.tags = tags.split(',').map(tag => tag.trim());
      if (titleSlug !== undefined) updates.titleSlug = createSlug(titleSlug);

      const media = await Media.findByIdAndUpdate(
        req.body.id,
        updates,
        { new: true, runValidators: true }
      );

      if (!media) {
        return res.status(404).json({ 
          success: false, 
          message: 'Media not found' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Media updated successfully',
        data: media 
      });
    } catch (err) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update media',
        error: err.message 
      });
    }
}

exports.deleteMedia = async (req, res) => {
    try {
      const media = await Media.findById(req.body.id);
      
      if (!media) {
        return res.status(404).json({ 
          success: false, 
          message: 'Media not found' 
        });
      }

      // Check if media is being used
      if (media.usedIn && media.usedIn.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete media that is currently being used in content' 
        });
      }

      // Delete from Cloudinary
      await deleteFromCloudinary(media.public_id);
      
      // Delete from database
      await Media.findByIdAndDelete(req.params.id);

      res.json({ 
        statuscode:200,
        success: true, 
        message: 'Media deleted successfully' 
      });
    } catch (err) {
      console.error('Delete error:', err);
      res.status(500).json({ 
        success: false, 
         statuscode:500,
        message: 'Failed to delete media',
        error: err.message 
      });
    }
};

exports.bulkDeleteMedia = async (req, res) => {
    try {
      const { mediaIds } = req.body;
      
      if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Media IDs array is required' 
        });
      }

      const mediaList = await Media.find({ _id: { $in: mediaIds } });
      const deletePromises = [];
      const errors = [];

      for (const media of mediaList) {
        if (media.usedIn && media.usedIn.length > 0) {
          errors.push({
            id: media._id,
            filename: media.originalName,
            error: 'Media is currently being used in content'
          });
          continue;
        }

        deletePromises.push(
          deleteFromCloudinary(media.public_id)
            .then(() => Media.findByIdAndDelete(media._id))
            .catch(err => {
              errors.push({
                id: media._id,
                filename: media.originalName,
                error: err.message
              });
            })
        );
      }

      await Promise.all(deletePromises);

      res.json({
        success: true,
        message: `${mediaList.length - errors.length} media files deleted successfully`,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (err) {
      res.status(500).json({ 
        success: false, 
        message: 'Bulk delete failed',
        error: err.message 
      });
    }
}

exports.getCategoriesGroupSimple = async (req, res) => {
  try {
    const { usage, type, isActive = true } = req.query;
    
    // Build match conditions
    const matchConditions = { isActive };
    if (usage) matchConditions.usage = usage;
    if (type) matchConditions.type = type;

    // Get all categories with their media
    const categoriesWithMedia = await Media.aggregate([
      {
        $match: matchConditions
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
        $group: {
          _id: {
            categoryId: '$category',
            categoryName: '$categoryInfo.name'
          },
          mediaCount: { $sum: 1 },
          media: {
            $push: {
              _id: '$_id',
              url: '$url',
              filename: '$filename',
              originalName: '$originalName',
              mimeType: '$mimeType',
              size: '$size',
              width: '$width',
              height: '$height',
              duration: '$duration',
              format: '$format',
              usage: '$usage',
              type: '$type',
              titleSlug: '$titleSlug',
              alt: '$alt',
              caption: '$caption',
              tags: '$tags',
              createdAt: '$createdAt'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          categoryId: '$_id.categoryId',
          categoryName: '$_id.categoryName',
          mediaCount: 1,
          media: 1
        }
      },
      {
        $sort: { categoryName: 1 }
      }
    ]);

    // Get total count of all media
    const totalMediaCount = await Media.countDocuments(matchConditions);

    // Create response with "All" category first
    const response = [
      {
        categoryId: 'all',
        categoryName: 'All',
        mediaCount: totalMediaCount,
        media: [] // We don't include all media here to avoid large response
      },
      ...categoriesWithMedia
    ];

    res.json({
      success: true,
      data: response,
      totalCategories: categoriesWithMedia.length + 1, // +1 for "All"
      totalMediaCount: totalMediaCount
    });

  } catch (err) {
    console.error('Get categories group simple error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories group',
      error: err.message
    });
  }
};

// Get media by specific category or all
exports.getMediaByCategory = async (req, res) => {
  try {
    const {
      categoryId,
      page = 1,
      limit = 20,
      usage,
      type,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive = true
    } = req.body;

    const skip = (page - 1) * limit;
    const filter = { isActive };

    // Add category filter only if not "all"
    if (categoryId && categoryId !== 'all') {
      filter.category = categoryId;
    }
    
    // Optional filters
    if (usage) filter.usage = usage;
    if (type) filter.type = type;
    
    // Search functionality
    if (search) {
      filter.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { titleSlug: { $regex: search, $options: 'i' } },
        { alt: { $regex: search, $options: 'i' } },
        { caption: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [mediaList, totalCount] = await Promise.all([
      Media.find(filter)
        .populate('category', 'name')
        .populate('uploadedBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Media.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: mediaList,
      statuscode:200,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (err) {
    console.error('Get media by category error:', err);
    res.status(500).json({
      statuscode:500,
      success: false,
      message: 'Failed to fetch media by category',
      error: err.message
    });
  }
};

// Get categories with count only (no media objects)
exports.getCategoriesCountOnly = async (req, res) => {
  try {
    const { usage, type, isActive = true } = req.query;
    
    const matchConditions = { isActive };
    if (usage) matchConditions.usage = usage;
    if (type) matchConditions.type = type;

    const categoriesCount = await Media.aggregate([
      {
        $match: matchConditions
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
        $group: {
          _id: {
            categoryId: '$category',
            categoryName: '$categoryInfo.name'
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          categoryId: '$_id.categoryId',
          categoryName: '$_id.categoryName',
          count: 1
        }
      },
      {
        $sort: { categoryName: 1 }
      }
    ]);

    // Get total count
    const totalCount = await Media.countDocuments(matchConditions);

    // Add "All" category at the beginning
    const response = [
      {
        categoryId: 'all',
        categoryName: 'All',
        count: totalCount
      },
      ...categoriesCount
    ];

    res.json({
      statuscode:200,
      success: true,
      data: response,
      totalCategories: categoriesCount.length + 1
    });

  } catch (err) {
    console.error('Get categories count error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories count',
      error: err.message
    });
  }
};


const Comment = require('../models/commentsModel');
const TechNews = require('../models/techNews.Model');
const Review = require('../models/reviewModel');
const { validationResult } = require('express-validator');


// Get comments for a review or tech news

exports.getComments = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const reviewId = req.query.reviewId;
      const techNewsId = req.query.techNewsId;
      const parentCommentId = req.query.parentCommentId;
      const includeHidden = req.query.includeHidden === 'true';

      // Build query
      let query = {};
      
      if (reviewId) {
        query.review = reviewId;
      } else if (techNewsId) {
        query.techNews = techNewsId;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Either reviewId or techNewsId is required'
        });
      }

      if (parentCommentId) {
        query.parentComment = parentCommentId;
      } else {
        query.parentComment = null;
      }

      if (!includeHidden) {
        query.isHidden = false;
        query.isApproved = true;
      }

      const comments = await Comment.find(query)
        .populate('author', 'username firstName lastName avatar')
        .populate('moderatedBy', 'username firstName lastName')
        .populate('repliesCount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Comment.countDocuments(query);

      res.json({
        success: true,
        data: {
          comments,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalComments: total,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
}

 // Get comment by ID

exports.getCommentById = async (req, res) => {
    try {
      const { id } = req.params;

      const comment = await Comment.findById(id)
        .populate('author', 'username firstName lastName avatar')
        .populate('review', 'title slug')
        .populate('techNews', 'title slug')
        .populate('parentComment', 'content author')
        .populate('moderatedBy', 'username firstName lastName')
        .populate('repliesCount');

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      res.json({
        success: true,
        data: { comment }
      });
    } catch (error) {
      console.error('Get comment by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
}

 // Create new comment

exports.createComment = async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { content, reviewId, techNewsId, parentCommentId } = req.body;

      // Validate that either reviewId or techNewsId is provided
      if (!reviewId && !techNewsId) {
        return res.status(400).json({
          success: false,
          message: 'Either reviewId or techNewsId is required'
        });
      }

      if (reviewId && techNewsId) {
        return res.status(400).json({
          success: false,
          message: 'Comment cannot be associated with both review and tech news'
        });
      }

      // Verify the parent exists
      if (reviewId) {
        const review = await Review.findById(reviewId);
        if (!review) {
          return res.status(400).json({
            success: false,
            message: 'Review not found'
          });
        }
      }

      if (techNewsId) {
        const techNews = await TechNews.findById(techNewsId);
        if (!techNews) {
          return res.status(400).json({
            success: false,
            message: 'Tech news not found'
          });
        }
      }

      // Verify parent comment if provided
      if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        if (!parentComment) {
          return res.status(400).json({
            success: false,
            message: 'Parent comment not found'
          });
        }

        // Ensure parent comment belongs to the same review/tech news
        if (reviewId && parentComment.review?.toString() !== reviewId) {
          return res.status(400).json({
            success: false,
            message: 'Parent comment does not belong to the specified review'
          });
        }

        if (techNewsId && parentComment.techNews?.toString() !== techNewsId) {
          return res.status(400).json({
            success: false,
            message: 'Parent comment does not belong to the specified tech news'
          });
        }
      }

      const comment = new Comment({
        content,
        author: req.user.userId,
        review: reviewId || null,
        techNews: techNewsId || null,
        parentComment: parentCommentId || null
      });

      await comment.save();

      const populatedComment = await Comment.findById(comment._id)
        .populate('author', 'username firstName lastName avatar')
        .populate('review', 'title slug')
        .populate('techNews', 'title slug')
        .populate('parentComment', 'content author');

      res.status(201).json({
        success: true,
        message: 'Comment created successfully',
        data: { comment: populatedComment }
      });
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
}

// Update comment

exports.updateComment = async (req, res) => {
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
      const { content } = req.body;

      const comment = await Comment.findById(id);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check if user can edit this comment
      if (comment.author.toString() !== req.user.userId && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to edit this comment'
        });
      }

      comment.content = content;
      await comment.save();

      const updatedComment = await Comment.findById(id)
        .populate('author', 'username firstName lastName avatar')
        .populate('review', 'title slug')
        .populate('techNews', 'title slug')
        .populate('parentComment', 'content author');

      res.json({
        success: true,
        message: 'Comment updated successfully',
        data: { comment: updatedComment }
      });
    } catch (error) {
      console.error('Update comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
}


// Delete comment

exports.deleteComment = async (req, res) => {
    try {
      const { id } = req.params;

      const comment = await Comment.findById(id);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      // Check if user can delete this comment
      if (comment.author.toString() !== req.user.userId && !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this comment'
        });
      }

      // Delete all replies first
      await Comment.deleteMany({ parentComment: id });

      await Comment.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
}

  // Moderate comment (Admin/Moderator only)

exports.moderateComment = async (req, res) => {
    try {
      const { id } = req.params;
      const { action, reason } = req.body; // action: 'approve', 'hide', 'show'

      const comment = await Comment.findById(id);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: 'Comment not found'
        });
      }

      switch (action) {
        case 'approve':
          comment.isApproved = true;
          comment.isHidden = false;
          break;
        case 'hide':
          comment.isHidden = true;
          comment.hiddenReason = reason;
          break;
        case 'show':
          comment.isHidden = false;
          comment.hiddenReason = null;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid moderation action'
          });
      }

      comment.moderatedBy = req.user.userId;
      comment.moderatedAt = new Date();

      await comment.save();

      const moderatedComment = await Comment.findById(id)
        .populate('author', 'username firstName lastName avatar')
        .populate('moderatedBy', 'username firstName lastName');

      res.json({
        success: true,
        message: `Comment ${action}d successfully`,
        data: { comment: moderatedComment }
      });
    } catch (error) {
      console.error('Moderate comment error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
}

  // Get comment replies

exports.getCommentReplies = async (req, res) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const replies = await Comment.find({ parentComment: id })
        .populate('author', 'username firstName lastName avatar')
        .populate('moderatedBy', 'username firstName lastName')
        .populate('repliesCount')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit);

      const total = await Comment.countDocuments({ parentComment: id });

      res.json({
        success: true,
        data: {
          replies,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalReplies: total,
            hasNext: page < Math.ceil(total / limit),
            hasPrev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Get comment replies error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
}

  // Get comment replies

exports.getCommentStats = async (req, res) => {
    try {
      const totalComments = await Comment.countDocuments();
      const approvedComments = await Comment.countDocuments({ isApproved: true });
      const hiddenComments = await Comment.countDocuments({ isHidden: true });
      const recentComments = await Comment.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      });

      // Comments by content type
      const reviewComments = await Comment.countDocuments({ review: { $ne: null } });
      const techNewsComments = await Comment.countDocuments({ techNews: { $ne: null } });

      // Top commenters
      const topCommenters = await Comment.aggregate([
        {
          $group: {
            _id: '$author',
            commentCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $unwind: '$userInfo'
        },
        {
          $project: {
            username: '$userInfo.username',
            fullName: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
            commentCount: 1
          }
        },
        {
          $sort: { commentCount: -1 }
        },
        {
          $limit: 5
        }
      ]);

      res.json({
        success: true,
        data: {
          totalComments,
          approvedComments,
          hiddenComments,
          recentComments,
          reviewComments,
          techNewsComments,
          topCommenters
        }
      });
    } catch (error) {
      console.error('Get comment stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
}



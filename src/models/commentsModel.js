const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    minlength: [1, 'Comment cannot be empty'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment author is required']
  },
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    default: null
  },
  techNews: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TechNews',
    default: null
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  likesCount: {
    type: Number,
    default: 0
  },
  dislikesCount: {
    type: Number,
    default: 0
  },
  reportCount: {
    type: Number,
    default: 0
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  hiddenReason: {
    type: String,
    maxlength: [200, 'Hidden reason cannot exceed 200 characters']
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  moderatedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for replies count
commentSchema.virtual('repliesCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  count: true
});

// Index for performance
commentSchema.index({ review: 1, createdAt: -1 });
commentSchema.index({ techNews: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1, createdAt: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ isApproved: 1, isHidden: 1 });

// Validation: Comment must belong to either review or tech news, but not both
commentSchema.pre('save', function(next) {
  if (!this.review && !this.techNews) {
    return next(new Error('Comment must be associated with either a review or tech news'));
  }
  if (this.review && this.techNews) {
    return next(new Error('Comment cannot be associated with both review and tech news'));
  }
  
  // Set edit timestamp if content is modified after creation
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  
  next();
});

module.exports = mongoose.model('Comment', commentSchema);

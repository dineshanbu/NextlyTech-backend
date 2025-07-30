const mongoose = require('mongoose');

const techNewsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'News title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  content: {
    type: String,
    required: [true, 'News content is required'],
    minlength: [100, 'Content must be at least 100 characters']
  },
  excerpt: {
    type: String,
    required: [true, 'News excerpt is required'],
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
    category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategory'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  featuredImage: {
    url: {
      type: String,
      required: [true, 'Featured image is required']
    },
    alt: {
      type: String,
      required: [true, 'Featured image alt text is required']
    },
    caption: String
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      required: true
    },
    caption: String
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: {
    type: Date,
    default: null
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isBreaking: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  source: {
    name: String,
    url: String
  },
  viewCount: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
  },
  likesCount: {
    type: Number,
    default: 0
  },
  metaTitle: {
    type: String,
    maxlength: [150, 'Meta title cannot exceed 150 characters']
  },
  metaDescription: {
    type: String,
    maxlength: [300, 'Meta description cannot exceed 300 characters']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for comments count
techNewsSchema.virtual('commentsCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'techNews',
  count: true
});

// Virtual for reading time estimate
// techNewsSchema.virtual('readingTime').get(function() {
//   const wordsPerMinute = 200;
//   const wordCount = this.content.split(/\s+/).length;
//   return Math.ceil(wordCount / wordsPerMinute);
// });

// Index for performance and search
techNewsSchema.index({ slug: 1 });
techNewsSchema.index({ status: 1, publishedAt: -1 });
techNewsSchema.index({ category: 1, publishedAt: -1 });
techNewsSchema.index({ isFeatured: 1, publishedAt: -1 });
techNewsSchema.index({ isBreaking: 1, publishedAt: -1 });
techNewsSchema.index({ priority: -1, publishedAt: -1 });
techNewsSchema.index({ tags: 1 });
techNewsSchema.index({ 
  title: 'text', 
  content: 'text', 
  excerpt: 'text' 
});

// Pre-save middleware to generate slug


module.exports = mongoose.model('TechNews', techNewsSchema);

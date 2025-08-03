const mongoose = require('mongoose');
const comparisonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Comparison title is required'],
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
    required: [true, 'Comparison content is required'],
    minlength: [100, 'Content must be at least 100 characters']
  },
  excerpt: {
    type: String,
    required: [true, 'Comparison excerpt is required'],
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategory',
    required: [true, 'Subcategory is required']
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    required: true
  }],
  winner: {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
      required: true
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500
    }
  },
  conclusion: {
    type: String,
    required: [true, 'Conclusion is required'],
    minlength: [100, 'Conclusion must be at least 100 characters'],
    maxlength: [1000, 'Conclusion cannot exceed 1000 characters']
  },
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
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
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
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
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

// Validation: Must have 2-5 products
comparisonSchema.path('products').validate(function(products) {
  return products.length >= 2 && products.length <= 5;
}, 'Comparison must have between 2 and 5 products');

// Validation: Winner must be one of the compared products
comparisonSchema.pre('save', function(next) {
  const productIds = this.products.map(p => p.toString());
  if (!productIds.includes(this.winner.productId.toString())) {
    return next(new Error('Winner must be one of the compared products'));
  }
  next();
});

// Virtual for comments count
comparisonSchema.virtual('commentsCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'comparison',
  count: true
});



// Indexes for performance and search
comparisonSchema.index({ slug: 1 });
comparisonSchema.index({ category: 1, subcategory: 1 });
comparisonSchema.index({ status: 1, publishedAt: -1 });
comparisonSchema.index({ isFeatured: 1, publishedAt: -1 });
comparisonSchema.index({ priority: -1, publishedAt: -1 });
comparisonSchema.index({ tags: 1 });
comparisonSchema.index({ 
  title: 'text', 
  content: 'text', 
  excerpt: 'text' 
});

module.exports = mongoose.model('Comparison', comparisonSchema);
const mongoose = require('mongoose');

const specificationSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

const prosConsSchema = new mongoose.Schema({
  pros: [{
    type: String,
    trim: true
  }],
  cons: [{
    type: String,
    trim: true
  }]
}, { _id: false });

const ratingSchema = new mongoose.Schema({
  design: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  performance: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  battery: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  camera: {
    type: Number,
    min: 1,
    max: 10,
    default: null
  },
  display: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  valueForMoney: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  }
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Review title is required'],
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
    required: [true, 'Review content is required'],
    minlength: [100, 'Content must be at least 100 characters']
  },
  excerpt: {
    type: String,
    required: [true, 'Review excerpt is required'],
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
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [150, 'Product name cannot exceed 150 characters']
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    maxlength: [100, 'Brand cannot exceed 100 characters']
  },
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true,
    maxlength: [100, 'Model cannot exceed 100 characters']
  },
  price: {
    original: {
      type: Number,
      required: [true, 'Original price is required'],
      min: [0, 'Price cannot be negative']
    },
    current: {
      type: Number,
      required: [true, 'Current price is required'],
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR', 'GBP']
    }
  },
  images: [{
    url: {
      type: String,
      required: false
    },
    alt: {
      type: String,
      required: false
    },
    caption: String
  }],
  featuredImage: {
    url: {
      type: String,
      required: [false, 'Featured image is required']
    },
    alt: {
      type: String,
      required: [false, 'Featured image alt text is required']
    }
  },
  specifications: [specificationSchema],
  ratings: {
    type: ratingSchema,
    required: true
  },
  overallRating: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  prosAndCons: prosConsSchema,
  verdict: {
    type: String,
    required: [true, 'Verdict is required'],
    minlength: [50, 'Verdict must be at least 50 characters'],
    maxlength: [500, 'Verdict cannot exceed 500 characters']
  },
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
  viewCount: {
    type: Number,
    default: 0
  },
  likesCount: {
    type: Number,
    default: 0
  },
  shareCount: {
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
reviewSchema.virtual('commentsCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'review',
  count: true
});

// Virtual for reading time estimate
// reviewSchema.virtual('readingTime').get(function() {
//   const wordsPerMinute = 200;
//   const wordCount = this.content.split(/\s+/).length;
//   return Math.ceil(wordCount / wordsPerMinute);
// });

// Index for performance and search
reviewSchema.index({ slug: 1 });
reviewSchema.index({ category: 1, subcategory: 1 });
reviewSchema.index({ status: 1, publishedAt: -1 });
reviewSchema.index({ isFeatured: 1, publishedAt: -1 });
reviewSchema.index({ brand: 1, model: 1 });
reviewSchema.index({ tags: 1 });
reviewSchema.index({ 
  title: 'text', 
  content: 'text', 
  productName: 'text', 
  brand: 'text', 
  model: 'text' 
});



module.exports = mongoose.model('Review', reviewSchema);

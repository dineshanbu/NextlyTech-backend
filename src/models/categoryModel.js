const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
 group: {
  type: String,
  required: [true, 'Group is required'],
   enum: ['Reviews', 'Comparisons', 'News', 'Static', 'Blog', 'AI Zone', 'Government Tech', 'Legal', 'Other'],
},
  description: {
    type: String,
    required: [true, 'Category description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  icon: {
    type: String,
    default: null
  },
  image: {
    type: String,
    default: null
  },
  color: {
    type: String,
    default: '#000000',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Virtual for subcategories count
categorySchema.virtual('subcategoriesCount', {
  ref: 'Subcategory',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Virtual for reviews count
categorySchema.virtual('reviewsCount', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Index for performance
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1, sortOrder: 1 });

// Pre-save middleware to generate slug
// categorySchema.pre('save', function(next) {
//   if (this.isModified('name')) {
//     this.slug = this.name
//       .toLowerCase()
//       .replace(/[^a-z0-9\s-]/g, '')
//       .trim()
//       .replace(/\s+/g, '-');
//   }
//   next();
// });

module.exports = mongoose.model('Category', categorySchema);

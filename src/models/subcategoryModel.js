const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subcategory name is required'],
    trim: true,
    maxlength: [100, 'Subcategory name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Subcategory description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Parent category is required']
  },
  icon: {
    type: String,
    default: null
  },
  image: {
    type: String,
    default: null
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

// Virtual for reviews count
subcategorySchema.virtual('reviewsCount', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'subcategory',
  count: true
});

// Compound index for uniqueness within category
subcategorySchema.index({ category: 1, slug: 1 }, { unique: true });
subcategorySchema.index({ category: 1, isActive: 1, sortOrder: 1 });

// Pre-save middleware to generate slug
// subcategorySchema.pre('save', function(next) {
//   if (this.isModified('name')) {
//     this.slug = this.name
//       .toLowerCase()
//       .replace(/[^a-z0-9\s-]/g, '')
//       .trim()
//       .replace(/\s+/g, '-');
//   }
//   next();
// });

module.exports = mongoose.model('Subcategory', subcategorySchema);

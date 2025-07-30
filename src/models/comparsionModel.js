const mongoose = require('mongoose');

const metricSchema = new mongoose.Schema({
  label: { type: String, required: true },
  productAValue: { type: String, required: true },
  productBValue: { type: String, required: true },
  better: {
    type: String,
    enum: ['productA', 'productB', 'equal'],
    required: true
  }
}, { _id: false });

const comparisonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Comparison title is required'],
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  productA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    required: true
  },
  productB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review',
    required: true
  },
  metrics: [metricSchema],
  totalPoints: {
    productA: { type: Number, default: 0 },
    productB: { type: Number, default: 0 }
  },
  winner: {
    type: String,
    enum: ['productA', 'productB', 'tie'],
    default: 'tie'
  },
  summary: {
    type: String,
    maxlength: 500
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roles: [{
    type: String,
    enum: ['admin', 'editor', 'moderator'],
    default: 'editor'
  }],
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
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

comparisonSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

module.exports = mongoose.model('Comparison', comparisonSchema);

const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    index: true
  },
  public_id: {
    type: String,
    required: true,
    unique: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: String,
  mimeType: String,
  size: Number,
  width: Number,
  height: Number,
  duration: Number, // for videos
  format: String,
  usage: {
    type: String,
    required: true,
    enum: ['review', 'tech-news', 'blog', 'comparison'],
    index: true
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true,
    index: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    index: true
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategory',
    index: true
  },
  titleSlug: {
    type: String,
    index: true
  },
  alt: String,
  caption: String,
  tags: [String],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usedIn: [{
    contentType: {
      type: String,
      enum: ['review', 'tech-news', 'blog', 'comparison']
    },
    contentId: mongoose.Schema.Types.ObjectId,
    usageType: {
      type: String,
      enum: ['featured', 'gallery', 'inline']
    }
  }]
}, {
  timestamps: true
});

// Add indexes for better query performance
mediaSchema.index({ usage: 1, type: 1, isActive: 1 });
mediaSchema.index({ category: 1, subcategory: 1 });
mediaSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Media', mediaSchema);
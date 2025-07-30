const mongoose = require('mongoose');

const staticPageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Page title is required'],
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
    required: [true, 'Page content is required']
  },
  excerpt: {
    type: String,
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
  pageType: {
    type: String,
    required: [true, 'Page type is required'],
    enum: [
      'about-us',
      'contact-us',
      'privacy-policy',
      'terms-of-service',
      'disclaimer',
      'cookie-policy',
      'faq',
      'careers',
      'advertise-with-us',
      'editorial-guidelines',
      'other'
    ]
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  showInFooter: {
    type: Boolean,
    default: true
  },
  showInMenu: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  featuredImage: {
    url: String,
    alt: String
  },
  metaTitle: {
    type: String,
    maxlength: [150, 'Meta title cannot exceed 150 characters']
  },
  metaDescription: {
    type: String,
    maxlength: [300, 'Meta description cannot exceed 300 characters']
  },
  lastReviewedAt: {
    type: Date,
    default: null
  },
  contactInfo: {
    email: {
      type: String,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    socialMedia: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String,
      youtube: String
    }
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
  timestamps: true
});

// Index for performance
staticPageSchema.index({ slug: 1 });
staticPageSchema.index({ pageType: 1 });
staticPageSchema.index({ isPublished: 1, sortOrder: 1 });



// Static method to create default pages
staticPageSchema.statics.createDefaultPages = async function() {
  const defaultPages = [
    {
      title: 'About Us',
      pageType: 'about-us',
      content: 'Learn more about our tech review platform and our mission to provide comprehensive technology reviews.',
      showInFooter: true,
      showInMenu: true
    },
    {
      title: 'Contact Us',
      pageType: 'contact-us',
      content: 'Get in touch with our team for any questions or suggestions.',
      showInFooter: true,
      showInMenu: true
    },
    {
      title: 'Privacy Policy',
      pageType: 'privacy-policy',
      content: 'Our privacy policy outlines how we collect, use, and protect your personal information.',
      showInFooter: true
    },
    {
      title: 'Terms of Service',
      pageType: 'terms-of-service',
      content: 'Terms and conditions for using our tech review platform.',
      showInFooter: true
    },
    {
      title: 'Disclaimer',
      pageType: 'disclaimer',
      content: 'Important disclaimers regarding our reviews and recommendations.',
      showInFooter: true
    }
  ];

  for (const pageData of defaultPages) {
    const existingPage = await this.findOne({ pageType: pageData.pageType });
    if (!existingPage) {
      // Need to set a default createdBy user ID
      pageData.createdBy = new mongoose.Types.ObjectId();
      pageData.slug = pageData.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
      await this.create(pageData);
    }
  }
};

module.exports = mongoose.model('StaticPage', staticPageSchema);

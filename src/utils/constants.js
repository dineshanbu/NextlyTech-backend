// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// User Roles
const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  REVIEWER: 'REVIEWER',
  USER: 'USER'
};

// Review Status
const REVIEW_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

// Tech News Categories
const TECH_NEWS_CATEGORIES = {
  LATEST: 'latest',
  LAUNCH_EVENTS: 'launch-events',
  STARTUPS: 'startups',
  AI_GADGETS: 'ai-gadgets',
  AI_NEWS: 'ai-news',
  DIGITAL_INDIA: 'digital-india',
  POLICIES: 'policies',
  SCHEMES: 'schemes',
  MOBILE_NEWS: 'mobile-news',
  LAPTOP_NEWS: 'laptop-news',
  SMARTWATCH_NEWS: 'smartwatch-news',
  TABLET_NEWS: 'tablet-news',
  GENERAL: 'general'
};

// Static Page Types
const STATIC_PAGE_TYPES = {
  ABOUT_US: 'about-us',
  CONTACT_US: 'contact-us',
  PRIVACY_POLICY: 'privacy-policy',
  TERMS_OF_SERVICE: 'terms-of-service',
  DISCLAIMER: 'disclaimer',
  COOKIE_POLICY: 'cookie-policy',
  FAQ: 'faq',
  CAREERS: 'careers',
  ADVERTISE_WITH_US: 'advertise-with-us',
  EDITORIAL_GUIDELINES: 'editorial-guidelines',
  OTHER: 'other'
};

// Permission Actions
const PERMISSION_ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  PUBLISH: 'publish',
  MODERATE: 'moderate'
};

// Permission Resources
const PERMISSION_RESOURCES = {
  USERS: 'users',
  CATEGORIES: 'categories',
  SUBCATEGORIES: 'subcategories',
  REVIEWS: 'reviews',
  COMMENTS: 'comments',
  TECH_NEWS: 'tech-news',
  STATIC_PAGES: 'static-pages',
  ALL: 'all'
};

// Supported Currencies
const CURRENCIES = {
  INR: 'INR',
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP'
};

// Rating Categories
const RATING_CATEGORIES = {
  DESIGN: 'design',
  PERFORMANCE: 'performance',
  BATTERY: 'battery',
  CAMERA: 'camera',
  DISPLAY: 'display',
  VALUE_FOR_MONEY: 'valueForMoney'
};

// File Upload Limits
const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_COUNT: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400 // 24 hours
};

// Regular Expressions
const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,30}$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  SLUG: /^[a-z0-9-]+$/,
  MONGODB_OBJECTID: /^[0-9a-fA-F]{24}$/
};

// Default Meta Values
const DEFAULT_META = {
  TITLE_SUFFIX: ' | Tech Review Platform',
  DESCRIPTION: 'Comprehensive technology reviews and news platform',
  KEYWORDS: 'technology, reviews, mobile, laptop, smartwatch, tablet, tech news',
  AUTHOR: 'Tech Review Platform',
  VIEWPORT: 'width=device-width, initial-scale=1.0'
};

// Error Messages
const ERROR_MESSAGES = {
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  ALREADY_EXISTS: 'Resource already exists',
  INTERNAL_ERROR: 'Internal server error',
  INVALID_CREDENTIALS: 'Invalid credentials',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid token',
  DATABASE_ERROR: 'Database connection error',
  FILE_TOO_LARGE: 'File size too large',
  INVALID_FILE_TYPE: 'Invalid file type',
  PERMISSION_DENIED: 'Permission denied'
};

// Success Messages
const SUCCESS_MESSAGES = {
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTER_SUCCESS: 'Registration successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  EMAIL_SENT: 'Email sent successfully',
  FILE_UPLOADED: 'File uploaded successfully'
};

// Content Status
const CONTENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  PENDING_REVIEW: 'pending-review',
  REJECTED: 'rejected'
};

// Comment Status
const COMMENT_STATUS = {
  APPROVED: 'approved',
  PENDING: 'pending',
  HIDDEN: 'hidden',
  SPAM: 'spam'
};

// Sort Orders
const SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc',
  ASCENDING: 1,
  DESCENDING: -1
};

// Date Formats
const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.sssZ',
  DATE_ONLY: 'YYYY-MM-DD',
  HUMAN_READABLE: 'MMMM Do YYYY',
  WITH_TIME: 'MMMM Do YYYY, h:mm:ss a'
};

// Environment Types
const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
  STAGING: 'staging'
};

// API Rate Limits (requests per window)
const RATE_LIMITS = {
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // 5 requests per window
  },
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requests per window
  },
  PUBLIC: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200 // 200 requests per window
  }
};

module.exports = {
  HTTP_STATUS,
  USER_ROLES,
  REVIEW_STATUS,
  TECH_NEWS_CATEGORIES,
  STATIC_PAGE_TYPES,
  PERMISSION_ACTIONS,
  PERMISSION_RESOURCES,
  CURRENCIES,
  RATING_CATEGORIES,
  FILE_UPLOAD,
  PAGINATION,
  CACHE_TTL,
  REGEX,
  DEFAULT_META,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CONTENT_STATUS,
  COMMENT_STATUS,
  SORT_ORDERS,
  DATE_FORMATS,
  ENVIRONMENTS,
  RATE_LIMITS
};

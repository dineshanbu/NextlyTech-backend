const { body, param, query } = require('express-validator');

// User validation
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must not exceed 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must not exceed 50 characters')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateUpdateProfile = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must not exceed 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must not exceed 50 characters'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

const validateCreateUser = [
  ...validateRegister,
  body('roleId')
    .isMongoId()
    .withMessage('Valid role ID is required'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters')
];

const validateUpdateUser = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must not exceed 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must not exceed 50 characters'),
  body('roleId')
    .optional()
    .isMongoId()
    .withMessage('Valid role ID is required'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Category validation
const validateCreateCategory = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name is required and must not exceed 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description is required and must not exceed 500 characters'),
  // body('color')
  //   .optional()
  //   .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
  //   .withMessage('Color must be a valid hex color'),
  // body('sortOrder')
  //   .optional()
  //   .isInt({ min: 0 })
  //   .withMessage('Sort order must be a non-negative integer'),
  body('metaTitle')
    .optional()
    .isLength({ max: 150 })
    .withMessage('Meta title must not exceed 150 characters'),
  body('metaDescription')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Meta description must not exceed 300 characters')
];

const validateUpdateCategory = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must not exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  // body('color')
  //   .optional()
  //   .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
  //   .withMessage('Color must be a valid hex color'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  body('metaTitle')
    .optional()
    .isLength({ max: 150 })
    .withMessage('Meta title must not exceed 150 characters'),
  body('metaDescription')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Meta description must not exceed 300 characters')
];

// Subcategory validation
const validateCreateSubcategory = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Subcategory name is required and must not exceed 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description is required and must not exceed 500 characters'),
  body('categoryId')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  // body('sortOrder')
  //   .optional()
  //   .isInt({ min: 0 })
  //   .withMessage('Sort order must be a non-negative integer'),
  body('metaTitle')
    .optional()
    .isLength({ max: 150 })
    .withMessage('Meta title must not exceed 150 characters'),
  body('metaDescription')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Meta description must not exceed 300 characters')
];

const validateUpdateSubcategory = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Subcategory name must not exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('categoryId')
    .optional()
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  // body('sortOrder')
  //   .optional()
  //   .isInt({ min: 0 })
  //   .withMessage('Sort order must be a non-negative integer'),
  body('metaTitle')
    .optional()
    .isLength({ max: 150 })
    .withMessage('Meta title must not exceed 150 characters'),
  body('metaDescription')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Meta description must not exceed 300 characters')
];

// Review validation
const validateCreateReview = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Review title is required and must not exceed 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 100 })
    .withMessage('Review content is required and must be at least 100 characters'),
  body('excerpt')
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Excerpt is required and must not exceed 300 characters'),
  body('categoryId')
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('subcategoryId')
    .isMongoId()
    .withMessage('Valid subcategory ID is required'),
  body('productName')
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('Product name is required and must not exceed 150 characters'),
  body('brand')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Brand is required and must not exceed 100 characters'),
  body('model')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Model is required and must not exceed 100 characters'),
  body('price.original')
    .isFloat({ min: 0 })
    .withMessage('Original price must be a positive number'),
  body('price.current')
    .isFloat({ min: 0 })
    .withMessage('Current price must be a positive number'),
  body('featuredImage.url')
    .isURL()
    .withMessage('Featured image URL is required and must be valid'),
  body('featuredImage.alt')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Featured image alt text is required'),
  body('ratings.design')
    .isFloat({ min: 1, max: 10 })
    .withMessage('Design rating must be between 1 and 10'),
  body('ratings.performance')
    .isFloat({ min: 1, max: 10 })
    .withMessage('Performance rating must be between 1 and 10'),
  body('ratings.battery')
    .isFloat({ min: 1, max: 10 })
    .withMessage('Battery rating must be between 1 and 10'),
  body('ratings.display')
    .isFloat({ min: 1, max: 10 })
    .withMessage('Display rating must be between 1 and 10'),
  body('ratings.valueForMoney')
    .isFloat({ min: 1, max: 10 })
    .withMessage('Value for money rating must be between 1 and 10'),
  body('verdict')
    .trim()
    .isLength({ min: 50, max: 500 })
    .withMessage('Verdict is required and must be between 50 and 500 characters')
];

const validateUpdateReview = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Review title must not exceed 200 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 100 })
    .withMessage('Review content must be at least 100 characters'),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Excerpt must not exceed 300 characters'),
  body('categoryId')
    .optional()
    .isMongoId()
    .withMessage('Valid category ID is required'),
  body('subcategoryId')
    .optional()
    .isMongoId()
    .withMessage('Valid subcategory ID is required'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean value')
];

// Comment validation
const validateCreateComment = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content is required and must not exceed 1000 characters'),
  body('reviewId')
    .optional()
    .isMongoId()
    .withMessage('Valid review ID is required'),
  body('techNewsId')
    .optional()
    .isMongoId()
    .withMessage('Valid tech news ID is required'),
  body('parentCommentId')
    .optional()
    .isMongoId()
    .withMessage('Valid parent comment ID is required')
];

const validateUpdateComment = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content is required and must not exceed 1000 characters')
];

const validateModerateComment = [
  body('action')
    .isIn(['approve', 'hide', 'show'])
    .withMessage('Action must be approve, hide, or show'),
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Reason must not exceed 200 characters')
];

// Tech News validation
const validateCreateTechNews = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('News title is required and must not exceed 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 100 })
    .withMessage('News content is required and must be at least 100 characters'),
  body('excerpt')
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Excerpt is required and must not exceed 300 characters'),
  // body('category')
  //   .isIn([
  //     'latest', 'launch-events', 'startups', 'ai-gadgets', 'ai-news',
  //     'digital-india', 'policies', 'schemes', 'mobile-news', 'laptop-news',
  //     'smartwatch-news', 'tablet-news', 'general'
  //   ])
  //   .withMessage('Invalid news category'),
  body('featuredImage.url')
    .isURL()
    .withMessage('Featured image URL is required and must be valid'),
  body('featuredImage.alt')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Featured image alt text is required'),
  body('priority')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Priority must be between 0 and 10')
];

const validateUpdateTechNews = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('News title must not exceed 200 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 100 })
    .withMessage('News content must be at least 100 characters'),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Excerpt must not exceed 300 characters'),
  body('category')
    .optional()
    .isIn([
      'latest', 'launch-events', 'startups', 'ai-gadgets', 'ai-news',
      'digital-india', 'policies', 'schemes', 'mobile-news', 'laptop-news',
      'smartwatch-news', 'tablet-news', 'general'
    ])
    .withMessage('Invalid news category'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('isFeatured must be a boolean value'),
  body('isBreaking')
    .optional()
    .isBoolean()
    .withMessage('isBreaking must be a boolean value')
];

// Static Page validation
const validateCreateStaticPage = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Page title is required and must not exceed 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Page content is required'),
  body('pageType')
    .isIn([
      'about-us', 'contact-us', 'privacy-policy', 'terms-of-service',
      'disclaimer', 'cookie-policy', 'faq', 'careers', 'advertise-with-us',
      'editorial-guidelines', 'other'
    ])
    .withMessage('Invalid page type'),
  body('excerpt')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Excerpt must not exceed 300 characters'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
];

const validateUpdateStaticPage = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Page title must not exceed 200 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Page content is required'),
  body('pageType')
    .optional()
    .isIn([
      'about-us', 'contact-us', 'privacy-policy', 'terms-of-service',
      'disclaimer', 'cookie-policy', 'faq', 'careers', 'advertise-with-us',
      'editorial-guidelines', 'other'
    ])
    .withMessage('Invalid page type'),
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean value'),
  body('showInFooter')
    .optional()
    .isBoolean()
    .withMessage('showInFooter must be a boolean value'),
  body('showInMenu')
    .optional()
    .isBoolean()
    .withMessage('showInMenu must be a boolean value')
];

const validateCreateAdmin = [
  body('username').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'REVIEWER']),
];

const validateComparison = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 100 })
    .withMessage('Content must be at least 100 characters'),
  
  body('excerpt')
    .notEmpty()
    .withMessage('Excerpt is required')
    .isLength({ max: 300 })
    .withMessage('Excerpt cannot exceed 300 characters'),
  
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Invalid category ID'),
  
  body('subcategory')
    .notEmpty()
    .withMessage('Subcategory is required')
    .isMongoId()
    .withMessage('Invalid subcategory ID'),
  
  
  body('products')
    .isArray({ min: 2, max: 5 })
    .withMessage('Must have between 2 and 5 products to compare'),
  
  body('products.*.productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  body('winner.productId')
    .isMongoId()
    .withMessage('Invalid winner product ID'),
  
  body('winner.reason')
    .notEmpty()
    .withMessage('Winner reason is required'),
  
  body('conclusion')
    .notEmpty()
    .withMessage('Conclusion is required')
    .isLength({ min: 100, max: 1000 })
    .withMessage('Conclusion must be between 100 and 1000 characters'),
];

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateCreateUser,
  validateUpdateUser,
  validateCreateCategory,
  validateUpdateCategory,
  validateCreateSubcategory,
  validateUpdateSubcategory,
  validateCreateReview,
  validateUpdateReview,
  validateCreateComment,
  validateUpdateComment,
  validateModerateComment,
  validateCreateTechNews,
  validateUpdateTechNews,
  validateCreateStaticPage,
  validateUpdateStaticPage,
  validateCreateAdmin,
  validateComparison
};

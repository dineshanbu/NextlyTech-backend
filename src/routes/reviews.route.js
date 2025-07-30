const express = require('express');
const { validateCreateReview, validateUpdateReview } = require('../middleware/validation');
const { auth, checkPermission } = require('../middleware/auth');

const router = express.Router();
const {
  getAllReviews,
  getTrendingReviews,
  getFeaturedReviews,
  getReviewStats,
  getReviewById,
  createReview,
  updateReview,
  deleteReview
} = require('../controller/review.controller');

// GET routes
router.route('/getAllReviews').post(getAllReviews);  // Changed from '/getAllReviews'
router.route('/trending').get(getTrendingReviews);
router.route('/featured').get(getFeaturedReviews);
router.route('/stats').get(getReviewStats);
router.route('/getReviewById').post(getReviewById);  // Changed from '/getReviewById'

// Protected routes
router.use(auth);
// POST/PUT/DELETE routes
router.route('/createReview').post(
  checkPermission('reviews', 'create'), 
  validateCreateReview,
  createReview
);  // Changed from GET '/create' to POST '/'

router.route('/update').post(
  checkPermission('reviews', 'update'), 
  validateUpdateReview,
  updateReview
);  // Changed from POST '/updateReview' to PUT '/:id'

router.route('/deleteReview').post(
  checkPermission('reviews', 'delete'), 
  deleteReview
);  // Changed from POST '/deleteReview' to DELETE '/:id'

module.exports = router;
const express = require('express');
const { validateCreateTechNews, validateUpdateTechNews } = require('../middleware/validation');
const { auth, checkPermission } = require('../middleware/auth');

const router = express.Router();
const {
  getAllTechNews,
  getTrendingTechNews,
  getFeaturedTechNews,
  getBreakingNews,
  getTechNewsStats,
  getTechNewsById,
  getTechNewsByCategory,
  createTechNews,
  updateTechNews,
  deleteTechNews,
} = require('../controller/techNews.controller');


// Apply auth middleware to all routes
router.use(auth);
// GET routes (read operations)
router.route('/getAllTechNews').post(getAllTechNews);  // Changed from '/getAllTechNews'
router.route('/trending').get(getTrendingTechNews);
router.route('/featured').get(getFeaturedTechNews);
router.route('/breaking').get(getBreakingNews);
router.route('/stats').get(getTechNewsStats);
router.route('/category/:categoryId').get(getTechNewsByCategory);  // Changed to use parameter
router.route('/getTechNewsById').post(getTechNewsById);  // Changed from '/getTechNewsById'



// POST/PUT/DELETE routes (write operations)
router.route('/createTechNews').post(
  checkPermission('tech-news', 'create'),
  validateCreateTechNews,
  createTechNews
);  // Changed from '/createTechNews'

router.route('/updateTechNews').post(
  checkPermission('tech-news', 'update'),
  validateUpdateTechNews,
  updateTechNews
);  // Changed from POST '/updateTechNews' to PUT '/:id'

router.route('/deleteTechNews').post(
  checkPermission('tech-news', 'delete'),
  deleteTechNews
);  // Changed from POST '/deleteTechNews' to DELETE '/:id'

module.exports = router;
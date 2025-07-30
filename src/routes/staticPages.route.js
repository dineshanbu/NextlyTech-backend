const express = require('express');
const { validateCreateStaticPage, validateUpdateStaticPage } = require('../middleware/validation');
const { auth, checkPermission } = require('../middleware/auth');

const router = express.Router();
const {
  getAllStaticPages,
  getFooterPages,
  getMenuPages,
  getStaticPageStats,
  getStaticPageByType,
  getStaticPageById,
  createStaticPage,
  updateStaticPage,
  deleteStaticPage,
  previewStaticPageAI
} = require('../controller/staticpage.controller');



// GET routes
router.route('/getAllStaticPages').post(getAllStaticPages);  // Changed from '/getAllStaticPages'
router.route('/previewStaticPageAI').post(previewStaticPageAI);
router.route('/footer').get(getFooterPages);
router.route('/menu').get(getMenuPages);
router.route('/stats').get(getStaticPageStats);
router.route('/type/:type').get(getStaticPageByType);  // Changed from '/type/getStaticPageByType'
router.route('/getStaticPageById').post(getStaticPageById);  // Changed from '/getStaticPageById'


// Protected routes
router.use(auth);
// POST/PUT/DELETE routes
router.route('/createPage').post(
  checkPermission('static-pages', 'create'),
  validateCreateStaticPage,
  createStaticPage
);  // Changed from '/createStaticPage'

router.route('/update').post(
  checkPermission('static-pages', 'update'),
  validateUpdateStaticPage,
  updateStaticPage
);  // Changed from '/updateStaticPage'

router.route('/delete').post(
  checkPermission('static-pages', 'delete'),
  deleteStaticPage
);  // Changed from POST '/deleteStaticPage' to DELETE '/:id'

module.exports = router;
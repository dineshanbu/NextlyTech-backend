const express = require('express');
const { validateCreateSubcategory, validateUpdateSubcategory } = require('../middleware/validation');
const { auth, checkPermission } = require('../middleware/auth');

const router = express.Router();
const {
  getAllSubcategories,
  getSubcategoryStats,
  getSubcategoriesByCategory,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} = require('../controller/subcategory.controller');


// GET routes
router.route('/getList').post(getAllSubcategories);  // Changed from '/getAllSubcategories'
router.route('/stats').get(getSubcategoryStats);
router.route('/category/:categoryId').get(getSubcategoriesByCategory);  // Changed to use parameter
router.route('/getListById').post(getSubcategoryById);  // Changed from '/getSubcategoryById'


// Protected routes
router.use(auth);

// POST/PUT/DELETE routes
router.route('/create').post(
  checkPermission('subcategories', 'create'),
  validateCreateSubcategory,
  createSubcategory
);

router.route('/update').post(  // Changed from POST to PUT
  checkPermission('subcategories', 'update'),
  validateUpdateSubcategory,
  updateSubcategory
);  // Changed from '/updateSubcategory'

router.route('/delete').post(  // Changed from POST to DELETE
  checkPermission('subcategories', 'delete'),
  deleteSubcategory
);  // Changed from '/deleteSubcategory'

module.exports = router;
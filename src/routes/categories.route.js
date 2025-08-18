const express = require('express');
const { validateCreateCategory, validateUpdateCategory } = require('../middleware/validation');
const { auth, checkPermission } = require('../middleware/auth');

const router = express.Router();
const {
  getAllCategories,
  getCategoryStats,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryWithSubcategories,
  getGroupEnums,
  generateMetaForCategory,
  getGroupedCategories,
  getFullMenuStructure
} = require('../controller/category.controller');

  // This applies to all routes below
router.use(auth);
router.route('/getGroupedCategories').get(getGroupedCategories);
router.route('/getFullMenuStructure').get(getFullMenuStructure);
router.route('/getAllCategories').post(getAllCategories);
router.route('/generateMetaForCategory').post(generateMetaForCategory);
router.route('/stats').get(getCategoryStats);
router.route('/getGroupEnums').get(getGroupEnums);
router.route('/getCategoryWithSubcategories').get(getCategoryWithSubcategories);
router.route('/getCategoryById').post(getCategoryById);  // Changed to use parameter

router.route('/createCategory').post(checkPermission('categories', 'create'), validateCreateCategory, createCategory);
router.route('/updateCategory').post(checkPermission('categories', 'update'), validateUpdateCategory, updateCategory);
router.route('/deleteCategory').post(checkPermission('categories', 'delete'), deleteCategory);



module.exports = router;

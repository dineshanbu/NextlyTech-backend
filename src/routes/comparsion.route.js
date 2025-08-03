const express = require('express');
const { validateComparison } = require('../middleware/validation');
const { auth, checkPermission } = require('../middleware/auth');

const router = express.Router();
const {
  getComparisons,
  getComparisonById,
  createComparison,
  updateComparison,
  deleteComparison,
  getFeaturedComparisons,
  getComparisonsByCategory,
  searchComparisons
} = require('../controller/comparsion.controller');

// This applies to all routes below

// Public routes (read-only)
router.use(auth); 

router.route('/add').post(checkPermission('comparsion', 'create'), validateComparison, createComparison);
router.route('/updateComparison').post(checkPermission('comparsion', 'update'), validateComparison, updateComparison);
router.route('/deleteComparison').post(checkPermission('comparsion', 'delete'), validateComparison,deleteComparison);
router.route('/getComparisons').post(checkPermission('comparsion', 'moderate'), validateComparison, getComparisons);

router.route('/getComparisonById').post(checkPermission('comparsion', 'delete'), validateComparison,getComparisonById);
router.route('/getFeaturedComparisons').post(checkPermission('comparsion', 'moderate'), validateComparison, getFeaturedComparisons);

router.route('/getComparisonsByCategory').post(checkPermission('comparsion', 'delete'), validateComparison,getComparisonsByCategory);
router.route('/searchComparisons').post(checkPermission('comparsion', 'moderate'), validateComparison, searchComparisons);

module.exports = router;
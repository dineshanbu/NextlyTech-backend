const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();
const {
  getLatestBannerPosts,
  getGroupPosts,
  getGroupedPosts,

} = require('../controller/home.controller');

// This applies to all routes below

// Public routes (read-only)
router.use(auth); 
router.route('/getLatestBannerPosts').get(getLatestBannerPosts);
router.route('/getGroupPosts').get(getGroupPosts);
router.route('/getGroupedPosts').get(getGroupedPosts);

 



module.exports = router;
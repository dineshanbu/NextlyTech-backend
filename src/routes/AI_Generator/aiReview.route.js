const express = require('express');
const { auth, checkPermission } = require('../../middleware/auth');

const router = express.Router();
const {
  generateFullAIReview,
  generateFullTechNews
} = require('../../controller/AI_Generator/aiReview.controller');


// router.use(auth);
router.route('/generateFullAIReview').post(generateFullAIReview);
router.route('/generateFullTechNews').post(generateFullTechNews);



module.exports = router;

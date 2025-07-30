const express = require('express');
const { auth, checkPermission } = require('../../middleware/auth');

const router = express.Router();
const {
  generateFullAIReview,

} = require('../../controller/AI_Generator/aiReview.controller');


// router.use(auth);
router.route('/generateFullAIReview').post(generateFullAIReview);




module.exports = router;

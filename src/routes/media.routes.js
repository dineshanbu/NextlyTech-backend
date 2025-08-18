const express = require('express');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const upload = require('../utils/multer');

const router = express.Router();
const {
     uploadMedia, getAllMedia, deleteMedia,getMediaById,updateMedia,bulkDeleteMedia,
     getMediaByCategory,
     getCategoriesCountOnly
} = require('../controller/media.controller');


  // This applies to all routes below
// router.use(auth);
router.use(auth); 
router.route('/upload').post(upload, uploadMedia);
router.route('/getAllMedia').get(getAllMedia);
router.route('/getMediaById').post(getMediaById);
router.route('/updateMedia').post(updateMedia);
router.route('/deleteMedia').post(deleteMedia);
router.route('/bulk-delete').post(bulkDeleteMedia);

router.route('/getMediaByCategory').post(getMediaByCategory);
router.route('/getCategoriesCountOnly').post(getCategoriesCountOnly);

module.exports = router;

const express = require('express');
const { validateCreateComment, validateUpdateComment, validateModerateComment } = require('../middleware/validation');
const { auth, checkPermission } = require('../middleware/auth');

const router = express.Router();
const {
  getComments,
  getCommentStats,
  getCommentById,
  getCommentReplies,
  createComment,
  updateComment,
  deleteComment,
  moderateComment
} = require('../controller/comment.controller');

// This applies to all routes below

// Public routes (read-only)
router.use(auth);  
router.route('/').get(getComments);
router.route('/stats').get(getCommentStats);
router.route('/:id').get(getCommentById);
router.route('/:id/replies').get(getCommentReplies);


router.route('/').post(checkPermission('comments', 'create'), validateCreateComment, createComment);
router.route('/:id').put(checkPermission('comments', 'update'), validateUpdateComment, updateComment);
router.route('/:id').delete(checkPermission('comments', 'delete'), deleteComment);
router.route('/:id/moderate').post(checkPermission('comments', 'moderate'), validateModerateComment, moderateComment);

module.exports = router;
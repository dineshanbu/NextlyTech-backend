const express = require('express');
const router = express.Router();

const { validateCreateUser, validateUpdateUser } = require('../middleware/validation');
const { auth, checkPermission } = require('../middleware/auth');

const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  appConfig
} = require('../controller/user.controller');
router.route('/appConfig').get( appConfig);
router.use(auth);
// Protected routes (all below require auth)
router.route('/getAllUsers')
  .post(checkPermission('users', 'read'), getAllUsers);

router.route('/getUserById').post(checkPermission('users', 'read'), getUserById)
router.route('/createUser').post(checkPermission('users', 'create'), validateCreateUser, createUser);


router.route('/getUserById').get(checkPermission('users', 'read'), getUserById)
router.route('/updateUser').post( checkPermission('users', 'update'), validateUpdateUser, updateUser)
router.route('/deleteUser').post(checkPermission('users', 'delete'), deleteUser);


router.route('/stats')
  .get(checkPermission('users', 'read'), getUserStats);

module.exports = router;

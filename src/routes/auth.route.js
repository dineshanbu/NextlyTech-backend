const express = require('express');
const { validateRegister, validateLogin, validateUpdateProfile, validateChangePassword,validateCreateAdmin } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

const router = express.Router();
const {
  newRegister,
  login,
  profile,
  updateProfile,
  changePassword,
  logout,
  createAccount
} = require('../controller/authccontroller');

// Public routes
router.route('/logout').get(auth,logout);
router.route('/register').post(validateRegister,newRegister);
router.route('/login').post(validateLogin,login);
router.route('/profile').get(auth,profile);
router.route('/updateProfile').post(auth, validateUpdateProfile, updateProfile);
router.route('/change-password').post(auth, validateChangePassword,changePassword);


// super admin
router.route('/admin/create-account').post(auth, validateCreateAdmin, createAccount);


module.exports = router;

const express = require('express');
const { register, login, googleLogin, changePassword, verifyPassword, deleteAccount, contact, forgotPassword, verifyOtp, resetPassword, sendOtp, changePasswordVerified } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/change-password', protect, changePassword);
router.post('/verify-password', protect, verifyPassword);
router.delete('/account', protect, deleteAccount);
router.post('/contact', protect, contact);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.post('/send-otp', protect, sendOtp);
router.post('/change-password-verified', protect, changePasswordVerified);

module.exports = router;

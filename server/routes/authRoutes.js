const express = require('express');
const { register, login, googleLogin, changePassword, verifyPassword, deleteAccount, contact, forgotPassword, verifyOtp, resetPassword, sendOtp, changePasswordVerified } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many authentication attempts. Please try again later.' } });
const otpRequestRateLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 3, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many OTP requests. Please try again later.' } });
const otpVerifyRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many OTP attempts. Please try again later.' } });

const router = express.Router();

router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.post('/google', authRateLimit, googleLogin);
router.post('/change-password', protect, changePassword);
router.post('/verify-password', protect, verifyPassword);
router.delete('/account', protect, deleteAccount);
router.post('/contact', protect, contact);
router.post('/forgot-password', otpRequestRateLimit, forgotPassword);
router.post('/verify-otp', otpVerifyRateLimit, verifyOtp);
router.post('/reset-password', otpVerifyRateLimit, resetPassword);
router.post('/send-otp', protect, otpRequestRateLimit, sendOtp);
router.post('/change-password-verified', protect, otpVerifyRateLimit, changePasswordVerified);

module.exports = router;

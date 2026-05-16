const express = require('express');
const { register, login, changePassword, verifyPassword, deleteAccount, contact } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/change-password', protect, changePassword);
router.post('/verify-password', protect, verifyPassword);
router.delete('/account', protect, deleteAccount);
router.post('/contact', protect, contact);

module.exports = router;

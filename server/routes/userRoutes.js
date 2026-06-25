const express = require('express');
const { getProfile, clearNotifications, updateProfile, setPassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/set-password', protect, setPassword);
router.post('/clear-notifications', protect, clearNotifications);

module.exports = router;

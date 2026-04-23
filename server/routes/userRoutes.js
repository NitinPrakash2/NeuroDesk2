const express = require('express');
const { getProfile, clearNotifications } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', protect, getProfile);
router.post('/clear-notifications', protect, clearNotifications);

module.exports = router;

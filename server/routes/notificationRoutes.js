const express = require('express');
const { getNotifications, addNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getNotifications);
router.post('/', protect, addNotification);

module.exports = router;

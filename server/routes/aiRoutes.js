const express = require('express');
const rateLimit = require('express-rate-limit');
const { processMessage, getSuggestions, summarizePDF, extractPoints } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { message: 'Too many AI requests, slow down.' },
});

const router = express.Router();
router.use(protect);
router.use(aiLimiter);

router.post('/chat', processMessage);
router.get('/suggestions', getSuggestions);
router.post('/summarize', summarizePDF);
router.post('/extract', extractPoints);

module.exports = router;

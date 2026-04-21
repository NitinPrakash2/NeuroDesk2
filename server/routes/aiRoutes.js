const express = require('express');
const rateLimit = require('express-rate-limit');
const { processMessage, getSuggestions, summarizePDF, extractPoints, generateRoadmap, goalChat } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
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
router.post('/roadmap', generateRoadmap);
router.post('/goal-chat', goalChat);

module.exports = router;
